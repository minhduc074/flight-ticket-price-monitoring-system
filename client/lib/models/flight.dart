class Flight {
  final String? id;
  final String airline;
  final String flightNumber;
  final String departureTime;
  final String arrivalTime;
  final int price;
  final String currency;
  final String classType;
  final int? seatsAvailable;

  Flight({
    this.id,
    required this.airline,
    required this.flightNumber,
    required this.departureTime,
    required this.arrivalTime,
    required this.price,
    this.currency = 'VND',
    this.classType = 'economy',
    this.seatsAvailable,
  });

  factory Flight.fromJson(Map<String, dynamic> json) {
    return Flight(
      id: json['id'],
      airline: json['airline'] ?? '',
      flightNumber: json['flightNumber'] ?? '',
      departureTime: json['departureTime'] ?? '',
      arrivalTime: json['arrivalTime'] ?? '',
      price: json['price'] ?? 0,
      currency: json['currency'] ?? 'VND',
      classType: json['classType'] ?? 'economy',
      seatsAvailable: json['seatsAvailable'],
    );
  }
}
