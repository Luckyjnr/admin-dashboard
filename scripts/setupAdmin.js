// scripts/setupAdmin.js
// Script to create initial admin user following best practices

const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

/**
 * Creates an admin user if none exists
 * This follows the principle of least privilege and secure defaults
 */
const setupAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Check if any admin users exist
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      return;
    }

    // Get admin credentials from environment variables
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@admin-dashboard.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
    const adminName = process.env.ADMIN_NAME || 'System Administrator';

    // Check if user with this email already exists
    const existingUser = await User.findOne({ email: adminEmail });
    if (existingUser) {
      // Update existing user to admin role
      existingUser.role = 'admin';
      await existingUser.save();
      console.log(`Updated existing user ${adminEmail} to admin role`);
      return;
    }

    // Create new admin user
    const adminUser = new User({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'admin'
    });

    await adminUser.save();
    
    console.log('✅ Admin user created successfully!');
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log('⚠️  Please change the password after first login!');
    
  } catch (error) {
    console.error('❌ Error setting up admin:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

// Run the setup
setupAdmin();
