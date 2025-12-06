const { Sequelize } = require('sequelize');
const config = require('./src/config');

const sequelize = new Sequelize(
  config.database.name,
  config.database.user,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: 'postgres',
    logging: false
  }
);

async function clearCache() {
  try {
    await sequelize.query('DELETE FROM flight_prices');
    console.log('✅ Flight price cache cleared successfully');
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing cache:', error.message);
    process.exit(1);
  }
}

clearCache();
