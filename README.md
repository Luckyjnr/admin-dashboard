# Admin Dashboard API

A comprehensive admin dashboard API built with Node.js, Express, and MongoDB featuring Role-Based Access Control (RBAC), activity logging, and advanced statistics.

## Features

### 🔐 Authentication & Authorization
- JWT-based authentication with access and refresh tokens
- Role-Based Access Control (RBAC) with three roles:
  - **Admin**: Full access (manage users, view stats, delete logs)
  - **Manager**: Limited access (view stats, manage logs, no user deletion)
  - **User**: Access to own profile and data only
- Secure password hashing with bcrypt
- Rate limiting on login routes

### 📊 Statistics & Analytics
- User statistics by role
- Login success/failure analytics
- Active user tracking
- System overview dashboard
- Advanced MongoDB aggregation pipelines

### 📝 Activity Logging
- Comprehensive activity tracking
- IP address and user agent logging
- Role-based log filtering
- Export functionality (CSV/JSON)
- Log cleanup and maintenance

### 🛡️ Security Features
- Helmet.js for secure HTTP headers
- Input validation and sanitization
- Centralized error handling
- IP tracking and rate limiting
- Secure session management

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Security**: Helmet, bcryptjs, express-rate-limit
- **Validation**: Custom validation middleware
- **Export**: json2csv for data export

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd admin-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory with the following variables:
   ```env
   # Database Configuration
   MONGO_URI=mongodb://localhost:27017/admin-dashboard
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-here
   REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key-here
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # Security Configuration
   BCRYPT_ROUNDS=10
   JWT_EXPIRES_IN=15m
   REFRESH_TOKEN_EXPIRES_IN=7d
   ```

4. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - User logout

### User Management
- `GET /api/users` - Get users (with pagination and filtering)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user (Admin only)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin only)
- `PATCH /api/users/:id/role` - Change user role (Admin only)
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update current user profile

### Statistics
- `GET /api/stats/users` - User statistics by role
- `GET /api/stats/logins` - Login statistics
- `GET /api/stats/active-users` - Active users statistics
- `GET /api/stats/overview` - System overview

### Activity Logs
- `GET /api/logs` - Get activity logs (with filtering and pagination)
- `GET /api/logs/stats` - Log statistics and analytics
- `GET /api/logs/export` - Export logs (CSV/JSON)
- `DELETE /api/logs/cleanup` - Cleanup old logs (Admin only)

## Role Permissions

### Admin
- Full access to all endpoints
- User management (create, read, update, delete)
- Role management
- View all statistics
- Access all activity logs
- Export functionality
- Log cleanup

### Manager
- View all users (no deletion)
- Update users (no role changes)
- View statistics
- View and filter activity logs
- Export functionality

### User
- View own profile
- Update own profile (limited fields)
- No access to user management
- No access to statistics
- No access to activity logs

## Database Schema

### User Model
```javascript
{
  name: String (required)
  email: String (required, unique)
  password: String (required, hashed)
  role: String (enum: ['user', 'manager', 'admin'])
  refreshToken: String
  createdAt: Date
  updatedAt: Date
}
```

### ActivityLog Model
```javascript
{
  user: ObjectId (ref: User)
  action: String (required, indexed)
  timestamp: Date (indexed)
  ip: String (required, indexed)
  userAgent: String
  details: Object
  createdAt: Date
  updatedAt: Date
}
```

## Security Best Practices

1. **Password Security**: Passwords are hashed using bcrypt with configurable rounds
2. **JWT Security**: Short-lived access tokens (15 minutes) with refresh tokens (7 days)
3. **Rate Limiting**: Login attempts are rate-limited to prevent brute force attacks
4. **Input Validation**: All inputs are validated and sanitized
5. **Error Handling**: Centralized error handling prevents information leakage
6. **Headers Security**: Helmet.js provides secure HTTP headers
7. **IP Tracking**: All activities are logged with IP addresses for security monitoring

## Development

### Project Structure
```
admin-dashboard/
├── config/
│   └── db.js
├── controllers/
│   ├── authController.js
│   ├── logController.js
│   ├── statsController.js
│   └── userController.js
├── middleware/
│   ├── activityLogger.js
│   ├── auth.js
│   ├── errorHandler.js
│   ├── rbac.js
│   └── validation.js
├── models/
│   ├── ActivityLog.js
│   └── User.js
├── routes/
│   ├── auth.js
│   ├── logs.js
│   ├── stats.js
│   └── users.js
├── app.js
├── server.js
└── package.json
```


## AUTHOR
NOAH LUCKY