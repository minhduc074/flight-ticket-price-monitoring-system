# Setup Vercel Environment Variables for Fly Ticket Monitor
# Run this script after logging into Vercel CLI

Write-Host "Setting up Vercel environment variables..." -ForegroundColor Green

# Database Configuration (Supabase)
$env:DATABASE_URL = "postgres://postgres.naivtpxodsuxlgpubbcl:5DR1a8oZMyxiIoNr@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require"
$env:DB_HOST = "aws-1-us-east-1.pooler.supabase.com"
$env:DB_PORT = "6543"
$env:DB_NAME = "postgres"
$env:DB_USER = "postgres.naivtpxodsuxlgpubbcl"
$env:DB_PASSWORD = "5DR1a8oZMyxiIoNr"

# JWT Secret (from Supabase)
$env:JWT_SECRET = "oZxbiVHvRjKYQ0U4NBW4RKlIfs+Tsp4m2MpBBfI3T+MVwtaIXjvkqsHgXwEwZEqG3v/2QZ4u7PQIMEV3viBZoA=="

# Firebase Configuration (get from your .env file)
$env:FIREBASE_PROJECT_ID = Get-Content .env | Select-String "FIREBASE_PROJECT_ID=" | ForEach-Object { $_.ToString().Split('=')[1] }
$env:FIREBASE_CLIENT_EMAIL = Get-Content .env | Select-String "FIREBASE_CLIENT_EMAIL=" | ForEach-Object { $_.ToString().Split('=')[1] }

# API Keys (get from your .env file)
$env:SERPAPI_KEY = Get-Content .env | Select-String "SERPAPI_KEY=" | ForEach-Object { $_.ToString().Split('=')[1] }
$env:RAPIDAPI_KEY = Get-Content .env | Select-String "RAPIDAPI_KEY=" | ForEach-Object { $_.ToString().Split('=')[1] }

# Admin credentials
$env:ADMIN_EMAIL = "admin@flyticket.com"
$env:ADMIN_PASSWORD = "admin123456"

Write-Host "Environment variables configured locally. Now setting in Vercel..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Run these commands manually in Vercel CLI:" -ForegroundColor Cyan
Write-Host ""
Write-Host 'echo "postgres://postgres.naivtpxodsuxlgpubbcl:5DR1a8oZMyxiIoNr@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require" | vercel env add DATABASE_URL production' -ForegroundColor White
Write-Host 'echo "oZxbiVHvRjKYQ0U4NBW4RKlIfs+Tsp4m2MpBBfI3T+MVwtaIXjvkqsHgXwEwZEqG3v/2QZ4u7PQIMEV3viBZoA==" | vercel env add JWT_SECRET production' -ForegroundColor White
Write-Host 'echo "' + $env:FIREBASE_PROJECT_ID + '" | vercel env add FIREBASE_PROJECT_ID production' -ForegroundColor White
Write-Host 'echo "' + $env:FIREBASE_CLIENT_EMAIL + '" | vercel env add FIREBASE_CLIENT_EMAIL production' -ForegroundColor White
Write-Host 'echo "' + $env:SERPAPI_KEY + '" | vercel env add SERPAPI_KEY production' -ForegroundColor White
Write-Host 'echo "' + $env:RAPIDAPI_KEY + '" | vercel env add RAPIDAPI_KEY production' -ForegroundColor White
Write-Host 'echo "admin@flyticket.com" | vercel env add ADMIN_EMAIL production' -ForegroundColor White
Write-Host 'echo "admin123456" | vercel env add ADMIN_PASSWORD production' -ForegroundColor White
Write-Host ""
Write-Host "Or use the Vercel Dashboard: https://vercel.com/dashboard -> Project -> Settings -> Environment Variables" -ForegroundColor Green
