import 'package:shared_preferences/shared_preferences.dart';
import '../models/user.dart';
import 'api_service.dart';

class AuthService {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  final ApiService _api = ApiService();
  
  static const String _tokenKey = 'auth_token';
  static const String _userKey = 'user_data';

  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await _api.post('/auth/login', body: {
      'email': email,
      'password': password,
    });

    if (response['success'] == true) {
      final token = response['data']['token'];
      final userData = response['data']['user'];
      
      await _saveToken(token);
      await _saveUser(userData);
      _api.setAuthToken(token);
      
      return response['data'];
    }
    
    throw Exception(response['message'] ?? 'Login failed');
  }

  Future<Map<String, dynamic>> register(
    String email,
    String password,
    String name,
  ) async {
    final response = await _api.post('/auth/register', body: {
      'email': email,
      'password': password,
      'name': name,
    });

    if (response['success'] == true) {
      final token = response['data']['token'];
      final userData = response['data']['user'];
      
      await _saveToken(token);
      await _saveUser(userData);
      _api.setAuthToken(token);
      
      return response['data'];
    }
    
    throw Exception(response['message'] ?? 'Registration failed');
  }

  Future<void> logout() async {
    try {
      await _api.post('/auth/logout');
    } catch (e) {
      // Ignore logout API errors
    }
    
    await _clearStorage();
    _api.setAuthToken(null);
  }

  Future<void> updateFcmToken(String fcmToken) async {
    await _api.post('/auth/fcm-token', body: {
      'fcmToken': fcmToken,
    });
  }

  Future<User?> getCurrentUser() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(_tokenKey);
    
    if (token == null) return null;
    
    _api.setAuthToken(token);
    
    try {
      final response = await _api.get('/auth/profile');
      if (response['success'] == true) {
        return User.fromJson(response['data']['user']);
      }
    } catch (e) {
      await _clearStorage();
    }
    
    return null;
  }

  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  Future<void> _saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }

  Future<void> _saveUser(Map<String, dynamic> user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_userKey, user.toString());
  }

  Future<void> _clearStorage() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userKey);
  }
}
