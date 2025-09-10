// controllers/userController.js
// Controller for user management (CRUD) and role changes

const User = require('../models/User');
const { logActivity } = require('../middleware/activityLogger');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Get users with pagination and filtering
 * Admin: Get all users
 * Manager: Get all users (no delete)
 * User: Get own profile
 * GET /users
 */
exports.getUsers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    role,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build filter object
  let filter = {};

  // Apply role-based access
  if (req.user.role === 'user') {
    // User can only view their own profile
    const user = await User.findById(req.user._id).select('-password -refreshToken');
    return res.json({
      success: true,
      data: {
        users: [user],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalUsers: 1,
          hasNext: false,
          hasPrev: false
        }
      }
    });
  }

  // Admin/Manager can view all users with filters
  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Execute query
  const users = await User.find(filter)
    .select('-password -refreshToken')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  // Get total count
  const totalUsers = await User.countDocuments(filter);
  const totalPages = Math.ceil(totalUsers / parseInt(limit));

  // Get role distribution for filters
  const roleDistribution = await User.aggregate([
    { $group: { _id: '$role', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalUsers,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      },
      filterOptions: {
        roles: roleDistribution
      },
      appliedFilters: {
        role,
        search
      }
    }
  });
});

/**
 * Get single user by ID
 * GET /users/:id
 */
exports.getUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if user can access this resource
  if (req.user.role === 'user' && req.user._id.toString() !== id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only view your own profile.'
    });
  }

  const user = await User.findById(id).select('-password -refreshToken');
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.json({
    success: true,
    data: { user }
  });
});

/**
 * Create new user
 * Admin: Create user with any role
 * POST /users
 */
exports.createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role = 'user' } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User with this email already exists'
    });
  }

  // Create user
  const user = new User({ name, email, password, role });
  await user.save();

  // Log activity
  await logActivity(req, 'user-create', {
    userId: user._id,
    email: user.email,
    role: user.role,
    createdBy: req.user._id
  });

  // Remove sensitive data from response
  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.refreshToken;

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: { user: userResponse }
  });
});

/**
 * Update user
 * Admin/Manager: Update any user
 * User: Update own profile (limited fields)
 * PUT /users/:id
 */
exports.updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, role } = req.body;

  // Check if user can access this resource
  if (req.user.role === 'user' && req.user._id.toString() !== id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only update your own profile.'
    });
  }

  // Users can't change their own role
  if (req.user.role === 'user' && role && role !== req.user.role) {
    return res.status(403).json({
      success: false,
      message: 'You cannot change your own role.'
    });
  }

  // Find user
  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Check if email is already taken by another user
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email, _id: { $ne: id } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already taken by another user'
      });
    }
  }

  // Update user
  const updatedUser = await User.findByIdAndUpdate(
    id,
    { name, email, role },
    { new: true, runValidators: true }
  ).select('-password -refreshToken');

  // Log activity
  await logActivity(req, 'user-update', {
    userId: updatedUser._id,
    email: updatedUser.email,
    updatedFields: { name, email, role },
    updatedBy: req.user._id
  });

  res.json({
    success: true,
    message: 'User updated successfully',
    data: { user: updatedUser }
  });
});

/**
 * Delete user
 * Admin: Delete any user
 * DELETE /users/:id
 */
exports.deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Prevent self-deletion
  if (req.user._id.toString() === id) {
    return res.status(400).json({
      success: false,
      message: 'You cannot delete your own account'
    });
  }

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Delete user
  await User.findByIdAndDelete(id);

  // Log activity
  await logActivity(req, 'user-delete', {
    userId: user._id,
    email: user.email,
    deletedBy: req.user._id
  });

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
});

/**
 * Change user role
 * Admin: Change any user's role
 * PATCH /users/:id/role
 */
exports.changeUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  // Prevent self-role change
  if (req.user._id.toString() === id) {
    return res.status(400).json({
      success: false,
      message: 'You cannot change your own role'
    });
  }

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const oldRole = user.role;

  // Update role
  const updatedUser = await User.findByIdAndUpdate(
    id,
    { role },
    { new: true, runValidators: true }
  ).select('-password -refreshToken');

  // Log activity
  await logActivity(req, 'role-change', {
    userId: updatedUser._id,
    email: updatedUser.email,
    oldRole,
    newRole: role,
    changedBy: req.user._id
  });

  res.json({
    success: true,
    message: 'User role updated successfully',
    data: { user: updatedUser }
  });
});

/**
 * Get user profile (current user)
 * GET /users/profile
 */
exports.getProfile = asyncHandler(async (req, res) => {
  // Ensure we have a valid user ID
  if (!req.user || !req.user._id) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  // Convert to string if it's a Buffer or ObjectId
  const userId = req.user._id.toString();
  
  const user = await User.findById(userId).select('-password -refreshToken');
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  res.json({
    success: true,
    data: { user }
  });
});

/**
 * Update user profile (current user)
 * PUT /users/profile
 */
exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;
  
  // Ensure we have a valid user ID
  if (!req.user || !req.user._id) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  // Convert to string if it's a Buffer or ObjectId
  const userId = req.user._id.toString();

  // Check if email is already taken by another user
  if (email && email !== req.user.email) {
    const existingUser = await User.findOne({ email, _id: { $ne: userId } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already taken by another user'
      });
    }
  }

  // Update profile
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { name, email },
    { new: true, runValidators: true }
  ).select('-password -refreshToken');

  if (!updatedUser) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Log activity
  await logActivity(req, 'profile-update', {
    userId: updatedUser._id,
    updatedFields: { name, email }
  });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user: updatedUser }
  });
});
