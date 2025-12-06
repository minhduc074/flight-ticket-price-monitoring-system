const { Sequelize } = require('sequelize');
const config = require('./index');

// Use DATABASE_URL if available (for Render.com), otherwise use individual config
const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      protocol: 'postgres',
      logging: config.nodeEnv === 'development' ? console.log : false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false // For Render.com SSL
        }
      },
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    })
  : new Sequelize(
      config.database.name,
      config.database.user,
      config.database.password,
      {
        host: config.database.host,
        port: config.database.port,
        dialect: 'postgres',
        logging: config.nodeEnv === 'development' ? console.log : false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      }
    );

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    if (process.env.DATABASE_URL) {
      console.log('PostgreSQL Connected: Using DATABASE_URL (Production)');
    } else {
      console.log(`PostgreSQL Connected: ${config.database.host}:${config.database.port}/${config.database.name}`);
    }
    return sequelize;
  } catch (error) {
    console.error('PostgreSQL connection error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
