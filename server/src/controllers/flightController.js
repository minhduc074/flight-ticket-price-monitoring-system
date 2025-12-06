const { flightService } = require('../services');
const config = require('../config');

/**
 * Search for flights
 */
exports.searchFlights = async (req, res, next) => {
  try {
    const { from, to, date } = req.query;

    if (!from || !to || !date) {
      return res.status(400).json({
        success: false,
        message: 'From airport, to airport, and date are required'
      });
    }

    // Validate airports
    const airports = config.airports;
    if (!airports[from.toUpperCase()]) {
      return res.status(400).json({
        success: false,
        message: `Invalid departure airport code: ${from}`
      });
    }
    if (!airports[to.toUpperCase()]) {
      return res.status(400).json({
        success: false,
        message: `Invalid arrival airport code: ${to}`
      });
    }

    // Validate date
    const searchDate = new Date(date);
    if (isNaN(searchDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (searchDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Cannot search for past dates'
      });
    }

    const result = await flightService.searchFlights(from.toUpperCase(), to.toUpperCase(), date);

    res.json({
      success: true,
      data: {
        from: {
          code: from.toUpperCase(),
          ...airports[from.toUpperCase()]
        },
        to: {
          code: to.toUpperCase(),
          ...airports[to.toUpperCase()]
        },
        date: searchDate.toISOString().split('T')[0],
        cached: result.cached,
        flights: result.flights.map(flight => ({
          id: flight._id,
          airline: flight.airline,
          flightNumber: flight.flightNumber,
          departureTime: flight.departureTime,
          arrivalTime: flight.arrivalTime,
          price: flight.price,
          currency: flight.currency,
          classType: flight.classType,
          seatsAvailable: flight.seatsAvailable
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get list of airports
 */
exports.getAirports = async (req, res, next) => {
  try {
    const airports = config.airports;
    
    const airportList = Object.entries(airports).map(([code, info]) => ({
      code,
      name: info.name,
      city: info.city
    }));

    res.json({
      success: true,
      data: {
        airports: airportList
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get lowest price for a route
 */
exports.getLowestPrice = async (req, res, next) => {
  try {
    const { from, to, date } = req.query;

    if (!from || !to || !date) {
      return res.status(400).json({
        success: false,
        message: 'From airport, to airport, and date are required'
      });
    }

    const lowestPrice = await flightService.getLowestPrice(from.toUpperCase(), to.toUpperCase(), date);

    if (lowestPrice === null) {
      return res.status(404).json({
        success: false,
        message: 'No flights found for this route and date'
      });
    }

    res.json({
      success: true,
      data: {
        from: from.toUpperCase(),
        to: to.toUpperCase(),
        date,
        lowestPrice,
        currency: 'VND'
      }
    });
  } catch (error) {
    next(error);
  }
};
