# PERMANENT SERVER SETUP GUIDE
## Mirage Tenders Tracking System

### ✅ QUICK START (For Daily Use)
1. **Double-click** `START_SERVER.bat`
2. **Wait** for "Ready in X seconds" message
3. **Share these URLs** with your team:
   - `http://192.168.1.117:3000`
   - `http://172.18.0.1:3000`

### 🔐 LOGIN CREDENTIALS
- **Admin**: `admin` / `admin123`
- **User**: `user` / `user123`

---

## 🔧 TROUBLESHOOTING

### If "This site can't be reached" error occurs:

#### Option 1: Windows Firewall (RECOMMENDED)
1. **Open Windows Firewall** → Advanced Settings
2. **Click "Inbound Rules"** → "New Rule"
3. **Select "Port"** → Next
4. **TCP, Specific ports: 3000** → Next
5. **Allow the connection** → Next
6. **All profiles checked** → Next
7. **Name: "Mirage Tenders Server"** → Finish

#### Option 2: Temporary Firewall Disable (TESTING ONLY)
1. Open Windows Security
2. Firewall & network protection
3. Turn off for "Private network"
4. Test access, then turn back ON

### If Server Won't Start:
```cmd
# Kill any hanging processes
taskkill /F /IM node.exe

# Clear cache
rmdir /s /q .next
rmdir /s /q node_modules\.cache

# Restart
START_SERVER.bat
```

---

## 📱 TEAM ACCESS INSTRUCTIONS

### For Team Members:
1. **Connect to same WiFi** as the server computer
2. **Open browser** and go to: `http://192.168.1.117:3000`
3. **If that doesn't work**, try: `http://172.18.0.1:3000`
4. **Login** with provided credentials above

### Network Requirements:
- ✅ Same local network (WiFi/Ethernet)
- ✅ Windows Firewall configured (see above)
- ✅ Server running (START_SERVER.bat)

---

## 🚀 ADVANCED SETUP

### Auto-Start on Boot (Optional):
1. Copy `START_SERVER.bat` to: `C:\ProgramData\Microsoft\Windows\Start Menu\Programs\StartUp\`
2. Server will start automatically when Windows starts

### Different Port (If 3000 is busy):
Edit `START_SERVER.bat` and change:
```batch
set PORT=3001
```

### Check Network IP (If IPs change):
```cmd
ipconfig | findstr IPv4
```

---

## 📊 SYSTEM STATUS

- ✅ **Server Type**: Development (Hot Reload)
- ✅ **Network Binding**: All Interfaces (0.0.0.0)
- ✅ **Firewall**: Requires Configuration
- ✅ **Auto-Sync**: Enabled
- ✅ **File Attachments**: Supported
- ✅ **Mobile Responsive**: Yes

---

## 📞 SUPPORT

**Created**: September 17, 2025  
**Version**: Next.js 15.5.3  
**Contact**: m.abuosba@miragebs.com  

For issues, check:
1. Server is running (green terminal text)
2. Firewall allows port 3000
3. Both computers on same network
4. Correct IP address used