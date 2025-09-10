// middleware/validation.js
// Input validation middleware

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates password strength
 * @param {string} password - Password to validate
 * @returns {Object} - Validation result with isValid and message
 */
const validatePassword = (password) => {
  if (!password || password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/(?=.*\d)/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  
  return { isValid: true };
};

/**
 * Validates MongoDB ObjectId
 * @param {string} id - ID to validate
 * @returns {boolean} - True if valid ObjectId
 */
const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Validates role
 * @param {string} role - Role to validate
 * @returns {boolean} - True if valid role
 */
const isValidRole = (role) => {
  const validRoles = ['user', 'manager', 'admin'];
  return validRoles.includes(role);
};

/**
 * Validates date format (YYYY-MM-DD)
 * @param {string} date - Date to validate
 * @returns {boolean} - True if valid date format
 */
const isValidDate = (date) => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  
  const parsedDate = new Date(date);
  return parsedDate instanceof Date && !isNaN(parsedDate);
};

/**
 * Middleware to validate user registration data
 */
const validateSignup = (req, res, next) => {
  const { name, email, password } = req.body;
  const errors = [];

  // Validate name
  if (!name || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  // Validate email
  if (!email || !isValidEmail(email)) {
    errors.push('Please provide a valid email address');
  }

  // Validate password
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    errors.push(passwordValidation.message);
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

/**
 * Middleware to validate user login data
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  // Validate email
  if (!email || !isValidEmail(email)) {
    errors.push('Please provide a valid email address');
  }

  // Validate password
  if (!password || password.length < 1) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

/**
 * Middleware to validate user update data
 */
const validateUserUpdate = (req, res, next) => {
  const { name, email, role } = req.body;
  const errors = [];

  // Validate name if provided
  if (name !== undefined && (!name || name.trim().length < 2)) {
    errors.push('Name must be at least 2 characters long');
  }

  // Validate email if provided
  if (email !== undefined && (!email || !isValidEmail(email))) {
    errors.push('Please provide a valid email address');
  }

  // Validate role if provided
  if (role !== undefined && !isValidRole(role)) {
    errors.push('Role must be one of: user, manager, admin');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

/**
 * Middleware to validate MongoDB ObjectId in params
 */
const validateObjectId = (req, res, next) => {
  const { id } = req.params;
  
  if (!isValidObjectId(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }

  next();
};

/**
 * Middleware to validate date range query parameters
 */
const validateDateRange = (req, res, next) => {
  const { start, end } = req.query;
  const errors = [];

  if (start && !isValidDate(start)) {
    errors.push('Start date must be in YYYY-MM-DD format');
  }

  if (end && !isValidDate(end)) {
    errors.push('End date must be in YYYY-MM-DD format');
  }

  if (start && end && new Date(start) > new Date(end)) {
    errors.push('Start date must be before end date');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

/**
 * Middleware to validate pagination parameters
 */
const validatePagination = (req, res, next) => {
  const { page, limit } = req.query;
  const errors = [];

  if (page && (isNaN(page) || parseInt(page) < 1)) {
    errors.push('Page must be a positive integer');
  }

  if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
    errors.push('Limit must be between 1 and 100');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

module.exports = {
  isValidEmail,
  validatePassword,
  isValidObjectId,
  isValidRole,
  isValidDate,
  validateSignup,
  validateLogin,
  validateUserUpdate,
  validateObjectId,
  validateDateRange,
  validatePagination
};
