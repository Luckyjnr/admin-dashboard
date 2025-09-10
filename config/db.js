// config/db.js
// This file handles the MongoDB connection logic using mongoose.

const mongoose = require('mongoose');

/**
 * Connects to MongoDB using the URI from environment variables.
 * Logs connection status and errors for debugging.
 */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;
