// Load environment variables from .env file
require('dotenv').config();

// Import express for creating the server
const express = require('express');
// Import database connection logic
const connectDB = require('./config/db');
// Import authentication routes
const authRoutes = require('./routes/auth');

// Initialize express app
const app = express();

// Middleware to parse JSON requests
app.use(express.json());

// Connect to MongoDB using best practice (separated config)
connectDB();

// Mount authentication routes at /api/auth
app.use('/api/auth', authRoutes);

// Root endpoint for API status
app.get('/', (req, res) => {
  res.send('Admin Dashboard API');
});

// Export the app for use in server.js
module.exports = app;
