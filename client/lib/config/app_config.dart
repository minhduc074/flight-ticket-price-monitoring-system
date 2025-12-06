class AppConfig {
  // Production server URL
  static const String baseUrl = 'https://flight-ticket-price-monitoring-system.onrender.com/api';
  
  // For local development, uncomment one of these:
  // static const String baseUrl = 'http://10.0.2.2:3000/api'; // Android emulator
  // static const String baseUrl = 'http://localhost:3000/api'; // iOS simulator
  
  static const Duration connectionTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
}
