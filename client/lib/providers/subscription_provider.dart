import 'package:flutter/foundation.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import '../services/subscription_service.dart';
import '../services/flight_service.dart';

class SubscriptionProvider with ChangeNotifier {
  final SubscriptionService _subscriptionService = SubscriptionService();
  final FlightService _flightService = FlightService();
  final ApiService _apiService = ApiService();

  List<Subscription> _subscriptions = [];
  List<Airport> _airports = [];
  bool _isLoading = false;
  String? _error;

  List<Subscription> get subscriptions => _subscriptions;
  List<Subscription> get activeSubscriptions =>
      _subscriptions.where((s) => s.isActive).toList();
  List<Airport> get airports => _airports;
  bool get isLoading => _isLoading;
  String? get error => _error;

  void setAuthToken(String? token) {
    _apiService.setAuthToken(token);
  }

  Future<void> loadAirports() async {
    if (_airports.isNotEmpty) return;
    
    try {
      _airports = await _flightService.getAirports();
      notifyListeners();
    } catch (e) {
      print('Failed to load airports: $e');
    }
  }

  Future<void> loadSubscriptions() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _subscriptions = await _subscriptionService.getSubscriptions();
      _subscriptions.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<Subscription?> getSubscription(String id) async {
    try {
      return await _subscriptionService.getSubscription(id);
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return null;
    }
  }

  Future<bool> createSubscription({
    required String fromAirport,
    required String toAirport,
    required DateTime date,
    required int expectedPrice,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _subscriptionService.createSubscription(
        fromAirport: fromAirport,
        toAirport: toAirport,
        date: date,
        expectedPrice: expectedPrice,
      );
      
      await loadSubscriptions();
      return true;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> updateSubscription(
    String id, {
    int? expectedPrice,
    bool? isActive,
  }) async {
    try {
      await _subscriptionService.updateSubscription(
        id,
        expectedPrice: expectedPrice,
        isActive: isActive,
      );
      
      await loadSubscriptions();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> deleteSubscription(String id) async {
    try {
      await _subscriptionService.deleteSubscription(id);
      _subscriptions.removeWhere((s) => s.id == id);
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<List<Flight>> searchFlights(
    String from,
    String to,
    DateTime date,
  ) async {
    try {
      return await _flightService.searchFlights(from, to, date);
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return [];
    }
  }

  Future<int?> getLowestPrice(
    String from,
    String to,
    DateTime date,
  ) async {
    try {
      return await _flightService.getLowestPrice(from, to, date);
    } catch (e) {
      return null;
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
