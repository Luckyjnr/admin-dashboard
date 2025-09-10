// Import express for routing
const express = require('express');
const router = express.Router();
// Import authentication controller
const authController = require('../controllers/authController');

// Route for user signup
// Registers a new user
router.post('/signup', authController.signup);

// Route for user login
// Authenticates user and issues tokens
router.post('/login', authController.login);

// Route for refreshing access token
// Issues new access token using refresh token
router.post('/refresh-token', authController.refreshToken);

// Route for user logout
// Invalidates refresh token
router.post('/logout', authController.logout);

// Export the router
module.exports = router;
