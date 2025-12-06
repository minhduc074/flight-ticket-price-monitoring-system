const { Op, fn, col, literal } = require('sequelize');
const { User, Subscription, FlightPrice, NotificationHistory } = require('../models');
const { sequelize } = require('../config/database');

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
      User.count({ where: { role: 'user' } }),
      User.count({ where: { role: 'user', isActive: true } }),
      Subscription.count(),
      Subscription.count({ where: { isActive: true } }),
      NotificationHistory.count()
    ]);

    // Get subscriptions by route
    const topRoutes = await Subscription.findAll({
      where: { isActive: true },
      attributes: [
        'fromAirport',
        'toAirport',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['fromAirport', 'toAirport'],
      order: [[literal('count'), 'DESC']],
      limit: 10,
      raw: true
    });

    // Recent activity
    const recentSubscriptions = await Subscription.findAll({
      include: [{
        model: User,
        as: 'user',
        attributes: ['email', 'name']
      }],
      order: [['createdAt', 'DESC']],
      limit: 10
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
          count: parseInt(r.count)
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
      where[Op.or] = [
        { email: { [Op.iLike]: `%${search}%` } },
        { name: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count: total, rows: users } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
      offset,
      limit: parseInt(limit)
    });

    // Get subscription counts for each user
    const userIds = users.map(u => u.id);
    const subscriptionCounts = await Subscription.findAll({
      where: { userId: { [Op.in]: userIds } },
      attributes: [
        'userId',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['userId'],
      raw: true
    });

    const countMap = subscriptionCounts.reduce((acc, item) => {
      acc[item.userId] = parseInt(item.count);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        users: users.map(u => ({
          id: u.id,
          email: u.email,
          name: u.name,
          isActive: u.isActive,
          subscriptionCount: countMap[u.id] || 0,
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

    const user = await User.findByPk(id);

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

    user.isActive = isActive;
    await user.save();

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

    const { count: total, rows: subscriptions } = await Subscription.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'name']
        },
        {
          model: NotificationHistory,
          as: 'notificationHistory'
        }
      ],
      order: [['createdAt', 'DESC']],
      offset,
      limit: parseInt(limit)
    });

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
      fetchedAt: { [Op.between]: [startDate, endDate] }
    };
    if (from) where.fromAirport = from.toUpperCase();
    if (to) where.toAirport = to.toUpperCase();

    const prices = await FlightPrice.findAll({
      where,
      attributes: [
        [fn('DATE', col('fetchedAt')), 'date'],
        'fromAirport',
        'toAirport',
        [fn('AVG', col('price')), 'avgPrice'],
        [fn('MIN', col('price')), 'minPrice'],
        [fn('MAX', col('price')), 'maxPrice'],
        [fn('COUNT', col('id')), 'count']
      ],
      group: [fn('DATE', col('fetchedAt')), 'fromAirport', 'toAirport'],
      order: [[fn('DATE', col('fetchedAt')), 'ASC']],
      raw: true
    });

    res.json({
      success: true,
      data: {
        priceHistory: prices.map(p => ({
          date: p.date,
          from: p.fromAirport,
          to: p.toAirport,
          avgPrice: Math.round(parseFloat(p.avgPrice)),
          minPrice: parseInt(p.minPrice),
          maxPrice: parseInt(p.maxPrice),
          sampleCount: parseInt(p.count)
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

    const subscription = await Subscription.findByPk(id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    await subscription.destroy();

    res.json({
      success: true,
      message: 'Subscription deleted successfully'
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
