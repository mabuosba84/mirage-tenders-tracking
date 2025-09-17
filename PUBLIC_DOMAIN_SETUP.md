# 🌐 Public Domain Deployment & Data Synchronization Guide

## Overview
This guide will help you deploy the Mirage Tenders Tracking System to a public domain while ensuring all data (tenders, users, attachments, settings) stays synchronized between your local development environment and the public production environment.

## 📋 Data Types Synchronized
- ✅ **Tenders**: All tender records with complete details
- ✅ **Users**: User accounts, roles, and permissions  
- ✅ **File Attachments**: PDFs, Word docs, and other uploaded files
- ✅ **Company Settings**: Logo, contact info, branding
- ✅ **Application State**: Last sync timestamps, metadata

## 🚀 Deployment Options

### Option 1: Vercel (Recommended for Public Access)

#### Step 1: Prepare for Deployment
```bash
# Ensure all data is properly synchronized
npm run build
```

#### Step 2: Deploy to Vercel
1. Push your code to GitHub
2. Connect GitHub to Vercel
3. Deploy with these settings:
   - Framework: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`

#### Step 3: Configure Environment Variables
Add these to your Vercel project settings:
```
NEXT_PUBLIC_SYNC_ENABLED=true
NEXT_PUBLIC_SYNC_INTERVAL=30000
NEXT_PUBLIC_PRIMARY_DOMAIN=your-domain.vercel.app
```

### Option 2: Custom Server/VPS

#### Step 1: Server Setup
```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
npm install -g pm2
```

#### Step 2: Deploy Application
```bash
# Clone and setup
git clone https://github.com/your-repo/mirage-tenders.git
cd mirage-tenders
npm install
npm run build

# Start with PM2
pm2 start npm --name "mirage-tenders" -- start
pm2 startup
pm2 save
```

## 🔄 Data Synchronization Setup

### Automatic Sync Configuration

The system includes built-in cross-domain synchronization that works automatically:

1. **Real-time Sync**: Changes sync every 30 seconds
2. **Conflict Resolution**: Last-write-wins with timestamp validation
3. **File Sync**: Attachments sync via secure API endpoints
4. **Offline Support**: Local storage maintains data during network issues

### Manual Sync Commands

```javascript
// Force immediate sync
await syncManager.forceSyncNow()

// Check sync status
const status = await syncManager.getSyncStatus()

// Reset sync (emergency use only)
await syncManager.resetAndResync()
```

## 🔐 Security Considerations

### API Security
- All sync endpoints use CORS protection
- File uploads validated for type and size
- User authentication required for data modifications

### Data Protection
- Local storage encrypted where possible
- Sensitive data excluded from client-side storage
- Regular backup recommendations

## 🌍 Public Domain Access URLs

Once deployed, your team can access the application at:

### Production URL
```
https://your-app-name.vercel.app
```

### Network URLs (for local network access)
```
http://YOUR-LOCAL-IP:3001
```

## 📱 Team Access Instructions

### For Team Members:
1. **Public Access**: Use the production URL from any internet connection
2. **Office Network**: Use the local network IP for faster access
3. **Mobile Devices**: Both URLs work on mobile devices
4. **Data Sync**: All data automatically syncs across all access points

### User Accounts:
Each team member should have their own account with appropriate permissions:
- **Admin**: Full access to all features
- **User**: Standard tender management access
- **Viewer**: Read-only access to assigned data

## ⚙️ Configuration Files

### next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    outputFileTracingIncludes: {
      '/api/**/*': ['./uploads/**/*', './network-storage.json']
    }
  }
}

module.exports = nextConfig
```

### vercel.json
```json
{
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "crons": [
    {
      "path": "/api/sync/auto",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

## 🔧 Troubleshooting

### Common Issues:

1. **Sync Not Working**
   - Check network connectivity
   - Verify API endpoints are accessible
   - Check browser console for errors

2. **Files Not Syncing**
   - Ensure file size limits are respected
   - Check file permissions
   - Verify upload directory exists

3. **Data Conflicts**
   - Check last sync timestamps
   - Use manual conflict resolution
   - Contact admin for data recovery

### Debug Commands:
```bash
# Check sync status
curl https://your-domain.com/api/sync/status

# View sync logs
tail -f logs/sync.log

# Test connectivity
curl https://your-domain.com/api/health
```

## 📊 Monitoring & Maintenance

### Regular Tasks:
- Monitor sync frequency and success rates
- Backup network-storage.json and uploads/ directory
- Update team access permissions as needed
- Review and clean up old file attachments

### Performance Optimization:
- Enable file compression for large attachments
- Configure CDN for static assets
- Implement database indexing for large datasets

## 🎯 Success Checklist

- [ ] Application deployed to public domain
- [ ] All team members can access both local and public URLs
- [ ] Data syncs automatically between domains
- [ ] File attachments accessible from both environments
- [ ] User accounts and permissions work correctly
- [ ] Backup and recovery procedures documented

## 📞 Support

For technical issues or questions:
- Email: m.abuosba@miragebs.com
- Phone: +962 6 569 13 33
- Documentation: Check README.md for detailed technical information