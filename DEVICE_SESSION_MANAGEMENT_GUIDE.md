# GUIDE: Fitur Device & Session Management

## Apa yang Sudah Ditambahkan?

### ✅ Backend:
1. **Enhanced device-tracker.js** - UA Parser untuk deteksi device lebih akurat
2. **API Routes** - `/sessions/my-devices`, `/sessions/device/:id`, `/sessions/logout-all-others`
3. **Database Migration** - Enhance sessions table dengan kolom browser, os, device_type, location

### ✅ Frontend:
1. **Active Devices Page** (`/user/active-devices`) - UI untuk manage sessions
2. **Link dari Dashboard Profile** - Button "🛡️ Device & Sesi Aktif"

---

## Manual Setup Steps

### 1. Jalankan Database Migration

Login ke **phpMyAdmin** atau **MySQL CLI** dan jalankan:

```sql
-- Enhanced Sessions Table for Device Tracking
ALTER TABLE user_sessions 
ADD COLUMN IF NOT EXISTS browser VARCHAR(100),
ADD COLUMN IF NOT EXISTS os VARCHAR(100),
ADD COLUMN IF NOT EXISTS device_type VARCHAR(50), -- 'desktop', 'mobile', 'tablet'
ADD COLUMN IF NOT EXISTS location VARCHAR(255), -- City, Country
ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT 0; -- Mark current device

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_active ON user_sessions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_expires ON user_sessions(expires_at);
```

### 2. Verify Installation

Check backend sudah running:
```bash
ssh root@72.61.140.193
cd /var/www/tiketbaris/backend
pm2 status tiketbaris-backend
pm2 logs tiketbaris-backend --lines 50
```

Check package installed:
```bash
cd /var/www/tiketbaris/backend
npm list ua-parser-js
```

---

## Testing Checklist

### Backend API:
- [ ] `GET /api/sessions/my-devices` - Return list sessions
- [ ] `DELETE /api/sessions/device/:id` - Logout specific device
- [ ] `POST /api/sessions/logout-all-others` - Logout all except current

### Frontend:
- [ ] Login dari browser Chrome
- [ ] Buka `/user/active-devices`
- [ ] Lihat device terdeteksi dengan benar
- [ ] Login dari browser lain atau HP
- [ ] Refresh active devices - lihat 2 sessions
- [ ] Logout dari one device - verify berhasil

### Device Detection:
- [ ] Chrome on Windows → "Windows 10/11 - Chrome"
- [ ] Safari on iOS → "iOS 16 - Safari"
- [ ] Chrome on Android → "Android 13 - Chrome"
- [ ] Firefox on Mac → "macOS - Firefox"

---

## Troubleshooting

### Issue: Sessions tidak muncul
**Check:**
1. Apakah tabel `user_sessions` ada kolom browser, os, device_type?
2. Apakah `trackDevice()` dipanggil saat login?
3. Check PM2 logs: `pm2 logs tiketbaris-backend | grep "device"`

### Issue: Device info = "Unknown Device"
**Check:**
1. Apakah package `ua-parser-js` installed?
2. Check console error di PM2 logs
3. Verify User-Agent header terkirim dari frontend

### Issue: Logout device tidak work
**Check:**
1. Apakah sessionId valid?
2. Check console error: `DELETE /api/sessions/device/:id`
3. Verify JWT token masih valid

---

## Features Overview

### 🎯 User Benefits:
- ✅ See all devices logged into their account
- ✅ Logout from suspicious devices remotely
- ✅ Security awareness (login notifications)
- ✅ Logout all devices at once (e.g., after password change)

### 🔒 Security Features:
- ✅ IP masking (show only first 2 octets)
- ✅ Session expiry (auto cleanup old sessions)
- ✅ Mark current device (prevent accidental logout)
- ✅ Last activity tracking

### 📊 Data Tracked:
- Device Type (Mobile/Desktop/Tablet)
- Browser (Chrome, Safari, Firefox, etc.)
- Operating System (Windows, macOS, Android, iOS)
- IP Address (masked)
- Location (placeholder - can integrate IP geolocation API)
- Login Time
- Last Activity
- Status (Active/Recent/Inactive)

---

## Future Enhancements

### 🚀 Phase 2:
- [ ] Email notification on new device login
- [ ] Push notification for suspicious activity
- [ ] IP geolocation integration (ipapi.co atau ip-api.com)
- [ ] Device name customization ("My iPhone", "Work Laptop")
- [ ] Session history (show expired sessions)

### 🔮 Phase 3:
- [ ] Two-Factor Authentication (2FA)
- [ ] Biometric authentication
- [ ] Trusted devices list
- [ ] Login activity timeline

---

## Deployed Files

**Backend:**
- ✅ `middleware/device-tracker.js` (enhanced with UA Parser)
- ✅ `package.json` (added ua-parser-js)
- ✅ PM2 restarted (process #67)

**Frontend:**
- ✅ `pages/user/ActiveDevices.jsx` (new page)
- ✅ `App.jsx` (added route)
- ✅ `DashboardUserResponsive.jsx` (added link)
- ✅ Deployed: `index.CQ_ozEzA.js` (786.41 KB)

**SQL Migration:**
- ⏳ `migrations/enhance-sessions-device-tracking.sql` (needs manual run)

---

## How to Use (User Guide)

### Untuk User:
1. Login ke account
2. Go to Dashboard → Profile
3. Klik "🛡️ Device & Sesi Aktif"
4. Lihat semua device yang login
5. Jika ada device mencurigakan, klik "Logout dari Device Ini"
6. Atau klik "Logout dari Semua Device Lain" untuk logout semua sekaligus

### Kapan Harus Check:
- ✅ Setelah ganti password
- ✅ Jika ada aktivitas mencurigakan
- ✅ Secara berkala (1x per bulan)
- ✅ Setelah login dari device publik

---

**Status:** ✅ DEPLOYED (Backend + Frontend)  
**Pending:** ⏳ SQL Migration (run manual di phpMyAdmin)  
**Deploy Date:** 26 Januari 2026  
**Version:** 1.0.0
