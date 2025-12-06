const axios = require('axios');
const config = require('../config');

/**
 * Flight Scraper Service
 * Uses multiple data sources to fetch real flight prices
 */
class FlightScraperService {
  constructor() {
    this.serpApiKey = process.env.SERPAPI_KEY || null;
    this.aviationStackKey = process.env.AVIATIONSTACK_KEY || null;
  }

  /**
   * Fetch flights using Google Flights via SerpAPI
   * SerpAPI has a free tier with 100 searches/month
   * Sign up at: https://serpapi.com/
   */
  async fetchFromGoogleFlights(fromAirport, toAirport, date) {
    if (!this.serpApiKey) {
      console.log('SERPAPI_KEY not configured, skipping Google Flights');
      return [];
    }

    try {
      const flightDate = new Date(date);
      const dateStr = flightDate.toISOString().split('T')[0];
      
      const response = await axios.get('https://serpapi.com/search.json', {
        params: {
          engine: 'google_flights',
          departure_id: fromAirport.toUpperCase(),
          arrival_id: toAirport.toUpperCase(),
          outbound_date: dateStr,
          currency: 'VND',
          hl: 'vi',
          gl: 'vn',
          type: '2', // One-way
          adults: 1,
          api_key: this.serpApiKey
        },
        timeout: 30000
      });

      const flights = [];
      
      // Parse best flights
      if (response.data?.best_flights) {
        for (const flight of response.data.best_flights) {
          const firstLeg = flight.flights?.[0];
          if (firstLeg) {
            flights.push({
              fromAirport: fromAirport.toUpperCase(),
              toAirport: toAirport.toUpperCase(),
              date: flightDate,
              airline: firstLeg.airline || 'Unknown',
              flightNumber: firstLeg.flight_number || 'N/A',
              departureTime: firstLeg.departure_airport?.time?.substring(0, 5) || '00:00',
              arrivalTime: firstLeg.arrival_airport?.time?.substring(0, 5) || '00:00',
              price: flight.price || 0,
              currency: 'VND',
              classType: flight.travel_class?.toLowerCase() || 'economy',
              seatsAvailable: 0,
              source: 'google_flights',
              fetchedAt: new Date()
            });
          }
        }
      }

      // Parse other flights
      if (response.data?.other_flights) {
        for (const flight of response.data.other_flights) {
          const firstLeg = flight.flights?.[0];
          if (firstLeg) {
            flights.push({
              fromAirport: fromAirport.toUpperCase(),
              toAirport: toAirport.toUpperCase(),
              date: flightDate,
              airline: firstLeg.airline || 'Unknown',
              flightNumber: firstLeg.flight_number || 'N/A',
              departureTime: firstLeg.departure_airport?.time?.substring(0, 5) || '00:00',
              arrivalTime: firstLeg.arrival_airport?.time?.substring(0, 5) || '00:00',
              price: flight.price || 0,
              currency: 'VND',
              classType: flight.travel_class?.toLowerCase() || 'economy',
              seatsAvailable: 0,
              source: 'google_flights',
              fetchedAt: new Date()
            });
          }
        }
      }

      console.log(`Google Flights found ${flights.length} flights for ${fromAirport}-${toAirport}`);
      return flights;
    } catch (error) {
      console.error('Google Flights API error:', error.message);
      return [];
    }
  }

  /**
   * Fetch from Traveloka using their public search
   */
  async fetchFromTraveloka(fromAirport, toAirport, date) {
    try {
      const flightDate = new Date(date);
      const dateStr = flightDate.toISOString().split('T')[0].replace(/-/g, '');
      
      // Traveloka search endpoint
      const response = await axios.get(
        `https://www.traveloka.com/api/v2/flight/search/oneway`,
        {
          params: {
            origin: fromAirport.toUpperCase(),
            destination: toAirport.toUpperCase(),
            date: dateStr,
            adult: 1,
            child: 0,
            infant: 0,
            class: 'ECONOMY'
          },
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
            'Referer': 'https://www.traveloka.com/vi-vn/flight',
            'Origin': 'https://www.traveloka.com'
          },
          timeout: 15000
        }
      );

      const flights = [];
      
      if (response.data?.data?.searchResults) {
        for (const result of response.data.data.searchResults) {
          const journey = result.journeys?.[0];
          const segment = journey?.segments?.[0];
          
          if (segment) {
            flights.push({
              fromAirport: fromAirport.toUpperCase(),
              toAirport: toAirport.toUpperCase(),
              date: flightDate,
              airline: segment.airlineName || segment.marketingAirline || 'Unknown',
              flightNumber: segment.flightNumber || 'N/A',
              departureTime: segment.departureTime || '00:00',
              arrivalTime: segment.arrivalTime || '00:00',
              price: result.fare?.totalFare || result.price || 0,
              currency: 'VND',
              classType: 'economy',
              seatsAvailable: result.seatsAvailable || 0,
              source: 'traveloka',
              fetchedAt: new Date()
            });
          }
        }
      }

      console.log(`Traveloka found ${flights.length} flights for ${fromAirport}-${toAirport}`);
      return flights;
    } catch (error) {
      console.log('Traveloka API error:', error.message);
      return [];
    }
  }

  /**
   * Aggregate flights from all sources
   */
  async searchAllSources(fromAirport, toAirport, date) {
    const sources = [
      this.fetchFromGoogleFlights(fromAirport, toAirport, date),
      this.fetchFromTraveloka(fromAirport, toAirport, date)
    ];

    const results = await Promise.allSettled(sources);
    let allFlights = [];

    for (const result of results) {
      if (result.status === 'fulfilled' && Array.isArray(result.value)) {
        allFlights = allFlights.concat(result.value);
      }
    }

    // Remove duplicates based on flightNumber and airline
    const uniqueFlights = [];
    const seen = new Set();

    for (const flight of allFlights) {
      const key = `${flight.airline}-${flight.flightNumber}-${flight.departureTime}`;
      if (!seen.has(key) && flight.price > 0) {
        seen.add(key);
        uniqueFlights.push(flight);
      }
    }

    // Sort by price
    return uniqueFlights.sort((a, b) => a.price - b.price);
  }
}

module.exports = new FlightScraperService();
