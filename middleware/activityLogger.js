// middleware/activityLogger.js
// Middleware to log user activities

const ActivityLog = require('../models/ActivityLog');

/**
 * Get client IP address from request
 * @param {Object} req - Express request object
 * @returns {string} - Client IP address
 */
const getClientIP = (req) => {
  return req.clientIP || 
         req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         'unknown';
};

/**
 * Get user agent from request headers
 * @param {Object} req - Express request object
 * @returns {string} - User agent string
 */
const getUserAgent = (req) => {
  return req.headers['user-agent'] || 'unknown';
};

/**
 * Logs a user action to the ActivityLog collection.
 * @param {Object} req - Express request object
 * @param {string} action - The type of action performed
 * @param {object} details - Additional details about the action
 */
const logActivity = async (req, action, details = {}) => {
  try {
    const logData = {
      user: req.user ? req.user._id : null,
      action,
      timestamp: new Date(),
      ip: getClientIP(req),
      userAgent: getUserAgent(req),
      details: {
        ...details,
        method: req.method,
        url: req.originalUrl,
        ...(req.user && { userId: req.user._id, userRole: req.user.role })
      },
    };

    await ActivityLog.create(logData);
  } catch (err) {
    // Log error to console and optionally to a file or monitoring system
    console.error('Activity log error:', {
      error: err.message,
      action,
      userId: req.user?._id,
      ip: getClientIP(req)
    });
  }
};

/**
 * Middleware to automatically log HTTP requests
 * @param {string} action - Action name to log
 */
const logRequest = (action) => {
  return async (req, res, next) => {
    // Log the request
    await logActivity(req, action);
    next();
  };
};

/**
 * Middleware to log successful operations
 * @param {string} action - Action name to log
 * @param {Function} getDetails - Function to extract details from request/response
 */
const logSuccess = (action, getDetails = () => ({})) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Only log if response is successful (2xx status)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        logActivity(req, action, getDetails(req, res, data));
      }
      return originalSend.call(this, data);
    };
    
    next();
  };
};

/**
 * Middleware to log failed operations
 * @param {string} action - Action name to log
 * @param {Function} getDetails - Function to extract details from request/response
 */
const logFailure = (action, getDetails = () => ({})) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Only log if response is not successful (4xx, 5xx status)
      if (res.statusCode >= 400) {
        logActivity(req, action, getDetails(req, res, data));
      }
      return originalSend.call(this, data);
    };
    
    next();
  };
};

module.exports = { 
  logActivity, 
  logRequest, 
  logSuccess, 
  logFailure 
};
