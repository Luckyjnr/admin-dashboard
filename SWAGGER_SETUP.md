# 📚 Swagger Documentation Setup Guide

## 🚀 **Quick Start**

### **1. Install Dependencies**
```bash
npm install
```

### **2. Start the Server**
```bash
npm start
# or
npm run dev
```

### **3. Access Swagger Documentation**
Open your browser and navigate to:
```
http://localhost:5000/api-docs
```

## 📖 **What's Included**

### **Complete API Documentation:**
- ✅ **Authentication Endpoints** (6 endpoints)
- ✅ **User Management** (8 endpoints) 
- ✅ **Statistics & Analytics** (4 endpoints)
- ✅ **Activity Logs** (4 endpoints)
- ✅ **Admin Setup** (2 endpoints)

### **Interactive Features:**
- 🔐 **JWT Authentication** - Test with real tokens
- 📝 **Request/Response Examples** - Copy-paste ready
- 🧪 **Try It Out** - Test endpoints directly in browser
- 📊 **Schema Validation** - See exact data structures
- 🔍 **Search & Filter** - Find endpoints quickly

## 🎯 **Key Features**

### **1. JWT Authentication Support**
- Click "Authorize" button
- Enter your JWT token: `Bearer YOUR_TOKEN_HERE`
- All protected endpoints will use your token

### **2. Comprehensive Examples**
Every endpoint includes:
- **Request examples** with sample data
- **Response examples** with real data structures
- **Error examples** for different scenarios
- **Parameter descriptions** with validation rules

### **3. Role-Based Access Control**
- Clear indication of required roles
- Permission levels for each endpoint
- Security requirements documented

### **4. Interactive Testing**
- Test endpoints directly from the browser
- See real-time responses
- Validate your API implementation

## 📋 **API Endpoints Overview**

### **🔐 Authentication (6 endpoints)**
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User authentication
- `POST /api/auth/refresh-token` - Token refresh
- `POST /api/auth/logout` - User logout
- `GET /api/auth/admin-setup/status` - Check admin setup
- `POST /api/auth/admin-setup` - Create initial admin

### **👥 User Management (8 endpoints)**
- `GET /api/users` - Get users (paginated)
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update current user profile
- `GET /api/users/{id}` - Get user by ID
- `POST /api/users` - Create new user (Admin/Manager)
- `PUT /api/users/{id}` - Update user (Admin/Manager)
- `DELETE /api/users/{id}` - Delete user (Admin only)
- `PATCH /api/users/{id}/role` - Change user role (Admin only)

### **📊 Statistics (4 endpoints)**
- `GET /api/stats/users` - User statistics by role
- `GET /api/stats/logins` - Login analytics
- `GET /api/stats/active-users` - Active users tracking
- `GET /api/stats/overview` - System overview dashboard

### **📝 Activity Logs (4 endpoints)**
- `GET /api/logs` - Get activity logs (filtered/paginated)
- `GET /api/logs/stats` - Log statistics and analytics
- `GET /api/logs/export` - Export logs (CSV/JSON)
- `DELETE /api/logs/cleanup` - Cleanup old logs (Admin only)

## 🛠️ **Testing Workflow**

### **Step 1: Check Admin Setup**
```bash
GET http://localhost:5000/api/auth/admin-setup/status
```

### **Step 2: Create Admin User (if needed)**
```bash
POST http://localhost:5000/api/auth/admin-setup
{
  "name": "System Administrator",
  "email": "admin@company.com",
  "password": "AdminPassword123!"
}
```

### **Step 3: Login and Get Token**
```bash
POST http://localhost:5000/api/auth/login
{
  "email": "admin@company.com",
  "password": "AdminPassword123!"
}
```

### **Step 4: Authorize in Swagger**
1. Click "Authorize" button in Swagger UI
2. Enter: `Bearer YOUR_ACCESS_TOKEN_HERE`
3. Click "Authorize"

### **Step 5: Test All Endpoints**
- Use "Try it out" button on any endpoint
- Modify request parameters as needed
- Execute and see real responses

## 🎨 **Customization**

### **Swagger UI Customization**
The Swagger UI is customized with:
- Clean, professional appearance
- Hidden top bar for better focus
- Persistent authorization
- Request duration display
- Collapsible sections
- Search functionality

### **Schema Definitions**
Comprehensive schemas for:
- **User** - Complete user model
- **ActivityLog** - Activity logging model
- **Error** - Standardized error responses
- **Success** - Standardized success responses
- **Pagination** - Pagination metadata

## 🔧 **Configuration Files**

### **Swagger Configuration** (`config/swagger.js`)
- OpenAPI 3.0 specification
- Server definitions
- Security schemes
- Schema definitions
- API metadata

### **Route Documentation** (in route files)
- JSDoc comments with Swagger annotations
- Parameter definitions
- Request/response schemas
- Security requirements
- Example data

## 📱 **Mobile-Friendly**

The Swagger UI is fully responsive and works great on:
- Desktop browsers
- Tablets
- Mobile devices
- Different screen sizes

## 🔒 **Security Features**

### **JWT Authentication**
- Bearer token authentication
- Token persistence across sessions
- Secure token handling

### **Role-Based Documentation**
- Clear permission requirements
- Role hierarchy explanation
- Access control documentation

## 🚀 **Production Considerations**

### **Environment-Specific URLs**
Update server URLs in `config/swagger.js`:
```javascript
servers: [
  {
    url: 'https://your-production-api.com',
    description: 'Production server'
  }
]
```

### **Custom Domain**
Update the Swagger path in `app.js`:
```javascript
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));
```

## 📊 **API Statistics**

- **Total Endpoints**: 22
- **Authentication Required**: 20
- **Public Endpoints**: 2
- **Admin Only**: 6
- **Manager+ Access**: 16
- **User+ Access**: 20

## 🎉 **Benefits**

### **For Developers:**
- Complete API reference
- Interactive testing
- Code generation support
- Easy integration

### **For Teams:**
- Consistent documentation
- Clear API contracts
- Easy onboarding
- Version control

### **For Users:**
- Self-service API exploration
- Real-time testing
- Clear examples
- Error understanding

## 🔗 **Quick Links**

- **Swagger UI**: http://localhost:5000/api-docs
- **API Root**: http://localhost:5000/
- **Health Check**: http://localhost:5000/

## 🆘 **Troubleshooting**

### **Swagger UI Not Loading**
1. Check if server is running
2. Verify dependencies are installed
3. Check console for errors

### **Authentication Not Working**
1. Ensure you have a valid JWT token
2. Check token format: `Bearer TOKEN`
3. Verify token hasn't expired

### **Endpoints Not Showing**
1. Check route files for Swagger comments
2. Verify swagger-jsdoc configuration
3. Restart the server

---