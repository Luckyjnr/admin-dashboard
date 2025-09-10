// Import mongoose for MongoDB interaction
const mongoose = require('mongoose');
// Import bcrypt for password hashing
const bcrypt = require('bcryptjs');

// Define the User schema
const userSchema = new mongoose.Schema({
  // User's name
  name: {
    type: String,
    required: true,
  },
  // User's email (must be unique)
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  // Hashed password
  password: {
    type: String,
    required: true,
  },
  // Role of the user (default: 'user')
  role: {
    type: String,
    enum: ['user', 'manager', 'admin'],
    default: 'user',
  },
  // Refresh token for session management
  refreshToken: {
    type: String,
    default: null,
  },
});

/**
 * Pre-save hook to hash password before saving user document
 * Only hashes if password is modified
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  // Hash the password with bcrypt
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

/**
 * Method to compare provided password with hashed password
 * @param {string} candidatePassword - Password to compare
 * @returns {Promise<boolean>} - Result of comparison
 */
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Export the User model
module.exports = mongoose.model('User', userSchema);
