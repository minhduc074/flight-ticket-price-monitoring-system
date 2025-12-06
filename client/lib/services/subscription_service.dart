import '../models/models.dart';
import 'api_service.dart';

class SubscriptionService {
  static final SubscriptionService _instance = SubscriptionService._internal();
  factory SubscriptionService() => _instance;
  SubscriptionService._internal();

  final ApiService _api = ApiService();

  Future<List<Subscription>> getSubscriptions({bool? active}) async {
    String endpoint = '/subscriptions';
    if (active != null) {
      endpoint += '?active=$active';
    }
    
    final response = await _api.get(endpoint);
    
    if (response['success'] == true) {
      final subscriptions = (response['data']['subscriptions'] as List)
          .map((s) => Subscription.fromJson(s))
          .toList();
      return subscriptions;
    }
    
    throw Exception(response['message'] ?? 'Failed to load subscriptions');
  }

  Future<Subscription> getSubscription(String id) async {
    final response = await _api.get('/subscriptions/$id');
    
    if (response['success'] == true) {
      return Subscription.fromJson(response['data']['subscription']);
    }
    
    throw Exception(response['message'] ?? 'Failed to load subscription');
  }

  Future<Subscription> createSubscription({
    required String fromAirport,
    required String toAirport,
    required DateTime date,
    required int expectedPrice,
  }) async {
    final response = await _api.post('/subscriptions', body: {
      'fromAirport': fromAirport,
      'toAirport': toAirport,
      'date': date.toIso8601String().split('T')[0],
      'expectedPrice': expectedPrice,
    });
    
    if (response['success'] == true) {
      // Return a basic subscription object
      return Subscription(
        id: response['data']['subscription']['id'],
        from: Airport(code: fromAirport, name: '', city: ''),
        to: Airport(code: toAirport, name: '', city: ''),
        date: date,
        expectedPrice: expectedPrice,
        currentPrice: response['data']['subscription']['currentPrice'],
        isActive: true,
        notificationSent: false,
        createdAt: DateTime.now(),
      );
    }
    
    throw Exception(response['message'] ?? 'Failed to create subscription');
  }

  Future<void> updateSubscription(
    String id, {
    int? expectedPrice,
    bool? isActive,
  }) async {
    final body = <String, dynamic>{};
    if (expectedPrice != null) body['expectedPrice'] = expectedPrice;
    if (isActive != null) body['isActive'] = isActive;
    
    final response = await _api.put('/subscriptions/$id', body: body);
    
    if (response['success'] != true) {
      throw Exception(response['message'] ?? 'Failed to update subscription');
    }
  }

  Future<void> deleteSubscription(String id) async {
    final response = await _api.delete('/subscriptions/$id');
    
    if (response['success'] != true) {
      throw Exception(response['message'] ?? 'Failed to delete subscription');
    }
  }
}
