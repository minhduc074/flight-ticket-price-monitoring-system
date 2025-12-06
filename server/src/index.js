require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const config = require('./config');
const { sequelize } = require('./config/database');
const { initializeFirebase } = require('./config/firebase');
const routes = require('./routes');
const { errorHandler } = require('./middleware');
const { startPriceCheckerJob } = require('./jobs');
const { User } = require('./models');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (admin panel)
app.use(express.static(path.join(__dirname, '../public')));

// API routes
app.use('/api', routes);

// Admin panel route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin.html'));
});

// Root redirect
app.get('/', (req, res) => {
  res.redirect('/admin');
});

// Error handler
app.use(errorHandler);

// Create default admin if not exists
const createDefaultAdmin = async () => {
  try {
    const adminExists = await User.findOne({ where: { role: 'admin' } });
    
    if (!adminExists) {
      await User.create({
        email: config.admin.email,
        password: config.admin.password,
        name: 'Admin',
        role: 'admin'
      });
      console.log(`Default admin created: ${config.admin.email}`);
    }
  } catch (error) {
    console.error('Error creating default admin:', error.message);
  }
};

// Start server
const startServer = async () => {
  try {
    // Connect to PostgreSQL and sync models
    await sequelize.authenticate();
    console.log('PostgreSQL connected successfully');
    
    // Sync database models (creates tables if they don't exist)
    await sequelize.sync({ alter: false });
    console.log('Database models synced');
    
    // Initialize Firebase
    initializeFirebase();
    
    // Create default admin
    await createDefaultAdmin();
    
    // Start price checker cron job
    startPriceCheckerJob();
    
    // Start HTTP server
    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
      console.log(`Admin panel: http://localhost:${config.port}/admin`);
      console.log(`API endpoint: http://localhost:${config.port}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
