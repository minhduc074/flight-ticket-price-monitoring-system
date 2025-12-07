const { prisma } = require('../lib/prisma');

/**
 * Get dashboard statistics
 */
exports.getDashboard = async (req, res, next) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalSubscriptions,
      activeSubscriptions,
      notificationsSent
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'user' } }),
      prisma.user.count({ where: { role: 'user', isActive: true } }),
      prisma.subscription.count(),
      prisma.subscription.count({ where: { isActive: true } }),
      prisma.notificationHistory.count()
    ]);

    // Get subscriptions by route
    const topRoutes = await prisma.subscription.groupBy({
      by: ['fromAirport', 'toAirport'],
      where: { isActive: true },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10
    });

    // Recent activity
    const recentSubscriptions = await prisma.subscription.findMany({
      include: {
        user: {
          select: { email: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // API usage stats for current month
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const apiUsageStats = await prisma.apiUsage.findMany({
      where: { month: currentMonth },
      orderBy: { callCount: 'desc' }
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          activeUsers,
          totalSubscriptions,
          activeSubscriptions,
          notificationsSent
        },
        topRoutes: topRoutes.map(r => ({
          from: r.fromAirport,
          to: r.toAirport,
          count: r._count.id
        })),
        recentSubscriptions: recentSubscriptions.map(s => ({
          id: s.id,
          user: s.user ? { email: s.user.email, name: s.user.name } : null,
          from: s.fromAirport,
          to: s.toAirport,
          date: s.date,
          expectedPrice: s.expectedPrice,
          currentPrice: s.currentPrice,
          isActive: s.isActive,
          createdAt: s.createdAt
        })),
        apiUsage: apiUsageStats.map(api => ({
          provider: api.apiProvider,
          calls: api.callCount,
          success: api.successCount,
          failed: api.failCount,
          rateLimited: api.rateLimitCount,
          lastCalled: api.lastCalledAt
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users
 */
exports.getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;

    const where = { role: 'user' };
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } }
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: { subscriptions: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: parseInt(limit)
      })
    ]);

    res.json({
      success: true,
      data: {
        users: users.map(u => ({
          id: u.id,
          email: u.email,
          name: u.name,
          isActive: u.isActive,
          subscriptionCount: u._count.subscriptions,
          createdAt: u.createdAt
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user status
 */
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify admin status'
      });
    }

    await prisma.user.update({
      where: { id },
      data: { isActive }
    });

    res.json({
      success: true,
      message: 'User status updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all subscriptions (admin view)
 */
exports.getAllSubscriptions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, active, from, to } = req.query;

    const where = {};
    if (active !== undefined) {
      where.isActive = active === 'true';
    }
    if (from) {
      where.fromAirport = from.toUpperCase();
    }
    if (to) {
      where.toAirport = to.toUpperCase();
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [total, subscriptions] = await Promise.all([
      prisma.subscription.count({ where }),
      prisma.subscription.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, name: true }
          },
          notificationHistory: true
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: parseInt(limit)
      })
    ]);

    res.json({
      success: true,
      data: {
        subscriptions: subscriptions.map(s => ({
          id: s.id,
          user: s.user ? { id: s.user.id, email: s.user.email, name: s.user.name } : null,
          from: s.fromAirport,
          to: s.toAirport,
          date: s.date,
          expectedPrice: s.expectedPrice,
          currentPrice: s.currentPrice,
          isActive: s.isActive,
          lastCheckedAt: s.lastCheckedAt,
          notificationHistory: s.notificationHistory,
          createdAt: s.createdAt
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get flight price history
 */
exports.getFlightPriceHistory = async (req, res, next) => {
  try {
    const { from, to, date, days = 7 } = req.query;

    const endDate = date ? new Date(date) : new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - parseInt(days));

    const where = {
      fetchedAt: { gte: startDate, lte: endDate }
    };
    if (from) where.fromAirport = from.toUpperCase();
    if (to) where.toAirport = to.toUpperCase();

    // Get flight prices with grouping logic handled in JS
    const flightPrices = await prisma.flightPrice.findMany({
      where,
      select: {
        fetchedAt: true,
        fromAirport: true,
        toAirport: true,
        price: true
      }
    });

    // Group by date and route
    const grouped = {};
    for (const fp of flightPrices) {
      const dateKey = fp.fetchedAt.toISOString().split('T')[0];
      const key = `${dateKey}-${fp.fromAirport}-${fp.toAirport}`;
      
      if (!grouped[key]) {
        grouped[key] = {
          date: dateKey,
          fromAirport: fp.fromAirport,
          toAirport: fp.toAirport,
          prices: []
        };
      }
      grouped[key].prices.push(fp.price);
    }

    // Calculate aggregates
    const prices = Object.values(grouped).map(g => ({
      date: g.date,
      fromAirport: g.fromAirport,
      toAirport: g.toAirport,
      avgPrice: Math.round(g.prices.reduce((a, b) => a + b, 0) / g.prices.length),
      minPrice: Math.min(...g.prices),
      maxPrice: Math.max(...g.prices),
      count: g.prices.length
    })).sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      success: true,
      data: {
        priceHistory: prices.map(p => ({
          date: p.date,
          from: p.fromAirport,
          to: p.toAirport,
          avgPrice: p.avgPrice,
          minPrice: p.minPrice,
          maxPrice: p.maxPrice,
          sampleCount: p.count
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete subscription
 */
exports.deleteSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;

    const subscription = await prisma.subscription.findUnique({
      where: { id }
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    await prisma.subscription.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Subscription deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get API usage statistics
 */
exports.getApiUsage = async (req, res, next) => {
  try {
    const { months = 3 } = req.query;
    
    // Get usage for last N months
    const now = new Date();
    const monthsList = [];
    for (let i = 0; i < parseInt(months); i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthsList.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    }

    const apiUsageStats = await prisma.apiUsage.findMany({
      where: { month: { in: monthsList } },
      orderBy: [{ month: 'desc' }, { callCount: 'desc' }]
    });

    // API limits configuration
    const apiLimits = {
      'google-flights': 150,
      'agoda': 500,
      'serpapi': 250,
      'skyscanner': 500,
      'flightapi': 100
    };

    // Group by month
    const grouped = {};
    for (const month of monthsList) {
      grouped[month] = [];
    }

    for (const stat of apiUsageStats) {
      if (grouped[stat.month]) {
        grouped[stat.month].push({
          provider: stat.apiProvider,
          calls: stat.callCount,
          limit: apiLimits[stat.apiProvider] || 0,
          remaining: Math.max(0, (apiLimits[stat.apiProvider] || 0) - stat.callCount),
          percentage: apiLimits[stat.apiProvider] 
            ? Math.round((stat.callCount / apiLimits[stat.apiProvider]) * 100)
            : 0,
          success: stat.successCount,
          failed: stat.failCount,
          rateLimited: stat.rateLimitCount,
          lastCalled: stat.lastCalledAt
        });
      }
    }

    res.json({
      success: true,
      data: {
        apiLimits,
        usage: grouped
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Manually trigger price check
 */
exports.triggerPriceCheck = async (req, res, next) => {
  try {
    const { checkPrices } = require('../jobs/priceChecker');
    
    // Run the price check job
    checkPrices();

    res.json({
      success: true,
      message: 'Price check job triggered'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Sync database models (for initial deployment - uses Prisma db push)
 */
exports.syncDatabase = async (req, res, next) => {
  try {
    // With Prisma, schema sync is done via CLI (prisma db push)
    // This endpoint is kept for API compatibility
    res.json({
      success: true,
      message: 'Database schema is managed via Prisma. Run `npx prisma db push` to sync.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get API logs
 */
exports.getApiLogs = async (req, res, next) => {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    const logDir = path.join(__dirname, '../../logs');
    
    // Get all log files
    const files = await fs.readdir(logDir);
    const logFiles = files.filter(f => f.endsWith('.log'));
    
    // Get stats for each file
    const logsInfo = await Promise.all(
      logFiles.map(async (file) => {
        const filePath = path.join(logDir, file);
        const stats = await fs.stat(filePath);
        const [apiName, date] = file.replace('.log', '').split('_');
        
        return {
          apiName,
          date,
          filename: file,
          size: stats.size,
          modified: stats.mtime
        };
      })
    );
    
    // Sort by modified date descending
    logsInfo.sort((a, b) => b.modified - a.modified);
    
    res.json({
      success: true,
      logs: logsInfo
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get API logs by name
 */
exports.getApiLogsByName = async (req, res, next) => {
  try {
    const { apiName } = req.params;
    const { date, limit = 100 } = req.query;
    
    const fs = require('fs').promises;
    const path = require('path');
    const logDir = path.join(__dirname, '../../logs');
    
    // Determine log file
    let filename;
    if (date) {
      filename = `${apiName}_${date}.log`;
    } else {
      // Get most recent log file for this API
      const files = await fs.readdir(logDir);
      const apiFiles = files
        .filter(f => f.startsWith(`${apiName}_`) && f.endsWith('.log'))
        .sort()
        .reverse();
      
      if (apiFiles.length === 0) {
        return res.json({
          success: true,
          logs: [],
          message: 'No logs found for this API'
        });
      }
      
      filename = apiFiles[0];
    }
    
    const logFilePath = path.join(logDir, filename);
    
    // Check if file exists
    try {
      await fs.access(logFilePath);
    } catch (error) {
      return res.json({
        success: true,
        logs: [],
        message: 'Log file not found'
      });
    }
    
    // Read log file
    const content = await fs.readFile(logFilePath, 'utf-8');
    const lines = content.trim().split('\n').filter(line => line.trim());
    
    // Parse JSON lines and limit results
    const logs = lines
      .slice(-limit)
      .map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          return { raw: line, parseError: true };
        }
      })
      .reverse(); // Most recent first
    
    res.json({
      success: true,
      filename,
      logs,
      total: lines.length
    });
  } catch (error) {
    next(error);
  }
};
