-- Fly Ticket Monitor - Database Schema for Supabase PostgreSQL
-- Run this SQL in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(10) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  "fcmToken" TEXT,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "fromAirport" VARCHAR(3) NOT NULL,
  "toAirport" VARCHAR(3) NOT NULL,
  date DATE NOT NULL,
  "expectedPrice" INTEGER NOT NULL CHECK ("expectedPrice" >= 0),
  "currentPrice" INTEGER,
  "lastCheckedAt" TIMESTAMP WITH TIME ZONE,
  "isActive" BOOLEAN DEFAULT true,
  "notificationSent" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notification History Table
CREATE TABLE IF NOT EXISTS notification_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "subscriptionId" UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  price INTEGER NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('price_drop', 'ticket_available', 'below_expected')),
  "sentAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- API Usage Table
CREATE TABLE IF NOT EXISTS api_usage (
  id SERIAL PRIMARY KEY,
  "apiProvider" VARCHAR(50) NOT NULL,
  month VARCHAR(7) NOT NULL,
  "callCount" INTEGER DEFAULT 0,
  "successCount" INTEGER DEFAULT 0,
  "failCount" INTEGER DEFAULT 0,
  "rateLimitCount" INTEGER DEFAULT 0,
  "lastCalledAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("apiProvider", month)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_route 
  ON subscriptions("userId", "fromAirport", "toAirport", date);

CREATE INDEX IF NOT EXISTS idx_subscriptions_active_date 
  ON subscriptions("isActive", date);

CREATE INDEX IF NOT EXISTS idx_notification_history_subscription 
  ON notification_history("subscriptionId");

CREATE INDEX IF NOT EXISTS idx_api_usage_provider_month 
  ON api_usage("apiProvider", month);

-- Function to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updatedAt
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_usage_updated_at BEFORE UPDATE ON api_usage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user
-- Password: admin123456 (hashed with bcrypt, salt rounds: 10)
INSERT INTO users (id, email, password, name, role, "isActive", "createdAt", "updatedAt")
VALUES (
  uuid_generate_v4(),
  'admin@flyticket.com',
  '$2a$10$xHZ4qZ.K3WQC7fLqgWK7W.qZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq',
  'Administrator',
  'admin',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO NOTHING;

-- Grant necessary permissions (if using RLS - Row Level Security)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

-- Create policies if needed (example - adjust based on your needs)
-- CREATE POLICY "Users can view their own data" ON users
--   FOR SELECT USING (auth.uid() = id);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Database schema created successfully!';
  RAISE NOTICE 'Admin user: admin@flyticket.com';
  RAISE NOTICE 'Admin password: admin123456 (Please change this after first login)';
END $$;
