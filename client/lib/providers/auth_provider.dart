import 'package:flutter/foundation.dart';
import '../models/user.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';
import '../services/notification_service.dart';

class AuthProvider with ChangeNotifier {
  final AuthService _authService = AuthService();
  final ApiService _apiService = ApiService();
  
  User? _user;
  String? _token;
  bool _isLoading = false;
  String? _error;

  User? get user => _user;
  String? get token => _token;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _user != null && _token != null;

  Future<void> checkAuth() async {
    _isLoading = true;
    notifyListeners();

    try {
      _user = await _authService.getCurrentUser();
      _token = await _authService.getToken();
      
      if (_user != null && _token != null) {
        _apiService.setAuthToken(_token);
        await _updateFcmToken();
      }
    } catch (e) {
      _user = null;
      _token = null;
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await _authService.login(email, password);
      _user = User.fromJson(data['user']);
      _token = data['token'];
      _apiService.setAuthToken(_token);
      
      await _updateFcmToken();
      
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> register(String email, String password, String name) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await _authService.register(email, password, name);
      _user = User.fromJson(data['user']);
      _token = data['token'];
      _apiService.setAuthToken(_token);
      
      await _updateFcmToken();
      
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();

    await _authService.logout();
    _user = null;
    _token = null;
    _apiService.setAuthToken(null);

    _isLoading = false;
    notifyListeners();
  }

  Future<void> _updateFcmToken() async {
    try {
      final fcmToken = await NotificationService.instance.getToken();
      if (fcmToken != null) {
        await _authService.updateFcmToken(fcmToken);
      }
      
      // Listen for token refresh
      NotificationService.instance.onTokenRefresh.listen((newToken) async {
        if (_user != null) {
          await _authService.updateFcmToken(newToken);
        }
      });
    } catch (e) {
      print('Failed to update FCM token: $e');
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
