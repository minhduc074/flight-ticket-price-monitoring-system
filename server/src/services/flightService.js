const axios = require('axios');
const { prisma } = require('../lib/prisma');
const config = require('../config');
const flightScraperService = require('./flightScraperService');
const fs = require('fs').promises;
const path = require('path');

class FlightService {
  constructor() {
    // BetterFlight API configuration (free tier available)
    this.betterFlightApiUrl = 'https://api.flightapi.io/onewaytrip';
    this.betterFlightApiKey = process.env.FLIGHTAPI_KEY || null;
    
    // RapidAPI key for multiple services
    this.rapidApiKey = process.env.RAPIDAPI_KEY || null;
    this.serpApiKey = process.env.SERPAPI_KEY || null;
    
    // Log directory
    this.logDir = path.join(__dirname, '../../logs');
    this.initLogDirectory();
    
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
   * Initialize log directory
   */
  async initLogDirectory() {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create log directory:', error.message);
    }
  }

  /**
   * Write log to file
   */
  async writeLog(apiName, logType, data) {
    try {
      const timestamp = new Date().toISOString();
      const date = timestamp.split('T')[0];
      const logFileName = `${apiName}_${date}.log`;
      const logFilePath = path.join(this.logDir, logFileName);
      
      const logEntry = {
        timestamp,
        api: apiName,
        type: logType,
        data
      };
      
      const logLine = JSON.stringify(logEntry) + '\n';
      await fs.appendFile(logFilePath, logLine);
    } catch (error) {
      console.error('Failed to write log:', error.message);
    }
  }

  /**
   * Log API request and response
   */
  async logApiCall(apiName, request, response, error = null) {
    const logData = {
      request,
      response,
      error
    };
    
    // Log to console
    console.log(`\n=== ${apiName.toUpperCase()} REQUEST ===`);
    console.log('URL:', request.url);
    if (request.params) console.log('Params:', JSON.stringify(request.params, null, 2));
    if (request.body) console.log('Body:', JSON.stringify(request.body, null, 2));
    console.log('Headers:', JSON.stringify(request.headers, null, 2));
    
    if (error) {
      console.log(`\n=== ${apiName.toUpperCase()} ERROR ===`);
      console.log('Error Message:', error.message);
      if (error.status) console.log('Error Status:', error.status);
      if (error.headers) console.log('Error Headers:', JSON.stringify(error.headers, null, 2));
      if (error.body) console.log('Error Body:', JSON.stringify(error.body, null, 2));
      console.log(`=== END ${apiName.toUpperCase()} ERROR ===\n`);
    } else if (response) {
      console.log('Response Status:', response.status);
      console.log('Response Body:', JSON.stringify(response.body, null, 2));
      console.log(`=== END ${apiName.toUpperCase()} REQUEST ===\n`);
    }
    
    // Write to file
    await this.writeLog(apiName, error ? 'error' : 'success', logData);
  }

  /**
   * Search for flights between airports on a specific date
   */
  async searchFlights(fromAirport, toAirport, date) {
    try {
      // Check if we have recent cached data (within 30 minutes)
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const cachedFlights = await prisma.flightPrice.findMany({
        where: {
          fromAirport: fromAirport.toUpperCase(),
          toAirport: toAirport.toUpperCase(),
          date: {
            gte: startOfDay,
            lte: endOfDay
          },
          fetchedAt: { gte: thirtyMinutesAgo }
        },
        orderBy: { price: 'asc' }
      });

      if (cachedFlights.length > 0) {
        console.log(`Returning ${cachedFlights.length} cached flights for ${fromAirport}-${toAirport}`);
        return {
          success: true,
          cached: true,
          flights: cachedFlights
        };
      }

      // Use smart API rotation - only ONE provider per search to save quota
      console.log(`Fetching real flights for ${fromAirport}-${toAirport} on ${date}`);
      let flights = await this.fetchFromAPIs(fromAirport, toAirport, date);

      // Save to database if we got results
      if (flights.length > 0) {
        await prisma.flightPrice.deleteMany({
          where: {
            fromAirport: fromAirport.toUpperCase(),
            toAirport: toAirport.toUpperCase(),
            date: {
              gte: startOfDay,
              lte: endOfDay
            }
          }
        });
        
        await prisma.flightPrice.createMany({
          data: flights
        });
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
      
      const existingUsage = await prisma.apiUsage.findUnique({
        where: {
          apiProvider_month: { apiProvider, month }
        }
      });

      if (existingUsage) {
        await prisma.apiUsage.update({
          where: {
            apiProvider_month: { apiProvider, month }
          },
          data: {
            callCount: { increment: 1 },
            successCount: success ? { increment: 1 } : undefined,
            failCount: !success ? { increment: 1 } : undefined,
            rateLimitCount: rateLimited ? { increment: 1 } : undefined,
            lastCalledAt: now
          }
        });
      } else {
        await prisma.apiUsage.create({
          data: {
            apiProvider,
            month,
            callCount: 1,
            successCount: success ? 1 : 0,
            failCount: !success ? 1 : 0,
            rateLimitCount: rateLimited ? 1 : 0,
            lastCalledAt: now
          }
        });
      }
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
        
        // No results from this provider - try next one
        console.log(`${provider.name} API returned no results - trying next provider`);
        await this.trackApiUsage(provider.name, true, false);
        
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

    const requestUrl = 'https://serpapi.com/search.json';
    const requestParams = {
      engine: 'google_flights',
      departure_id: fromAirport.toUpperCase(),
      arrival_id: toAirport.toUpperCase(),
      outbound_date: new Date(date).toISOString().split('T')[0],
      type: '2',
      currency: 'VND',
      hl: 'vi',
      api_key: this.serpApiKey
    };
    
    try {
      const flightDate = new Date(date);
      
      const response = await axios.get(requestUrl, {
        params: requestParams,
        timeout: 30000
      });
      
      await this.logApiCall('serpapi', {
        url: requestUrl,
        params: { ...requestParams, api_key: '***' },
        headers: {}
      }, {
        status: response.status,
        body: response.data
      });

      const flights = [];
      
      // Parse best_flights
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
              source: 'serpapi',
              fetchedAt: new Date()
            });
          }
        }
      }
      
      // Also parse other_flights for more options
      if (response.data && response.data.other_flights) {
        for (const flight of response.data.other_flights) {
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
              source: 'serpapi',
              fetchedAt: new Date()
            });
          }
        }
      }
      
      return flights;
    } catch (error) {
      await this.logApiCall('serpapi', {
        url: requestUrl,
        params: { ...requestParams, api_key: '***' },
        headers: {}
      }, null, {
        message: error.message,
        status: error.response?.status,
        headers: error.response?.headers,
        body: error.response?.data
      });
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

    const requestUrl = 'https://agoda-com.p.rapidapi.com/flights/search-one-way';
    const requestParams = {
      origin: fromAirport.toUpperCase(),
      destination: toAirport.toUpperCase(),
      departureDate: new Date(date).toISOString().split('T')[0]
    };
    const requestHeaders = {
      'x-rapidapi-key': this.rapidApiKey,
      'x-rapidapi-host': 'agoda-com.p.rapidapi.com'
    };

    try {
      const flightDate = new Date(date);
      
      const response = await axios.get(
        requestUrl,
        {
          params: requestParams,
          headers: requestHeaders,
          timeout: 30000
        }
      );
      
      await this.logApiCall('agoda', {
        url: requestUrl,
        params: requestParams,
        headers: { ...requestHeaders, 'x-rapidapi-key': '***' }
      }, {
        status: response.status,
        body: response.data
      });

      const flights = [];
      
      // Parse Agoda response - handle multiple response structures
      const resultList = response.data?.flights?.resultList || 
                        response.data?.data?.resultList || 
                        [];
      
      for (const result of resultList) {
        const outboundSlice = result.outboundSlice;
        const segments = outboundSlice?.segments || [];
        const firstSegment = segments[0];
        
        // Get price from various possible locations
        const priceOption = result.priceOptions?.[0] || result.defaultPriceOption;
        const price = priceOption?.price?.display?.perBook?.allInclusive || 
                     priceOption?.price?.display?.averagePerPax?.allInclusive ||
                     result.price?.display?.perBook?.allInclusive || 0;
        
        if (firstSegment) {
          flights.push({
            fromAirport: fromAirport.toUpperCase(),
            toAirport: toAirport.toUpperCase(),
            date: flightDate,
            airline: firstSegment.carrierContent?.carrierName || 
                    firstSegment.operatingCarrierContent?.carrierName || 'Unknown',
            flightNumber: firstSegment.flightNumber || 'N/A',
            departureTime: firstSegment.departDateTime?.substring(11, 16) || '00:00',
            arrivalTime: firstSegment.arrivalDateTime?.substring(11, 16) || '00:00',
            duration: outboundSlice.duration || null,
            stops: segments.length - 1,
            price: Math.round(price),
            currency: 'USD',
            classType: 'economy',
            source: 'agoda',
            fetchedAt: new Date()
          });
        }
      }
      
      console.log(`Agoda parsed ${flights.length} flights from ${resultList.length} results`);
      return flights;
    } catch (error) {
      await this.logApiCall('agoda', {
        url: requestUrl,
        params: requestParams,
        headers: { ...requestHeaders, 'x-rapidapi-key': '***' }
      }, null, {
        message: error.message,
        status: error.response?.status,
        headers: error.response?.headers,
        body: error.response?.data
      });
      throw error;
    }
  }

  /**
   * Fetch from FlightAPI.io (requires API key)
   */
  async fetchFromFlightAPI(fromAirport, toAirport, date) {
    if (!this.betterFlightApiKey) {
      return [];
    }

    const flightDate = new Date(date);
    const dateStr = flightDate.toISOString().split('T')[0];
    const requestUrl = `${this.betterFlightApiUrl}/${this.betterFlightApiKey}/${fromAirport}/${toAirport}/${dateStr}/1/0/0/Economy/VND`;
    const maskedUrl = requestUrl.replace(this.betterFlightApiKey, '***');

    try {
      const response = await axios.get(
        requestUrl,
        { timeout: 30000 }
      );
      
      await this.logApiCall('flightapi', {
        url: maskedUrl,
        params: {},
        headers: {}
      }, {
        status: response.status,
        body: response.data
      });

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
              source: 'flightapi',
              fetchedAt: new Date()
            });
          }
        }
      }
      
      return flights;
    } catch (error) {
      await this.logApiCall('flightapi', {
        url: maskedUrl,
        params: {},
        headers: {}
      }, null, {
        message: error.message,
        status: error.response?.status,
        headers: error.response?.headers,
        body: error.response?.data
      });
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

    const requestUrl = 'https://google-flights2.p.rapidapi.com/api/v1/searchFlights';
    const requestParams = {
      departure_id: fromAirport.toUpperCase(),
      arrival_id: toAirport.toUpperCase(),
      outbound_date: new Date(date).toISOString().split('T')[0],
      travel_class: 'ECONOMY',
      adults: '1',
      show_hidden: '1',
      currency: 'USD',
      language_code: 'en-US',
      country_code: 'US',
      search_type: 'best'
    };
    const requestHeaders = {
      'x-rapidapi-key': this.rapidApiKey,
      'x-rapidapi-host': 'google-flights2.p.rapidapi.com'
    };

    try {
      const flightDate = new Date(date);
      
      const response = await axios.get(
        requestUrl,
        {
          params: requestParams,
          headers: requestHeaders,
          timeout: 30000
        }
      );
      
      await this.logApiCall('google-flights', {
        url: requestUrl,
        params: requestParams,
        headers: { ...requestHeaders, 'x-rapidapi-key': '***' }
      }, {
        status: response.status,
        body: response.data
      });

      const flights = [];
      
      // Parse flights from various possible response structures
      const flightsList = response.data?.data?.flights || 
                         response.data?.data?.itineraries ||
                         response.data?.flights ||
                         response.data?.best_flights ||
                         [];
      
      for (const flight of flightsList) {
        const firstLeg = flight.legs?.[0] || flight.flights?.[0];
        if (firstLeg) {
          flights.push({
            fromAirport: fromAirport.toUpperCase(),
            toAirport: toAirport.toUpperCase(),
            date: flightDate,
            airline: firstLeg.carriers?.[0]?.name || firstLeg.airline_name || firstLeg.airline || 'Unknown',
            flightNumber: firstLeg.flight_number || firstLeg.flightNumber || 'N/A',
            departureTime: (firstLeg.departure_time || firstLeg.departure)?.substring(11, 16) || '00:00',
            arrivalTime: (firstLeg.arrival_time || firstLeg.arrival)?.substring(11, 16) || '00:00',
            duration: flight.total_duration || firstLeg.duration || null,
            stops: (flight.legs?.length || 1) - 1,
            price: flight.price ? parseInt(flight.price) : 0,
            currency: 'USD',
            classType: 'economy',
            source: 'google-flights',
            fetchedAt: new Date()
          });
        }
      }
      
      // Also check for other_flights
      const otherFlights = response.data?.data?.other_flights || response.data?.other_flights || [];
      for (const flight of otherFlights) {
        const firstLeg = flight.legs?.[0] || flight.flights?.[0];
        if (firstLeg) {
          flights.push({
            fromAirport: fromAirport.toUpperCase(),
            toAirport: toAirport.toUpperCase(),
            date: flightDate,
            airline: firstLeg.carriers?.[0]?.name || firstLeg.airline_name || firstLeg.airline || 'Unknown',
            flightNumber: firstLeg.flight_number || firstLeg.flightNumber || 'N/A',
            departureTime: (firstLeg.departure_time || firstLeg.departure)?.substring(11, 16) || '00:00',
            arrivalTime: (firstLeg.arrival_time || firstLeg.arrival)?.substring(11, 16) || '00:00',
            duration: flight.total_duration || firstLeg.duration || null,
            stops: (flight.legs?.length || 1) - 1,
            price: flight.price ? parseInt(flight.price) : 0,
            currency: 'USD',
            classType: 'economy',
            source: 'google-flights',
            fetchedAt: new Date()
          });
        }
      }
      
      console.log(`Google Flights parsed ${flights.length} flights`);
      return flights;
    } catch (error) {
      await this.logApiCall('google-flights', {
        url: requestUrl,
        params: requestParams,
        headers: { ...requestHeaders, 'x-rapidapi-key': '***' }
      }, null, {
        message: error.message,
        status: error.response?.status,
        headers: error.response?.headers,
        body: error.response?.data
      });
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
