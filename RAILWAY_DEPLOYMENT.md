# 🚂 Railway.app Deployment Guide

## Mirage Tenders Tracking System - Railway Deployment

Railway.app is perfect for this project because it provides:
- ✅ **Persistent file storage** - uploads stay permanently
- ✅ **Automatic deployments** from GitHub
- ✅ **Zero configuration** - works out of the box
- ✅ **Professional domains** and SSL certificates
- ✅ **Database support** (PostgreSQL, MySQL available)

---

## 📋 Prerequisites

1. **GitHub Repository**: Your code is already on GitHub at `mabuosba84/mirage-tenders-tracking`
2. **Railway Account**: Sign up at [railway.app](https://railway.app)
3. **Domain** (optional): You can use Railway's domain or connect your own

---

## 🚀 Step-by-Step Deployment

### Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Click "Login" and sign in with GitHub
3. Authorize Railway to access your repositories

### Step 2: Deploy Your Project
1. Click "New Project" on Railway dashboard
2. Select "Deploy from GitHub repo"
3. Choose `mabuosba84/mirage-tenders-tracking`
4. Railway will automatically:
   - Detect it's a Next.js project
   - Install dependencies
   - Build and deploy

### Step 3: Configure Environment (Optional)
- Railway will auto-detect most settings
- Your `railway.json` file provides optimal configuration
- No environment variables needed for basic functionality

### Step 4: Get Your Live URL
- Railway provides a URL like: `your-app-name.up.railway.app`
- Click on your deployment to see the live URL
- Your app is now live with full file upload/viewing!

---

## 🔧 Configuration Files Included

### `railway.json`
```json
{
  "build": {
    "builder": "nixpacks"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/",
    "healthcheckTimeout": 300,
    "restartPolicyType": "always"
  }
}
```

### File Storage Optimization
- Files are stored in persistent `/uploads` directory
- Automatic directory creation
- Works exactly like your local production setup
- No file size limitations (within reasonable bounds)

---

## 💰 Pricing

### Hobby Plan (Perfect for your needs)
- **$5/month** for the service
- **$0.000463 per GB-hour** for usage
- **500GB-hours included** (approximately 23 days of continuous running)

### Estimated Monthly Cost
- Small business usage: **$5-15/month**
- Includes domain, SSL, automatic deployments
- Much cheaper than VPS alternatives

---

## 🎯 Advantages for Your Project

### File Handling
- ✅ **Persistent storage** - files never disappear
- ✅ **No size limits** for reasonable business files
- ✅ **Direct file serving** - fast download/preview
- ✅ **Automatic backup** as part of the filesystem

### Business Features
- ✅ **Custom domains** - use your own domain
- ✅ **SSL certificates** - automatic HTTPS
- ✅ **Professional setup** - suitable for client use
- ✅ **99.9% uptime** - reliable for business operations

### Development Features
- ✅ **Auto-deployments** - push to GitHub, instantly live
- ✅ **Build logs** - easy debugging
- ✅ **Rollback support** - revert to previous versions
- ✅ **Environment variables** - configure as needed

---

## 🔗 Post-Deployment Steps

### 1. Test Your Application
- Login with: `admin` / `admin123`
- Create a test tender with file upload
- Verify file viewing works correctly

### 2. Custom Domain (Optional)
1. Go to Railway project settings
2. Add your domain in "Domains" section
3. Update DNS records as instructed
4. SSL certificate is automatic

### 3. Database (Future Enhancement)
- Click "Add Service" → "Database" → "PostgreSQL"
- Railway provides connection details
- Easy to migrate from current storage system

---

## 🆘 Troubleshooting

### Build Fails
- Check build logs in Railway dashboard
- Ensure all dependencies are in `package.json`
- Our `railway.json` handles most configuration

### File Uploads Not Working
- Check deployment logs for filesystem errors
- Verify `/uploads` directory permissions
- Railway filesystem is persistent by default

### Performance Issues
- Monitor usage in Railway dashboard
- Consider upgrading plan if needed
- Database can be added for better performance

---

## 📞 Support

### Railway Support
- **Documentation**: [docs.railway.app](https://docs.railway.app)
- **Discord Community**: Active support community
- **GitHub Issues**: Report platform issues

### Application Support
- Your application is fully configured for Railway
- File uploads work out of the box
- No additional configuration needed

---

## ✅ Ready to Deploy!

Your project is already configured and ready for Railway deployment. The file storage system has been optimized specifically for Railway's persistent filesystem.

**Next Step**: Go to [railway.app](https://railway.app) and deploy your GitHub repository!