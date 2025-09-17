# 🌐 Network Access Guide for Mirage Tenders Tracking System

## 🎯 Complete Solution for Company Network Access

Your Mirage Tenders Tracking System is now configured for **automatic network synchronization**. Here's how to access it from multiple devices in your company network:

## 📱 Access URLs

### From the Server Computer (where you're running the app):
- **Local Access**: `http://localhost:3001`
- **Network Access**: `http://172.18.0.1:3001`

### From Other Devices on the Same Network:
- **Primary URL**: `http://172.18.0.1:3001`
- **Alternative**: Find the server's IP address and use `http://[SERVER-IP]:3001`

## 🔧 Setup Instructions

### 1. Find Your Server's IP Address
Run this command on the server computer:
```powershell
ipconfig | findstr IPv4
```
Look for the IP address that starts with `192.168.` or `172.` or `10.`

### 2. Configure Windows Firewall
**On the server computer**, allow port 3001:
```powershell
# Run as Administrator
netsh advfirewall firewall add rule name="Mirage Tenders Port 3001" dir=in action=allow protocol=TCP localport=3001
```

### 3. Start the Server
```powershell
cd "c:\projects\Mirage tenders Tracking System"
npx next dev -p 3001
```

## 🔄 Automatic Synchronization Features

✅ **Real-time Data Sync**: Data automatically syncs every 30 seconds  
✅ **Cross-device Access**: All devices see the same tenders  
✅ **Offline Support**: Works offline, syncs when back online  
✅ **Network Detection**: Automatically handles network changes  
✅ **Conflict Resolution**: Intelligent data merging  

## 📋 Step-by-Step Network Access

### For IT Administrator:
1. **Start the server** on the main computer (port 3001)
2. **Configure firewall** to allow port 3001
3. **Share the network URL** `http://172.18.0.1:3001` with team
4. **Test access** from another device

### For Team Members:
1. **Open browser** on your device
2. **Navigate to** `http://172.18.0.1:3001`
3. **Login** with your credentials:
   - Admin: `admin` / `admin123`
   - User: `user` / `user123`
4. **Start working** - data syncs automatically!

## 🛠️ Troubleshooting

### If other devices can't access:

1. **Check Firewall**:
   ```powershell
   netsh advfirewall firewall show rule name="Mirage Tenders Port 3001"
   ```

2. **Test Network Connectivity**:
   From another device, ping the server:
   ```cmd
   ping 172.18.0.1
   ```

3. **Verify Server is Running**:
   Check if port 3001 is listening:
   ```powershell
   netstat -an | findstr :3001
   ```

4. **Alternative IP Discovery**:
   ```powershell
   # Get all network interfaces
   Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*" -or $_.IPAddress -like "172.*" -or $_.IPAddress -like "10.*"}
   ```

### If data doesn't sync:

1. **Check Sync Status**: Look for "Auto-sync active" in the dashboard
2. **Manual Sync**: Click the "Manual Network Sync" button
3. **Check Console**: Open browser dev tools (F12) to see sync logs
4. **Restart**: Refresh the browser page

## 🔒 Security Notes

- ✅ The app is configured for **internal company network use**
- ✅ CORS headers are set for network access
- ✅ Data is stored locally and synced across devices
- ⚠️ **Not exposed to internet** - only accessible within your network

## 📊 Data Synchronization

Your 7 existing tenders will automatically appear on all devices:
- Capital Bank of Jordan
- Supreme Judge Department  
- Ministry of Education
- Ideco
- Jopetrol
- Ideco PC
- Sadad

## 🆘 Support

If you encounter issues:
1. Check this guide first
2. Verify network connectivity
3. Restart the server if needed
4. Contact your IT administrator

## 🚀 Quick Start Command

**For immediate network access:**
```powershell
# Stop any existing servers
taskkill /f /im node.exe 2>$null

# Add firewall rule
netsh advfirewall firewall add rule name="Mirage Tenders Port 3001" dir=in action=allow protocol=TCP localport=3001

# Start server
cd "c:\projects\Mirage tenders Tracking System"
npx next dev -p 3001

# Share this URL with your team:
# http://172.18.0.1:3001
```

---
**🎉 Your Mirage Tenders Tracking System is ready for company-wide use!**
