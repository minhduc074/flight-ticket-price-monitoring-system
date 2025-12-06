import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';

class ApiException implements Exception {
  final String message;
  final int? statusCode;

  ApiException(this.message, {this.statusCode});

  @override
  String toString() => message;
}

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  String? _authToken;

  void setAuthToken(String? token) {
    _authToken = token;
  }

  Map<String, String> get _headers {
    final headers = {
      'Content-Type': 'application/json',
    };
    if (_authToken != null) {
      headers['Authorization'] = 'Bearer $_authToken';
    }
    return headers;
  }

  Future<Map<String, dynamic>> get(String endpoint) async {
    try {
      final response = await http
          .get(
            Uri.parse('${AppConfig.baseUrl}$endpoint'),
            headers: _headers,
          )
          .timeout(AppConfig.connectionTimeout);

      return _handleResponse(response);
    } catch (e) {
      throw ApiException('Connection error: ${e.toString()}');
    }
  }

  Future<Map<String, dynamic>> post(
    String endpoint, {
    Map<String, dynamic>? body,
  }) async {
    try {
      final response = await http
          .post(
            Uri.parse('${AppConfig.baseUrl}$endpoint'),
            headers: _headers,
            body: body != null ? jsonEncode(body) : null,
          )
          .timeout(AppConfig.connectionTimeout);

      return _handleResponse(response);
    } catch (e) {
      throw ApiException('Connection error: ${e.toString()}');
    }
  }

  Future<Map<String, dynamic>> put(
    String endpoint, {
    Map<String, dynamic>? body,
  }) async {
    try {
      final response = await http
          .put(
            Uri.parse('${AppConfig.baseUrl}$endpoint'),
            headers: _headers,
            body: body != null ? jsonEncode(body) : null,
          )
          .timeout(AppConfig.connectionTimeout);

      return _handleResponse(response);
    } catch (e) {
      throw ApiException('Connection error: ${e.toString()}');
    }
  }

  Future<Map<String, dynamic>> delete(String endpoint) async {
    try {
      final response = await http
          .delete(
            Uri.parse('${AppConfig.baseUrl}$endpoint'),
            headers: _headers,
          )
          .timeout(AppConfig.connectionTimeout);

      return _handleResponse(response);
    } catch (e) {
      throw ApiException('Connection error: ${e.toString()}');
    }
  }

  Map<String, dynamic> _handleResponse(http.Response response) {
    final data = jsonDecode(response.body) as Map<String, dynamic>;

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return data;
    }

    throw ApiException(
      data['message'] ?? 'Unknown error',
      statusCode: response.statusCode,
    );
  }
}
