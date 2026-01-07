# Database Seeder - Tiketbaris Backend

## Deskripsi

Seeder untuk populate database dengan sample data development. Memudahkan development team untuk quickly setup project dengan data testing yang sudah siap.

## Features

✅ **Environment Protected** - Hanya bisa jalankan di development environment  
✅ **Clean Start** - Otomatis clear data lama sebelum seed  
✅ **Complete Data** - Users, Events, Transactions, Tickets  
✅ **Realistic Data** - Sample data yang realistis untuk testing  
✅ **Colored Logs** - Output yang clear dengan warna-warni  
✅ **Error Handling** - Detailed error messages untuk debugging  

## Prerequisites

```bash
# Pastikan MySQL running
# Pastikan .env sudah configured dengan DB credentials
# Node.js 14+ installed
# Dependencies installed (npm install)
```

## Installation

Seeder sudah included di project. Tidak perlu install tambahan.

## Usage

### 1. Basic Seed (Recommended)

```bash
# Clear old data dan insert sample data baru
npm run seed
```

**Proses:**
- ✅ Connect ke database
- ✅ Clear tables (users, events, transactions, tickets)
- ✅ Insert 6 users (admin + panitia + customers)
- ✅ Insert 5 sample events
- ✅ Insert sample transactions & tickets
- ✅ Display test credentials

### 2. Reset and Seed

```bash
# Sama seperti basic seed, untuk clarity
npm run seed:reset
```

## Sample Data Generated

### Users (6 total)

| Username | Email | Password | Role | Status |
|----------|-------|----------|------|--------|
| admin | admin@gmail.com | Admin@123456 | admin | verified |
| panitia_1 | panitia1@gmail.com | Panitia@123456 | panitia | verified |
| panitia_2 | panitia2@gmail.com | Panitia@123456 | panitia | verified |
| user_1 | user1@gmail.com | User@123456 | user | verified |
| user_2 | user2@gmail.com | User@123456 | user | verified |
| user_3 | user3@gmail.com | User@123456 | user | verified |

**Semua password sudah di-hash dengan bcrypt (salt rounds: 12)**

### Events (5 total)

1. **Konser Musik 2025** - Rp 250.000 (Capacity: 5000)
2. **Workshop Web Development** - Rp 150.000 (Capacity: 200)
3. **Seminar Startup Indonesia** - Rp 100.000 (Capacity: 1000)
4. **Festival Seni Rupa 2025** - Rp 75.000 (Capacity: 3000)
5. **Turnamen E-Sports 2025** - Rp 50.000 (Capacity: 500)

**Semua events status: published, is_hidden: 0**

### Transactions & Tickets

- Per event: 2 sample transactions
- Per transaction: 2 tickets
- Total tickets: ~20 tickets

## Output Example

```
ℹ️  === TIKETBARIS DATABASE SEEDER ===
ℹ️  Environment: development
ℹ️  Database: tiket

ℹ️  Membersihkan data lama...
✅ Tabel users berhasil dibersihkan
✅ Tabel events berhasil dibersihkan
✅ Tabel transactions berhasil dibersihkan
✅ Tabel tickets berhasil dibersihkan

ℹ️  Seeding users...
✅ User admin (admin@gmail.com) created
✅ User panitia_1 (panitia1@gmail.com) created
✅ User panitia_2 (panitia2@gmail.com) created
✅ User user_1 (user1@gmail.com) created
✅ User user_2 (user2@gmail.com) created
✅ User user_3 (user3@gmail.com) created

ℹ️  Seeding events...
✅ Event "Konser Musik 2025" created
✅ Event "Workshop Web Development" created
✅ Event "Seminar Startup Indonesia" created
✅ Event "Festival Seni Rupa 2025" created
✅ Event "Turnamen E-Sports 2025" created

ℹ️  Seeding tickets...
✅ Transaction SEED-... dengan 2 tickets created

ℹ️  === SEEDING COMPLETED SUCCESSFULLY ===

📊 Summary:
   Users: 6
   Events: 5
   Transactions & Tickets: Created

🔐 Test Credentials:
   Admin: admin@gmail.com / Admin@123456
   Panitia: panitia1@gmail.com / Panitia@123456
   User: user1@gmail.com / User@123456
```

## Workflow untuk Team Development

### First Time Setup

```bash
# 1. Clone repository
git clone https://github.com/Hawsyi-CEO/tiketbaris-backend.git
cd tiketbaris-backend

# 2. Install dependencies
npm install

# 3. Setup .env file
# Copy .env.example ke .env dan configure DB credentials
cp .env.example .env
# Edit .env dengan:
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=your_password
# DB_NAME=tiket
# NODE_ENV=development

# 4. Seed database
npm run seed

# 5. Start development server
npm run dev
```

### Reset Database

Saat ingin clear dan reseed:

```bash
npm run seed
```

Data lama otomatis dihapus dan diganti dengan fresh sample data.

## Customization

### Modify Sample Data

Edit `scripts/seed.js` di bagian `sampleData` object:

```javascript
const sampleData = {
  users: [
    // Add/modify users di sini
  ],
  events: (panitiaIds) => [
    // Add/modify events di sini
  ],
};
```

### Add More Events

```javascript
events: (panitiaIds) => [
  // ... existing events
  {
    title: 'New Event',
    description: 'Event description',
    price: 100000,
    capacity: 500,
    stock: 500,
    // ... other fields
  },
],
```

### Change Password Requirements

Update di seeder untuk match dengan validation logic:
- Min 8 characters
- 1 uppercase letter
- 1 lowercase letter
- 1 number
- 1 special character

## Environment Variables Required

```bash
# .env file
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=tiket
DB_PORT=3306
```

## Troubleshooting

### Error: "Seeding hanya diperbolehkan di environment DEVELOPMENT"

**Solusi:** Set NODE_ENV=development

```bash
# Manual
NODE_ENV=development node scripts/seed.js

# Atau gunakan npm script (sudah include NODE_ENV)
npm run seed
```

### Error: "Database connection failed"

**Solusi:** Check:
1. MySQL running
2. .env credentials correct
3. Database `tiket` exists

```bash
# Test connection
npm run check-db
```

### Error: "Tabel tidak ditemukan"

**Solusi:** Setup database schema dulu

```bash
npm run setup-laragon
```

### Error: "Password tidak memenuhi kriteria"

**Solusi:** Gunakan password yang memenuhi kriteria (sudah ada di seeder)

## Performance

- **Execution time**: ~2-5 detik
- **Database size**: Minimal (~500KB dengan sample data)
- **Safe to run**: Bisa dijalankan berkali-kali

## Maintenance

### Reset ke fresh state

```bash
npm run seed
```

### Backup before seeding

Data apapun di DB akan di-clear. Backup dulu jika ada data penting.

### Add more sample data

Edit `scripts/seed.js` dan run ulang `npm run seed`.

## Future Enhancements

- [ ] Seed user preferences/settings
- [ ] Seed reviews/ratings untuk events
- [ ] Seed withdrawals untuk panitia
- [ ] Seed sessions untuk user logins
- [ ] Add faker.js untuk generate realistic data
- [ ] Add --clear-only flag untuk clear tanpa seed
- [ ] Add --seed-only flag untuk seed existing data

## Support

Jika ada issue dengan seeder:
1. Check console output untuk error messages
2. Verify .env configuration
3. Ensure MySQL running dan database exists
4. Clear node_modules dan reinstall: `rm -rf node_modules && npm install`

## Created By

Seeder dibuat untuk memudahkan team development Tiketbaris.
Maintained dan updated untuk match dengan production database schema.
