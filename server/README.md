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

## Deployment to Render.com

This project is configured for easy deployment to Render.com using the `render.yaml` file.

### Prerequisites
1. GitHub account with this repository
2. Render.com account (free tier available)
3. Firebase project credentials

### Steps

1. **Create PostgreSQL Database**
   - Go to [Render.com Dashboard](https://dashboard.render.com/)
   - Click "New" → "PostgreSQL"
   - Name: `flight-ticket-db`
   - Region: Singapore (or closest to your users)
   - Plan: Free
   - Create Database

2. **Deploy Web Service**
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Select the repository: `flight-ticket-price-monitoring-system`
   - Configure:
     - Name: `flight-ticket-api`
     - Region: Singapore
     - Branch: `master`
     - Root Directory: `server`
     - Runtime: Node
     - Build Command: `npm install`
     - Start Command: `node src/index.js`
     - Plan: Free

3. **Set Environment Variables**
   Go to Environment tab and add:
   ```
   NODE_ENV=production
   DATABASE_URL=[Copy from PostgreSQL database]
   JWT_SECRET=[Generate a secure random string]
   JWT_EXPIRES_IN=7d
   FIREBASE_PROJECT_ID=your-firebase-project-id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
   ADMIN_EMAIL=admin@flyticket.com
   ADMIN_PASSWORD=[Set a secure password]
   SERPAPI_KEY=your-serpapi-key
   ```

4. **Important Notes**
   - **PORT**: Render automatically sets this - don't override it with 443
   - **DATABASE_URL**: Use the Internal Database URL from your PostgreSQL service
   - **FIREBASE_PRIVATE_KEY**: Must include `\n` for line breaks and be wrapped in quotes
   - Free tier services sleep after 15 minutes of inactivity

5. **Deploy**
   - Click "Create Web Service"
   - Render will automatically deploy when you push to GitHub

### Production URL
Your API will be available at:
```
https://flight-ticket-price-monitoring-system.onrender.com
```

### Troubleshooting

**Database Connection Refused**
- Ensure DATABASE_URL is set correctly
- Use the Internal Database URL, not External
- Check that database is in the same region

**Server Won't Start**
- Check logs in Render dashboard
- Verify all environment variables are set
- Don't set PORT manually (Render handles this)

**Firebase Issues**
- Ensure FIREBASE_PRIVATE_KEY has proper escape sequences
- Verify all Firebase credentials are correct
- Test credentials locally first

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
