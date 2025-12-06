# Vercel Deployment Helper Script (PowerShell)
# This script helps you prepare for Vercel deployment

Write-Host "🚀 Fly Ticket Noti - Vercel Deployment Helper" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "vercel.json")) {
    Write-Host "❌ Error: vercel.json not found. Please run this script from the project root." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Project structure validated" -ForegroundColor Green
Write-Host ""

# Check for required files
Write-Host "📋 Checking required files..." -ForegroundColor Yellow
$filesOk = $true

if (-not (Test-Path "server\package.json")) {
    Write-Host "❌ server\package.json not found" -ForegroundColor Red
    $filesOk = $false
}

if (-not (Test-Path "server\src\index.js")) {
    Write-Host "❌ server\src\index.js not found" -ForegroundColor Red
    $filesOk = $false
}

if (-not (Test-Path ".vercelignore")) {
    Write-Host "⚠️  .vercelignore not found (optional but recommended)" -ForegroundColor Yellow
}

if ($filesOk) {
    Write-Host "✅ All required files present" -ForegroundColor Green
}
Write-Host ""

# Check environment variables
Write-Host "🔐 Environment Variables Checklist" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Please ensure you have the following ready for Vercel:" -ForegroundColor White
Write-Host ""
Write-Host "1. Database Configuration (choose one):" -ForegroundColor Yellow
Write-Host "   □ Vercel Postgres credentials"
Write-Host "   □ External DB (Supabase/Neon/Railway) credentials"
Write-Host "   □ Database name: _____________ (YOU CHOOSE THIS)" -ForegroundColor Green
Write-Host ""
Write-Host "2. Firebase Configuration:" -ForegroundColor Yellow
Write-Host "   □ FIREBASE_PROJECT_ID"
Write-Host "   □ FIREBASE_PRIVATE_KEY"
Write-Host "   □ FIREBASE_CLIENT_EMAIL"
Write-Host ""
Write-Host "3. JWT Secret:" -ForegroundColor Yellow
Write-Host "   □ JWT_SECRET (min 32 characters)"
Write-Host ""
Write-Host "4. Admin Account:" -ForegroundColor Yellow
Write-Host "   □ ADMIN_EMAIL"
Write-Host "   □ ADMIN_PASSWORD"
Write-Host ""
Write-Host "5. Optional API Keys:" -ForegroundColor Yellow
Write-Host "   □ SERPAPI_KEY"
Write-Host "   □ FLIGHTAPI_KEY"
Write-Host "   □ RAPIDAPI_KEY"
Write-Host ""

# Ask if ready to deploy
$ready = Read-Host "Have you prepared all environment variables? (y/n)"
if ($ready -ne "y" -and $ready -ne "Y") {
    Write-Host "Please prepare environment variables first. See DEPLOYMENT_CHECKLIST.md" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "📦 Next Steps:" -ForegroundColor Cyan
Write-Host "==============" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Push your code to Git:" -ForegroundColor Yellow
Write-Host "   git add ."
Write-Host "   git commit -m 'Prepare for Vercel deployment'"
Write-Host "   git push"
Write-Host ""
Write-Host "2. Go to https://vercel.com/" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Import your repository" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. Configure build settings:" -ForegroundColor Yellow
Write-Host "   - Framework: Other"
Write-Host "   - Root Directory: ./server (or leave blank)"
Write-Host "   - Build Command: npm install"
Write-Host ""
Write-Host "5. Add environment variables (see DEPLOYMENT_CHECKLIST.md)" -ForegroundColor Yellow
Write-Host ""
Write-Host "6. Deploy!" -ForegroundColor Yellow
Write-Host ""
Write-Host "7. After deployment, initialize database:" -ForegroundColor Yellow
Write-Host '   $body = @{email="admin@flyticket.com"; password="your-password"} | ConvertTo-Json'
Write-Host '   $response = Invoke-RestMethod -Method POST -Uri "https://your-app.vercel.app/api/auth/login" -Body $body -ContentType "application/json"'
Write-Host '   $token = $response.data.token'
Write-Host '   Invoke-RestMethod -Method POST -Uri "https://your-app.vercel.app/api/admin/sync-db" -Headers @{Authorization="Bearer $token"}'
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   - Full guide: README_VERCEL_DEPLOYMENT.md"
Write-Host "   - Checklist: DEPLOYMENT_CHECKLIST.md"
Write-Host ""
Write-Host "Good luck with your deployment! 🎉" -ForegroundColor Green
