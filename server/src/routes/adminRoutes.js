const express = require('express');
const { adminController } = require('../controllers');
const { adminAuth } = require('../middleware');

const router = express.Router();

// All routes require admin authentication
router.use(adminAuth);

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// API Usage
router.get('/api-usage', adminController.getApiUsage);

// Users
router.get('/users', adminController.getUsers);
router.put('/users/:id/status', adminController.updateUserStatus);

// Subscriptions
router.get('/subscriptions', adminController.getAllSubscriptions);
router.delete('/subscriptions/:id', adminController.deleteSubscription);

// Price history
router.get('/price-history', adminController.getFlightPriceHistory);

// Manual price check
router.post('/trigger-price-check', adminController.triggerPriceCheck);

// Database sync (for initial deployment)
router.post('/sync-db', adminController.syncDatabase);

// API Logs
router.get('/logs', adminController.getApiLogs);
router.get('/logs/:apiName', adminController.getApiLogsByName);

module.exports = router;
