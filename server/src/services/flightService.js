const axios = require('axios');
const { Op } = require('sequelize');
const { FlightPrice, ApiUsage } = require('../models');
const config = require('../config');
const flightScraperService = require('./flightScraperService');

class FlightService {
  constructor() {
    // BetterFlight API configuration (free tier available)
    this.betterFlightApiUrl = 'https://api.flightapi.io/onewaytrip';
    this.betterFlightApiKey = process.env.FLIGHTAPI_KEY || null;
    
    // RapidAPI key for multiple services
    this.rapidApiKey = process.env.RAPIDAPI_KEY || null;
    this.serpApiKey = process.env.SERPAPI_KEY || null;
    
    // Check if API keys are properly configured (not default values)
    const isValidKey = (key) => key && key !== 'your-rapidapi-key' && key !== 'your-flightapi-key' && key !== 'your-serpapi-key';
    
    this.rapidApiKey = isValidKey(this.rapidApiKey) ? this.rapidApiKey : null;
    this.serpApiKey = isValidKey(this.serpApiKey) ? this.serpApiKey : null;
    this.betterFlightApiKey = isValidKey(this.betterFlightApiKey) ? this.betterFlightApiKey : null;
    
    // API rotation strategy: Try one API at a time, if it fails move to next
    // Priority order based on reliability and free tier limits
    this.apiProviders = [
      { name: 'google-flights', enabled: !!this.rapidApiKey, method: 'fetchFromGoogleFlightsAPI' },
      { name: 'agoda', enabled: !!this.rapidApiKey, method: 'fetchFromAgodaAPI' },
      { name: 'serpapi', enabled: !!this.serpApiKey, method: 'fetchFromSerpAPI' },
      { name: 'skyscanner', enabled: !!this.rapidApiKey, method: 'fetchFromSkyscannerAPI' },
      { name: 'flightapi', enabled: !!this.betterFlightApiKey, method: 'fetchFromFlightAPI' }
    ];
    
    // Log enabled APIs
    const enabledApis = this.apiProviders.filter(p => p.enabled).map(p => p.name);
    if (enabledApis.length > 0) {
      console.log(`Enabled APIs: ${enabledApis.join(', ')}`);
    } else {
      console.log('⚠️  Warning: No flight APIs configured. Please set API keys in .env file.');
    }
    
    // Track which API to use (rotates on failure)
    this.currentApiIndex = 0;
  }

  /**
   * Search for flights between airports on a specific date
   */
  async searchFlights(fromAirport, toAirport, date) {
    try {
      // First, check if we have recent cached data (within 5 minutes for testing)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const cachedFlights = await FlightPrice.findAll({
        where: {
          fromAirport: fromAirport.toUpperCase(),
          toAirport: toAirport.toUpperCase(),
          date: {
            [Op.between]: [startOfDay, endOfDay]
          },
          fetchedAt: { [Op.gte]: fiveMinutesAgo }
        },
        order: [['price', 'ASC']]
      });

      if (cachedFlights.length > 0) {
        console.log(`Returning ${cachedFlights.length} cached flights for ${fromAirport}-${toAirport}`);
        return {
          success: true,
          cached: true,
          flights: cachedFlights
        };
      }

      // Fetch from real sources using scraper service
      console.log(`Fetching real flights for ${fromAirport}-${toAirport} on ${date}`);
      let flights = await flightScraperService.searchAllSources(fromAirport, toAirport, date);
      
      // If scraper returns no results, try direct airline APIs
      if (flights.length === 0) {
        const flightPromises = [
          this.fetchFromVietjetAir(fromAirport, toAirport, date),
          this.fetchFromVietnamAirlines(fromAirport, toAirport, date),
          this.fetchFromBambooAirways(fromAirport, toAirport, date),
        ];

        const results = await Promise.allSettled(flightPromises);
        
        for (const result of results) {
          if (result.status === 'fulfilled' && result.value.length > 0) {
            flights = flights.concat(result.value);
          }
        }
      }

      // Use smart API rotation - try one API at a time
      if (flights.length === 0) {
        flights = await this.fetchFromAPIs(fromAirport, toAirport, date);
      }

      // Save to database if we got results
      if (flights.length > 0) {
        await FlightPrice.destroy({
          where: {
            fromAirport: fromAirport.toUpperCase(),
            toAirport: toAirport.toUpperCase(),
            date: {
              [Op.between]: [startOfDay, endOfDay]
            }
          }
        });
        
        await FlightPrice.bulkCreate(flights);
        console.log(`Saved ${flights.length} flights to database`);
      } else {
        console.log(`No flights found for ${fromAirport}-${toAirport}`);
      }

      return {
        success: true,
        cached: false,
        flights: flights.sort((a, b) => a.price - b.price)
      };
    } catch (error) {
      console.error('Flight search error:', error);
      throw error;
    }
  }

  /**
   * Track API usage
   */
  async trackApiUsage(apiProvider, success, rateLimited = false) {
    try {
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      const [usage, created] = await ApiUsage.findOrCreate({
        where: { apiProvider, month },
        defaults: {
          callCount: 0,
          successCount: 0,
          failCount: 0,
          rateLimitCount: 0
        }
      });

      usage.callCount += 1;
      if (success) {
        usage.successCount += 1;
      } else {
        usage.failCount += 1;
      }
      if (rateLimited) {
        usage.rateLimitCount += 1;
      }
      usage.lastCalledAt = now;
      
      await usage.save();
    } catch (error) {
      console.error('Error tracking API usage:', error.message);
    }
  }

  /**
   * Smart API rotation - tries one API at a time, rotates on failure
   */
  async fetchFromAPIs(fromAirport, toAirport, date) {
    const enabledProviders = this.apiProviders.filter(p => p.enabled);
    
    if (enabledProviders.length === 0) {
      console.log('No API providers configured');
      return [];
    }

    // Try current API first
    let attempts = 0;
    const maxAttempts = enabledProviders.length;

    while (attempts < maxAttempts) {
      const provider = enabledProviders[this.currentApiIndex];
      
      try {
        console.log(`Trying ${provider.name} API (attempt ${attempts + 1}/${maxAttempts})...`);
        const flights = await this[provider.method](fromAirport, toAirport, date);
        
        if (flights.length > 0) {
          console.log(`✓ ${provider.name} API returned ${flights.length} flights`);
          await this.trackApiUsage(provider.name, true, false);
          return flights;
        }
        
        // No results means no flights available, not an error - stop trying other APIs
        console.log(`${provider.name} API returned no results (no flights available for this route/date)`);
        await this.trackApiUsage(provider.name, true, false);
        return []; // Return empty array immediately, don't try other providers
        
      } catch (error) {
        const isRateLimited = error.response?.status === 429 || 
                             error.message?.includes('rate limit') ||
                             error.message?.includes('quota');
        
        await this.trackApiUsage(provider.name, false, isRateLimited);
        
        if (isRateLimited) {
          console.log(`✗ ${provider.name} API rate limited - rotating to next API`);
          // Move to next API permanently when rate limited
          this.currentApiIndex = (this.currentApiIndex + 1) % enabledProviders.length;
        } else {
          console.log(`✗ ${provider.name} API error: ${error.message} - trying next provider`);
        }
      }

      // Move to next API for this request
      this.currentApiIndex = (this.currentApiIndex + 1) % enabledProviders.length;
      attempts++;
      
      // Small delay between API attempts
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('All API providers exhausted');
    return [];
  }

  /**
   * Fetch from SerpAPI (Google Flights scraper)
   */
  async fetchFromSerpAPI(fromAirport, toAirport, date) {
    if (!this.serpApiKey) {
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
          api_key: this.serpApiKey
        },
        timeout: 30000
      });

      const flights = [];
      
      if (response.data && response.data.best_flights) {
        for (const flight of response.data.best_flights) {
          const firstFlight = flight.flights?.[0];
          if (firstFlight) {
            flights.push({
              fromAirport: fromAirport.toUpperCase(),
              toAirport: toAirport.toUpperCase(),
              date: flightDate,
              airline: firstFlight.airline || 'Unknown',
              flightNumber: firstFlight.flight_number || 'N/A',
              departureTime: firstFlight.departure_airport?.time?.substring(11, 16) || '00:00',
              arrivalTime: firstFlight.arrival_airport?.time?.substring(11, 16) || '00:00',
              price: flight.price ? parseInt(flight.price) : 0,
              currency: 'VND',
              classType: 'economy',
              seatsAvailable: 0,
              source: 'serpapi',
              fetchedAt: new Date()
            });
          }
        }
      }
      
      return flights;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Fetch from Agoda via RapidAPI
   */
  async fetchFromAgodaAPI(fromAirport, toAirport, date) {
    if (!this.rapidApiKey) {
      return [];
    }

    try {
      const flightDate = new Date(date);
      const dateStr = flightDate.toISOString().split('T')[0];
      
      const response = await axios.get(
        'https://agoda-com.p.rapidapi.com/flights/search-one-way',
        {
          params: {
            origin: fromAirport.toUpperCase(),
            destination: toAirport.toUpperCase(),
            departureDate: dateStr,
            adults: '1',
            cabinClass: 'ECONOMY',
            currency: 'VND'
          },
          headers: {
            'X-RapidAPI-Key': this.rapidApiKey,
            'X-RapidAPI-Host': 'agoda-com.p.rapidapi.com'
          },
          timeout: 30000
        }
      );

      const flights = [];
      
      if (response.data && response.data.data && response.data.data.results) {
        for (const result of response.data.data.results) {
          const leg = result.legs?.[0];
          if (leg) {
            flights.push({
              fromAirport: fromAirport.toUpperCase(),
              toAirport: toAirport.toUpperCase(),
              date: flightDate,
              airline: leg.airline?.name || 'Unknown',
              flightNumber: leg.flightNumber || 'N/A',
              departureTime: leg.departure?.time?.substring(11, 16) || '00:00',
              arrivalTime: leg.arrival?.time?.substring(11, 16) || '00:00',
              price: result.price?.amount ? parseInt(result.price.amount) : 0,
              currency: 'VND',
              classType: 'economy',
              seatsAvailable: 0,
              source: 'agoda',
              fetchedAt: new Date()
            });
          }
        }
      }
      
      return flights;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Fetch from VietJet Air API
   */
  async fetchFromVietjetAir(fromAirport, toAirport, date) {
    try {
      const flightDate = new Date(date);
      const dateStr = flightDate.toISOString().split('T')[0];
      
      // VietJet Air search API endpoint
      const response = await axios.post(
        'https://www.vietjetair.com/api/booking/search',
        {
          DepartureStation: fromAirport.toUpperCase(),
          ArrivalStation: toAirport.toUpperCase(),
          DepartureDate: dateStr,
          Adults: 1,
          Children: 0,
          Infants: 0,
          Currency: 'VND',
          CabinClass: 'Y'
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Origin': 'https://www.vietjetair.com',
            'Referer': 'https://www.vietjetair.com/'
          },
          timeout: 15000
        }
      );

      const flights = [];
      
      if (response.data && response.data.Journeys) {
        for (const journey of response.data.Journeys) {
          for (const fare of journey.Fares || []) {
            flights.push({
              fromAirport: fromAirport.toUpperCase(),
              toAirport: toAirport.toUpperCase(),
              date: flightDate,
              airline: 'VietJet Air',
              flightNumber: journey.FlightNumber || `VJ${Math.floor(Math.random() * 900) + 100}`,
              departureTime: journey.DepartureTime?.substring(11, 16) || '00:00',
              arrivalTime: journey.ArrivalTime?.substring(11, 16) || '00:00',
              price: fare.TotalAmount || fare.Amount,
              currency: 'VND',
              classType: fare.ClassOfService || 'economy',
              seatsAvailable: fare.AvailableCount || 0,
              source: 'vietjetair',
              fetchedAt: new Date()
            });
          }
        }
      }
      
      return flights;
    } catch (error) {
      console.log('VietJet Air API error:', error.message);
      return [];
    }
  }

  /**
   * Fetch from Vietnam Airlines API
   */
  async fetchFromVietnamAirlines(fromAirport, toAirport, date) {
    try {
      const flightDate = new Date(date);
      const dateStr = flightDate.toISOString().split('T')[0];
      
      // Vietnam Airlines IBE API
      const response = await axios.post(
        'https://www.vietnamairlines.com/api/booking/availability',
        {
          origin: fromAirport.toUpperCase(),
          destination: toAirport.toUpperCase(),
          departDate: dateStr,
          adult: 1,
          child: 0,
          infant: 0,
          currency: 'VND',
          cabinClass: 'ECONOMY'
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Origin': 'https://www.vietnamairlines.com',
            'Referer': 'https://www.vietnamairlines.com/'
          },
          timeout: 15000
        }
      );

      const flights = [];
      
      if (response.data && response.data.flights) {
        for (const flight of response.data.flights) {
          flights.push({
            fromAirport: fromAirport.toUpperCase(),
            toAirport: toAirport.toUpperCase(),
            date: flightDate,
            airline: 'Vietnam Airlines',
            flightNumber: flight.flightNumber || `VN${Math.floor(Math.random() * 900) + 100}`,
            departureTime: flight.departureTime || '00:00',
            arrivalTime: flight.arrivalTime || '00:00',
            price: flight.price || flight.lowestPrice,
            currency: 'VND',
            classType: 'economy',
            seatsAvailable: flight.seatsAvailable || 0,
            source: 'vietnamairlines',
            fetchedAt: new Date()
          });
        }
      }
      
      return flights;
    } catch (error) {
      console.log('Vietnam Airlines API error:', error.message);
      return [];
    }
  }

  /**
   * Fetch from Bamboo Airways API
   */
  async fetchFromBambooAirways(fromAirport, toAirport, date) {
    try {
      const flightDate = new Date(date);
      const dateStr = flightDate.toISOString().split('T')[0];
      
      const response = await axios.post(
        'https://www.bambooairways.com/api/flight/search',
        {
          departure: fromAirport.toUpperCase(),
          arrival: toAirport.toUpperCase(),
          departureDate: dateStr,
          passengers: { adult: 1, child: 0, infant: 0 },
          currency: 'VND'
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Origin': 'https://www.bambooairways.com',
            'Referer': 'https://www.bambooairways.com/'
          },
          timeout: 15000
        }
      );

      const flights = [];
      
      if (response.data && response.data.results) {
        for (const result of response.data.results) {
          flights.push({
            fromAirport: fromAirport.toUpperCase(),
            toAirport: toAirport.toUpperCase(),
            date: flightDate,
            airline: 'Bamboo Airways',
            flightNumber: result.flightNumber || `QH${Math.floor(Math.random() * 900) + 100}`,
            departureTime: result.departureTime || '00:00',
            arrivalTime: result.arrivalTime || '00:00',
            price: result.price || result.totalPrice,
            currency: 'VND',
            classType: 'economy',
            seatsAvailable: result.availability || 0,
            source: 'bambooairways',
            fetchedAt: new Date()
          });
        }
      }
      
      return flights;
    } catch (error) {
      console.log('Bamboo Airways API error:', error.message);
      return [];
    }
  }

  /**
   * Fetch from FlightAPI.io (requires API key)
   */
  async fetchFromFlightAPI(fromAirport, toAirport, date) {
    if (!this.betterFlightApiKey) {
      return [];
    }

    try {
      const flightDate = new Date(date);
      const dateStr = flightDate.toISOString().split('T')[0];
      
      const response = await axios.get(
        `${this.betterFlightApiUrl}/${this.betterFlightApiKey}/${fromAirport}/${toAirport}/${dateStr}/1/0/0/Economy/VND`,
        { timeout: 30000 }
      );

      const flights = [];
      
      if (response.data && response.data.itineraries) {
        for (const itinerary of response.data.itineraries) {
          const leg = itinerary.legs?.[0];
          if (leg) {
            flights.push({
              fromAirport: fromAirport.toUpperCase(),
              toAirport: toAirport.toUpperCase(),
              date: flightDate,
              airline: leg.carriers?.[0]?.name || 'Unknown',
              flightNumber: leg.flightNumbers?.[0] || 'N/A',
              departureTime: leg.departure?.substring(11, 16) || '00:00',
              arrivalTime: leg.arrival?.substring(11, 16) || '00:00',
              price: itinerary.price?.amount || 0,
              currency: 'VND',
              classType: 'economy',
              seatsAvailable: 0,
              source: 'flightapi',
              fetchedAt: new Date()
            });
          }
        }
      }
      
      return flights;
    } catch (error) {
      console.log('FlightAPI.io error:', error.message);
      return [];
    }
  }

  /**
   * Fetch from Google Flights via RapidAPI
   */
  async fetchFromGoogleFlightsAPI(fromAirport, toAirport, date) {
    if (!this.rapidApiKey) {
      return [];
    }

    try {
      const flightDate = new Date(date);
      const dateStr = flightDate.toISOString().split('T')[0];
      
      const response = await axios.get(
        'https://google-flights2.p.rapidapi.com/api/v1/searchFlights',
        {
          params: {
            departure_id: fromAirport.toUpperCase(),
            arrival_id: toAirport.toUpperCase(),
            outbound_date: dateStr,
            travel_class: 'ECONOMY',
            adults: '1',
            show_hidden: '1',
            currency: 'VND',
            language_code: 'vi-VN',
            country_code: 'VN',
            search_type: 'best'
          },
          headers: {
            'X-RapidAPI-Key': this.rapidApiKey,
            'X-RapidAPI-Host': 'google-flights2.p.rapidapi.com'
          },
          timeout: 30000
        }
      );

      const flights = [];
      
      if (response.data && response.data.data && response.data.data.flights) {
        for (const flight of response.data.data.flights) {
          const firstLeg = flight.legs?.[0];
          if (firstLeg) {
            flights.push({
              fromAirport: fromAirport.toUpperCase(),
              toAirport: toAirport.toUpperCase(),
              date: flightDate,
              airline: firstLeg.carriers?.[0]?.name || firstLeg.airline_name || 'Unknown',
              flightNumber: firstLeg.flight_number || 'N/A',
              departureTime: firstLeg.departure_time?.substring(11, 16) || '00:00',
              arrivalTime: firstLeg.arrival_time?.substring(11, 16) || '00:00',
              price: flight.price ? parseInt(flight.price) : 0,
              currency: 'VND',
              classType: 'economy',
              seatsAvailable: 0,
              source: 'google-flights',
              fetchedAt: new Date()
            });
          }
        }
      }
      
      return flights;
    } catch (error) {
      console.log('Google Flights API error:', error.message);
      return [];
    }
  }

  /**
   * Fetch from Skyscanner via RapidAPI
   */
  async fetchFromSkyscannerAPI(fromAirport, toAirport, date) {
    if (!this.rapidApiKey) {
      return [];
    }

    try {
      const flightDate = new Date(date);
      const dateStr = flightDate.toISOString().split('T')[0];
      
      // Create search session
      const sessionResponse = await axios.post(
        'https://skyscanner-api.p.rapidapi.com/v3/flights/live/search/create',
        {
          query: {
            market: 'VN',
            locale: 'vi-VN',
            currency: 'VND',
            queryLegs: [{
              originPlaceId: { iata: fromAirport.toUpperCase() },
              destinationPlaceId: { iata: toAirport.toUpperCase() },
              date: { year: flightDate.getFullYear(), month: flightDate.getMonth() + 1, day: flightDate.getDate() }
            }],
            adults: 1,
            cabinClass: 'CABIN_CLASS_ECONOMY'
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-RapidAPI-Key': this.rapidApiKey,
            'X-RapidAPI-Host': 'skyscanner-api.p.rapidapi.com'
          },
          timeout: 30000
        }
      );

      const flights = [];
      const data = sessionResponse.data;
      
      if (data?.content?.results?.itineraries) {
        for (const [id, itinerary] of Object.entries(data.content.results.itineraries)) {
          const legId = itinerary.legIds?.[0];
          const leg = data.content.results.legs?.[legId];
          const pricingOption = itinerary.pricingOptions?.[0];
          
          if (leg && pricingOption) {
            const carrierId = leg.operatingCarrierIds?.[0];
            const carrier = data.content.results.carriers?.[carrierId];
            
            flights.push({
              fromAirport: fromAirport.toUpperCase(),
              toAirport: toAirport.toUpperCase(),
              date: flightDate,
              airline: carrier?.name || 'Unknown',
              flightNumber: leg.segments?.[0]?.flightNumber || 'N/A',
              departureTime: leg.departureDateTime?.substring(11, 16) || '00:00',
              arrivalTime: leg.arrivalDateTime?.substring(11, 16) || '00:00',
              price: pricingOption.price?.amount ? parseInt(pricingOption.price.amount) : 0,
              currency: 'VND',
              classType: 'economy',
              seatsAvailable: 0,
              source: 'skyscanner',
              fetchedAt: new Date()
            });
          }
        }
      }
      
      return flights;
    } catch (error) {
      console.log('Skyscanner API error:', error.message);
      return [];
    }
  }

  /**
   * Get the lowest price for a route on a specific date
   */
  async getLowestPrice(fromAirport, toAirport, date) {
    const result = await this.searchFlights(fromAirport, toAirport, date);
    
    if (result.flights.length === 0) {
      return null;
    }
    
    return result.flights[0].price;
  }

  /**
   * Get all airports
   */
  getAirports() {
    return config.airports;
  }
}

module.exports = new FlightService();
