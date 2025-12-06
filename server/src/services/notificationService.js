const { getMessaging } = require('../config/firebase');

class NotificationService {
  /**
   * Send push notification to a specific device
   */
  async sendToDevice(fcmToken, title, body, data = {}) {
    const messaging = getMessaging();
    
    if (!messaging) {
      console.warn('Firebase messaging not configured - skipping notification');
      return { success: false, reason: 'Firebase not configured' };
    }

    try {
      const message = {
        token: fcmToken,
        notification: {
          title,
          body
        },
        data: {
          ...data,
          click_action: 'FLUTTER_NOTIFICATION_CLICK'
        },
        android: {
          priority: 'high',
          notification: {
            channelId: 'flight_alerts',
            priority: 'high',
            defaultSound: true,
            defaultVibrateTimings: true
          }
        }
      };

      const response = await messaging.send(message);
      console.log('Notification sent successfully:', response);
      
      return { success: true, messageId: response };
    } catch (error) {
      console.error('Error sending notification:', error);
      
      // Handle invalid token
      if (error.code === 'messaging/invalid-registration-token' ||
          error.code === 'messaging/registration-token-not-registered') {
        return { success: false, reason: 'invalid_token' };
      }
      
      return { success: false, reason: error.message };
    }
  }

  /**
   * Send price drop notification
   */
  async sendPriceDropNotification(user, subscription, currentPrice, previousPrice) {
    if (!user.fcmToken) {
      console.warn(`User ${user.email} has no FCM token`);
      return { success: false, reason: 'no_fcm_token' };
    }

    const priceDropAmount = previousPrice - currentPrice;
    const priceDropPercent = Math.round((priceDropAmount / previousPrice) * 100);

    const title = '🎉 Giá vé máy bay giảm!';
    const body = `${subscription.fromAirport} → ${subscription.toAirport}: Giảm ${this.formatPrice(priceDropAmount)} (${priceDropPercent}%). Giá hiện tại: ${this.formatPrice(currentPrice)}`;

    const data = {
      type: 'price_drop',
      subscriptionId: subscription.id || subscription._id?.toString(),
      fromAirport: subscription.fromAirport,
      toAirport: subscription.toAirport,
      date: typeof subscription.date === 'string' ? subscription.date : subscription.date.toISOString(),
      currentPrice: currentPrice.toString(),
      previousPrice: previousPrice.toString()
    };

    return this.sendToDevice(user.fcmToken, title, body, data);
  }

  /**
   * Send notification when price is below expected
   */
  async sendBelowExpectedNotification(user, subscription, currentPrice) {
    if (!user.fcmToken) {
      console.warn(`User ${user.email} has no FCM token`);
      return { success: false, reason: 'no_fcm_token' };
    }

    const savings = subscription.expectedPrice - currentPrice;

    const title = '✅ Giá vé đạt mục tiêu!';
    const body = `${subscription.fromAirport} → ${subscription.toAirport}: ${this.formatPrice(currentPrice)} (Tiết kiệm ${this.formatPrice(savings)} so với mức kỳ vọng)`;

    const data = {
      type: 'below_expected',
      subscriptionId: subscription.id || subscription._id?.toString(),
      fromAirport: subscription.fromAirport,
      toAirport: subscription.toAirport,
      date: typeof subscription.date === 'string' ? subscription.date : subscription.date.toISOString(),
      currentPrice: currentPrice.toString(),
      expectedPrice: subscription.expectedPrice.toString()
    };

    return this.sendToDevice(user.fcmToken, title, body, data);
  }

  /**
   * Send notification when ticket becomes available
   */
  async sendTicketAvailableNotification(user, subscription, currentPrice) {
    if (!user.fcmToken) {
      console.warn(`User ${user.email} has no FCM token`);
      return { success: false, reason: 'no_fcm_token' };
    }

    const title = '🎫 Có vé máy bay!';
    const body = `${subscription.fromAirport} → ${subscription.toAirport}: Đã có vé với giá ${this.formatPrice(currentPrice)}`;

    const data = {
      type: 'ticket_available',
      subscriptionId: subscription.id || subscription._id?.toString(),
      fromAirport: subscription.fromAirport,
      toAirport: subscription.toAirport,
      date: typeof subscription.date === 'string' ? subscription.date : subscription.date.toISOString(),
      currentPrice: currentPrice.toString()
    };

    return this.sendToDevice(user.fcmToken, title, body, data);
  }

  /**
   * Format price in VND
   */
  formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  }
}

module.exports = new NotificationService();
