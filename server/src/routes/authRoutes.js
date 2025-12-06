const express = require('express');
const { body } = require('express-validator');
const { authController } = require('../controllers');
const { auth } = require('../middleware');

const router = express.Router();

// Register
router.post('/register', [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').trim().notEmpty().withMessage('Name is required')
], authController.register);

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
  body('password').notEmpty().withMessage('Password is required')
], authController.login);

// Get profile (authenticated)
router.get('/profile', auth, authController.getProfile);

// Update profile (authenticated)
router.put('/profile', auth, authController.updateProfile);

// Update FCM token (authenticated)
router.post('/fcm-token', auth, authController.updateFcmToken);

// Logout (authenticated)
router.post('/logout', auth, authController.logout);

module.exports = router;
