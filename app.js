// Load environment variables from .env file
require('dotenv').config();

// Import express for creating the server
const express = require('express');
// Import database connection logic
const connectDB = require('./config/db');
// Import authentication routes
const authRoutes = require('./routes/auth');
// Import stats routes
const statsRoutes = require('./routes/stats');
// Import logs routes
const logsRoutes = require('./routes/logs');
// Import users routes
const usersRoutes = require('./routes/users');


// Import security middleware
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import Swagger
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

// Initialize express app
const app = express();


// Use helmet for secure HTTP headers
app.use(helmet());

// Middleware to parse JSON requests
app.use(express.json());

// Connect to MongoDB using best practice (separated config)
connectDB();



// Rate limiting for login route (prevent brute force)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 login requests per windowMs
  message: 'Too many login attempts from this IP, please try again later.'
});
app.use('/api/auth/login', loginLimiter);

// Mount authentication routes at /api/auth
app.use('/api/auth', authRoutes);


// Mount stats endpoints at /api/stats
app.use('/api/stats', statsRoutes);


// Mount logs endpoints at /api/logs
app.use('/api/logs', logsRoutes);

// Mount users endpoints at /api/users
app.use('/api/users', usersRoutes);

// Root endpoint for API status
app.get('/', (req, res) => {
  res.json({
    message: 'Admin Dashboard API',
    version: '1.0.0',
    documentation: '/api-docs',
    status: 'running'
  });
});

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Admin Dashboard API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true
  }
}));


// Import error handling middleware
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Handle 404 errors for undefined routes
app.use(notFound);

// Centralized error handler
app.use(errorHandler);

// Export the app for use in server.js
module.exports = app;
