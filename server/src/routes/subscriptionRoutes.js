const express = require('express');
const { subscriptionController } = require('../controllers');
const { auth } = require('../middleware');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Create subscription
router.post('/', subscriptionController.createSubscription);

// Get user's subscriptions
router.get('/', subscriptionController.getSubscriptions);

// Get a specific subscription
router.get('/:id', subscriptionController.getSubscription);

// Update subscription
router.put('/:id', subscriptionController.updateSubscription);

// Delete subscription
router.delete('/:id', subscriptionController.deleteSubscription);

module.exports = router;
