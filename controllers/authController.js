
// Import required modules
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { logActivity } = require('../middleware/activityLogger');
const { asyncHandler } = require('../middleware/errorHandler');

// Helper function to generate a short-lived access token
const generateAccessToken = (user) => {
  // Payload includes user ID and role - ensure ID is string
  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' } // Access token expires in 15 minutes
  );
};

// Helper function to generate a long-lived refresh token
const generateRefreshToken = (user) => {
  // Payload includes only user ID - ensure ID is string
  return jwt.sign(
    { id: user._id.toString() },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' } // Refresh token expires in 7 days
  );
};

/**
 * Signup Controller
 * Registers a new user with name, email, password, and default role 'user'.
 * Hashes password before saving.
 */
exports.signup = asyncHandler(async (req, res) => {
  // Extract user details from request body
  const { name, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ 
      success: false,
      message: 'Email already exists',
      code: 'EMAIL_EXISTS'
    });
  }

  // Create new user instance
  const user = new User({ name, email, password });

  // Save user to database
  await user.save();

  // Log signup activity
  await logActivity(req, 'user-signup', {
    userId: user._id,
    email: user.email,
    ip: req.clientIP || req.ip
  });

  // Respond with success message
  res.status(201).json({ 
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }
  });
});

/**
 * Login Controller
 * Authenticates user and issues access and refresh tokens.
 * Stores refresh token in DB for future validation.
 */
exports.login = asyncHandler(async (req, res) => {
  // Extract credentials from request body
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    await logActivity(req, 'login-failed', { 
      reason: 'Missing email or password', 
      email: email || 'unknown',
      ip: req.clientIP || req.ip
    });
    return res.status(400).json({ 
      success: false,
      message: 'Email and password are required.',
      code: 'MISSING_CREDENTIALS'
    });
  }

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    await logActivity(req, 'login-failed', { 
      reason: 'User not found', 
      email,
      ip: req.clientIP || req.ip
    });
    return res.status(401).json({ 
      success: false,
      message: 'Invalid credentials.',
      code: 'INVALID_CREDENTIALS'
    });
  }

  // Compare provided password with hashed password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    await logActivity(req, 'login-failed', { 
      reason: 'Incorrect password', 
      email,
      userId: user._id,
      ip: req.clientIP || req.ip
    });
    return res.status(401).json({ 
      success: false,
      message: 'Invalid credentials.',
      code: 'INVALID_CREDENTIALS'
    });
  }

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Store refresh token in DB
  user.refreshToken = refreshToken;
  await user.save();

  // Log successful login
  await logActivity(req, 'login-success', { 
    userId: user._id, 
    email,
    ip: req.clientIP || req.ip,
    userAgent: req.headers['user-agent']
  });

  // Respond with tokens and success message
  res.json({
    success: true,
    message: 'Login successful.',
    data: {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }
  });
});

/**
 * Refresh Token Controller
 * Issues a new access token if the provided refresh token is valid.
 */
exports.refreshToken = asyncHandler(async (req, res) => {
  // Extract refresh token from request body
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ 
      success: false,
      message: 'Refresh token required',
      code: 'MISSING_REFRESH_TOKEN'
    });
  }

  // Find user by refresh token
  const user = await User.findOne({ refreshToken });
  if (!user) {
    return res.status(403).json({ 
      success: false,
      message: 'Invalid refresh token',
      code: 'INVALID_REFRESH_TOKEN'
    });
  }

  // Verify refresh token
  try {
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    
    // Issue new access token
    const accessToken = generateAccessToken(user);
    
    // Log token refresh
    await logActivity(req, 'token-refresh', {
      userId: user._id,
      email: user.email,
      ip: req.clientIP || req.ip
    });
    
    res.json({ 
      success: true,
      data: { accessToken }
    });
  } catch (err) {
    // Clear invalid refresh token
    user.refreshToken = null;
    await user.save();
    
    return res.status(403).json({ 
      success: false,
      message: 'Invalid or expired refresh token',
      code: 'INVALID_REFRESH_TOKEN'
    });
  }
});

/**
 * Logout Controller
 * Invalidates the user's refresh token by removing it from DB.
 */
exports.logout = asyncHandler(async (req, res) => {
  // Extract refresh token from request body
  const { refreshToken } = req.body;

  // Validate input
  if (!refreshToken) {
    return res.status(400).json({ 
      success: false,
      message: 'Refresh token is required for logout.',
      code: 'MISSING_REFRESH_TOKEN'
    });
  }

  // Find user by refresh token
  const user = await User.findOne({ refreshToken });
  if (!user) {
    return res.status(401).json({ 
      success: false,
      message: 'Invalid refresh token. User already logged out or token expired.',
      code: 'INVALID_REFRESH_TOKEN'
    });
  }

  // Remove refresh token from DB
  user.refreshToken = null;
  await user.save();

  // Log logout action
  await logActivity(req, 'logout', { 
    userId: user._id, 
    email: user.email,
    ip: req.clientIP || req.ip
  });

  // Respond with success message
  res.json({ 
    success: true,
    message: 'Logout successful. You have been securely logged out.'
  });
});

/**
 * Admin Setup Controller
 * Creates the first admin user if none exists
 * This route is only available when no admin users exist
 */
exports.setupAdmin = asyncHandler(async (req, res) => {
  // Check if any admin users already exist
  const existingAdmin = await User.findOne({ role: 'admin' });
  
  if (existingAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Admin user already exists. This endpoint is only available during initial setup.',
      code: 'ADMIN_EXISTS'
    });
  }

  const { name, email, password } = req.body;

  // Validate input
  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, and password are required.',
      code: 'MISSING_FIELDS'
    });
  }

  // Check if user with this email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User with this email already exists.',
      code: 'EMAIL_EXISTS'
    });
  }

  // Create admin user
  const adminUser = new User({
    name,
    email,
    password,
    role: 'admin'
  });

  await adminUser.save();

  // Log admin creation
  await logActivity(req, 'admin-setup', {
    userId: adminUser._id,
    email: adminUser.email,
    ip: req.clientIP || req.ip
  });

  // Generate tokens for immediate login
  const accessToken = generateAccessToken(adminUser);
  const refreshToken = generateRefreshToken(adminUser);

  // Store refresh token
  adminUser.refreshToken = refreshToken;
  await adminUser.save();

  res.status(201).json({
    success: true,
    message: 'Admin user created successfully! You are now logged in.',
    data: {
      accessToken,
      refreshToken,
      user: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role
      }
    }
  });
});

/**
 * Check Admin Setup Status
 * Returns whether admin setup is needed
 */
exports.checkAdminSetup = asyncHandler(async (req, res) => {
  const adminCount = await User.countDocuments({ role: 'admin' });
  
  res.json({
    success: true,
    data: {
      adminExists: adminCount > 0,
      adminCount,
      setupRequired: adminCount === 0
    }
  });
});
