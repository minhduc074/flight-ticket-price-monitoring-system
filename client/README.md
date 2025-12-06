# Fly Ticket Monitor - Flutter Client

Flutter Android application for monitoring Vietnam flight ticket prices.

## Features

- User authentication (login/register)
- Search flights between Vietnam airports
- Subscribe to flight price alerts
- Receive push notifications when prices drop
- View and manage subscriptions

## Prerequisites

- Flutter SDK 3.0+
- Android Studio or VS Code with Flutter extension
- Firebase project configured

## Setup

### 1. Install Dependencies

```bash
flutter pub get
```

### 2. Configure Firebase

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Add an Android app with package name: `com.example.fly_ticket_client`
3. Download `google-services.json` and place it in `android/app/`
4. Enable Cloud Messaging in Firebase Console

### 3. Update Server URL

Edit `lib/config/app_config.dart`:

```dart
class AppConfig {
  // For Android emulator (localhost from host machine)
  static const String baseUrl = 'http://10.0.2.2:3000/api';
  
  // For physical device (use your computer's local IP)
  // static const String baseUrl = 'http://192.168.1.x:3000/api';
  
  // For production
  // static const String baseUrl = 'https://your-server.com/api';
}
```

### 4. Run the App

```bash
flutter run
```

## Project Structure

```
lib/
├── config/         # App configuration
├── models/         # Data models
├── providers/      # State management (Provider)
├── screens/        # UI screens
└── services/       # API and notification services
```

## Screens

1. **Splash Screen** - App loading and auth check
2. **Login Screen** - User login
3. **Register Screen** - New user registration
4. **Home Screen** - List of subscriptions
5. **Search Flights Screen** - Search and subscribe to flights
6. **Subscription Detail Screen** - View/manage subscription

## Push Notifications

The app uses Firebase Cloud Messaging (FCM) for push notifications. Notifications are sent when:

- Price drops by 5% or more
- Price reaches expected level
- Tickets become available for a route

## Building for Release

```bash
flutter build apk --release
```

The APK will be at `build/app/outputs/flutter-apk/app-release.apk`

## Troubleshooting

### FCM Token Issues
Make sure `google-services.json` is correctly placed and Firebase is initialized before the app starts.

### Network Errors
- Check that the server is running
- Verify the baseUrl is correct for your environment
- For physical devices, ensure they're on the same network as the server

### Build Issues
```bash
flutter clean
flutter pub get
flutter run
```
