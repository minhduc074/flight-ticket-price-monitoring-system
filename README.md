# Vietnam Flight Ticket Price Monitor

A complete system for monitoring Vietnam domestic flight ticket prices with automatic notifications when prices drop.

### Quick Start Deployment
```bash
# Run deployment helper
.\deploy-render.ps1  # Windows
./deploy-render.sh   # Linux/Mac
```
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
│   │   ├── models/       # PostgreSQL models
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
- ✅ Automated price checking (every 6 hours)
- ✅ Push notifications via Firebase Cloud Messaging
- ✅ Admin web dashboard with API usage monitoring
- ✅ Smart API rotation to save quota

### Client (Flutter Android)
- ✅ User login/registration
- ✅ Airport search with autocomplete
- ✅ Date picker for flight dates
- ✅ Flight search results
- ✅ Subscription management
- ✅ Push notifications

## Quick Start

### 1. Prerequisites

- Node.js 24+
- PostgreSQL
- Flutter SDK 3.0+
- Firebase project
- RapidAPI account (for flight data)

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

### 3. API Keys Setup

The system uses multiple flight data APIs with automatic rotation:

#### RapidAPI (Primary Sources)
1. Sign up at [RapidAPI](https://rapidapi.com/)
2. Subscribe to these APIs:
   - **Google Flights API** (150 requests/month free)
   - **Agoda Flight Search** (500 requests/month free)
   - **Skyscanner API** (500 requests/month free)
3. Get your RapidAPI key from account settings
4. Add to `.env`: `RAPIDAPI_KEY=your_key_here`

#### SerpAPI (Alternative)
1. Sign up at [SerpAPI](https://serpapi.com/)
2. Get API key (250 searches/month free)
3. Add to `.env`: `SERPAPI_KEY=your_key_here`

#### FlightAPI.io (Optional)
1. Sign up at [FlightAPI.io](https://www.flightapi.io/)
2. Get API key (100 requests/month free)
3. Add to `.env`: `FLIGHTAPI_IO_KEY=your_key_here`

**Smart API Rotation**: The system automatically uses one API at a time. If one reaches its quota or returns an error, it switches to the next available API. This saves your quota limits.

### 4. Setup Firebase

1. Create project at [Firebase Console](https://console.firebase.google.com)
2. Enable Cloud Messaging
3. Download service account key for server
4. Download `google-services.json` for Android client
5. Update server `.env` with Firebase credentials
6. Place `google-services.json` in `client/android/app/`

### 5. Setup Flutter Client

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
| GET | /api/admin/api-usage | API usage statistics |
| POST | /api/admin/trigger-price-check | Manual price check |

## Flight Data Sources

The system uses multiple flight data APIs with smart rotation:

### Active APIs
- **Google Flights** (via RapidAPI) - 150 requests/month
- **Agoda Flight Search** (via RapidAPI) - 500 requests/month
- **Skyscanner** (via RapidAPI) - 500 requests/month
- **SerpAPI Google Flights** - 250 searches/month
- **FlightAPI.io** - 100 requests/month

### Smart API Rotation
- Uses **one API at a time** to save quota
- If API returns error or reaches limit → switches to next API
- If API returns **no results** (no flights available) → **stops** (no need to check others)
- Tracks usage in admin dashboard with color-coded warnings
- Admin panel shows: calls made / success / fails / rate-limited per month


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

## Admin Dashboard

Access at `/admin` (or `http://localhost:3000/admin` in development)

Features:
- 📊 **Dashboard**: Overview stats (users, subscriptions, searches)
- 👥 **Users**: Manage user accounts and status
- 📝 **Subscriptions**: View and manage all price subscriptions
- 📡 **API Usage**: Monitor API calls, quotas, and rate limits
  - Visual progress bars for each API
  - Color-coded warnings (red at 80%+ usage)
  - Success/fail/rate-limited counts per month
- 🔔 **Manual Price Check**: Trigger immediate price check for testing

## Production Deployment

### Deploy to Render.com (Recommended)
📚 **[Complete Render.com Deployment Guide](README_RENDER_DEPLOYMENT.md)**

Quick steps:
1. Push code to GitHub/GitLab/Bitbucket
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Create new Blueprint (Render will detect `render.yaml`)
4. Configure environment variables (see deployment guide)
5. Deploy!

Use the helper script:
```bash
# Windows PowerShell
.\deploy-render.ps1

# Linux/Mac
./deploy-render.sh
```

📋 **[Deployment Checklist](DEPLOYMENT_CHECKLIST.md)** - Step-by-step checklist

### Database Configuration
**The database name is NOT random - YOU specify it:**
- Render PostgreSQL: You choose the name during setup (e.g., `fly_ticket_noti`)
- External providers (Supabase/Neon/Railway): you choose during setup
- Set `DATABASE_URL` with your PostgreSQL connection string

### Other Deployment Options

#### Server
1. Set `NODE_ENV=production`
2. Use a production PostgreSQL database (Render, Supabase, Neon, Railway, etc.)
3. Configure Firebase with production credentials
4. Deploy to cloud platform (Render, Vercel, AWS, DigitalOcean, Railway, etc.)
5. Set up HTTPS (automatic on Render)

#### Client
1. Update `baseUrl` to production server in `lib/config/app_config.dart`
2. Build release APK: `flutter build apk --release`
3. Sign the APK for Google Play Store

## License

MIT License

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
