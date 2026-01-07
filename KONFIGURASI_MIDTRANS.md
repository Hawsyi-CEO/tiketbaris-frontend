# 📋 PANDUAN KONFIGURASI SIMTIX

## 🎯 Penjelasan Setiap Parameter

### 1. 🔑 **MIDTRANS Configuration**
```
MIDTRANS_SERVER_KEY=SB-Mid-server-XXXXXXXXXXXXXXXXXXXXXXXX
MIDTRANS_CLIENT_KEY=SB-Mid-client-XXXXXXXXXXXXXXXXXXXXXXXX
```
- **Cara dapat**: Login ke [Midtrans Dashboard](https://dashboard.sandbox.midtrans.com/)
- **Server Key**: Dashboard → Settings → Access Keys → Server Key
- **Client Key**: Dashboard → Settings → Access Keys → Client Key
- **⚠️ Penting**: Untuk development gunakan **Sandbox keys** (yang ada "SB-")

### 2. 🌐 **Backend URL & Frontend URL**

**🔧 Development (sekarang):**
```
BACKEND_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3001
```

**🚀 Production (nanti saat upload hosting):**
```
BACKEND_URL=https://api-simtix.yourdomain.com
FRONTEND_URL=https://simtix.yourdomain.com
```
- **Penjelasan**: URL ini untuk CORS dan redirect payment
- **Contoh hosting**: 
  - Shared hosting: `https://yourdomain.com/simtix-api`
  - VPS: `https://api.yourdomain.com`
  - Netlify/Vercel: `https://simtix-app.vercel.app`

### 3. 🗄️ **Database Configuration**

**🔧 Development (Laragon MySQL):**
```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=u390486773_simtix
DB_USER=root
DB_PASSWORD=
```

**🚀 Production (hosting database):**
```
DB_HOST=localhost (atau IP database hosting)
DB_PORT=3306
DB_NAME=nama_database_dari_cpanel
DB_USER=username_database_dari_cpanel
DB_PASSWORD=password_database_dari_cpanel
```
- **Cara dapat**: 
  - **cPanel Hosting**: cPanel → MySQL Databases
  - **VPS**: Setup MySQL manual
  - **Cloud DB**: AWS RDS, Google Cloud SQL

## 🛠️ **Cara Setup Step by Step**

### Step 1: Update Midtrans Keys
1. Buka file `backend/.env`
2. Ganti `MIDTRANS_SERVER_KEY` dan `MIDTRANS_CLIENT_KEY` dengan keys dari dashboard Midtrans

### Step 2: Test Configuration
```bash
# Test dengan development settings
cd backend
npm start
```

### Step 3: Production Setup (nanti)
1. Upload files ke hosting
2. Update environment variables di hosting:
   - Database credentials dari hosting
   - URLs hosting sesungguhnya
   - Set `MIDTRANS_IS_PRODUCTION=true` untuk live transactions

## 🔍 **Contoh Nilai Production**

```env
# Production Example (cPanel hosting)
BACKEND_URL=https://yourdomain.com/simtix-api
FRONTEND_URL=https://yourdomain.com/simtix
DB_HOST=localhost
DB_NAME=yourusr_simtix
DB_USER=yourusr_simtix
DB_PASSWORD=random_secure_password
MIDTRANS_IS_PRODUCTION=true
```

## 🚨 **Security Notes**
- ❌ **JANGAN** commit file `.env` ke Git
- ✅ **SELALU** gunakan `.env.example` untuk template
- ✅ **GANTI** semua default passwords
- ✅ **GUNAKAN** HTTPS untuk production

## ❓ **FAQ**
**Q: Dimana dapat database credentials untuk production?**
A: Dari hosting provider (cPanel, DirectAdmin, atau cloud provider)

**Q: Apakah harus ganti semua URLs sekarang?**
A: Tidak, untuk development biarkan localhost dulu

**Q: Bagaimana test Midtrans sandbox?**
A: Gunakan test credit cards dari [Midtrans Testing](https://docs.midtrans.com/en/technical-reference/sandbox-test)