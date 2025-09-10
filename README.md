
# Admin Dashboard API

## Description
An Admin Panel API with Role-Based Access Control (RBAC) and secure JWT authentication. This backend provides endpoints for user registration, login, token refresh, and logout, following best practices for security and structure.

## Features
- User authentication with JWT and refresh tokens
- Passwords hashed with bcrypt
- Store refresh tokens in DB for session management
- Signup, login, refresh token, and logout endpoints
- Role-based access control (RBAC)
- Bearer tokens for protected routes
- Admin can assign roles and manage permissions
- Secure RESTful API endpoints

## Installation & Usage
```bash
# Clone the repo
git clone https://github.com/<your-username>/admin-dashboard.git

# Navigate into the project
cd admin-dashboard

# Install dependencies
npm install

# Start the development server
node server.js
```

## Technologies
- Node.js
- Express.js
- JWT Authentication
- bcrypt
- MongoDB & Mongoose

## API Endpoints

### Signup
`POST /api/auth/signup`
Registers a new user.
**Body Example:**
```json
{
	"name": "Test User",
	"email": "test@example.com",
	"password": "password123"
}
```

### Login
`POST /api/auth/login`
Authenticates user and returns access and refresh tokens.
**Body Example:**
```json
{
	"email": "test@example.com",
	"password": "password123"
}
```
**Response Example:**
```json
{
	"message": "Login successful.",
	"accessToken": "<JWT_ACCESS_TOKEN>",
	"refreshToken": "<JWT_REFRESH_TOKEN>",
	"user": {
		"id": "<USER_ID>",
		"name": "Test User",
		"email": "test@example.com",
		"role": "user"
	}
}
```

### Refresh Token
`POST /api/auth/refresh-token`
Issues a new access token using a valid refresh token.
**Body Example:**
```json
{
	"refreshToken": "<JWT_REFRESH_TOKEN>"
}
```
**Response Example:**
```json
{
	"accessToken": "<NEW_JWT_ACCESS_TOKEN>"
}
```

### Logout
`POST /api/auth/logout`
Invalidates the user's refresh token.
**Body Example:**
```json
{
	"refreshToken": "<JWT_REFRESH_TOKEN>"
}
```
**Response Example:**
```json
{
	"message": "Logout successful. You have been securely logged out."
}
```

## Progress
- Project initialized with necessary dependencies
- Best-practice folder structure implemented
- User authentication with JWT and refresh tokens
- Signup, login, refresh token, and logout endpoints
- Passwords hashed with bcrypt
- Refresh tokens stored in DB and invalidated on logout
- Error handling and user-friendly messages added
- Database logic separated in config/db.js
- Codebase documented with comments

## Author
NOAH LUCKY