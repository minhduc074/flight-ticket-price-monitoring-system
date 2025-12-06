require('dotenv').config();
const { sequelize } = require('./database');
require('../models'); // Load models and associations

const syncDatabase = async () => {
  try {
    console.log('Connecting to PostgreSQL...');
    await sequelize.authenticate();
    console.log('Connection established successfully.');

    console.log('Syncing database schema...');
    await sequelize.sync({ alter: true });
    console.log('Database schema synchronized successfully.');

    process.exit(0);
  } catch (error) {
    console.error('Error syncing database:', error);
    process.exit(1);
  }
};

syncDatabase();
