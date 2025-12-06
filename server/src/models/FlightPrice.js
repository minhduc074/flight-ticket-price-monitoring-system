const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FlightPrice = sequelize.define('FlightPrice', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
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
  airline: {
    type: DataTypes.STRING,
    allowNull: false
  },
  flightNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  departureTime: {
    type: DataTypes.STRING,
    allowNull: true
  },
  arrivalTime: {
    type: DataTypes.STRING,
    allowNull: true
  },
  price: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'VND'
  },
  classType: {
    type: DataTypes.ENUM('economy', 'business', 'first'),
    defaultValue: 'economy'
  },
  seatsAvailable: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  source: {
    type: DataTypes.STRING,
    defaultValue: 'api'
  },
  fetchedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'flight_prices',
  timestamps: false,
  indexes: [
    {
      fields: ['fromAirport', 'toAirport', 'date']
    },
    {
      fields: ['fetchedAt']
    }
  ]
});

module.exports = FlightPrice;
