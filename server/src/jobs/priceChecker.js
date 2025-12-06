const cron = require('node-cron');
const { Op } = require('sequelize');
const { Subscription, User, NotificationHistory } = require('../models');
const { flightService, notificationService } = require('../services');

/**
 * Check prices for all active subscriptions
 */
const checkPrices = async () => {
  console.log(`[${new Date().toISOString()}] Starting price check job...`);
  
  try {
    // Get all active subscriptions with future dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const subscriptions = await Subscription.findAll({
      where: {
        isActive: true,
        date: { [Op.gte]: today }
      },
      include: [{
        model: User,
        as: 'user'
      }]
    });

    console.log(`Found ${subscriptions.length} active subscriptions to check`);

    // Group subscriptions by route and date to minimize API calls
    const routeGroups = {};
    for (const sub of subscriptions) {
      const subDate = typeof sub.date === 'string' ? sub.date : sub.date.toISOString().split('T')[0];
      const key = `${sub.fromAirport}-${sub.toAirport}-${subDate}`;
      if (!routeGroups[key]) {
        routeGroups[key] = {
          from: sub.fromAirport,
          to: sub.toAirport,
          date: typeof sub.date === 'string' ? sub.date : sub.date,
          subscriptions: []
        };
      }
      routeGroups[key].subscriptions.push(sub);
    }

    // Process each route group
    for (const key of Object.keys(routeGroups)) {
      const group = routeGroups[key];
      
      try {
        const dateStr = typeof group.date === 'string' ? group.date : group.date.toISOString().split('T')[0];
        console.log(`Checking prices for ${group.from} -> ${group.to} on ${dateStr}`);
        
        const currentPrice = await flightService.getLowestPrice(
          group.from,
          group.to,
          dateStr
        );

        if (currentPrice === null) {
          console.log(`No flights found for route ${key}`);
          continue;
        }

        // Process each subscription in this group
        for (const subscription of group.subscriptions) {
          await processSubscription(subscription, currentPrice);
        }
      } catch (error) {
        console.error(`Error checking prices for route ${key}:`, error.message);
      }

      // Add a small delay between route checks to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`[${new Date().toISOString()}] Price check job completed`);
  } catch (error) {
    console.error('Price check job error:', error);
  }
};

/**
 * Process a single subscription
 */
const processSubscription = async (subscription, currentPrice) => {
  try {
    const previousPrice = subscription.currentPrice;
    const user = subscription.user;

    // Update subscription with current price
    subscription.currentPrice = currentPrice;
    subscription.lastCheckedAt = new Date();

    let notificationSent = false;
    let notificationType = null;

    // Check if we should send a notification
    if (user && user.fcmToken && user.isActive) {
      // Case 1: Ticket became available (was null, now has price)
      if (previousPrice === null && currentPrice !== null) {
        const result = await notificationService.sendTicketAvailableNotification(
          user,
          subscription,
          currentPrice
        );
        if (result.success) {
          notificationSent = true;
          notificationType = 'ticket_available';
        }
      }
      // Case 2: Price dropped
      else if (previousPrice !== null && currentPrice < previousPrice) {
        const priceDrop = previousPrice - currentPrice;
        const priceDropPercent = (priceDrop / previousPrice) * 100;
        
        // Only notify if price dropped by at least 5% or 100,000 VND
        if (priceDropPercent >= 5 || priceDrop >= 100000) {
          const result = await notificationService.sendPriceDropNotification(
            user,
            subscription,
            currentPrice,
            previousPrice
          );
          if (result.success) {
            notificationSent = true;
            notificationType = 'price_drop';
          }
        }
      }
      // Case 3: Price is below expected (and not already notified for this)
      if (currentPrice <= subscription.expectedPrice && !subscription.notificationSent) {
        const result = await notificationService.sendBelowExpectedNotification(
          user,
          subscription,
          currentPrice
        );
        if (result.success) {
          subscription.notificationSent = true;
          notificationSent = true;
          notificationType = 'below_expected';
        }
      }
    }

    // Record notification in history
    if (notificationSent && notificationType) {
      await NotificationHistory.create({
        subscriptionId: subscription.id,
        price: currentPrice,
        sentAt: new Date(),
        type: notificationType
      });
    }

    await subscription.save();

    if (notificationSent) {
      console.log(`Notification sent to ${user.email} for ${subscription.fromAirport}->${subscription.toAirport}: ${notificationType}`);
    }
  } catch (error) {
    console.error(`Error processing subscription ${subscription.id}:`, error.message);
  }
};

/**
 * Start the cron job
 * Runs every 15 minutes
 */
const startPriceCheckerJob = () => {
  // Run every 15 minutes
  cron.schedule('*/15 * * * *', checkPrices);
  
  console.log('Price checker job scheduled to run every 15 minutes');
  
  // Also run immediately on startup (after a short delay)
  setTimeout(checkPrices, 5000);
};

module.exports = {
  startPriceCheckerJob,
  checkPrices
};
