# Deployment Guide for Mirage Tenders Tracking System

## File Storage Important Note

This application now uses persistent file storage in the `data/uploads` directory to ensure uploaded documents (Bank Guarantees, Proposal Documents, Tender Documents) persist across deployments.

### Railway Deployment (Recommended for File Storage)

Railway provides persistent disk storage which is perfect for this application's file upload requirements.

#### Steps:
1. **Push code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/mirage-tenders.git
   git push -u origin main
   ```

2. **Deploy on Railway:**
   - Go to [railway.app](https://railway.app)
   - Sign up/Login with GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway will automatically detect Next.js and deploy

3. **The app will be live at:** Your Railway provided URL

4. **File Storage:** Files are automatically stored in the persistent `data/uploads` directory and will survive deployments.

## Option 1: Vercel (Limited File Storage)

**⚠️ Note:** Vercel has ephemeral filesystem - uploaded files will be lost on each deployment. Only suitable for testing.

### Prerequisites:
1. GitHub account
2. Vercel account (free)

### Steps:
1. **Push code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/mirage-tenders.git
   git push -u origin main
   ```

2. **Deploy on Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign up/Login with GitHub
   - Click "New Project"
   - Import your repository
   - Configure settings:
     - Framework Preset: Next.js
     - Build Command: `npm run build`
     - Output Directory: `.next`
   - Click "Deploy"

3. **Your app will be live at:** `https://your-app-name.vercel.app`

## Option 2: Netlify (Static Export Only)

**⚠️ Note:** Netlify static hosting doesn't support file uploads. Only suitable for demo purposes.

### Steps:
1. **Build the project:**
   ```bash
   npm run build
   npm run export
   ```

2. **Deploy on Netlify:**
   - Go to [netlify.com](https://netlify.com)
   - Drag and drop the `out` folder
   - Your site is live!

## Option 3: Custom Server (VPS/Dedicated)

### Requirements:
- Node.js 18+
- PM2 for process management
- Nginx for reverse proxy

### Steps:
1. **Upload code to server**
2. **Install dependencies:** `npm install`
3. **Build project:** `npm run build`
4. **Start with PM2:** `pm2 start npm --name "mirage-tenders" -- start`
5. **Configure Nginx** to proxy to port 3001

## Important Notes:

### Data Storage:
- **Current**: Uses localStorage (client-side only)
- **For Production**: Consider migrating to a database
- **Options**: PostgreSQL, MySQL, MongoDB, Supabase

### Environment Variables:
- Set `NODE_ENV=production`
- Configure any API keys in hosting platform
- Update localhost URLs to production URLs

### Security Considerations:
- Add proper authentication
- Use HTTPS (automatic on Vercel/Netlify)
- Validate all user inputs
- Add rate limiting

### Performance Optimization:
- Next.js automatically optimizes for production
- Images are optimized
- Code is minified and compressed

## Cost Breakdown:
- **Vercel Free:** 100GB bandwidth, unlimited sites
- **Netlify Free:** 100GB bandwidth, 300 build minutes
- **Railway Free:** $5 credit monthly
- **Custom VPS:** $5-20/month depending on provider

## Recommended: Start with Vercel Free Tier
Perfect for your tender tracking system and can handle significant traffic!
