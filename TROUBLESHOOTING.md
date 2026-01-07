# 🔧 TROUBLESHOOTING GUIDE

## Error: Cannot find module 'express'

### Penyebab
Dependencies belum ter-install dengan benar.

### Solusi
```powershell
cd backend
npm install --legacy-peer-deps
```

---

## Error: No matching version found for jsonwebtoken@^9.1.0

### Penyebab
Versi package tidak tersedia di npm registry.

### Solusi yang Sudah Diterapkan ✅
Package.json sudah diperbaharui dengan versi:
- `jsonwebtoken`: ^9.0.0
- `midtrans-client`: ^1.3.0

Jika masih error, jalankan:
```powershell
cd backend
rm -r node_modules
rm package-lock.json
npm install --legacy-peer-deps
```

---

## Warning: keepAliveInitialDelayMs is invalid

### Penyebab
Database config pakai parameter yang tidak didukung mysql2.

### Solusi yang Sudah Diterapkan ✅
Parameter `keepAliveInitialDelayMs` sudah dihapus dari `config/database.js`.

---

## Port 3000 sudah dipakai

### Solusi
Frontend otomatis pakai port 3001.

Jika ingin pakai 3000, harus stop aplikasi lain yang pakai port itu:

**Windows:**
```powershell
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
lsof -i :3000
kill -9 <PID>
```

---

## Port 5000 sudah dipakai

### Solusi
Ubah PORT di backend/.env:

```env
PORT=5001
```

Atau stop aplikasi lain:
```powershell
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

---

## Error: Database connection failed

### Penyebab
MySQL server belum running atau kredensial salah.

### Solusi

#### 1. Cek MySQL Server running
```powershell
# Windows - Cek service
Get-Service | findstr -i mysql

# Start MySQL jika belum
net start MySQL80
```

#### 2. Verifikasi Kredensial di .env
```env
DB_HOST=localhost
DB_USER=u390486773_simtix
DB_PASSWORD=Tiketbaris123#
DB_NAME=u390486773_simtix
DB_PORT=3306
```

#### 3. Test koneksi
```powershell
mysql -u u390486773_simtix -p
```

Masukkan password: `Tiketbaris123#`

Jika berhasil, exit dengan `exit`

#### 4. Restore database jika belum ada
```powershell
mysql -u u390486773_simtix -p u390486773_simtix < u390486773_simtix.sql
```

---

## Error: ENOENT (file not found)

### Penyebab
Folder uploads tidak ada.

### Solusi
```powershell
# Di backend folder
mkdir uploads
```

---

## Frontend tidak bisa akses backend API

### Penyebab
- Backend belum running
- API proxy tidak bekerja
- CORS error

### Solusi

#### 1. Pastikan backend running di port 5000
```powershell
cd backend
npm start
```

#### 2. Cek vite.config.js proxy setting
```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true
    }
  }
}
```

#### 3. Cek browser console
- Buka DevTools (F12)
- Lihat Network tab untuk request ke API
- Cek error message di Console tab

---

## Error: CORS origin not allowed

### Solusi
Backend sudah auto-allow semua CORS di server.js:

```javascript
app.use(cors()); // Allow all origins
```

Jika masih error, modifikasi server.js:

```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
```

---

## Login Error: Invalid email or password

### Penyebab
1. User belum terdaftar
2. Password salah
3. Database tidak punya tabel users

### Solusi

#### 1. Pastikan database sudah restore
```powershell
mysql -u u390486773_simtix -p u390486773_simtix < u390486773_simtix.sql
```

#### 2. Daftar user baru
- Klik "Register"
- Isi form dengan data baru
- Pilih role: user/panitia
- Klik Register

#### 3. Jika masih error, cek database
```powershell
mysql -u u390486773_simtix -p u390486773_simtix
SELECT * FROM users;
```

---

## Upload Gambar Error: File too large

### Penyebab
File lebih dari 5MB.

### Solusi
Ubah limit di routes/events.js:

```javascript
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});
```

---

## Midtrans Payment Error

### Penyebab
- Credentials salah
- Server key atau client key invalid

### Solusi
1. Cek .env file punya credentials yang benar
2. Update di https://dashboard.midtrans.com
3. Pastikan IS_PRODUCTION = false untuk testing

Test Credit Card:
- Number: 4811 1111 1111 1114
- CVV: 123
- Exp: 12/25
- OTP: 123456

---

## npm start tidak berjalan (Windows)

### Penyebab
Script tidak dikenali oleh PowerShell.

### Solusi
Gunakan:
```powershell
npm run dev    # dengan nodemon (auto-reload)
```

Atau:
```powershell
node server.js # langsung
```

---

## Terminal freeze atau tidak responsif

### Solusi
1. Buka terminal baru
2. Ctrl + C di terminal yang freeze
3. Run command lagi

---

## Dependencies conflict

### Solusi Universal
```powershell
cd backend
rm -r node_modules
rm package-lock.json
npm cache clean --force
npm install --legacy-peer-deps
```

---

## Lupa Password atau Token Expired

### Solusi untuk Password
1. Login lagi / Register ulang
2. Atau reset langsung dari database:

```powershell
mysql -u u390486773_simtix -p u390486773_simtix

# Update password (hash dengan bcryptjs dari tools online)
UPDATE users SET password_hash='$2a$10$...' WHERE email='user@test.com';
```

### Solusi untuk Token
Token JWT auto expire setelah 24 jam (bisa ubah di auth.js).

Jika error 401 Unauthorized:
1. Login ulang
2. Clear localStorage di DevTools

---

## Membuka file dengan special character @ #

### Tips
Gunakan quote saat cd:
```powershell
cd "e:\Documents\Obi\tiket pembaris\file js\backend"
```

---

## Performance Issue - Server Lambat

### Solusi
1. Pastikan MySQL tidak hang:
   ```powershell
   mysql -u u390486773_simtix -p u390486773_simtix
   SHOW PROCESSLIST;
   ```

2. Check database indexes exist

3. Restart Node:
   ```powershell
   npm run dev
   ```

---

## Environment Variable tidak terbaca

### Penyebab
.env file tidak ditemukan atau dotenv belum loaded.

### Solusi
1. Pastikan .env ada di root backend folder
2. Pastikan `require('dotenv').config()` di line pertama server.js
3. Restart server

---

## Checklist Debugging

### Setup Phase ✅
- [ ] Node.js installed (cek: `node -v`)
- [ ] npm installed (cek: `npm -v`)
- [ ] MySQL running (cek: `mysql -u root`)
- [ ] Database restored
- [ ] .env file created dengan credentials

### Runtime Phase ✅
- [ ] Backend running di :5000
- [ ] Frontend running di :3000 atau :3001
- [ ] DevTools console show no errors
- [ ] Network tab show API calls 200 OK
- [ ] localStorage ada token saat login

### Testing Phase ✅
- [ ] Bisa register user baru
- [ ] Bisa login dengan user baru
- [ ] Dashboard load dengan benar
- [ ] Bisa view events
- [ ] Bisa checkout

---

## Kontak Support

Jika masalah masih belum teratasi:

1. **Cek error message** - screenshot error atau copy paste error text
2. **Cek terminal output** - lihat apa yang di-print saat error
3. **Check browser console** - DevTools F12 → Console tab
4. **Check Network tab** - DevTools → Network → lihat failed requests

---

**Last Updated:** December 11, 2025

**Tips:** Cek file ini sebelum mengajukan pertanyaan! 📖
