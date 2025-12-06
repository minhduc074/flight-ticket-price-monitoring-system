/**
 * Vercel Configuration Validator
 * Run this script to validate your Vercel deployment setup
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Vercel Configuration Validator');
console.log('==================================\n');

let errors = [];
let warnings = [];
let success = [];

// Check vercel.json
const vercelJsonPath = path.join(__dirname, '..', 'vercel.json');
if (fs.existsSync(vercelJsonPath)) {
    success.push('✅ vercel.json found');
    
    const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
    
    if (vercelConfig.builds && vercelConfig.builds.length > 0) {
        success.push('✅ Build configuration present');
    } else {
        warnings.push('⚠️  No build configuration in vercel.json');
    }
    
    if (vercelConfig.routes && vercelConfig.routes.length > 0) {
        success.push('✅ Route configuration present');
    } else {
        warnings.push('⚠️  No route configuration in vercel.json');
    }
    
    if (vercelConfig.crons && vercelConfig.crons.length > 0) {
        success.push('✅ Cron job configuration present');
        warnings.push('⚠️  Note: Cron jobs require Vercel Pro plan');
    } else {
        warnings.push('⚠️  No cron configuration (price checks will need manual triggering)');
    }
} else {
    errors.push('❌ vercel.json not found in project root');
}

// Check .vercelignore
const vercelIgnorePath = path.join(__dirname, '..', '.vercelignore');
if (fs.existsSync(vercelIgnorePath)) {
    success.push('✅ .vercelignore found');
} else {
    warnings.push('⚠️  .vercelignore not found (optional but recommended)');
}

// Check package.json
const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
    success.push('✅ package.json found');
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    if (packageJson.dependencies) {
        const requiredDeps = ['express', 'pg', 'sequelize', 'dotenv'];
        const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);
        
        if (missingDeps.length === 0) {
            success.push('✅ All required dependencies present');
        } else {
            errors.push(`❌ Missing dependencies: ${missingDeps.join(', ')}`);
        }
    }
    
    if (packageJson.scripts && packageJson.scripts.start) {
        success.push('✅ Start script configured');
    } else {
        errors.push('❌ No start script in package.json');
    }
} else {
    errors.push('❌ package.json not found');
}

// Check entry point
const entryPoint = path.join(__dirname, 'src', 'index.js');
if (fs.existsSync(entryPoint)) {
    success.push('✅ Entry point (src/index.js) found');
} else {
    errors.push('❌ Entry point (src/index.js) not found');
}

// Check config files
const configPath = path.join(__dirname, 'src', 'config', 'index.js');
if (fs.existsSync(configPath)) {
    success.push('✅ Configuration file found');
    
    const configContent = fs.readFileSync(configPath, 'utf8');
    
    // Check for Vercel Postgres support
    if (configContent.includes('POSTGRES_URL') || configContent.includes('DATABASE_URL')) {
        success.push('✅ Vercel Postgres support configured');
    } else {
        warnings.push('⚠️  No Vercel Postgres support detected');
    }
    
    // Check for SSL support
    const dbConfigPath = path.join(__dirname, 'src', 'config', 'database.js');
    if (fs.existsSync(dbConfigPath)) {
        const dbConfigContent = fs.readFileSync(dbConfigPath, 'utf8');
        if (dbConfigContent.includes('dialectOptions') && dbConfigContent.includes('ssl')) {
            success.push('✅ SSL configuration found in database.js');
        } else {
            warnings.push('⚠️  No SSL configuration found (may be needed for production)');
        }
    }
} else {
    errors.push('❌ Configuration file not found');
}

// Check .env.example
const envExamplePath = path.join(__dirname, '.env.example');
if (fs.existsSync(envExamplePath)) {
    success.push('✅ .env.example found');
    
    const envExample = fs.readFileSync(envExamplePath, 'utf8');
    const requiredVars = [
        'DB_HOST',
        'DB_NAME',
        'DB_USER',
        'DB_PASSWORD',
        'JWT_SECRET',
        'FIREBASE_PROJECT_ID'
    ];
    
    const missingVars = requiredVars.filter(v => !envExample.includes(v));
    if (missingVars.length === 0) {
        success.push('✅ All required environment variables documented');
    } else {
        warnings.push(`⚠️  Missing documentation for: ${missingVars.join(', ')}`);
    }
} else {
    warnings.push('⚠️  .env.example not found');
}

// Check documentation
const deploymentGuide = path.join(__dirname, '..', 'README_VERCEL_DEPLOYMENT.md');
const checklist = path.join(__dirname, '..', 'DEPLOYMENT_CHECKLIST.md');
const dbConfig = path.join(__dirname, '..', 'DATABASE_CONFIG.md');

if (fs.existsSync(deploymentGuide)) {
    success.push('✅ Deployment guide available');
}
if (fs.existsSync(checklist)) {
    success.push('✅ Deployment checklist available');
}
if (fs.existsSync(dbConfig)) {
    success.push('✅ Database configuration guide available');
}

// Print results
console.log('✅ SUCCESS:');
console.log('===========');
success.forEach(msg => console.log(msg));

if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    console.log('=============');
    warnings.forEach(msg => console.log(msg));
}

if (errors.length > 0) {
    console.log('\n❌ ERRORS:');
    console.log('==========');
    errors.forEach(msg => console.log(msg));
    console.log('\nPlease fix these errors before deploying to Vercel.');
    process.exit(1);
} else {
    console.log('\n🎉 Configuration looks good!');
    console.log('\nNext steps:');
    console.log('1. Set up your database (Vercel Postgres, Supabase, Neon, etc.)');
    console.log('2. Note down your database name (YOU choose this!)');
    console.log('3. Prepare environment variables (see .env.example)');
    console.log('4. Push to Git and deploy on Vercel');
    console.log('5. Add environment variables in Vercel dashboard');
    console.log('6. Deploy and initialize database');
    console.log('\n📚 See README_VERCEL_DEPLOYMENT.md for detailed instructions');
    console.log('📋 See DEPLOYMENT_CHECKLIST.md for step-by-step checklist');
    console.log('💾 See DATABASE_CONFIG.md for database name explanation');
}
