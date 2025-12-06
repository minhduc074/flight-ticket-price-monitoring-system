const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ApiUsage = sequelize.define('ApiUsage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  apiProvider: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'google-flights, agoda, serpapi, skyscanner, flightapi'
  },
  month: {
    type: DataTypes.STRING(7),
    allowNull: false,
    comment: 'Format: YYYY-MM'
  },
  callCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  successCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  failCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  rateLimitCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  lastCalledAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'api_usage',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['apiProvider', 'month']
    }
  ]
});

module.exports = ApiUsage;
