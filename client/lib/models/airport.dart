class Airport {
  final String code;
  final String name;
  final String city;

  Airport({
    required this.code,
    required this.name,
    required this.city,
  });

  factory Airport.fromJson(Map<String, dynamic> json) {
    return Airport(
      code: json['code'] ?? '',
      name: json['name'] ?? '',
      city: json['city'] ?? '',
    );
  }

  @override
  String toString() => '$city ($code)';
  
  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Airport && other.code == code;
  }
  
  @override
  int get hashCode => code.hashCode;
}
