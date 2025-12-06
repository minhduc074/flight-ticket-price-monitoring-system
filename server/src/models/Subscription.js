const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Subscription = sequelize.define('Subscription', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  fromAirport: {
    type: DataTypes.STRING(3),
    allowNull: false
  },
  toAirport: {
    type: DataTypes.STRING(3),
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  expectedPrice: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  currentPrice: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  lastCheckedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  notificationSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'subscriptions',
  timestamps: true,
  indexes: [
    {
      fields: ['userId', 'fromAirport', 'toAirport', 'date']
    },
    {
      fields: ['isActive', 'date']
    }
  ]
});

module.exports = Subscription;
