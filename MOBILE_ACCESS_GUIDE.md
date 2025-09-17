# Mobile and Network Access Guide
## Mirage Tenders Tracking System

### Current Server Status ✅
- **Production Server**: Running on all network interfaces (0.0.0.0:3000)
- **Auto-Sync System**: Active and working
- **Cross-Origin Support**: Configured for team access

---

## 📱 Mobile Access Instructions

### Step 1: Configure Windows Firewall (REQUIRED)
**Run as Administrator** - Right-click on `setup-firewall.bat` and select "Run as administrator"

```batch
@echo off
echo Setting up Windows Firewall for Mirage Tenders System...
netsh advfirewall firewall add rule name="Mirage Tenders System" dir=in action=allow protocol=TCP localport=3000
```

### Step 2: Access URLs from Mobile Devices
Once firewall is configured, access from mobile devices on the same network:

#### Primary Network Address (Use This):
- **http://192.168.1.117:3000** ← Use this on mobile devices

#### Alternative Addresses:
- **http://172.18.0.1:3000** ← Docker/WSL network
- **http://localhost:3000** ← Local computer only

---

## 🔄 Auto-Sync System Status

### Smart Synchronization Features:
- ✅ **Real-time sync** every 3 seconds
- ✅ **Automatic conflict resolution**
- ✅ **Network-aware syncing**
- ✅ **Visual sync indicators**
- ✅ **Logo synchronization**
- ✅ **User authentication sync**

### Visual Indicators:
- 🟢 **Green**: Synced successfully
- 🔵 **Blue**: Syncing in progress
- 🔴 **Red**: Sync error
- ⚫ **Gray**: Offline

---

## 🚀 Quick Start Guide

### For System Administrator:
1. Run `setup-firewall.bat` as Administrator (one-time setup)
2. Start server with `start-mobile-server.bat`
3. Share **http://192.168.1.117:3000** with team

### For Team Members:
1. Connect to same WiFi network
2. Open browser and go to **http://192.168.1.117:3000**
3. Login with your credentials
4. Data syncs automatically across all devices

---

## 🔧 Troubleshooting

### Mobile Can't Access?
1. ✅ Check firewall rule is created
2. ✅ Ensure mobile is on same network
3. ✅ Try both IP addresses above
4. ✅ Clear browser cache on mobile

### Data Not Syncing?
- Check sync indicator in top-right corner
- Click sync icon to force manual sync
- All changes sync automatically within 3 seconds

### Server Issues?
- Production server is more stable than development
- Restart with `start-mobile-server.bat`
- Check that port 3000 isn't blocked

---

## 📋 Team Access Summary

| User Type | Access URL | Capabilities |
|-----------|------------|--------------|
| **Admin** | Any URL | Full access, user management |
| **User** | Any URL | Tender entry, view own data |
| **Mobile** | http://192.168.1.117:3000 | Full functionality |

---

*Last Updated: January 2025*
*Auto-Sync System: Active ✅*