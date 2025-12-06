import 'package:intl/intl.dart';

/// Utilities for formatting/displaying dates in UTC+7 timezone (Vietnam time)
class DateTimeUtils {
  static final _locale = 'vi_VN';

  /// Convert any DateTime to UTC+7 time (returns a DateTime with adjusted value)
  static DateTime toUtc7(DateTime dt) {
    // Normalize to UTC then add 7 hours
    return dt.toUtc().add(const Duration(hours: 7));
  }

  static String formatDate(DateTime dt) {
    final shifted = toUtc7(dt);
    return DateFormat('dd/MM/yyyy', _locale).format(shifted);
  }

  static String formatDateTime(DateTime dt) {
    final shifted = toUtc7(dt);
    return DateFormat('dd/MM/yyyy HH:mm', _locale).format(shifted);
  }

  static String formatFullDate(DateTime dt) {
    final shifted = toUtc7(dt);
    return DateFormat('EEEE, dd/MM/yyyy', _locale).format(shifted);
  }
}
