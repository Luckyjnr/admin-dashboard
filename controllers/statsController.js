// controllers/statsController.js
// Controller for stats endpoints using MongoDB aggregation

const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Get comprehensive user statistics by role
 * GET /stats/users
 */
exports.getUsersByRole = asyncHandler(async (req, res) => {
  const pipeline = [
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
        // Get the most recent user for each role
        lastCreated: { $max: '$createdAt' }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $project: {
        role: '$_id',
        count: 1,
        lastCreated: 1,
        _id: 0
      }
    }
  ];

  const usersByRole = await User.aggregate(pipeline);
  
  // Get total user count
  const totalUsers = await User.countDocuments();
  
  // Get users created in the last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentUsers = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

  res.json({
    success: true,
    data: {
      usersByRole,
      totalUsers,
      recentUsers,
      generatedAt: new Date().toISOString()
    }
  });
});

/**
 * Get comprehensive login statistics
 * GET /stats/logins
 */
exports.getLoginStats = asyncHandler(async (req, res) => {
  const { period = '7d' } = req.query;
  
  // Calculate date range based on period
  let days;
  switch (period) {
    case '1d': days = 1; break;
    case '7d': days = 7; break;
    case '30d': days = 30; break;
    case '90d': days = 90; break;
    default: days = 7;
  }
  
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const pipeline = [
    {
      $match: {
        action: { $in: ['login-success', 'login-failed'] },
        timestamp: { $gte: since }
      }
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
    }
  ];

  const loginStats = await ActivityLog.aggregate(pipeline);
  
  // Calculate success rate
  const successCount = loginStats.find(stat => stat.action === 'login-success')?.count || 0;
  const failedCount = loginStats.find(stat => stat.action === 'login-failed')?.count || 0;
  const totalAttempts = successCount + failedCount;
  const successRate = totalAttempts > 0 ? ((successCount / totalAttempts) * 100).toFixed(2) : 0;

  // Get login attempts by hour for the last 24 hours
  const hourlyStats = await ActivityLog.aggregate([
    {
      $match: {
        action: { $in: ['login-success', 'login-failed'] },
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }
    },
    {
      $group: {
        _id: {
          hour: { $hour: '$timestamp' },
          action: '$action'
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.hour': 1 }
    }
  ]);

  res.json({
    success: true,
    data: {
      loginStats,
      summary: {
        totalAttempts,
        successCount,
        failedCount,
        successRate: parseFloat(successRate)
      },
      hourlyStats,
      period,
      generatedAt: new Date().toISOString()
    }
  });
});

/**
 * Get active users statistics
 * GET /stats/active-users
 */
exports.getActiveUsers = asyncHandler(async (req, res) => {
  const { hours = 24 } = req.query;
  const since = new Date(Date.now() - parseInt(hours) * 60 * 60 * 1000);

  // Get unique active users
  const activeUsersPipeline = [
    {
      $match: {
        action: 'login-success',
        timestamp: { $gte: since },
        user: { $ne: null }
      }
    },
    {
      $group: {
        _id: '$user',
        lastActivity: { $max: '$timestamp' },
        loginCount: { $sum: 1 }
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
        lastActivity: 1,
        loginCount: 1,
        _id: 0
      }
    },
    {
      $sort: { lastActivity: -1 }
    }
  ];

  const activeUsers = await ActivityLog.aggregate(activeUsersPipeline);

  // Get activity summary
  const activitySummary = await ActivityLog.aggregate([
    {
      $match: {
        timestamp: { $gte: since }
      }
    },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  // Get most active users by action count
  const mostActiveUsers = await ActivityLog.aggregate([
    {
      $match: {
        timestamp: { $gte: since },
        user: { $ne: null }
      }
    },
    {
      $group: {
        _id: '$user',
        actionCount: { $sum: 1 },
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
        actionCount: 1,
        lastActivity: 1,
        _id: 0
      }
    },
    {
      $sort: { actionCount: -1 }
    },
    {
      $limit: 10
    }
  ]);

  res.json({
    success: true,
    data: {
      activeUsers,
      totalActiveUsers: activeUsers.length,
      activitySummary,
      mostActiveUsers,
      timeRange: {
        hours: parseInt(hours),
        since: since.toISOString(),
        until: new Date().toISOString()
      },
      generatedAt: new Date().toISOString()
    }
  });
});

/**
 * Get system overview statistics
 * GET /stats/overview
 */
exports.getSystemOverview = asyncHandler(async (req, res) => {
  const now = new Date();
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Get user counts
  const totalUsers = await User.countDocuments();
  const usersLast24h = await User.countDocuments({ createdAt: { $gte: last24Hours } });
  const usersLast7d = await User.countDocuments({ createdAt: { $gte: last7Days } });
  const usersLast30d = await User.countDocuments({ createdAt: { $gte: last30Days } });

  // Get activity counts
  const totalActivities = await ActivityLog.countDocuments();
  const activitiesLast24h = await ActivityLog.countDocuments({ timestamp: { $gte: last24Hours } });
  const activitiesLast7d = await ActivityLog.countDocuments({ timestamp: { $gte: last7Days } });

  // Get login statistics
  const loginStats = await ActivityLog.aggregate([
    {
      $match: {
        action: { $in: ['login-success', 'login-failed'] },
        timestamp: { $gte: last7Days }
      }
    },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 }
      }
    }
  ]);

  const successLogins = loginStats.find(stat => stat._id === 'login-success')?.count || 0;
  const failedLogins = loginStats.find(stat => stat._id === 'login-failed')?.count || 0;
  const totalLogins = successLogins + failedLogins;
  const loginSuccessRate = totalLogins > 0 ? ((successLogins / totalLogins) * 100).toFixed(2) : 0;

  // Get role distribution
  const roleDistribution = await User.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  res.json({
    success: true,
    data: {
      users: {
        total: totalUsers,
        last24h: usersLast24h,
        last7d: usersLast7d,
        last30d: usersLast30d
      },
      activities: {
        total: totalActivities,
        last24h: activitiesLast24h,
        last7d: activitiesLast7d
      },
      logins: {
        total: totalLogins,
        successful: successLogins,
        failed: failedLogins,
        successRate: parseFloat(loginSuccessRate)
      },
      roleDistribution,
      generatedAt: new Date().toISOString()
    }
  });
});
