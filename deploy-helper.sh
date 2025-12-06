#!/bin/bash
# Vercel Deployment Helper Script
# This script helps you prepare for Vercel deployment

echo "🚀 Fly Ticket Noti - Vercel Deployment Helper"
echo "=============================================="
echo ""

# Check if we're in the right directory
if [ ! -f "vercel.json" ]; then
    echo "❌ Error: vercel.json not found. Please run this script from the project root."
    exit 1
fi

echo "✅ Project structure validated"
echo ""

# Check for required files
echo "📋 Checking required files..."
files_ok=true

if [ ! -f "server/package.json" ]; then
    echo "❌ server/package.json not found"
    files_ok=false
fi

if [ ! -f "server/src/index.js" ]; then
    echo "❌ server/src/index.js not found"
    files_ok=false
fi

if [ ! -f ".vercelignore" ]; then
    echo "⚠️  .vercelignore not found (optional but recommended)"
fi

if [ "$files_ok" = true ]; then
    echo "✅ All required files present"
fi
echo ""

# Check environment variables
echo "🔐 Environment Variables Checklist"
echo "=================================="
echo ""
echo "Please ensure you have the following ready for Vercel:"
echo ""
echo "1. Database Configuration (choose one):"
echo "   □ Vercel Postgres credentials"
echo "   □ External DB (Supabase/Neon/Railway) credentials"
echo "   □ Database name: _____________ (YOU CHOOSE THIS)"
echo ""
echo "2. Firebase Configuration:"
echo "   □ FIREBASE_PROJECT_ID"
echo "   □ FIREBASE_PRIVATE_KEY"
echo "   □ FIREBASE_CLIENT_EMAIL"
echo ""
echo "3. JWT Secret:"
echo "   □ JWT_SECRET (min 32 characters)"
echo ""
echo "4. Admin Account:"
echo "   □ ADMIN_EMAIL"
echo "   □ ADMIN_PASSWORD"
echo ""
echo "5. Optional API Keys:"
echo "   □ SERPAPI_KEY"
echo "   □ FLIGHTAPI_KEY"
echo "   □ RAPIDAPI_KEY"
echo ""

# Ask if ready to deploy
read -p "Have you prepared all environment variables? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please prepare environment variables first. See DEPLOYMENT_CHECKLIST.md"
    exit 0
fi

echo ""
echo "📦 Next Steps:"
echo "=============="
echo ""
echo "1. Push your code to Git:"
echo "   git add ."
echo "   git commit -m 'Prepare for Vercel deployment'"
echo "   git push"
echo ""
echo "2. Go to https://vercel.com/"
echo ""
echo "3. Import your repository"
echo ""
echo "4. Configure build settings:"
echo "   - Framework: Other"
echo "   - Root Directory: ./server (or leave blank)"
echo "   - Build Command: npm install"
echo ""
echo "5. Add environment variables (see DEPLOYMENT_CHECKLIST.md)"
echo ""
echo "6. Deploy!"
echo ""
echo "7. After deployment, initialize database:"
echo "   curl -X POST https://your-app.vercel.app/api/auth/login \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"email\":\"admin@flyticket.com\",\"password\":\"your-password\"}'"
echo ""
echo "   # Use the token from above"
echo "   curl -X POST https://your-app.vercel.app/api/admin/sync-db \\"
echo "     -H 'Authorization: Bearer YOUR_TOKEN'"
echo ""
echo "📚 Documentation:"
echo "   - Full guide: README_VERCEL_DEPLOYMENT.md"
echo "   - Checklist: DEPLOYMENT_CHECKLIST.md"
echo ""
echo "Good luck with your deployment! 🎉"
