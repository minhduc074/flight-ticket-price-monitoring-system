const User = require('./User');
const Subscription = require('./Subscription');
const FlightPrice = require('./FlightPrice');
const NotificationHistory = require('./NotificationHistory');

// Define associations
User.hasMany(Subscription, { foreignKey: 'userId', as: 'subscriptions' });
Subscription.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Subscription.hasMany(NotificationHistory, { foreignKey: 'subscriptionId', as: 'notificationHistory' });
NotificationHistory.belongsTo(Subscription, { foreignKey: 'subscriptionId', as: 'subscription' });

module.exports = {
  User,
  Subscription,
  FlightPrice,
  NotificationHistory
};
