import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _formKey = GlobalKey<FormState>();
  final _serverUrlController = TextEditingController();
  bool _isLoading = true;
  String _currentUrl = '';

  final List<Map<String, String>> _presetUrls = [
    {
      'name': 'Production (Vercel)',
      'url': 'https://flight-ticket-price-monitoring-syst.vercel.app/api',
    },
    {
      'name': 'Local Development',
      'url': 'http://localhost:3000/api',
    },
    {
      'name': 'Android Emulator (Local)',
      'url': 'http://10.0.2.2:3000/api',
    },
  ];

  @override
  void initState() {
    super.initState();
    _loadCurrentUrl();
  }

  @override
  void dispose() {
    _serverUrlController.dispose();
    super.dispose();
  }

  Future<void> _loadCurrentUrl() async {
    final prefs = await SharedPreferences.getInstance();
    final customUrl = prefs.getString('custom_server_url');
    
    setState(() {
      _currentUrl = customUrl ?? AppConfig.baseUrl;
      _serverUrlController.text = _currentUrl;
      _isLoading = false;
    });
  }

  Future<void> _saveServerUrl(String url) async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('custom_server_url', url);
      
      setState(() {
        _currentUrl = url;
        _isLoading = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Đã lưu địa chỉ server. Vui lòng khởi động lại ứng dụng.'),
            backgroundColor: Colors.green,
            duration: Duration(seconds: 3),
          ),
        );
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi khi lưu cài đặt: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _resetToDefault() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Khôi phục mặc định'),
        content: Text('Bạn có chắc muốn khôi phục địa chỉ server về mặc định?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('Hủy'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text('Khôi phục'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('custom_server_url');
      
      setState(() {
        _currentUrl = AppConfig.baseUrl;
        _serverUrlController.text = _currentUrl;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Đã khôi phục về địa chỉ mặc định'),
            backgroundColor: Colors.green,
          ),
        );
      }
    }
  }

  void _selectPresetUrl(String url) {
    setState(() {
      _serverUrlController.text = url;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Cài đặt'),
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Current URL Display
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(
                                  Icons.info_outline,
                                  color: Colors.blue,
                                  size: 20,
                                ),
                                SizedBox(width: 8),
                                Text(
                                  'Địa chỉ server hiện tại',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Colors.grey[600],
                                  ),
                                ),
                              ],
                            ),
                            SizedBox(height: 8),
                            Text(
                              _currentUrl,
                              style: TextStyle(
                                fontWeight: FontWeight.w500,
                                fontFamily: 'monospace',
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    SizedBox(height: 24),

                    // Preset URLs
                    Text(
                      'Địa chỉ server có sẵn',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    SizedBox(height: 12),
                    ..._presetUrls.map((preset) {
                      final isSelected = _serverUrlController.text == preset['url'];
                      return Card(
                        margin: EdgeInsets.only(bottom: 8),
                        color: isSelected ? Colors.blue.withOpacity(0.1) : null,
                        child: ListTile(
                          title: Text(preset['name']!),
                          subtitle: Text(
                            preset['url']!,
                            style: TextStyle(
                              fontFamily: 'monospace',
                              fontSize: 11,
                            ),
                          ),
                          trailing: isSelected
                              ? Icon(Icons.check_circle, color: Colors.blue)
                              : Icon(Icons.radio_button_unchecked),
                          onTap: () => _selectPresetUrl(preset['url']!),
                        ),
                      );
                    }).toList(),
                    SizedBox(height: 24),

                    // Custom URL Input
                    Text(
                      'Địa chỉ tùy chỉnh',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    SizedBox(height: 12),
                    TextFormField(
                      controller: _serverUrlController,
                      decoration: InputDecoration(
                        labelText: 'Địa chỉ server',
                        hintText: 'https://your-server.com/api',
                        prefixIcon: Icon(Icons.link),
                        border: OutlineInputBorder(),
                        helperText: 'Nhập địa chỉ đầy đủ bao gồm /api',
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Vui lòng nhập địa chỉ server';
                        }
                        if (!value.startsWith('http://') &&
                            !value.startsWith('https://')) {
                          return 'Địa chỉ phải bắt đầu bằng http:// hoặc https://';
                        }
                        return null;
                      },
                    ),
                    SizedBox(height: 24),

                    // Action Buttons
                    ElevatedButton(
                      onPressed: () => _saveServerUrl(_serverUrlController.text),
                      style: ElevatedButton.styleFrom(
                        padding: EdgeInsets.symmetric(vertical: 16),
                      ),
                      child: Text('Lưu cài đặt'),
                    ),
                    SizedBox(height: 12),
                    OutlinedButton(
                      onPressed: _resetToDefault,
                      style: OutlinedButton.styleFrom(
                        padding: EdgeInsets.symmetric(vertical: 16),
                      ),
                      child: Text('Khôi phục mặc định'),
                    ),
                    SizedBox(height: 24),

                    // Warning
                    Card(
                      color: Colors.orange.withOpacity(0.1),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Icon(
                              Icons.warning_amber,
                              color: Colors.orange,
                              size: 20,
                            ),
                            SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                'Lưu ý: Sau khi thay đổi địa chỉ server, bạn cần khởi động lại ứng dụng để áp dụng thay đổi.',
                                style: TextStyle(
                                  fontSize: 13,
                                  color: Colors.orange[900],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}
