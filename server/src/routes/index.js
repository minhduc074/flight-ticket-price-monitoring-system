const express = require('express');
const authRoutes = require('./authRoutes');
const flightRoutes = require('./flightRoutes');
const subscriptionRoutes = require('./subscriptionRoutes');
const adminRoutes = require('./adminRoutes');

const router = express.Router();

// API routes
router.use('/auth', authRoutes);
router.use('/flights', flightRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/admin', adminRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
