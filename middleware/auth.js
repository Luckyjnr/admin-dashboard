// middleware/auth.js
// Middleware to verify JWT and attach user to request

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Get client IP address from request
 * @param {Object} req - Express request object
 * @returns {string} - Client IP address
 */
const getClientIP = (req) => {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         'unknown';
};

/**
 * Authenticates requests using JWT Bearer token.
 * Attaches user object to req.user if valid.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Authorization header missing or malformed.',
        code: 'MISSING_AUTH_HEADER'
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        message: 'Token not provided.',
        code: 'MISSING_TOKEN'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user by ID
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        message: 'User not found or account deleted.',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if user account is still active
    if (user.refreshToken === null) {
      return res.status(401).json({ 
        message: 'Session expired. Please login again.',
        code: 'SESSION_EXPIRED'
      });
    }

    // Attach user and IP to request
    req.user = user;
    req.clientIP = getClientIP(req);
    
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token.',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired.',
        code: 'TOKEN_EXPIRED'
      });
    }

    console.error('Authentication error:', err);
    return res.status(500).json({ 
      message: 'Authentication failed.',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token provided
 * Useful for endpoints that work with or without authentication
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (user && user.refreshToken !== null) {
      req.user = user;
      req.clientIP = getClientIP(req);
    }
    
    next();
  } catch (err) {
    // For optional auth, we don't fail on token errors
    next();
  }
};

module.exports = { authenticate, optionalAuth };
