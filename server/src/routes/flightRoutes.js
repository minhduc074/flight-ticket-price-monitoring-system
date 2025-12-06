const express = require('express');
const { flightController } = require('../controllers');

const router = express.Router();

// Search flights
router.get('/search', flightController.searchFlights);

// Get all airports
router.get('/airports', flightController.getAirports);

// Get lowest price for a route
router.get('/lowest-price', flightController.getLowestPrice);

module.exports = router;
