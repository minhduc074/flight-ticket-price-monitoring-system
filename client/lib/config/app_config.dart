import 'package:shared_preferences/shared_preferences.dart';

class AppConfig {
  // Default production server URL
  static const String defaultBaseUrl =
      'https://flight-ticket-price-monitoring-syst.vercel.app/api';

  // For backwards compatibility
  static const String baseUrl = defaultBaseUrl;

  // Get custom server URL from SharedPreferences, or return default
  static Future<String> getServerUrl() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final customUrl = prefs.getString('custom_server_url');
      return customUrl ?? defaultBaseUrl;
    } catch (e) {
      return defaultBaseUrl;
    }
  }

  static const Duration connectionTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
}
