import '../models/models.dart';
import 'api_service.dart';

class FlightService {
  static final FlightService _instance = FlightService._internal();
  factory FlightService() => _instance;
  FlightService._internal();

  final ApiService _api = ApiService();

  Future<List<Airport>> getAirports() async {
    final response = await _api.get('/flights/airports');
    
    if (response['success'] == true) {
      final airports = (response['data']['airports'] as List)
          .map((a) => Airport.fromJson(a))
          .toList();
      return airports;
    }
    
    throw Exception(response['message'] ?? 'Failed to load airports');
  }

  Future<List<Flight>> searchFlights(
    String from,
    String to,
    DateTime date,
  ) async {
    final dateStr = date.toIso8601String().split('T')[0];
    final response = await _api.get(
      '/flights/search?from=$from&to=$to&date=$dateStr',
    );
    
    if (response['success'] == true) {
      final flights = (response['data']['flights'] as List)
          .map((f) => Flight.fromJson(f))
          .toList();
      return flights;
    }
    
    throw Exception(response['message'] ?? 'Failed to search flights');
  }

  Future<int?> getLowestPrice(
    String from,
    String to,
    DateTime date,
  ) async {
    final dateStr = date.toIso8601String().split('T')[0];
    final response = await _api.get(
      '/flights/lowest-price?from=$from&to=$to&date=$dateStr',
    );
    
    if (response['success'] == true) {
      return response['data']['lowestPrice'];
    }
    
    return null;
  }
}
