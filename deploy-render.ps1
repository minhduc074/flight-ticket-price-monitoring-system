#!/usr/bin/env pwsh

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Render.com Deployment Helper" -ForegroundColor Cyan
Write-Host "  Vietnam Flight Ticket Price Monitor" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if git repository
if (-not (Test-Path .git)) {
    Write-Host "❌ Error: Not a git repository" -ForegroundColor Red
    Write-Host "   Initialize git first: git init" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Git repository detected" -ForegroundColor Green
Write-Host ""

# Check for uncommitted changes
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "⚠️  Warning: You have uncommitted changes" -ForegroundColor Yellow
    Write-Host ""
    git status --short
    Write-Host ""
    $commit = Read-Host "Do you want to commit these changes? (y/n)"
    if ($commit -eq 'y') {
        $message = Read-Host "Enter commit message"
        git add .
        git commit -m $message
        Write-Host "✅ Changes committed" -ForegroundColor Green
    }
}

# Check remote
$remote = git remote -v | Select-String "origin"
if (-not $remote) {
    Write-Host "⚠️  No remote repository configured" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Configure your remote repository:" -ForegroundColor Cyan
    Write-Host "  git remote add origin https://github.com/username/repo.git" -ForegroundColor White
    Write-Host "  git push -u origin main" -ForegroundColor White
    Write-Host ""
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Pre-Deployment Checklist" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$checklist = @(
    @{Item = "Code pushed to GitHub/GitLab/Bitbucket"; Done = $false},
    @{Item = "Firebase project created and configured"; Done = $false},
    @{Item = "Firebase service account key downloaded"; Done = $false},
    @{Item = "Strong JWT secret generated"; Done = $false},
    @{Item = "Admin password changed from default"; Done = $false}
)

foreach ($item in $checklist) {
    $response = Read-Host "☐ $($item.Item) (y/n)"
    if ($response -eq 'y') {
        Write-Host "  ✅ Confirmed" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Please complete this before deploying" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Deployment Instructions" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📖 Follow these steps to deploy to Render.com:" -ForegroundColor White
Write-Host ""
Write-Host "1. Push your code to Git (if not done):" -ForegroundColor Cyan
Write-Host "   git push origin main" -ForegroundColor White
Write-Host ""

Write-Host "2. Go to Render Dashboard:" -ForegroundColor Cyan
Write-Host "   https://dashboard.render.com/" -ForegroundColor Blue
Write-Host ""

Write-Host "3. Deploy with Blueprint (Recommended):" -ForegroundColor Cyan
Write-Host "   • Click 'New +' → 'Blueprint'" -ForegroundColor White
Write-Host "   • Connect your repository" -ForegroundColor White
Write-Host "   • Render will detect render.yaml" -ForegroundColor White
Write-Host "   • Click 'Apply'" -ForegroundColor White
Write-Host ""

Write-Host "4. Configure Environment Variables:" -ForegroundColor Cyan
Write-Host "   See README_RENDER_DEPLOYMENT.md for details" -ForegroundColor White
Write-Host ""

Write-Host "5. Monitor Deployment:" -ForegroundColor Cyan
Write-Host "   Watch the logs for any errors" -ForegroundColor White
Write-Host ""

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Environment Variables Template" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$envTemplate = @"
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://user:password@host/database
JWT_SECRET=generate-strong-secret-here
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=admin@flyticket.com
ADMIN_PASSWORD=change-this-password
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
"@

Write-Host $envTemplate -ForegroundColor Yellow
Write-Host ""

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Quick Commands" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Generate JWT Secret:" -ForegroundColor Cyan
Write-Host '  node -e "console.log(require(''crypto'').randomBytes(32).toString(''base64''))"' -ForegroundColor White
Write-Host ""

Write-Host "Test Local Server:" -ForegroundColor Cyan
Write-Host "  cd server" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""

Write-Host "View Full Documentation:" -ForegroundColor Cyan
Write-Host "  See README_RENDER_DEPLOYMENT.md" -ForegroundColor White
Write-Host ""

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Next Steps" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "After deployment:" -ForegroundColor White
Write-Host "1. Update Flutter client with production URL" -ForegroundColor White
Write-Host "2. Test all endpoints" -ForegroundColor White
Write-Host "3. Monitor logs for errors" -ForegroundColor White
Write-Host "4. Set up custom domain (optional)" -ForegroundColor White
Write-Host ""

Write-Host "🚀 Ready to deploy! Good luck!" -ForegroundColor Green
Write-Host ""
