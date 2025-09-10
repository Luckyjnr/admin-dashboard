// controllers/logController.js
// Controller for viewing and exporting activity logs

const ActivityLog = require('../models/ActivityLog');
const { Parser } = require('json2csv');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Get activity logs with advanced filtering and pagination
 * Admin: View all logs
 * Manager: View filtered logs (by user or date)
 * GET /logs
 */
exports.getLogs = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 50,
    user,
    action,
    start,
    end,
    ip,
    sortBy = 'timestamp',
    sortOrder = 'desc'
  } = req.query;

  // Build filter object
  let filter = {};

  // Apply role-based filtering
  if (req.user.role === 'manager') {
    // Managers can filter by user or date
    if (user) filter.user = user;
    if (start && end) {
      filter.timestamp = {
        $gte: new Date(start),
        $lte: new Date(end)
      };
    }
  }
  // Admins can see all logs with any filter

  // Apply additional filters
  if (action) filter.action = action;
  if (ip) filter.ip = { $regex: ip, $options: 'i' };

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Execute query with pagination
  const logs = await ActivityLog.find(filter)
    .populate('user', 'name email role')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  // Get total count for pagination
  const totalLogs = await ActivityLog.countDocuments(filter);
  const totalPages = Math.ceil(totalLogs / parseInt(limit));

  // Get filter options for UI
  const filterOptions = await ActivityLog.aggregate([
    { $group: { _id: '$action', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 20 }
  ]);

  res.json({
    success: true,
    data: {
      logs,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalLogs,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      },
      filterOptions: {
        actions: filterOptions
      },
      appliedFilters: {
        user,
        action,
        start,
        end,
        ip
      }
    }
  });
});

/**
 * Get log statistics and analytics
 * GET /logs/stats
 */
exports.getLogStats = asyncHandler(async (req, res) => {
  const { period = '7d' } = req.query;
  
  // Calculate date range
  let days;
  switch (period) {
    case '1d': days = 1; break;
    case '7d': days = 7; break;
    case '30d': days = 30; break;
    case '90d': days = 90; break;
    default: days = 7;
  }
  
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Get action statistics
  const actionStats = await ActivityLog.aggregate([
    {
      $match: { timestamp: { $gte: since } }
    },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$user' }
      }
    },
    {
      $project: {
        action: '$_id',
        count: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
        _id: 0
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  // Get hourly activity for the last 24 hours
  const hourlyActivity = await ActivityLog.aggregate([
    {
      $match: {
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }
    },
    {
      $group: {
        _id: { $hour: '$timestamp' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  // Get top users by activity
  const topUsers = await ActivityLog.aggregate([
    {
      $match: {
        timestamp: { $gte: since },
        user: { $ne: null }
      }
    },
    {
      $group: {
        _id: '$user',
        activityCount: { $sum: 1 },
        lastActivity: { $max: '$timestamp' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'userInfo'
      }
    },
    {
      $unwind: '$userInfo'
    },
    {
      $project: {
        userId: '$_id',
        name: '$userInfo.name',
        email: '$userInfo.email',
        role: '$userInfo.role',
        activityCount: 1,
        lastActivity: 1,
        _id: 0
      }
    },
    {
      $sort: { activityCount: -1 }
    },
    {
      $limit: 10
    }
  ]);

  // Get IP statistics
  const ipStats = await ActivityLog.aggregate([
    {
      $match: { timestamp: { $gte: since } }
    },
    {
      $group: {
        _id: '$ip',
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$user' }
      }
    },
    {
      $project: {
        ip: '$_id',
        count: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
        _id: 0
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: 10
    }
  ]);

  res.json({
    success: true,
    data: {
      actionStats,
      hourlyActivity,
      topUsers,
      ipStats,
      period,
      generatedAt: new Date().toISOString()
    }
  });
});

/**
 * Export logs to CSV or JSON with advanced filtering
 * GET /logs/export?format=csv|json&...
 */
exports.exportLogs = asyncHandler(async (req, res) => {
  const {
    format = 'json',
    user,
    action,
    start,
    end,
    ip,
    limit = 10000
  } = req.query;

  // Build filter object (same as getLogs)
  let filter = {};

  if (req.user.role === 'manager') {
    if (user) filter.user = user;
    if (start && end) {
      filter.timestamp = {
        $gte: new Date(start),
        $lte: new Date(end)
      };
    }
  }

  if (action) filter.action = action;
  if (ip) filter.ip = { $regex: ip, $options: 'i' };

  // Get logs with limit
  const logs = await ActivityLog.find(filter)
    .populate('user', 'name email role')
    .sort({ timestamp: -1 })
    .limit(parseInt(limit))
    .lean();

  if (format === 'csv') {
    const fields = [
      'timestamp',
      'user.name',
      'user.email',
      'user.role',
      'action',
      'ip',
      'userAgent',
      'details.method',
      'details.url',
      'details.userId',
      'details.userRole'
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(logs.map(log => ({
      timestamp: log.timestamp,
      'user.name': log.user?.name || 'N/A',
      'user.email': log.user?.email || 'N/A',
      'user.role': log.user?.role || 'N/A',
      action: log.action,
      ip: log.ip,
      userAgent: log.userAgent,
      'details.method': log.details?.method || 'N/A',
      'details.url': log.details?.url || 'N/A',
      'details.userId': log.details?.userId || 'N/A',
      'details.userRole': log.details?.userRole || 'N/A'
    })));

    const filename = `activity_logs_${new Date().toISOString().split('T')[0]}.csv`;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(csv);
  }

  // Default to JSON
  const filename = `activity_logs_${new Date().toISOString().split('T')[0]}.json`;
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.json({
    success: true,
    data: {
      logs,
      exportedAt: new Date().toISOString(),
      totalLogs: logs.length,
      filters: {
        user,
        action,
        start,
        end,
        ip
      }
    }
  });
});

/**
 * Delete old logs (Admin only)
 * DELETE /logs/cleanup
 */
exports.cleanupLogs = asyncHandler(async (req, res) => {
  const { days = 90 } = req.query;
  const cutoffDate = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

  const result = await ActivityLog.deleteMany({
    timestamp: { $lt: cutoffDate }
  });

  res.json({
    success: true,
    message: `Cleaned up ${result.deletedCount} logs older than ${days} days`,
    deletedCount: result.deletedCount,
    cutoffDate: cutoffDate.toISOString()
  });
});
