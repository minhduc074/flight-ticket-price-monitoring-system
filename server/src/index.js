require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
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

// Determine public folder path (works for both local and Vercel)
const publicPath = path.join(__dirname, '../public');

// Serve static files (admin panel)
app.use(express.static(publicPath));

// API routes
app.use('/api', routes);

// Admin panel route - serve HTML directly for Vercel compatibility
app.get('/admin', (req, res) => {
  const adminHtmlPath = path.join(publicPath, 'admin.html');
  
  // Check if file exists
  if (fs.existsSync(adminHtmlPath)) {
    res.sendFile(adminHtmlPath);
  } else {
    // Fallback: send inline HTML for Vercel
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fly Ticket Monitor - Admin</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
          .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          h1 { color: #333; }
          .status { padding: 10px; background: #e8f5e9; border-radius: 4px; margin: 10px 0; }
          a { color: #1976d2; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🛫 Fly Ticket Monitor - Admin Panel</h1>
          <div class="status">✅ Server is running</div>
          <p>API Endpoint: <a href="/api">/api</a></p>
          <p>Health Check: <a href="/api/health">/api/health</a></p>
        </div>
      </body>
      </html>
    `);
  }
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
    
    // Start HTTP server (only in non-serverless environment)
    if (!process.env.VERCEL) {
      app.listen(config.port, () => {
        console.log(`Server running on port ${config.port}`);
        console.log(`Admin panel: http://localhost:${config.port}/admin`);
        console.log(`API endpoint: http://localhost:${config.port}/api`);
      });
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
  }
};

// Initialize on startup
startServer();

// Export for Vercel serverless
module.exports = app;
