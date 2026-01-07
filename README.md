# Tiket Pembaris - JavaScript Full Stack Application

Aplikasi penjualan tiket event online yang dibangun dengan **React + Vite** untuk frontend dan **Express.js** untuk backend.

> **✨ Sekarang sudah dikonfigurasi untuk Laragon!**  
> Database akan otomatis reconnect dan lebih stabil.

## 🚀 Quick Start (Laragon)

### 1. Pastikan Laragon Berjalan
- Buka Laragon
- Klik "Start All"
- MySQL harus berwarna hijau

### 2. Install Dependencies (Pertama Kali)
```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### 3. Setup Database (Pertama Kali)
```bash
cd backend
npm run setup-db
```

### 4. Jalankan Aplikasi

**Cara Termudah - Auto Start:**
```bash
# Dari folder root, double-click:
START_ALL.bat
```

**Atau Manual:**
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 5. Akses Aplikasi
- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- API Health: http://localhost:5000/api/health

---

## 🎯 Stack Teknologi

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Web framework
- **MySQL 2** - Database driver
- **JWT** - Authentication
- **Bcryptjs** - Password hashing
- **Multer** - File upload
- **Midtrans** - Payment gateway

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **React Router** - Routing
- **Axios** - HTTP client

## 📁 Struktur Folder

```
file js/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── events.js
│   │   ├── checkout.js
│   │   ├── admin.js
│   │   ├── users.js
│   │   └── withdrawals.js
│   ├── uploads/
│   ├── .env
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── user/
    │   │   │   ├── DashboardUser.jsx
    │   │   │   └── HistoryPembayaran.jsx
    │   │   ├── panitia/
    │   │   │   └── DashboardPanitia.jsx
    │   │   ├── admin/
    │   │   │   └── DashboardAdmin.jsx
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   ├── HomePage.jsx
    │   │   └── CheckoutPage.jsx
    │   ├── services/
    │   │   ├── api.js
    │   │   └── apiServices.js
    │   ├── App.jsx
    │   ├── index.css
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── .gitignore
```

## 🔧 Setup & Installation

### Prerequisites
- Node.js v14 atau lebih tinggi
- MySQL Server
- npm atau yarn

### Backend Setup

1. **Masuk ke folder backend:**
```bash
cd file\ js/backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Konfigurasi `.env`:**
```env
DB_HOST=localhost
DB_USER=u390486773_simtix
DB_PASSWORD=Tiketbaris123#
DB_NAME=u390486773_simtix
DB_PORT=3306

PORT=5000

JWT_SECRET=<YOUR_JWT_SECRET_HERE>

MIDTRANS_SERVER_KEY=<YOUR_SERVER_KEY_HERE>
MIDTRANS_CLIENT_KEY=<YOUR_CLIENT_KEY_HERE>
MIDTRANS_IS_PRODUCTION=false

NODE_ENV=development
```

4. **Jalankan server:**
```bash
npm start
# atau untuk development dengan auto-reload:
npm run dev
```

Server akan berjalan di `http://localhost:5000`

### Frontend Setup

1. **Masuk ke folder frontend:**
```bash
cd file\ js/frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Jalankan development server:**
```bash
npm run dev
```

Frontend akan berjalan di `http://localhost:3000`

## 🔐 Fitur Utama

### 1. Authentication
- ✅ Register user (user/panitia)
- ✅ Login dengan JWT token
- ✅ Password hashing dengan bcryptjs
- ✅ Token verification

### 2. User (Pembeli Tiket)
- ✅ Melihat daftar event aktif
- ✅ Membeli tiket dengan Midtrans
- ✅ Melihat riwayat pembayaran
- ✅ Dashboard personal

### 3. Panitia (Penyelenggara Event)
- ✅ Membuat event baru
- ✅ Upload gambar event
- ✅ Melihat status event
- ✅ Melihat riwayat penarikan saldo
- ✅ Request penarikan saldo

### 4. Admin
- ✅ Approve/decline event pending
- ✅ Hapus event
- ✅ Manage users
- ✅ Manage partnerships
- ✅ View semua transactions

### 5. Payment Integration
- ✅ Midtrans Snap integration
- ✅ Transaction management
- ✅ Order tracking

## 📋 API Endpoints

### Auth Routes (`/api/auth`)
- `POST /register` - Register user baru
- `POST /login` - Login user
- `GET /verify` - Verify JWT token

### Events Routes (`/api/events`)
- `GET /` - Get semua event aktif
- `GET /:id` - Get event by ID
- `POST /` - Create event (Panitia)
- `GET /user/my-events` - Get user's events (Panitia)

### Checkout Routes (`/api/checkout`)
- `POST /process` - Process payment
- `GET /transaction/:orderId` - Get transaction details

### Admin Routes (`/api/admin`)
- `GET /pending-events` - Get pending events
- `PUT /approve-event/:id` - Approve event
- `PUT /decline-event/:id` - Decline event
- `DELETE /event/:id` - Delete event
- `GET /users` - Get all users
- `GET /partnerships` - Get all partnerships
- `PUT /partnership/:id/approve` - Approve partnership

### User Routes (`/api/user`)
- `GET /profile` - Get user profile
- `GET /transactions` - Get transaction history

### Withdrawal Routes (`/api/withdrawals`)
- `GET /` - Get user withdrawals
- `POST /request` - Request withdrawal

## 🔑 Credentials untuk Testing

### Admin
- Email: `admin@gmail.com`
- Password: `password` (sesuaikan dengan yang ada di database)

### Panitia
- Email: `pantia@gm`
- Password: (sesuaikan)

### User
- Email: `user@gm`
- Password: (sesuaikan)

## 🗄️ Database Schema

Database menggunakan schema yang sama dengan aplikasi PHP asli. Silakan gunakan:
```sql
u390486773_simtix.sql
```

### Tabel Utama:
- `admins` - Admin users
- `users` - Regular users
- `events` - Events
- `transactions` - Payment transactions
- `withdrawals` - Withdrawal requests
- `partnerships` - Partnership proposals

## 🛠️ Development Tips

### Debugging Backend
```bash
# Set NODE_ENV untuk development
set NODE_ENV=development
npm run dev
```

### Debugging Frontend
- Buka DevTools (F12)
- Lihat Network tab untuk API calls
- Lihat Console untuk errors

### Common Issues

**CORS Error:**
- Pastikan backend proxy sudah dikonfigurasi di `vite.config.js`

**Database Connection:**
- Pastikan Laragon MySQL sudah berjalan
- Verify `.env` file credentials
- Jalankan: `npm run check-db`

**Token Expired:**
- Clear localStorage dan login ulang

---

## ⚙️ Konfigurasi Laragon

### Database Settings (`.env`)
```env
# Default Laragon Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=u390486773_simtix
DB_PORT=3306

# Server
PORT=5000

# JWT
JWT_SECRET=your_secret_key

# Midtrans
MIDTRANS_SERVER_KEY=your_server_key
MIDTRANS_CLIENT_KEY=your_client_key
MIDTRANS_IS_PRODUCTION=false
```

### Fitur Database
✅ Auto-reconnect jika koneksi terputus
✅ Connection pooling optimal (10 connections)
✅ Error handling yang informatif
✅ Keep-alive untuk stabilitas
✅ Logging koneksi database

### Database Commands
```bash
# Cek status database
npm run check-db

# Setup/reset database
npm run setup-db

# Development mode (auto-reload)
npm run dev

# Production mode
npm start
```

---

## 📝 Dokumentasi Tambahan

- **[QUICK_START_LARAGON.md](QUICK_START_LARAGON.md)** - Quick reference
- **[CARA_MENJALANKAN_LARAGON.md](CARA_MENJALANKAN_LARAGON.md)** - Panduan lengkap setup
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - API endpoints
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Solusi masalah umum

---

## 🚀 Production Deployment

1. **Build frontend:**
```bash
npm run build
```

2. **Deploy to server** (Vercel, Netlify, atau custom server)

3. **Set environment variables** di production

4. **Update Midtrans credentials** untuk production mode

## 📞 Support & Troubleshooting

### Common Issues

1. **MySQL tidak dapat diakses**
   ```bash
   # Pastikan Laragon berjalan
   # Start Laragon → "Start All"
   npm run check-db
   ```

2. **Port 5000 sudah digunakan**
   ```bash
   # Stop semua Node process
   STOP_ALL.bat
   ```

3. **Database tidak ditemukan**
   ```bash
   npm run setup-db
   ```

4. **Module not found**
   ```bash
   npm install
   ```

### Quick Commands

```bash
# Start aplikasi (auto)
START_ALL.bat

# Stop aplikasi
STOP_ALL.bat

# Cek database
cd backend && npm run check-db

# Reset database
cd backend && npm run setup-db
```

---

## 📄 License

MIT

## 👤 Author

Tiket Pembaris Development Team

---

**Last Updated:** December 19, 2025
**Database:** Configured for Laragon MySQL
