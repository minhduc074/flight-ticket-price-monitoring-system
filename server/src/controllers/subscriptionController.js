const { Op } = require('sequelize');
const { Subscription, NotificationHistory } = require('../models');
const { flightService } = require('../services');
const config = require('../config');

/**
 * Create a new subscription
 */
exports.createSubscription = async (req, res, next) => {
  try {
    const { fromAirport, toAirport, date, expectedPrice } = req.body;

    // Validate airports
    const airports = config.airports;
    if (!airports[fromAirport?.toUpperCase()]) {
      return res.status(400).json({
        success: false,
        message: `Invalid departure airport code: ${fromAirport}`
      });
    }
    if (!airports[toAirport?.toUpperCase()]) {
      return res.status(400).json({
        success: false,
        message: `Invalid arrival airport code: ${toAirport}`
      });
    }

    // Validate date
    const flightDate = new Date(date);
    if (isNaN(flightDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (flightDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Cannot subscribe to past dates'
      });
    }

    // Validate expected price
    if (!expectedPrice || expectedPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Expected price must be a positive number'
      });
    }

    // Check for duplicate subscription
    const startOfDay = new Date(flightDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(flightDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingSubscription = await Subscription.findOne({
      where: {
        userId: req.user.id,
        fromAirport: fromAirport.toUpperCase(),
        toAirport: toAirport.toUpperCase(),
        date: {
          [Op.between]: [startOfDay, endOfDay]
        },
        isActive: true
      }
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active subscription for this route and date'
      });
    }

    // Get current lowest price
    const currentPrice = await flightService.getLowestPrice(
      fromAirport.toUpperCase(),
      toAirport.toUpperCase(),
      date
    );

    const subscription = await Subscription.create({
      userId: req.user.id,
      fromAirport: fromAirport.toUpperCase(),
      toAirport: toAirport.toUpperCase(),
      date: new Date(date),
      expectedPrice,
      currentPrice,
      lastCheckedAt: currentPrice ? new Date() : null
    });

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: {
        subscription: {
          id: subscription.id,
          fromAirport: subscription.fromAirport,
          toAirport: subscription.toAirport,
          date: subscription.date,
          expectedPrice: subscription.expectedPrice,
          currentPrice: subscription.currentPrice,
          isActive: subscription.isActive
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's subscriptions
 */
exports.getSubscriptions = async (req, res, next) => {
  try {
    const { active } = req.query;
    
    const where = { userId: req.user.id };
    if (active !== undefined) {
      where.isActive = active === 'true';
    }

    const subscriptions = await Subscription.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });

    const airports = config.airports;

    res.json({
      success: true,
      data: {
        subscriptions: subscriptions.map(sub => ({
          id: sub.id,
          from: {
            code: sub.fromAirport,
            ...airports[sub.fromAirport]
          },
          to: {
            code: sub.toAirport,
            ...airports[sub.toAirport]
          },
          date: sub.date,
          expectedPrice: sub.expectedPrice,
          currentPrice: sub.currentPrice,
          isActive: sub.isActive,
          lastCheckedAt: sub.lastCheckedAt,
          notificationSent: sub.notificationSent,
          createdAt: sub.createdAt
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific subscription
 */
exports.getSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;

    const subscription = await Subscription.findOne({
      where: {
        id,
        userId: req.user.id
      },
      include: [{
        model: NotificationHistory,
        as: 'notificationHistory',
        order: [['sentAt', 'DESC']]
      }]
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    const airports = config.airports;

    res.json({
      success: true,
      data: {
        subscription: {
          id: subscription.id,
          from: {
            code: subscription.fromAirport,
            ...airports[subscription.fromAirport]
          },
          to: {
            code: subscription.toAirport,
            ...airports[subscription.toAirport]
          },
          date: subscription.date,
          expectedPrice: subscription.expectedPrice,
          currentPrice: subscription.currentPrice,
          isActive: subscription.isActive,
          lastCheckedAt: subscription.lastCheckedAt,
          notificationSent: subscription.notificationSent,
          notificationHistory: subscription.notificationHistory,
          createdAt: subscription.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a subscription
 */
exports.updateSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { expectedPrice, isActive } = req.body;

    const subscription = await Subscription.findOne({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    if (expectedPrice !== undefined) {
      if (expectedPrice <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Expected price must be a positive number'
        });
      }
      subscription.expectedPrice = expectedPrice;
      subscription.notificationSent = false; // Reset notification flag when price changes
    }

    if (isActive !== undefined) {
      subscription.isActive = isActive;
    }

    await subscription.save();

    res.json({
      success: true,
      message: 'Subscription updated successfully',
      data: {
        subscription: {
          id: subscription.id,
          fromAirport: subscription.fromAirport,
          toAirport: subscription.toAirport,
          date: subscription.date,
          expectedPrice: subscription.expectedPrice,
          currentPrice: subscription.currentPrice,
          isActive: subscription.isActive
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a subscription
 */
exports.deleteSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deleted = await Subscription.destroy({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    res.json({
      success: true,
      message: 'Subscription deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
