// middleware/rbac.js
// Middleware for Role-Based Access Control (RBAC)

// Define role hierarchy and permissions
const ROLE_HIERARCHY = {
  user: 1,
  manager: 2,
  admin: 3
};

const PERMISSIONS = {
  user: ['read:own_profile', 'update:own_profile'],
  manager: ['read:own_profile', 'update:own_profile', 'read:users', 'read:stats', 'read:logs', 'update:users', 'export:logs'],
  admin: ['read:own_profile', 'update:own_profile', 'read:users', 'read:stats', 'read:logs', 'update:users', 'delete:users', 'create:users', 'change:roles', 'export:logs']
};

/**
 * Checks if the user has one of the required roles to access a route.
 * @param {...string} roles - Allowed roles for the route
 */
const permit = (...roles) => {
  return (req, res, next) => {
    // User must be authenticated
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    // Check if user has one of the required roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.',
        required: roles,
        current: req.user.role
      });
    }
    next();
  };
};

/**
 * Checks if the user has a specific permission
 * @param {string} permission - Required permission
 */
const hasPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const userPermissions = PERMISSIONS[req.user.role] || [];
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.',
        required: permission,
        current: req.user.role
      });
    }
    next();
  };
};

/**
 * Checks if user can access resource (own or higher role)
 * @param {string} resourceUserId - ID of the user whose resource is being accessed
 */
const canAccessResource = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  const resourceUserId = req.params.id || req.params.userId;
  
  // Admin can access everything
  if (req.user.role === 'admin') {
    return next();
  }

  // Manager can access everything except user deletion
  if (req.user.role === 'manager') {
    return next();
  }

  // User can only access their own resources
  if (req.user.role === 'user' && req.user._id.toString() === resourceUserId) {
    return next();
  }

  return res.status(403).json({ 
    message: 'Access denied. You can only access your own resources.',
    current: req.user.role
  });
};

module.exports = { permit, hasPermission, canAccessResource };
