// routes/stats.js
// Routes for stats endpoints with RBAC and authentication

const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { authenticate } = require('../middleware/auth');
const { permit } = require('../middleware/rbac');
const { validateDateRange, validatePagination } = require('../middleware/validation');

/**
 * @swagger
 * tags:
 *   name: Statistics
 *   description: Analytics and statistics endpoints
 */

/**
 * @swagger
 * /api/stats/users:
 *   get:
 *     summary: Get user statistics by role
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Statistics retrieved successfully
 *                 data:
 *                       type: object
 *                       properties:
 *                         usersByRole:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               role:
 *                                 type: string
 *                                 example: user
 *                               count:
 *                                 type: integer
 *                                 example: 25
 *                               lastCreated:
 *                                 type: string
 *                                 format: date-time
 *                         totalUsers:
 *                           type: integer
 *                           example: 50
 *                         recentUsers:
 *                           type: integer
 *                           example: 5
 *                         generatedAt:
 *                           type: string
 *                           format: date-time
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Access denied
 *                 code:
 *                   type: string
 *                   example: FORBIDDEN
 */
router.get('/users', authenticate, permit('admin', 'manager'), statsController.getUsersByRole);

/**
 * @swagger
 * /api/stats/logins:
 *   get:
 *     summary: Get login statistics and analytics
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [1d, 7d, 30d, 90d]
 *           default: 7d
 *         description: Time period for statistics
 *     responses:
 *       200:
 *         description: Login statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Statistics retrieved successfully
 *                 data:
 *                       type: object
 *                       properties:
 *                         loginStats:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               action:
 *                                 type: string
 *                                 example: login-success
 *                               count:
 *                                 type: integer
 *                                 example: 150
 *                               uniqueUsers:
 *                                 type: integer
 *                                 example: 25
 *                         summary:
 *                           type: object
 *                           properties:
 *                             totalAttempts:
 *                               type: integer
 *                               example: 200
 *                             successCount:
 *                               type: integer
 *                               example: 150
 *                             failedCount:
 *                               type: integer
 *                               example: 50
 *                             successRate:
 *                               type: number
 *                               example: 75.0
 *                         hourlyStats:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: object
 *                                 properties:
 *                                   hour:
 *                                     type: integer
 *                                   action:
 *                                     type: string
 *                               count:
 *                                 type: integer
 *                         period:
 *                           type: string
 *                           example: 7d
 *                         generatedAt:
 *                           type: string
 *                           format: date-time
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Access denied
 *                 code:
 *                   type: string
 *                   example: FORBIDDEN
 */
router.get('/logins', authenticate, permit('admin', 'manager'), validateDateRange, statsController.getLoginStats);

/**
 * @swagger
 * /api/stats/active-users:
 *   get:
 *     summary: Get active users statistics
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: hours
 *         schema:
 *           type: integer
 *           default: 24
 *         description: Number of hours to look back for active users
 *     responses:
 *       200:
 *         description: Active users statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Statistics retrieved successfully
 *                 data:
 *                       type: object
 *                       properties:
 *                         activeUsers:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               userId:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               email:
 *                                 type: string
 *                               role:
 *                                 type: string
 *                               lastActivity:
 *                                 type: string
 *                                 format: date-time
 *                               loginCount:
 *                                 type: integer
 *                         totalActiveUsers:
 *                           type: integer
 *                           example: 15
 *                         activitySummary:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               count:
 *                                 type: integer
 *                         mostActiveUsers:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               userId:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               email:
 *                                 type: string
 *                               role:
 *                                 type: string
 *                               actionCount:
 *                                 type: integer
 *                               lastActivity:
 *                                 type: string
 *                                 format: date-time
 *                         timeRange:
 *                           type: object
 *                           properties:
 *                             hours:
 *                               type: integer
 *                             since:
 *                               type: string
 *                               format: date-time
 *                             until:
 *                               type: string
 *                               format: date-time
 *                         generatedAt:
 *                           type: string
 *                           format: date-time
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Access denied
 *                 code:
 *                   type: string
 *                   example: FORBIDDEN
 */
router.get('/active-users', authenticate, permit('admin', 'manager'), validateDateRange, statsController.getActiveUsers);

/**
 * @swagger
 * /api/stats/overview:
 *   get:
 *     summary: Get system overview statistics
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     description: Comprehensive system overview with user counts, activity metrics, and login statistics
 *     responses:
 *       200:
 *         description: System overview retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Statistics retrieved successfully
 *                 data:
 *                       type: object
 *                       properties:
 *                         users:
 *                           type: object
 *                           properties:
 *                             total:
 *                               type: integer
 *                               example: 100
 *                             last24h:
 *                               type: integer
 *                               example: 5
 *                             last7d:
 *                               type: integer
 *                               example: 15
 *                             last30d:
 *                               type: integer
 *                               example: 50
 *                         activities:
 *                           type: object
 *                           properties:
 *                             total:
 *                               type: integer
 *                               example: 1000
 *                             last24h:
 *                               type: integer
 *                               example: 50
 *                             last7d:
 *                               type: integer
 *                               example: 200
 *                         logins:
 *                           type: object
 *                           properties:
 *                             total:
 *                               type: integer
 *                               example: 500
 *                             successful:
 *                               type: integer
 *                               example: 450
 *                             failed:
 *                               type: integer
 *                               example: 50
 *                             successRate:
 *                               type: number
 *                               example: 90.0
 *                         roleDistribution:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 example: user
 *                               count:
 *                                 type: integer
 *                                 example: 80
 *                         generatedAt:
 *                           type: string
 *                           format: date-time
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Access denied
 *                 code:
 *                   type: string
 *                   example: FORBIDDEN
 */
router.get('/overview', authenticate, permit('admin', 'manager'), statsController.getSystemOverview);

module.exports = router;
