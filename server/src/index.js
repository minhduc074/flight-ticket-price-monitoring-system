require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');

const config = require('./config');
const { prisma, connectDB } = require('./lib/prisma');
const { initializeFirebase } = require('./config/firebase');
const routes = require('./routes');
const { errorHandler } = require('./middleware');
const { startPriceCheckerJob } = require('./jobs');

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
    const adminExists = await prisma.user.findFirst({ 
      where: { role: 'admin' } 
    });
    
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(config.admin.password, salt);
      
      await prisma.user.create({
        data: {
          email: config.admin.email,
          password: hashedPassword,
          name: 'Admin',
          role: 'admin'
        }
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
    // Connect to PostgreSQL via Prisma
    await connectDB();
    
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
