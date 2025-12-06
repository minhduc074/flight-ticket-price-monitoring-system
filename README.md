# Vietnam Flight Ticket Price Monitor

A complete system for monitoring Vietnam domestic flight ticket prices with automatic notifications when prices drop.

## Architecture

```
fly_ticket_noti/
├── server/         # Node.js backend server
│   ├── src/
│   │   ├── config/       # Configuration files
│   │   ├── controllers/  # Route handlers
│   │   ├── jobs/         # Cron jobs (price checker)
│   │   ├── middleware/   # Auth & error handling
│   │   ├── models/       # MongoDB schemas
│   │   ├── routes/       # API routes
│   │   └── services/     # Business logic
│   └── public/           # Admin web panel
│
└── client/         # Flutter Android app
    ├── lib/
    │   ├── config/       # App configuration
    │   ├── models/       # Data models
    │   ├── providers/    # State management
    │   ├── screens/      # UI screens
    │   └── services/     # API services
    └── android/          # Android configuration
```

## Features

### Server
- ✅ User authentication (JWT)
- ✅ Flight search API (Vietnam airports)
- ✅ Price subscription system
- ✅ Automated price checking (every 15 minutes)
- ✅ Push notifications via Firebase Cloud Messaging
- ✅ Admin web dashboard

### Client (Flutter Android)
- ✅ User login/registration
- ✅ Airport search with autocomplete
- ✅ Date picker for flight dates
- ✅ Flight search results
- ✅ Subscription management
- ✅ Push notifications

## Quick Start

### 1. Prerequisites

- Node.js 18+
- MongoDB
- Flutter SDK 3.0+
- Firebase project

### 2. Setup Server

```bash
cd server
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

Access admin panel at: http://localhost:3000/admin

Default admin: admin@flyticket.com / admin123456

### 3. Setup Firebase

1. Create project at [Firebase Console](https://console.firebase.google.com)
2. Enable Cloud Messaging
3. Download service account key for server
4. Download `google-services.json` for Android client
5. Update server `.env` with Firebase credentials
6. Place `google-services.json` in `client/android/app/`

### 4. Setup Flutter Client

```bash
cd client
flutter pub get

# Update server URL in lib/config/app_config.dart
# For Android emulator: http://10.0.2.2:3000/api
# For physical device: http://YOUR_COMPUTER_IP:3000/api

flutter run
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | User login |
| GET | /api/auth/profile | Get current user |
| POST | /api/auth/fcm-token | Update FCM token |
| POST | /api/auth/logout | Logout |

### Flights
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/flights/airports | List all airports |
| GET | /api/flights/search | Search flights |
| GET | /api/flights/lowest-price | Get lowest price |

### Subscriptions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/subscriptions | Create subscription |
| GET | /api/subscriptions | List user subscriptions |
| GET | /api/subscriptions/:id | Get subscription details |
| PUT | /api/subscriptions/:id | Update subscription |
| DELETE | /api/subscriptions/:id | Delete subscription |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/dashboard | Dashboard stats |
| GET | /api/admin/users | List all users |
| PUT | /api/admin/users/:id/status | Update user status |
| GET | /api/admin/subscriptions | List all subscriptions |
| POST | /api/admin/trigger-price-check | Manual price check |

## Vietnam Airports Supported

| Code | City |
|------|------|
| SGN | Hồ Chí Minh (Tân Sơn Nhất) |
| HAN | Hà Nội (Nội Bài) |
| DAD | Đà Nẵng |
| CXR | Nha Trang (Cam Ranh) |
| PQC | Phú Quốc |
| VCA | Cần Thơ |
| HPH | Hải Phòng |
| VII | Vinh |
| HUI | Huế |
| DLI | Đà Lạt |
| BMV | Buôn Ma Thuột |
| ... | And more |

## Notification Types

1. **Price Drop** - When price drops by ≥5% or ≥100,000 VND
2. **Below Expected** - When price reaches user's expected price
3. **Ticket Available** - When tickets become available for a route

## Production Deployment

### Server
1. Set `NODE_ENV=production`
2. Use a production MongoDB (MongoDB Atlas)
3. Configure Firebase with production credentials
4. Deploy to a cloud platform (Heroku, AWS, DigitalOcean, etc.)
5. Set up HTTPS

### Client
1. Update `baseUrl` to production server
2. Build release APK: `flutter build apk --release`
3. Sign the APK for Google Play Store

## License

MIT License

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
