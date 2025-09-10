// routes/logs.js
// Routes for viewing and exporting activity logs with RBAC and authentication

const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const { authenticate } = require('../middleware/auth');
const { permit } = require('../middleware/rbac');
const { validateDateRange, validatePagination } = require('../middleware/validation');

/**
 * @swagger
 * tags:
 *   name: Activity Logs
 *   description: Activity logging and audit trail endpoints
 */

/**
 * @swagger
 * /api/logs:
 *   get:
 *     summary: Get activity logs with filtering and pagination
 *     tags: [Activity Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of logs per page
 *       - in: query
 *         name: user
 *         schema:
 *           type: string
 *         description: Filter by user ID (Manager only)
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter by action type
 *       - in: query
 *         name: start
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: end
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *       - in: query
 *         name: ip
 *         schema:
 *           type: string
 *         description: Filter by IP address
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: timestamp
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Activity logs retrieved successfully
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
 *                   example: Activity logs retrieved successfully
 *                 data:
 *                       type: object
 *                       properties:
 *                         logs:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               user:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: string
 *                                   name:
 *                                     type: string
 *                                   email:
 *                                     type: string
 *                                   role:
 *                                     type: string
 *                               action:
 *                                 type: string
 *                               timestamp:
 *                                 type: string
 *                                 format: date-time
 *                               ip:
 *                                 type: string
 *                               userAgent:
 *                                 type: string
 *                               details:
 *                                 type: object
 *                         pagination:
 *                           type: object
 *                           properties:
 *                             currentPage:
 *                               type: integer
 *                             totalPages:
 *                               type: integer
 *                             totalLogs:
 *                               type: integer
 *                             hasNext:
 *                               type: boolean
 *                             hasPrev:
 *                               type: boolean
 *                         filterOptions:
 *                           type: object
 *                           properties:
 *                             actions:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   _id:
 *                                     type: string
 *                                   count:
 *                                     type: integer
 *                         appliedFilters:
 *                           type: object
 *                           properties:
 *                             user:
 *                               type: string
 *                             action:
 *                               type: string
 *                             start:
 *                               type: string
 *                             end:
 *                               type: string
 *                             ip:
 *                               type: string
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
router.get('/', authenticate, permit('admin', 'manager'), validatePagination, validateDateRange, logController.getLogs);

/**
 * @swagger
 * /api/logs/stats:
 *   get:
 *     summary: Get log statistics and analytics
 *     tags: [Activity Logs]
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
 *         description: Log statistics retrieved successfully
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
 *                   example: Activity logs retrieved successfully
 *                 data:
 *                       type: object
 *                       properties:
 *                         actionStats:
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
 *                         hourlyActivity:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: integer
 *                                 example: 14
 *                               count:
 *                                 type: integer
 *                                 example: 25
 *                         topUsers:
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
 *                               activityCount:
 *                                 type: integer
 *                               lastActivity:
 *                                 type: string
 *                                 format: date-time
 *                         ipStats:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               ip:
 *                                 type: string
 *                                 example: 192.168.1.1
 *                               count:
 *                                 type: integer
 *                                 example: 50
 *                               uniqueUsers:
 *                                 type: integer
 *                                 example: 5
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
router.get('/stats', authenticate, permit('admin', 'manager'), validateDateRange, logController.getLogStats);

/**
 * @swagger
 * /api/logs/export:
 *   get:
 *     summary: Export activity logs (CSV/JSON)
 *     tags: [Activity Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, json]
 *           default: json
 *         description: Export format
 *       - in: query
 *         name: user
 *         schema:
 *           type: string
 *         description: Filter by user ID (Manager only)
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter by action type
 *       - in: query
 *         name: start
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: end
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *       - in: query
 *         name: ip
 *         schema:
 *           type: string
 *         description: Filter by IP address
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10000
 *         description: Maximum number of logs to export
 *     responses:
 *       200:
 *         description: Logs exported successfully
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
 *                   example: Activity logs retrieved successfully
 *                 data:
 *                       type: object
 *                       properties:
 *                         logs:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               user:
 *                                 type: object
 *                               action:
 *                                 type: string
 *                               timestamp:
 *                                 type: string
 *                                 format: date-time
 *                               ip:
 *                                 type: string
 *                               userAgent:
 *                                 type: string
 *                               details:
 *                                 type: object
 *                         exportedAt:
 *                           type: string
 *                           format: date-time
 *                         totalLogs:
 *                           type: integer
 *                         filters:
 *                           type: object
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *             description: CSV file download
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
router.get('/export', authenticate, permit('admin', 'manager'), validateDateRange, logController.exportLogs);

/**
 * @swagger
 * /api/logs/cleanup:
 *   delete:
 *     summary: Cleanup old logs (Admin only)
 *     tags: [Activity Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 90
 *         description: Number of days to keep logs (older logs will be deleted)
 *     responses:
 *       200:
 *         description: Logs cleaned up successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Cleaned up 150 logs older than 90 days
 *                     deletedCount:
 *                       type: integer
 *                       example: 150
 *                     cutoffDate:
 *                       type: string
 *                       format: date-time
 *       403:
 *         description: Access denied (Admin only)
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
router.delete('/cleanup', authenticate, permit('admin'), logController.cleanupLogs);

module.exports = router;
