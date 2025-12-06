const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const NotificationHistory = sequelize.define('NotificationHistory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  subscriptionId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'subscriptions',
      key: 'id'
    }
  },
  price: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('price_drop', 'ticket_available', 'below_expected'),
    allowNull: false
  },
  sentAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'notification_history',
  timestamps: false
});

module.exports = NotificationHistory;
