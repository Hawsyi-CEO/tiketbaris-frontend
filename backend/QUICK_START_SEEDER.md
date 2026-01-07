# 🚀 Quick Start Guide - Tiketbaris Backend with Seeder

## Untuk Teman Developer: Setup Project dalam 5 Menit

### Step 1: Clone Repository

```bash
git clone https://github.com/Hawsyi-CEO/tiketbaris-backend.git
cd tiketbaris-backend
```

### Step 2: Setup Database

**Windows (Laragon):**
1. Buka Laragon
2. Klik "Start All" atau Start MySQL + Node
3. Buka http://localhost/phpmyadmin
4. Create new database named `tiket`

**macOS/Linux:**
```bash
mysql -u root -p
mysql> CREATE DATABASE tiket CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Step 3: Configure Environment

```bash
# Create .env file (copy dari template atau buat baru)
cat > .env << EOF
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=tiket
DB_PORT=3306
NODE_ENV=development
JWT_SECRET=your-secret-key-for-jwt
MIDTRANS_SERVER_KEY=your-midtrans-key
MIDTRANS_CLIENT_KEY=your-midtrans-client-key
GOOGLE_CLIENT_ID=your-google-client-id
OPENAI_API_KEY=your-openai-key (optional)
OPENAI_DEFAULT_MODEL=gpt-5-mini
EOF
```

**Note:** 
- Database credentials default untuk Laragon: `root` (user), password kosong
- Untuk VPS/production: adjust credentials sesuai setup
- OpenAI keys optional untuk development

### Step 4: Install Dependencies

```bash
npm install
```

### Step 5: Seed Database (AUTO SETUP)

```bash
npm run seed
```

**Apa yang terjadi:**
✅ Clear database (hapus data lama)  
✅ Insert 6 sample users  
✅ Insert 5 sample events  
✅ Insert sample transactions & tickets  
✅ Display test credentials  

**Output:**
```
✅ === SEEDING COMPLETED SUCCESSFULLY ===

📊 Summary:
   Users: 6
   Events: 5
   Transactions & Tickets: Created

🔐 Test Credentials:
   Admin: admin@gmail.com / Admin@123456
   Panitia: panitia1@gmail.com / Panitia@123456
   User: user1@gmail.com / User@123456
```

### Step 6: Start Development Server

```bash
npm run dev
```

Server running di: `http://localhost:5020`

## Testing dengan Sample Credentials

### Login sebagai Admin

```bash
Email: admin@gmail.com
Password: Admin@123456
Role: Admin
```

**Akses:** Admin Dashboard dengan full features

### Login sebagai Panitia

```bash
Email: panitia1@gmail.com
Password: Panitia@123456
Role: Panitia (Event Organizer)
```

**Akses:** Create events, manage tickets, lihat statistics

### Login sebagai Customer/User

```bash
Email: user1@gmail.com
Password: User@123456
Role: User
```

**Akses:** Browse events, buy tickets, lihat profile

## Apa yang Sudah Ready?

### Database Setup

✅ All tables created (users, events, transactions, tickets)  
✅ Relationships & foreign keys configured  
✅ Indexes untuk performance  

### Sample Data

✅ 6 demo users (berbeda roles)  
✅ 5 realistic events dengan details  
✅ 20+ sample tickets dari transactions  
✅ Payment status: completed (settlement)  

### Backend Features

✅ Authentication (JWT)  
✅ Event management (CRUD)  
✅ Payment integration (Midtrans)  
✅ Ticket generation & QR codes  
✅ Admin dashboard  
✅ User roles & permissions  

## Common Commands

```bash
# Development
npm run dev                    # Start with auto-reload
npm run start                 # Start server (production mode)

# Database
npm run seed                  # Seed dengan sample data
npm run check-db              # Test database connection
npm run setup-laragon         # Complete setup untuk Laragon

# Testing
npm test                      # Run tests (if configured)
```

## Troubleshooting

### Error: "ECONNREFUSED"

**Penyebab:** MySQL tidak running  
**Solusi:**
- Windows (Laragon): Click "Start All"
- macOS: `brew services start mysql`
- Linux: `sudo systemctl start mysql`

### Error: "Database 'tiket' tidak ada"

**Penyebab:** Database belum dibuat  
**Solusi:**
```bash
# Buat database manual
mysql -u root -p -e "CREATE DATABASE tiket CHARACTER SET utf8mb4;"

# Atau gunakan command
npm run setup-laragon
```

### Error: "NODE_ENV hanya untuk development"

**Penyebab:** Jalankan di production environment  
**Solusi:** Set NODE_ENV=development

```bash
# macOS/Linux
NODE_ENV=development npm run seed

# Windows (PowerShell)
$env:NODE_ENV="development"; npm run seed
```

### Error: "Access denied for user"

**Penyebab:** DB credentials tidak sesuai di .env  
**Solusi:**
1. Check .env file: `cat .env | grep DB_`
2. Verify credentials dengan: `npm run check-db`
3. Update .env dengan correct credentials

### Seeder berhenti di tengah jalan

**Penyebab:** Database error atau constraint  
**Solusi:**
```bash
# Clear semua tables manual
mysql -u root -p tiket < /dev/null

# Run seeder lagi
npm run seed
```

## Frontend Development

Frontend sudah di-setup dengan:
- ✅ Responsive design (mobile/tablet/desktop)
- ✅ Admin dashboard
- ✅ Event creation workflow
- ✅ Payment integration UI
- ✅ Ticket QR code display

Lihat: `../frontend/` directory

## Production Deployment

Untuk deploy ke production:
1. Set `NODE_ENV=production`
2. Configure production database
3. Set all required API keys (.env)
4. Use PM2 untuk process management
5. Setup SSL/HTTPS

Lihat: `PRODUCTION_DEPLOYMENT_GUIDE.md` (jika ada)

## API Documentation

Lengkap API docs available di: `/docs` atau check routes folder

Quick reference:
```bash
# Events
GET    /api/events              # Semua events
POST   /api/events              # Create event (panitia)
GET    /api/events/:id          # Detail event
PUT    /api/events/:id          # Update event (panitia)
DELETE /api/events/:id          # Delete event (panitia)

# Auth
POST   /api/auth/register       # Register user baru
POST   /api/auth/login          # Login & get JWT token
POST   /api/auth/logout         # Logout

# Checkout
POST   /api/checkout            # Create checkout/transaction
GET    /api/checkout/:id        # Get transaction detail

# Admin (protected)
GET    /api/admin/profile       # Admin profile
GET    /api/admin/events        # Semua events (admin view)
GET    /api/admin/users         # Semua users
DELETE /api/admin/user/:id      # Delete user
```

## Need Help?

1. **Check logs:**
   ```bash
   # Backend logs
   npm run dev
   
   # Database logs
   tail -f logs/database.log
   ```

2. **Test endpoint:**
   ```bash
   curl http://localhost:5020/api/events
   ```

3. **Reset everything:**
   ```bash
   npm run seed
   npm run dev
   ```

## Next Steps

1. ✅ Explore sample data di database
2. ✅ Test login dengan demo credentials
3. ✅ Create new event sebagai panitia
4. ✅ Buy ticket sebagai user
5. ✅ Check admin dashboard
6. ✅ Develop your features!

Happy coding! 🎉
