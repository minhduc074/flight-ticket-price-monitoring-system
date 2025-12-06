# Vietnam Flight Ticket Price Monitor

A complete system for monitoring Vietnam domestic flight ticket prices with automatic notifications when prices drop.

## 🚀 Quick Deploy to Vercel

**Ready to deploy?** See our comprehensive deployment documentation:

- 📚 **[Documentation Index](DOCUMENTATION_INDEX.md)** - Complete guide to all documentation
- 🎯 **[Database Name Guide](DATABASE_NAME_VISUAL_GUIDE.md)** - Is it random? (NO! You choose it!)
- ✅ **[Deployment Checklist](DEPLOYMENT_CHECKLIST.md)** - Step-by-step checklist
- 📖 **[Full Deployment Guide](README_VERCEL_DEPLOYMENT.md)** - Complete instructions
- ⚡ **[Quick Reference](QUICK_REFERENCE.md)** - Common commands and quick tips

### Quick Start Deployment
```bash
# Validate configuration
cd server
npm run validate:vercel

# Run deployment helper
.\deploy-helper.ps1  # Windows
./deploy-helper.sh   # Linux/Mac
```

**Database Question**: The database name is **NOT random** - YOU choose it! See [Database Name Guide](DATABASE_NAME_VISUAL_GUIDE.md) for details.

---

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

### Deploy to Vercel (Recommended)
📚 **[Complete Vercel Deployment Guide](README_VERCEL_DEPLOYMENT.md)**

Quick steps:
1. Push code to GitHub/GitLab/Bitbucket
2. Import to Vercel at https://vercel.com/
3. Configure environment variables (see deployment guide)
4. Deploy!

Use the helper script:
```bash
# Windows PowerShell
.\deploy-helper.ps1

# Linux/Mac
./deploy-helper.sh
```

📋 **[Deployment Checklist](DEPLOYMENT_CHECKLIST.md)** - Step-by-step checklist

### Database Configuration
**The database name is NOT random - YOU specify it:**
- Vercel Postgres: default is `verceldb` (or create custom name)
- External providers (Supabase/Neon/Railway): you choose during setup
- Set `DB_NAME` or `POSTGRES_DATABASE` to match your chosen name

### Other Deployment Options

#### Server
1. Set `NODE_ENV=production`
2. Use a production PostgreSQL database (Supabase, Neon, Railway, etc.)
3. Configure Firebase with production credentials
4. Deploy to cloud platform (Vercel, AWS, DigitalOcean, Railway, etc.)
5. Set up HTTPS (automatic on Vercel)

#### Client
1. Update `baseUrl` to production server in `lib/config/app_config.dart`
2. Build release APK: `flutter build apk --release`
3. Sign the APK for Google Play Store

## License

MIT License

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
