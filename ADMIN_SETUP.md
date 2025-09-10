# 🔐 Admin Setup Guide

This guide explains how to set up the initial admin user for the Admin Dashboard API following security best practices.

## 🚀 **Quick Setup Methods**

### **Method 1: API Endpoint (Recommended for Production)**

#### **Step 1: Check Admin Setup Status**
```bash
GET http://localhost:5000/api/auth/admin-setup/status
```

**Response if no admin exists:**
```json
{
  "success": true,
  "data": {
    "adminExists": false,
    "adminCount": 0,
    "setupRequired": true
  }
}
```

#### **Step 2: Create Admin User**
```bash
POST http://localhost:5000/api/auth/admin-setup
Content-Type: application/json

{
  "name": "System Administrator",
  "email": "admin@yourcompany.com",
  "password": "SecureAdmin123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin user created successfully! You are now logged in.",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "...",
      "name": "System Administrator",
      "email": "admin@yourcompany.com",
      "role": "admin"
    }
  }
}
```

### **Method 2: Environment Variables + Script**

#### **Step 1: Set Environment Variables**
Add to your `.env` file:
```env
# Admin Setup
ADMIN_EMAIL=admin@yourcompany.com
ADMIN_PASSWORD=SecureAdmin123!
ADMIN_NAME=System Administrator
```

#### **Step 2: Run Setup Script**
```bash
npm run setup-admin
```

**Output:**
```
Connected to MongoDB
✅ Admin user created successfully!
📧 Email: admin@yourcompany.com
🔑 Password: SecureAdmin123!
⚠️  Please change the password after first login!
```

### **Method 3: Manual Database Update**

#### **Step 1: Find Your User**
```javascript
// In MongoDB shell or MongoDB Compass
db.users.findOne({ email: "your-email@example.com" })
```

#### **Step 2: Update Role to Admin**
```javascript
// In MongoDB shell or MongoDB Compass
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "admin" } }
)
```

## 🔒 **Security Features**

### **Admin Setup Protection**
- ✅ Admin setup endpoint only works when no admin exists
- ✅ Once an admin is created, the setup endpoint is disabled
- ✅ All admin creation attempts are logged
- ✅ Strong password validation enforced

### **Best Practices Implemented**
- ✅ No hardcoded admin credentials
- ✅ Environment-based configuration
- ✅ Automatic token generation after admin creation
- ✅ Comprehensive logging and audit trail
- ✅ Input validation and sanitization

## 📋 **Testing the Admin Setup**

### **1. Test Admin Setup Status**
```bash
GET http://localhost:5000/api/auth/admin-setup/status
```

### **2. Create Admin (if no admin exists)**
```bash
POST http://localhost:5000/api/auth/admin-setup
Content-Type: application/json

{
  "name": "Test Admin",
  "email": "admin@test.com",
  "password": "TestAdmin123!"
}
```

### **3. Login with Admin Credentials**
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@test.com",
  "password": "TestAdmin123!"
}
```

### **4. Test Admin Permissions**
```bash
# Create a new user (Admin only)
POST http://localhost:5000/api/users
Authorization: Bearer YOUR_ADMIN_TOKEN
Content-Type: application/json

{
  "name": "Jane Manager",
  "email": "jane@example.com",
  "password": "Password123",
  "role": "manager"
}
```

## 🛡️ **Security Recommendations**

### **After Admin Setup:**
1. **Change Default Password**: Use the admin account to change the password
2. **Create Additional Admins**: Create backup admin accounts
3. **Review Logs**: Check activity logs for any suspicious activity
4. **Disable Setup Endpoint**: Consider removing the setup endpoint in production

### **Production Considerations:**
- Use strong, unique passwords
- Enable HTTPS for all admin operations
- Monitor admin account activity
- Implement account lockout policies
- Regular security audits

## 🔧 **Troubleshooting**

### **"Admin user already exists" Error**
- This means an admin user already exists in the database
- Use the login endpoint instead of the setup endpoint
- Check the admin setup status endpoint

### **"Email already exists" Error**
- The email is already registered as a regular user
- Either use a different email or update the existing user's role

### **Database Connection Issues**
- Ensure MongoDB is running
- Check your MONGO_URI in the .env file
- Verify network connectivity

## 📚 **Next Steps**

After setting up the admin user:

1. **Login as Admin** ✅
2. **Create Manager Users** ✅
3. **Test All RBAC Permissions** ✅
4. **Review Activity Logs** ✅
5. **Configure Additional Security** ✅

## 🆘 **Support**

If you encounter issues:
1. Check the server logs for detailed error messages
2. Verify your environment variables
3. Ensure MongoDB is running and accessible
4. Check the admin setup status endpoint

---

**⚠️ Important**: Keep your admin credentials secure and never commit them to version control!
