# Complete Setup and Deployment Guide
## Mirage Tenders Tracking System with Automatic Data Synchronization

### 🚀 Quick Start (Local Development)

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd "Mirage tenders Tracking System"
   npm install
   ```

2. **Configure Environment**
   ```bash
   # Copy example environment file
   cp .env.example .env.local
   
   # Edit .env.local with your settings
   NEXT_PUBLIC_PRIMARY_DOMAIN=http://localhost:3001
   NEXT_PUBLIC_AUTO_SYNC=true
   ```

3. **Start Development Servers**
   ```bash
   # Terminal 1: Main development server
   npm run dev
   
   # Terminal 2: Network sync server (for testing sync)
   npx next dev -p 3001
   ```

4. **Access the Application**
   - Main app: http://localhost:3000
   - Sync server: http://localhost:3001
   - Login: admin/admin123 or user/user123

### 🔄 Automatic Synchronization Features

The system now includes comprehensive automatic data synchronization:

#### What Gets Synchronized
- ✅ **Tenders**: All tender data with search/filter preferences
- ✅ **Users**: User accounts and permissions  
- ✅ **Files**: Attachments with metadata and checksums
- ✅ **Settings**: Application configuration and preferences
- ✅ **Audit Trails**: Edit history and user activity logs

#### How It Works
1. **Startup Sync**: Automatic sync when application loads
2. **Periodic Sync**: Every 30 seconds (configurable)
3. **Manual Sync**: Click sync button in status indicator
4. **Conflict Resolution**: Intelligent merging of concurrent changes
5. **File Integrity**: Checksum verification for file transfers

#### Sync Status Indicator
Look for the status indicator in the top-right corner:
- 🟢 **Green**: Online and synchronized
- 🟡 **Yellow**: Syncing in progress
- 🔴 **Red**: Offline or sync error

Click the indicator to see detailed sync information and manual controls.

### 🌐 Production Deployment Options

#### Option A: Vercel (Recommended for Teams)

1. **Prepare for Deployment**
   ```bash
   # Ensure all changes are committed
   git add .
   git commit -m "Production ready with auto-sync"
   git push origin main
   ```

2. **Deploy to Vercel**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel --prod
   ```

3. **Configure Environment Variables in Vercel**
   ```bash
   # Set via Vercel dashboard or CLI
   vercel env add NEXT_PUBLIC_PRIMARY_DOMAIN
   # Enter: https://your-app.vercel.app
   
   vercel env add NEXT_PUBLIC_AUTO_SYNC
   # Enter: true
   
   vercel env add NODE_ENV
   # Enter: production
   ```

4. **Team Access Setup**
   - Share the Vercel URL with your team
   - All team members will automatically sync data
   - No additional setup required

#### Option B: Custom VPS/Server

1. **Server Requirements**
   - Node.js 18+ installed
   - PM2 for process management
   - Nginx for reverse proxy (optional)

2. **Deploy to Server**
   ```bash
   # On your server
   git clone <repository-url>
   cd "Mirage tenders Tracking System"
   npm install
   npm run build
   
   # Install PM2
   npm install -g pm2
   
   # Start with PM2
   pm2 start npm --name "mirage-tenders" -- start
   pm2 startup
   pm2 save
   ```

3. **Configure Environment**
   ```bash
   # Create production environment file
   nano .env.production.local
   ```
   
   Add:
   ```bash
   NEXT_PUBLIC_PRIMARY_DOMAIN=https://tenders.your-domain.com
   NEXT_PUBLIC_AUTO_SYNC=true
   NODE_ENV=production
   ```

4. **Set Up Nginx (Optional)**
   ```nginx
   server {
       listen 80;
       server_name tenders.your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### 👥 Team Configuration

#### For Team Lead/Admin:
1. Deploy to production using Option A or B above
2. Share the production URL with team members
3. Create user accounts via User Management
4. All data automatically syncs across team members

#### For Team Members:
1. Access the shared production URL
2. Login with provided credentials
3. Data automatically syncs with team
4. Work normally - sync happens transparently

### ⚙️ Configuration Options

#### Sync Settings (Environment Variables)
```bash
# Primary domain for synchronization
NEXT_PUBLIC_PRIMARY_DOMAIN=https://your-domain.com

# Sync frequency (milliseconds)
NEXT_PUBLIC_SYNC_INTERVAL=30000  # 30 seconds

# Enable/disable features
NEXT_PUBLIC_AUTO_SYNC=true       # Automatic sync
NEXT_PUBLIC_FILE_SYNC=true       # File synchronization

# File upload limits
NEXT_PUBLIC_MAX_FILE_SIZE=10485760  # 10MB max
```

#### Sync Behavior Customization
```javascript
// In comprehensiveSync.ts, modify defaultSyncConfig:
export const defaultSyncConfig = {
  primaryDomain: 'https://your-domain.com',
  syncInterval: 60000,  // 1 minute
  enableAutoSync: true,
  enableFileSync: true,
  maxFileSize: 20 * 1024 * 1024,  // 20MB
  allowedFileTypes: ['pdf', 'doc', 'docx', 'xlsx']
}
```

### 🔧 Troubleshooting

#### Sync Issues
1. **Check Network Connection**: Ensure internet connectivity
2. **Verify Domain**: Confirm NEXT_PUBLIC_PRIMARY_DOMAIN is correct
3. **Check Console**: Look for sync errors in browser console
4. **Manual Sync**: Use "Sync Now" button in status indicator
5. **Reset Data**: Use "Reset & Sync" for fresh start

#### Common Problems
- **Sync Status Red**: Network issue or wrong domain
- **Files Not Syncing**: Check file size limits and types
- **Data Conflicts**: Automatic merge resolves most conflicts
- **Performance**: Reduce sync frequency for large datasets

#### Debug Mode
Enable detailed logging:
```bash
DEBUG_SYNC=true
```

### 📊 Monitoring and Maintenance

#### Sync Status Monitoring
- Real-time status indicator shows connection health
- Detailed view shows last sync times for each data type
- Error reporting for failed operations

#### Data Backup
- Local data automatically backed up before syncs
- Export functionality available in Reports section
- File attachments preserved with metadata

#### Performance Optimization
- Incremental syncing (only changed data)
- Gzip compression for large transfers
- Checksum validation prevents unnecessary transfers
- Background sync doesn't block UI

### 🆘 Support

#### For Technical Issues:
1. Check browser console for errors
2. Verify environment variables
3. Test connectivity to primary domain
4. Review sync status details

#### For Business Logic Issues:
1. Check user permissions
2. Verify tender data integrity
3. Review audit trails
4. Contact system administrator

### 🔐 Security Notes

- All sync traffic uses HTTPS in production
- File integrity verified with checksums
- User authentication required for all operations
- Audit trails track all data changes
- Environment variables keep sensitive data secure

---

**Ready to Go!** 
Your Mirage Tenders Tracking System is now configured with automatic data synchronization. Team members can collaborate seamlessly with real-time data sharing across all devices and locations.