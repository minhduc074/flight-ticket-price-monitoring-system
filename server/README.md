# Fly Ticket Price Monitor - Server

Vietnam flight ticket price monitoring server with Node.js, Express, and PostgreSQL.

## Features

- User authentication (register/login)
- **Real flight price data** from multiple sources (Google Flights, Traveloka, airlines)
- Flight search with Vietnam airports
- Price subscription system
- Automatic price checking (every 15 minutes)
- Push notifications via Firebase Cloud Messaging
- Admin dashboard for monitoring

## Prerequisites

- Node.js 18+
- PostgreSQL
- Firebase project (for push notifications)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Configure `.env` file:
```env
PORT=3000
NODE_ENV=development

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fly_ticket_noti
DB_USER=postgres
DB_PASSWORD=postgres

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# Admin
ADMIN_EMAIL=admin@flyticket.com
ADMIN_PASSWORD=admin123456

# Flight APIs (Optional but recommended)
SERPAPI_KEY=your-serpapi-key
```

## Getting Real Flight Data

The server supports multiple flight data sources. For best results, configure at least one API key:

### Option 1: SerpAPI (Recommended - Free tier available)
1. Sign up at [https://serpapi.com/](https://serpapi.com/)
2. Get your API key (100 free searches/month)
3. Add to `.env`: `SERPAPI_KEY=your-key`

SerpAPI provides Google Flights data which includes:
- Vietnam Airlines
- VietJet Air
- Bamboo Airways
- Pacific Airlines
- And more...

### Option 2: FlightAPI.io
1. Sign up at [https://www.flightapi.io/](https://www.flightapi.io/)
2. Get your API key
3. Add to `.env`: `FLIGHTAPI_KEY=your-key`

### Option 3: RapidAPI (Skyscanner)
1. Sign up at [https://rapidapi.com/](https://rapidapi.com/)
2. Subscribe to Skyscanner API
3. Add to `.env`: `RAPIDAPI_KEY=your-key`

### Data Sources Priority
The server tries sources in this order:
1. Google Flights (via SerpAPI)
2. Traveloka
3. BayDi.vn
4. Mytour.vn
5. Direct airline APIs
6. FlightAPI.io
7. Skyscanner (via RapidAPI)

Data is cached for 30 minutes to reduce API calls.

## Running

Development:
```bash
npm run dev
```

Production:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/fcm-token` - Update FCM token
- `POST /api/auth/logout` - Logout

### Flights
- `GET /api/flights/airports` - Get list of airports
- `GET /api/flights/search?from=SGN&to=HAN&date=2024-01-15` - Search flights
- `GET /api/flights/lowest-price?from=SGN&to=HAN&date=2024-01-15` - Get lowest price

### Subscriptions
- `POST /api/subscriptions` - Create subscription
- `GET /api/subscriptions` - Get user's subscriptions
- `GET /api/subscriptions/:id` - Get subscription detail
- `PUT /api/subscriptions/:id` - Update subscription
- `DELETE /api/subscriptions/:id` - Delete subscription

### Admin
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/users` - List users
- `PUT /api/admin/users/:id/status` - Update user status
- `GET /api/admin/subscriptions` - List all subscriptions
- `POST /api/admin/trigger-price-check` - Manually trigger price check

## Admin Panel

Access admin panel at: `http://localhost:3000/admin`

Default credentials:
- Email: admin@flyticket.com
- Password: admin123456

## Vietnam Airports

Supported airport codes:
- SGN - Tân Sơn Nhất (Hồ Chí Minh)
- HAN - Nội Bài (Hà Nội)
- DAD - Đà Nẵng
- CXR - Cam Ranh (Nha Trang)
- PQC - Phú Quốc
- VCA - Cần Thơ
- HPH - Hải Phòng
- VII - Vinh
- HUI - Huế
- DLI - Đà Lạt
- And more...
