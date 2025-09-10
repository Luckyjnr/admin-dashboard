
// Import required modules
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Helper function to generate a short-lived access token
const generateAccessToken = (user) => {
  // Payload includes user ID and role
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' } // Access token expires in 15 minutes
  );
};

// Helper function to generate a long-lived refresh token
const generateRefreshToken = (user) => {
  // Payload includes only user ID
  return jwt.sign(
    { id: user._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' } // Refresh token expires in 7 days
  );
};

/**
 * Signup Controller
 * Registers a new user with name, email, password, and default role 'user'.
 * Hashes password before saving.
 */
exports.signup = async (req, res) => {
  try {
    // Extract user details from request body
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Create new user instance
    const user = new User({ name, email, password });

    // Save user to database
    await user.save();

    // Respond with success message
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    // Handle errors
    res.status(500).json({ message: err.message });
  }
};

/**
 * Login Controller
 * Authenticates user and issues access and refresh tokens.
 * Stores refresh token in DB for future validation.
 */
exports.login = async (req, res) => {
  try {
    // Extract credentials from request body
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'User not found. Please check your email or sign up.' });
    }

    // Compare provided password with hashed password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password. Please try again.' });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token in DB
    user.refreshToken = refreshToken;
    await user.save();

    // Respond with tokens and success message
    res.json({
      message: 'Login successful.',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    // Handle errors
    res.status(500).json({ message: 'An error occurred during login. Please try again later.' });
  }
};

/**
 * Refresh Token Controller
 * Issues a new access token if the provided refresh token is valid.
 */
exports.refreshToken = async (req, res) => {
  try {
    // Extract refresh token from request body
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    // Find user by refresh token
    const user = await User.findOne({ refreshToken });
    if (!user) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    // Verify refresh token
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: 'Invalid refresh token' });
      }
      // Issue new access token
      const accessToken = generateAccessToken(user);
      res.json({ accessToken });
    });
  } catch (err) {
    // Handle errors
    res.status(500).json({ message: err.message });
  }
};

/**
 * Logout Controller
 * Invalidates the user's refresh token by removing it from DB.
 */
exports.logout = async (req, res) => {
  try {
    // Extract refresh token from request body
    const { refreshToken } = req.body;

    // Validate input
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required for logout.' });
    }

    // Find user by refresh token
    const user = await User.findOne({ refreshToken });
    if (!user) {
      return res.status(401).json({ message: 'Invalid refresh token. User already logged out or token expired.' });
    }

    // Remove refresh token from DB
    user.refreshToken = null;
    await user.save();

    // Respond with success message
    res.json({ message: 'Logout successful. You have been securely logged out.' });
  } catch (err) {
    // Handle errors
    res.status(500).json({ message: 'An error occurred during logout. Please try again later.' });
  }
};
