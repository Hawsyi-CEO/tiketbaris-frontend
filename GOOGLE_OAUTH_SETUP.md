# 🔐 Google OAuth Setup Guide - SIMTIX

## 📋 Ringkasan
Panduan lengkap untuk mengkonfigurasi Google OAuth untuk fitur login/register dengan Gmail di SIMTIX.

## ✅ Yang Sudah Dikonfigurasi

### Frontend
1. ✅ Package `@react-oauth/google` dan `jwt-decode` sudah terinstall
2. ✅ `RegisterPageNew.jsx` dengan Google OAuth button sudah dibuat
3. ✅ `RegisterPage.css` dengan responsive design sudah dibuat
4. ✅ `App.jsx` sudah dibungkus dengan `GoogleOAuthProvider`
5. ✅ File `.env.local` untuk Google Client ID sudah dibuat

### Backend
1. ✅ Endpoint `/api/auth/google` untuk handle Google OAuth sudah dibuat
2. ✅ Migration script untuk menambahkan kolom `google_id` sudah dibuat
3. ✅ File `.env` sudah diupdate dengan placeholder `GOOGLE_CLIENT_ID`
4. ⏳ Package `google-auth-library` perlu diinstall

## 🚀 Langkah Setup

### Step 1: Install Package Backend
```bash
cd backend
npm install google-auth-library
```

### Step 2: Jalankan Database Migration
```bash
cd backend
node add-google-auth-columns.js
```

### Step 3: Dapatkan Google OAuth Client ID

#### A. Buat Project di Google Cloud Console
1. Buka https://console.cloud.google.com/
2. Klik **Select a project** → **New Project**
3. Nama project: `SIMTIX` atau nama lain
4. Klik **Create**

#### B. Enable Google+ API (Optional)
1. Di sidebar, pilih **APIs & Services** → **Library**
2. Cari "Google+ API" atau "Google People API"
3. Klik **Enable**

#### C. Configure OAuth Consent Screen
1. Di sidebar, pilih **APIs & Services** → **OAuth consent screen**
2. Pilih **External** (untuk testing)
3. Klik **Create**
4. Isi form:
   - **App name**: SIMTIX
   - **User support email**: email@anda.com
   - **Developer contact**: email@anda.com
5. Klik **Save and Continue**
6. Di **Scopes**, skip atau tambahkan scope basic (email, profile)
7. Di **Test users**, tambahkan email yang akan digunakan untuk testing
8. Klik **Save and Continue**

#### D. Create OAuth 2.0 Client ID
1. Di sidebar, pilih **APIs & Services** → **Credentials**
2. Klik **Create Credentials** → **OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Name: **SIMTIX Web Client**
5. **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   http://localhost:3001
   ```
6. **Authorized redirect URIs**:
   ```
   http://localhost:3000
   http://localhost:3001
   ```
7. Klik **Create**
8. **COPY** Client ID yang muncul (format: xxx-yyy.apps.googleusercontent.com)

### Step 4: Configure Environment Variables

#### Frontend - `frontend/.env.local`
```env
VITE_GOOGLE_CLIENT_ID=paste-client-id-anda-disini.apps.googleusercontent.com
VITE_API_URL=http://localhost:5000/api
```

#### Backend - `backend/.env`
```env
GOOGLE_CLIENT_ID=paste-client-id-anda-disini.apps.googleusercontent.com
```

**⚠️ PENTING**: Gunakan Client ID yang SAMA untuk frontend dan backend!

### Step 5: Restart Servers

#### Stop semua Node.js processes
```bash
# Windows
taskkill /F /IM node.exe

# Linux/Mac
killall node
```

#### Start Backend
```bash
cd backend
npm start
```

#### Start Frontend (terminal baru)
```bash
cd frontend
npm run dev
```

## 🧪 Testing

### 1. Buka Browser
```
http://localhost:3000/register
```

### 2. Klik tombol "Sign up with Google"

### 3. Pilih akun Google (harus ada di Test Users jika app masih External)

### 4. Cek Response
- ✅ Jika berhasil: Otomatis login dan redirect ke dashboard
- ❌ Jika error: Cek console browser dan terminal backend

## 📁 File yang Dimodifikasi/Dibuat

### Frontend
```
frontend/
├── src/
│   ├── App.jsx                    ← Updated (GoogleOAuthProvider wrapper)
│   └── pages/
│       ├── RegisterPageNew.jsx    ← Created (new register page)
│       └── RegisterPage.css       ← Created (responsive styles)
├── .env.local                     ← Created (Google Client ID)
└── package.json                   ← Updated (oauth packages)
```

### Backend
```
backend/
├── routes/
│   └── auth.js                         ← Updated (Google OAuth endpoint)
├── add-google-auth-columns.js          ← Created (migration script)
├── .env                                ← Updated (Google Client ID)
└── package.json                        ← Need to update (google-auth-library)
```

## 🔒 Keamanan

### Token Verification
Backend menggunakan `google-auth-library` untuk:
- ✅ Verify signature token dari Google
- ✅ Validate audience (Client ID)
- ✅ Check expiration time
- ✅ Extract user payload (email, name, picture)

### Database Security
- Password random generated untuk user Google (tidak pernah digunakan)
- Email otomatis verified (email_verified = 1)
- Unique constraint pada google_id
- Foreign key relationships maintained

## 🎨 UI Features

### Responsive Design
- ✅ Desktop: Two-column layout (branding left, form right)
- ✅ Tablet: Single column with adjusted spacing
- ✅ Mobile: Optimized for small screens (320px+)

### UX Enhancements
- ✅ Google button dengan icon official
- ✅ Password visibility toggle
- ✅ Form validation real-time
- ✅ Loading states dengan spinner
- ✅ Error handling dengan notifications
- ✅ Smooth animations dan transitions

## 🐛 Troubleshooting

### Error: "Invalid Client ID"
**Solusi**: 
1. Pastikan Client ID di `.env.local` dan `.env` sama
2. Restart kedua server (frontend & backend)
3. Clear browser cache dan cookies

### Error: "Unauthorized JavaScript origin"
**Solusi**:
1. Buka Google Cloud Console → Credentials
2. Edit OAuth Client ID
3. Tambahkan `http://localhost:3000` di Authorized JavaScript origins
4. Save dan tunggu 5-10 menit untuk propagasi

### Error: "Access denied"
**Solusi**:
1. Pastikan email ada di Test Users (jika app masih External)
2. Atau publish app ke Production (tidak perlu Test Users)

### Error: "Token used too early"
**Solusi**:
- Ini error clock skew, tunggu beberapa detik dan coba lagi
- Backend sudah handle dengan response yang informatif

### Database Error: "Unknown column 'google_id'"
**Solusi**:
```bash
cd backend
node add-google-auth-columns.js
```

## 📊 Database Schema

### Users Table - New Columns
```sql
ALTER TABLE users 
ADD COLUMN google_id VARCHAR(255) DEFAULT NULL AFTER email_verified,
ADD UNIQUE KEY idx_google_id (google_id);
```

### Columns:
- `google_id`: Unique identifier dari Google (sub claim)
- `email_verified`: Otomatis set ke 1 untuk Google users
- `profile_picture`: URL dari Google profile picture
- `password`: Random generated (tidak digunakan untuk Google login)

## 🔄 Flow Diagram

### Register/Login Flow
```
User clicks "Sign up with Google"
    ↓
Google OAuth popup muncul
    ↓
User memilih akun Google
    ↓
Google mengirim credential (JWT token) ke frontend
    ↓
Frontend mengirim credential ke backend /api/auth/google
    ↓
Backend verify token dengan Google
    ↓
Backend cek: User exists?
    ├─ YES → Login (update profile picture jika perlu)
    └─ NO  → Register (create new user dengan data Google)
    ↓
Backend generate JWT token internal
    ↓
Frontend simpan token di localStorage
    ↓
Redirect ke dashboard sesuai role
```

## 📞 Support

Jika mengalami masalah:
1. Cek console browser (F12)
2. Cek terminal backend untuk error logs
3. Cek file `backend/auth-debug.log`
4. Pastikan semua environment variables sudah di-set
5. Restart semua servers

## ✨ Next Steps

Setelah Google OAuth berfungsi, pertimbangkan untuk:
1. ✅ Tambahkan Google OAuth di LoginPage juga
2. ✅ Implementasi "Link Google account" untuk existing users
3. ✅ Add Google Calendar integration untuk event reminders
4. ✅ Implement Google Drive untuk document storage
5. ✅ Add social sharing dengan Google+

---

**Created**: ${new Date().toISOString()}
**Status**: Ready for Implementation ✅
