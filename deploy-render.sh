#!/bin/bash

echo "================================================"
echo "  Render.com Deployment Helper"
echo "  Vietnam Flight Ticket Price Monitor"
echo "================================================"
echo ""

# Check if git repository
if [ ! -d .git ]; then
    echo "❌ Error: Not a git repository"
    echo "   Initialize git first: git init"
    exit 1
fi

echo "✅ Git repository detected"
echo ""

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Warning: You have uncommitted changes"
    echo ""
    git status --short
    echo ""
    read -p "Do you want to commit these changes? (y/n) " commit
    if [ "$commit" = "y" ]; then
        read -p "Enter commit message: " message
        git add .
        git commit -m "$message"
        echo "✅ Changes committed"
    fi
fi

# Check remote
if ! git remote -v | grep -q "origin"; then
    echo "⚠️  No remote repository configured"
    echo ""
    echo "Configure your remote repository:"
    echo "  git remote add origin https://github.com/username/repo.git"
    echo "  git push -u origin main"
    echo ""
fi

echo ""
echo "================================================"
echo "  Pre-Deployment Checklist"
echo "================================================"
echo ""

checklist=(
    "Code pushed to GitHub/GitLab/Bitbucket"
    "Firebase project created and configured"
    "Firebase service account key downloaded"
    "Strong JWT secret generated"
    "Admin password changed from default"
)

for item in "${checklist[@]}"; do
    read -p "☐ $item (y/n) " response
    if [ "$response" = "y" ]; then
        echo "  ✅ Confirmed"
    else
        echo "  ❌ Please complete this before deploying"
    fi
done

echo ""
echo "================================================"
echo "  Deployment Instructions"
echo "================================================"
echo ""

echo "📖 Follow these steps to deploy to Render.com:"
echo ""
echo "1. Push your code to Git (if not done):"
echo "   git push origin main"
echo ""

echo "2. Go to Render Dashboard:"
echo "   https://dashboard.render.com/"
echo ""

echo "3. Deploy with Blueprint (Recommended):"
echo "   • Click 'New +' → 'Blueprint'"
echo "   • Connect your repository"
echo "   • Render will detect render.yaml"
echo "   • Click 'Apply'"
echo ""

echo "4. Configure Environment Variables:"
echo "   See README_RENDER_DEPLOYMENT.md for details"
echo ""

echo "5. Monitor Deployment:"
echo "   Watch the logs for any errors"
echo ""

echo "================================================"
echo "  Environment Variables Template"
echo "================================================"
echo ""

cat << 'EOF'
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
EOF

echo ""
echo "================================================"
echo "  Quick Commands"
echo "================================================"
echo ""

echo "Generate JWT Secret:"
echo '  node -e "console.log(require('"'"'crypto'"'"').randomBytes(32).toString('"'"'base64'"'"'))"'
echo ""

echo "Test Local Server:"
echo "  cd server"
echo "  npm run dev"
echo ""

echo "View Full Documentation:"
echo "  See README_RENDER_DEPLOYMENT.md"
echo ""

echo "================================================"
echo "  Next Steps"
echo "================================================"
echo ""

echo "After deployment:"
echo "1. Update Flutter client with production URL"
echo "2. Test all endpoints"
echo "3. Monitor logs for errors"
echo "4. Set up custom domain (optional)"
echo ""

echo "🚀 Ready to deploy! Good luck!"
echo ""
