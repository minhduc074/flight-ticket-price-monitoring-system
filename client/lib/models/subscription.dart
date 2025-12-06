import 'airport.dart';

class Subscription {
  final String id;
  final Airport from;
  final Airport to;
  final DateTime date;
  final int expectedPrice;
  final int? currentPrice;
  final bool isActive;
  final DateTime? lastCheckedAt;
  final bool notificationSent;
  final DateTime createdAt;

  Subscription({
    required this.id,
    required this.from,
    required this.to,
    required this.date,
    required this.expectedPrice,
    this.currentPrice,
    required this.isActive,
    this.lastCheckedAt,
    required this.notificationSent,
    required this.createdAt,
  });

  factory Subscription.fromJson(Map<String, dynamic> json) {
    return Subscription(
      id: json['id'] ?? '',
      from: Airport.fromJson(json['from'] ?? {}),
      to: Airport.fromJson(json['to'] ?? {}),
      date: DateTime.parse(json['date']),
      expectedPrice: json['expectedPrice'] ?? 0,
      currentPrice: json['currentPrice'],
      isActive: json['isActive'] ?? true,
      lastCheckedAt: json['lastCheckedAt'] != null 
          ? DateTime.parse(json['lastCheckedAt']) 
          : null,
      notificationSent: json['notificationSent'] ?? false,
      createdAt: DateTime.parse(json['createdAt']),
    );
  }

  bool get isPriceMet => currentPrice != null && currentPrice! <= expectedPrice;
  
  double? get priceDifferencePercent {
    if (currentPrice == null) return null;
    return ((currentPrice! - expectedPrice) / expectedPrice) * 100;
  }
}
