import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:dropdown_search/dropdown_search.dart';
import 'package:table_calendar/table_calendar.dart';
import '../providers/subscription_provider.dart';
import '../models/models.dart';

class SearchFlightsScreen extends StatefulWidget {
  const SearchFlightsScreen({super.key});

  @override
  State<SearchFlightsScreen> createState() => _SearchFlightsScreenState();
}

class _SearchFlightsScreenState extends State<SearchFlightsScreen> {
  Airport? _fromAirport;
  Airport? _toAirport;
  DateTime _selectedDate = DateTime.now().add(const Duration(days: 7));
  int _expectedPrice = 1500000;
  
  List<Flight> _flights = [];
  bool _isSearching = false;
  bool _isCreating = false;
  int? _currentLowestPrice;

  final _priceController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _priceController.text = _formatNumber(_expectedPrice);
    
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<SubscriptionProvider>(context, listen: false).loadAirports();
    });
  }

  @override
  void dispose() {
    _priceController.dispose();
    super.dispose();
  }

  String _formatNumber(int number) {
    return NumberFormat('#,###', 'vi_VN').format(number);
  }

  String _formatPrice(int price) {
    return NumberFormat.currency(
      locale: 'vi_VN',
      symbol: '₫',
      decimalDigits: 0,
    ).format(price);
  }

  Future<void> _searchFlights() async {
    if (_fromAirport == null || _toAirport == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Vui lòng chọn điểm đi và điểm đến')),
      );
      return;
    }

    setState(() {
      _isSearching = true;
    });

    final provider = Provider.of<SubscriptionProvider>(context, listen: false);
    final flights = await provider.searchFlights(
      _fromAirport!.code,
      _toAirport!.code,
      _selectedDate,
    );

    setState(() {
      _flights = flights;
      _isSearching = false;
      _currentLowestPrice = flights.isNotEmpty ? flights.first.price : null;
    });
  }

  Future<void> _createSubscription() async {
    if (_fromAirport == null || _toAirport == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Vui lòng chọn điểm đi và điểm đến')),
      );
      return;
    }

    setState(() {
      _isCreating = true;
    });

    final provider = Provider.of<SubscriptionProvider>(context, listen: false);
    final success = await provider.createSubscription(
      fromAirport: _fromAirport!.code,
      toAirport: _toAirport!.code,
      date: _selectedDate,
      expectedPrice: _expectedPrice,
    );

    setState(() {
      _isCreating = false;
    });

    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Đã tạo đăng ký theo dõi thành công'),
          backgroundColor: Colors.green,
        ),
      );
      Navigator.pop(context);
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(provider.error ?? 'Tạo đăng ký thất bại'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _showDatePicker() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Chọn ngày bay',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 16),
            TableCalendar(
              firstDay: DateTime.now(),
              lastDay: DateTime.now().add(const Duration(days: 365)),
              focusedDay: _selectedDate,
              selectedDayPredicate: (day) => isSameDay(_selectedDate, day),
              onDaySelected: (selectedDay, focusedDay) {
                setState(() {
                  _selectedDate = selectedDay;
                });
                Navigator.pop(context);
              },
              calendarStyle: CalendarStyle(
                selectedDecoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.primary,
                  shape: BoxShape.circle,
                ),
                todayDecoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.primary.withOpacity(0.3),
                  shape: BoxShape.circle,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Tìm chuyến bay'),
      ),
      body: Consumer<SubscriptionProvider>(
        builder: (context, provider, child) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // From Airport
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Thông tin chuyến bay',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 16),
                        
                        // From
                        DropdownSearch<Airport>(
                          popupProps: PopupProps.menu(
                            showSearchBox: true,
                            searchFieldProps: TextFieldProps(
                              decoration: InputDecoration(
                                hintText: 'Tìm sân bay...',
                                prefixIcon: Icon(Icons.search),
                              ),
                            ),
                          ),
                          items: provider.airports,
                          itemAsString: (airport) => '${airport.city} (${airport.code})',
                          onChanged: (airport) {
                            setState(() {
                              _fromAirport = airport;
                            });
                          },
                          selectedItem: _fromAirport,
                          dropdownDecoratorProps: DropDownDecoratorProps(
                            dropdownSearchDecoration: InputDecoration(
                              labelText: 'Điểm đi',
                              prefixIcon: Icon(Icons.flight_takeoff),
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        
                        // To
                        DropdownSearch<Airport>(
                          popupProps: PopupProps.menu(
                            showSearchBox: true,
                            searchFieldProps: TextFieldProps(
                              decoration: InputDecoration(
                                hintText: 'Tìm sân bay...',
                                prefixIcon: Icon(Icons.search),
                              ),
                            ),
                          ),
                          items: provider.airports,
                          itemAsString: (airport) => '${airport.city} (${airport.code})',
                          onChanged: (airport) {
                            setState(() {
                              _toAirport = airport;
                            });
                          },
                          selectedItem: _toAirport,
                          dropdownDecoratorProps: DropDownDecoratorProps(
                            dropdownSearchDecoration: InputDecoration(
                              labelText: 'Điểm đến',
                              prefixIcon: Icon(Icons.flight_land),
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        
                        // Date
                        InkWell(
                          onTap: _showDatePicker,
                          child: InputDecorator(
                            decoration: InputDecoration(
                              labelText: 'Ngày bay',
                              prefixIcon: Icon(Icons.calendar_today),
                            ),
                            child: Text(
                              DateFormat('EEEE, dd/MM/yyyy', 'vi_VN').format(_selectedDate),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Search Button
                ElevatedButton.icon(
                  onPressed: _isSearching ? null : _searchFlights,
                  icon: _isSearching
                      ? SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : Icon(Icons.search),
                  label: Text(_isSearching ? 'Đang tìm...' : 'Tìm chuyến bay'),
                ),
                const SizedBox(height: 16),

                // Results
                if (_flights.isNotEmpty) ...[
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                'Kết quả tìm kiếm',
                                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const Spacer(),
                              if (_currentLowestPrice != null)
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 4,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Colors.green.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    'Từ ${_formatPrice(_currentLowestPrice!)}',
                                    style: TextStyle(
                                      color: Colors.green,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          ...(_flights.take(5).map((flight) => _buildFlightTile(flight))),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // Subscribe Section
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Đăng ký theo dõi giá',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Nhận thông báo khi giá vé đạt mức bạn mong muốn',
                          style: TextStyle(color: Colors.grey[600]),
                        ),
                        const SizedBox(height: 16),
                        
                        // Expected Price
                        TextFormField(
                          controller: _priceController,
                          keyboardType: TextInputType.number,
                          decoration: InputDecoration(
                            labelText: 'Giá kỳ vọng (VNĐ)',
                            prefixIcon: Icon(Icons.attach_money),
                            helperText: 'Bạn sẽ nhận thông báo khi giá ≤ mức này',
                          ),
                          onChanged: (value) {
                            final number = int.tryParse(
                              value.replaceAll('.', '').replaceAll(',', ''),
                            );
                            if (number != null) {
                              _expectedPrice = number;
                            }
                          },
                        ),
                        const SizedBox(height: 16),

                        // Quick price buttons
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            900000,
                            1200000,
                            1500000,
                            2000000,
                            2500000,
                          ].map((price) => OutlinedButton(
                            onPressed: () {
                              setState(() {
                                _expectedPrice = price;
                                _priceController.text = _formatNumber(price);
                              });
                            },
                            style: OutlinedButton.styleFrom(
                              backgroundColor: _expectedPrice == price
                                  ? Theme.of(context).colorScheme.primaryContainer
                                  : null,
                            ),
                            child: Text(_formatPrice(price)),
                          )).toList(),
                        ),
                        const SizedBox(height: 24),

                        // Create Subscription Button
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            onPressed: _isCreating ? null : _createSubscription,
                            icon: _isCreating
                                ? SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      valueColor: AlwaysStoppedAnimation(Colors.white),
                                    ),
                                  )
                                : Icon(Icons.notifications_active),
                            label: Text(_isCreating ? 'Đang tạo...' : 'Đăng ký theo dõi'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Theme.of(context).colorScheme.primary,
                              foregroundColor: Colors.white,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildFlightTile(Flight flight) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(color: Colors.grey.shade200),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  flight.airline,
                  style: TextStyle(fontWeight: FontWeight.w500),
                ),
                Text(
                  '${flight.flightNumber} • ${flight.departureTime} - ${flight.arrivalTime}',
                  style: TextStyle(
                    color: Colors.grey[600],
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                _formatPrice(flight.price),
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Theme.of(context).colorScheme.primary,
                ),
              ),
              if (flight.seatsAvailable != null)
                Text(
                  'Còn ${flight.seatsAvailable} chỗ',
                  style: TextStyle(
                    color: Colors.grey[600],
                    fontSize: 12,
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
