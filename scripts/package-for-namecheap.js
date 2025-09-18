const fs = require('fs');
const path = require('path');

// Package the static build for Namecheap shared hosting
function packageForNamecheap() {
  console.log('📦 Packaging for Namecheap shared hosting...');
  
  const staticDir = path.join(process.cwd(), 'static-build');
  const packageDir = path.join(process.cwd(), 'namecheap-deployment');
  
  // Check if static build exists
  if (!fs.existsSync(staticDir)) {
    console.error('❌ Static build not found. Run "npm run build:static" first.');
    process.exit(1);
  }
  
  // Create package directory
  if (fs.existsSync(packageDir)) {
    fs.rmSync(packageDir, { recursive: true, force: true });
  }
  fs.mkdirSync(packageDir, { recursive: true });
  
  // Copy static build
  copyDirectory(staticDir, path.join(packageDir, 'public_html'));
  
  // Create deployment instructions
  const instructions = `# Mirage Tenders - Namecheap Deployment Instructions

## 📋 Deployment Steps:

### 1. Upload Files
1. Login to your Namecheap cPanel
2. Open File Manager
3. Navigate to public_html directory
4. Upload all files from the "public_html" folder in this package
5. Extract if uploaded as ZIP

### 2. Set Permissions (if needed)
- Set directory permissions to 755
- Set file permissions to 644

### 3. Access Your Site
- Your site will be available at: https://yourdomain.com
- Login with: admin / admin123

## ⚠️ Important Limitations:

### Static Hosting Limitations:
- ❌ File uploads will NOT work (no server-side processing)
- ❌ Real-time data sync will NOT work
- ✅ Viewing existing data works
- ✅ Form interactions work (client-side only)
- ✅ PDF generation works
- ✅ All UI features work

### For Full Functionality:
Consider upgrading to:
1. **VPS Hosting** - Full Node.js support
2. **Dedicated Server** - Complete control
3. **Cloud Hosting** - AWS, DigitalOcean, etc.

## 🔧 Alternative Solutions:

### Option 1: Hybrid Approach
- Host static site on Namecheap
- Use external API service for file uploads (Firebase, AWS S3)

### Option 2: Database Integration
- Add MySQL database (available on most Namecheap plans)
- Use PHP backend for data operations

### Option 3: Keep Current Setup
- Use local production for full functionality
- Static site for demonstration only

## 📞 Support:
- Company: Mirage Business Solutions
- Email: m.abuosba@miragebs.com
- Phone: +962 6 569 13 33
`;

  fs.writeFileSync(path.join(packageDir, 'DEPLOYMENT_INSTRUCTIONS.md'), instructions);
  
  // Create a simple PHP fallback for forms (optional)
  const phpFallback = `<?php
// Simple fallback for form submissions on shared hosting
// This is a basic example - adapt as needed

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Log the data (for demo purposes)
    $logFile = 'tender_submissions.json';
    $submissions = [];
    
    if (file_exists($logFile)) {
        $submissions = json_decode(file_get_contents($logFile), true) ?: [];
    }
    
    $submissions[] = [
        'data' => $input,
        'timestamp' => date('Y-m-d H:i:s'),
        'ip' => $_SERVER['REMOTE_ADDR']
    ];
    
    file_put_contents($logFile, json_encode($submissions, JSON_PRETTY_PRINT));
    
    echo json_encode(['success' => true, 'message' => 'Data received']);
} else {
    echo json_encode(['error' => 'Method not allowed']);
}
?>`;

  fs.writeFileSync(path.join(packageDir, 'public_html', 'api', 'fallback.php'), phpFallback);
  
  console.log('✅ Package created successfully!');
  console.log(`📁 Location: ${packageDir}`);
  console.log('📖 Read DEPLOYMENT_INSTRUCTIONS.md for upload instructions');
}

function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

packageForNamecheap();