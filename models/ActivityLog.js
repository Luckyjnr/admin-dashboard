// models/ActivityLog.js
// Model for storing user activity logs

const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Allow null for anonymous actions
  },
  action: {
    type: String,
    required: true,
    index: true, // Add index for better query performance
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true, // Add index for time-based queries
  },
  ip: {
    type: String,
    required: true,
    index: true, // Add index for IP-based queries
  },
  userAgent: {
    type: String,
    default: 'unknown',
  },
  details: {
    type: Object,
    default: {},
  },
}, {
  timestamps: true, // Add createdAt and updatedAt
  collection: 'activitylogs' // Explicit collection name
});

// Add compound indexes for better query performance
activityLogSchema.index({ user: 1, timestamp: -1 });
activityLogSchema.index({ action: 1, timestamp: -1 });
activityLogSchema.index({ ip: 1, timestamp: -1 });
activityLogSchema.index({ timestamp: -1 }); // For time-based queries

module.exports = mongoose.model('ActivityLog', activityLogSchema);
