import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../utils/date_time_utils.dart';
import '../providers/subscription_provider.dart';
import '../models/subscription.dart';

class SubscriptionDetailScreen extends StatefulWidget {
  final String subscriptionId;

  const SubscriptionDetailScreen({
    super.key,
    required this.subscriptionId,
  });

  @override
  State<SubscriptionDetailScreen> createState() => _SubscriptionDetailScreenState();
}

class _SubscriptionDetailScreenState extends State<SubscriptionDetailScreen> {
  Subscription? _subscription;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadSubscription();
  }

  Future<void> _loadSubscription() async {
    setState(() {
      _isLoading = true;
    });

    final provider = Provider.of<SubscriptionProvider>(context, listen: false);
    final subscription = await provider.getSubscription(widget.subscriptionId);

    setState(() {
      _subscription = subscription;
      _isLoading = false;
    });
  }

  String _formatPrice(int price) {
    return NumberFormat.currency(
      locale: 'vi_VN',
      symbol: '₫',
      decimalDigits: 0,
    ).format(price);
  }

  String _formatDate(DateTime date) {
    return DateTimeUtils.formatFullDate(date);
  }

  String _formatDateTime(DateTime date) {
    return DateTimeUtils.formatDateTime(date);
  }

  Future<void> _toggleActive() async {
    if (_subscription == null) return;

    final provider = Provider.of<SubscriptionProvider>(context, listen: false);
    final success = await provider.updateSubscription(
      widget.subscriptionId,
      isActive: !_subscription!.isActive,
    );

    if (success) {
      await _loadSubscription();
    }
  }

  Future<void> _deleteSubscription() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Xóa đăng ký'),
        content: Text('Bạn có chắc muốn xóa đăng ký theo dõi này?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('Hủy'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: Text('Xóa'),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      final provider = Provider.of<SubscriptionProvider>(context, listen: false);
      final success = await provider.deleteSubscription(widget.subscriptionId);

      if (success && mounted) {
        Navigator.pop(context);
      }
    }
  }

  Future<void> _updateExpectedPrice() async {
    if (_subscription == null) return;

    final controller = TextEditingController(
      text: _subscription!.expectedPrice.toString(),
    );

    final newPrice = await showDialog<int>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Cập nhật giá kỳ vọng'),
        content: TextField(
          controller: controller,
          keyboardType: TextInputType.number,
          decoration: InputDecoration(
            labelText: 'Giá kỳ vọng (VNĐ)',
            suffixText: 'VNĐ',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Hủy'),
          ),
          TextButton(
            onPressed: () {
              final price = int.tryParse(controller.text);
              if (price != null && price > 0) {
                Navigator.pop(context, price);
              }
            },
            child: Text('Cập nhật'),
          ),
        ],
      ),
    );

    if (newPrice != null && mounted) {
      final provider = Provider.of<SubscriptionProvider>(context, listen: false);
      final success = await provider.updateSubscription(
        widget.subscriptionId,
        expectedPrice: newPrice,
      );

      if (success) {
        await _loadSubscription();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Chi tiết theo dõi'),
        actions: [
          if (_subscription != null)
            PopupMenuButton<String>(
              onSelected: (value) {
                switch (value) {
                  case 'toggle':
                    _toggleActive();
                    break;
                  case 'delete':
                    _deleteSubscription();
                    break;
                }
              },
              itemBuilder: (context) => [
                PopupMenuItem(
                  value: 'toggle',
                  child: Row(
                    children: [
                      Icon(
                        _subscription!.isActive
                            ? Icons.pause
                            : Icons.play_arrow,
                      ),
                      const SizedBox(width: 8),
                      Text(_subscription!.isActive ? 'Tạm dừng' : 'Kích hoạt'),
                    ],
                  ),
                ),
                PopupMenuItem(
                  value: 'delete',
                  child: Row(
                    children: [
                      Icon(Icons.delete, color: Colors.red),
                      const SizedBox(width: 8),
                      Text('Xóa', style: TextStyle(color: Colors.red)),
                    ],
                  ),
                ),
              ],
            ),
        ],
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator())
          : _subscription == null
              ? Center(child: Text('Không tìm thấy dữ liệu'))
              : RefreshIndicator(
                  onRefresh: _loadSubscription,
                  child: SingleChildScrollView(
                    physics: AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        _buildRouteCard(),
                        const SizedBox(height: 16),
                        _buildPriceCard(),
                        const SizedBox(height: 16),
                        _buildInfoCard(),
                      ],
                    ),
                  ),
                ),
    );
  }

  Widget _buildRouteCard() {
    final subscription = _subscription!;
    
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                Column(
                  children: [
                    Text(
                      subscription.from.code,
                      style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      subscription.from.city,
                      style: TextStyle(color: Colors.grey[600]),
                    ),
                  ],
                ),
                Column(
                  children: [
                    Icon(Icons.flight, size: 32, color: Colors.grey[400]),
                    Container(
                      width: 80,
                      height: 2,
                      color: Colors.grey[300],
                    ),
                  ],
                ),
                Column(
                  children: [
                    Text(
                      subscription.to.code,
                      style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      subscription.to.city,
                      style: TextStyle(color: Colors.grey[600]),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.calendar_today, size: 16, color: Colors.grey[600]),
                  const SizedBox(width: 8),
                  Text(
                    _formatDate(subscription.date),
                    style: TextStyle(fontWeight: FontWeight.w500),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPriceCard() {
    final subscription = _subscription!;
    final isPriceMet = subscription.isPriceMet;
    final priceColor = isPriceMet ? Colors.green : Colors.orange;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  'Thông tin giá',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                IconButton(
                  icon: Icon(Icons.edit, size: 20),
                  onPressed: _updateExpectedPrice,
                  tooltip: 'Cập nhật giá kỳ vọng',
                ),
              ],
            ),
            const SizedBox(height: 16),
            
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Giá kỳ vọng',
                        style: TextStyle(color: Colors.grey[600]),
                      ),
                      Text(
                        _formatPrice(subscription.expectedPrice),
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Giá hiện tại',
                        style: TextStyle(color: Colors.grey[600]),
                      ),
                      Text(
                        subscription.currentPrice != null
                            ? _formatPrice(subscription.currentPrice!)
                            : 'Chưa có',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: subscription.currentPrice != null
                              ? priceColor
                              : Colors.grey,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            
            if (subscription.currentPrice != null) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: priceColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Icon(
                      isPriceMet
                          ? Icons.check_circle
                          : Icons.info_outline,
                      color: priceColor,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        isPriceMet
                            ? 'Giá đã đạt mức kỳ vọng! Bạn có thể đặt vé ngay.'
                            : 'Giá hiện tại cao hơn ${subscription.priceDifferencePercent?.toStringAsFixed(1)}% so với kỳ vọng.',
                        style: TextStyle(color: priceColor),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildInfoCard() {
    final subscription = _subscription!;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Thông tin theo dõi',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            
            _buildInfoRow(
              'Trạng thái',
              subscription.isActive ? 'Đang theo dõi' : 'Tạm dừng',
              color: subscription.isActive ? Colors.green : Colors.grey,
            ),
            _buildInfoRow(
              'Lần kiểm tra gần nhất',
              subscription.lastCheckedAt != null
                  ? _formatDateTime(subscription.lastCheckedAt!)
                  : 'Chưa kiểm tra',
            ),
            _buildInfoRow(
              'Ngày tạo',
              _formatDateTime(subscription.createdAt),
            ),
            _buildInfoRow(
              'Đã gửi thông báo',
              subscription.notificationSent ? 'Có' : 'Chưa',
              color: subscription.notificationSent ? Colors.green : Colors.grey,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value, {Color? color}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(color: Colors.grey[600]),
          ),
          Text(
            value,
            style: TextStyle(
              fontWeight: FontWeight.w500,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}
