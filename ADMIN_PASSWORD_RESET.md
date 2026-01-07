# 🔐 Admin Password Reset - Complete Guide

## 📌 Admin Credentials

Dari database yang kami temukan:

```
Email: admin@gmail.com
Username: Admin_Nobunaga
Password Hash: $2y$10$SMMW/evZ/h0tm20/lG./4uapS89Df9usS8SxvDplO/JfDEBln3QdO
```

**Password ini sudah di-hash dan tidak bisa di-reverse!**

---

## 3 Cara Reset Password Admin

### ✅ Cara 1: Gunakan Node Script (Recommended)

**Prasyarat:**
- Backend sudah di-setup (npm install selesai)
- MySQL server HARUS running

**Langkah:**

```powershell
# 1. Pastikan MySQL running (cek di Services atau Task Manager)

# 2. Buka PowerShell di backend folder
cd "e:\Documents\Obi\tiket pembaris\file js\backend"

# 3. Jalankan reset script
node reset-admin-password.js

# Atau dengan password custom:
node reset-admin-password.js "MyNewPassword123"
```

**Output yang diharapkan:**
```
✅ SUCCESS! Password updated successfully

📝 Login Credentials:
  Email: admin@gmail.com
  Password: admin123

🌐 Login URL: http://localhost:3001/login
```

---

### ✅ Cara 2: Database Management GUI

Jika punya **phpMyAdmin** atau **MySQL Workbench**:

1. **Login ke database:**
   - Host: localhost
   - User: u390486773_simtix
   - Password: Tiketbaris123#
   - Database: u390486773_simtix

2. **Buka tabel `admins`**

3. **Edit row dengan email `admin@gmail.com`**

4. **Update field `password` dengan hash ini:**
   ```
   $2a$10$UD2m4O2CHjhqBrxFCOdzBOwzKlPr.4qVRXNnvF8M.YN6CKdM7.0t.
   ```
   **(Password: admin123)**

5. **Save/Update**

---

### ✅ Cara 3: Command Line MySQL (Jika MySQL CLI Available)

```powershell
mysql -u u390486773_simtix -pTiketbaris123# u390486773_simtix -e "UPDATE admins SET password='$2a$10$UD2m4O2CHjhqBrxFCOdzBOwzKlPr.4qVRXNnvF8M.YN6CKdM7.0t.' WHERE email='admin@gmail.com';"
```

---

## Password Hash Reference

Berikut beberapa password yang sudah di-hash (bcryptjs):

| Password | Hash |
|----------|------|
| **admin123** | $2a$10$UD2m4O2CHjhqBrxFCOdzBOwzKlPr.4qVRXNnvF8M.YN6CKdM7.0t. |
| **pantia123** | $2a$10$56dLVuINZH5Ju9OQ3h3E3uKtXknbT4JL.V3GdkiZZ6rGBVp0VjKM2 |
| **user123** | $2a$10$56dLVuINZH5Ju9OQ3h3E3uKtXknbT4JL.V3GdkiZZ6rGBVp0VjKM2 |

---

## Setelah Reset Berhasil

### Login Admin

1. **Buka http://localhost:3001/login**
   - Jika port berbeda, sesuaikan (bisa :3001 dll)

2. **Masukkan:**
   - Email: `admin@gmail.com`
   - Password: `admin123` (atau password custom Anda)

3. **Klik "Login"**

4. **Akan redirect ke Admin Dashboard**

---

## Admin Dashboard - Apa Saja yang Bisa Dilakukan?

Setelah login, Anda adalah **admin** dan bisa:

### 📋 Pending Events
- Lihat event yang menunggu approval
- ✅ **Approve** → Event menjadi active
- ❌ **Decline** → Event dibatalkan
- Lihat info lengkap event (judul, lokasi, harga, deskripsi)

### 📊 All Transactions
- Lihat SEMUA transaksi dari semua user
- Cek status pembayaran (pending/completed/cancelled)
- Lihat user, event, dan nominal pembayaran

### 👥 User Management
- Lihat list semua user terdaftar
- Lihat user details (email, username, role)
- Lihat kapan user mendaftar

### 🤝 Partnerships
- Review pengajuan kerjasama dari user
- Accept atau reject partnership requests

### 💰 Withdrawals
- Lihat withdrawal requests dari panitia
- ✅ **Approve** → Transfer uang ke panitia
- ❌ **Reject** → Tolak request

---

## Test Login Dengan Berbagai Role

Setelah reset, Anda bisa test dengan account lain:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@gmail.com | admin123 |
| **Panitia** | pantia@gm | pantia123 |
| **User** | user@gm | user123 |

Atau **register user baru** di halaman register.

---

## Troubleshooting Reset

### ❌ Error: "connect ECONNREFUSED"
```
Artinya: MySQL server tidak running!

Solusi:
1. Cek Services di Windows
2. Atau buka MySQL Workbench
3. Atau cek XAMPP/WAMP apakah MySQL aktif
```

### ❌ Error: "Admin user not found"
```
Artinya: Database tidak ada atau admin row dihapus

Solusi:
1. Import/restore database: u390486773_simtix.sql
2. Atau create admin manual di database
```

### ❌ Error: "Cannot find module 'bcryptjs'"
```
Solusi:
cd backend
npm install bcryptjs
```

---

## Manual Create Admin (Jika Tabel Kosong)

Jika tabel `admins` kosong atau admin tidak ada:

### Via SQL:
```sql
INSERT INTO admins (username, email, password, profile_picture, created_at) 
VALUES (
  'Admin_Nobunaga',
  'admin@gmail.com',
  '$2a$10$UD2m4O2CHjhqBrxFCOdzBOwzKlPr.4qVRXNnvF8M.YN6CKdM7.0t.',
  'default.png',
  NOW()
);
```

---

## Security Best Practices

🔒 **IMPORTANT:**

1. ✅ **Ubah password default** setelah first login
2. ✅ **Gunakan password yang KUAT:**
   - Min 12 karakter
   - Kombinasi: A-Z, a-z, 0-9, symbols (!@#$%^&*)
   - Contoh: `Adm!n@Tiket2025#Secure`

3. ✅ **Jangan share** admin credentials

4. ✅ **Log out** saat selesai kerja

5. ✅ **Update password** setiap 3 bulan

---

## Generate Hash untuk Password Custom

Jika ingin set password custom, gunakan tools ini:

### Online (Risky - jangan gunakan untuk production):
https://bcrypt-generator.com/

### Via Node.js Script:
```powershell
# Buat file temporary: hash-password.js
$code = @'
const bcrypt = require("bcryptjs");
const password = process.argv[2];
bcrypt.hash(password, 10, (err, hash) => {
  console.log("Hash:", hash);
});
'@

$code | Out-File hash-password.js

# Jalankan:
node hash-password.js "MyPassword123"

# Output contoh:
# Hash: $2a$10$UD2m4O2CHjhqBrxFCOdzBOwzKlPr.4qVRXNnvF8M.YN6CKdM7.0t.
```

---

## Quick Reference

```powershell
# Reset password ke default (admin123)
node reset-admin-password.js

# Reset password ke custom password
node reset-admin-password.js "MyNewPassword123"

# Test login
# URL: http://localhost:3001/login
# Email: admin@gmail.com
# Password: (sesuai yang di-set)
```

---

## Files Related to Admin

- **backend/reset-admin-password.js** - Script untuk reset
- **backend/reset-admin-password.sql** - SQL untuk reset
- **backend/routes/admin.js** - Admin routes
- **frontend/src/pages/admin/DashboardAdmin.jsx** - Admin dashboard page
- **ADMIN_LOGIN.md** - Dokumentasi ini

---

## Contact & Support

Jika masalah:

1. **Cek error message** - Copy paste ke chat
2. **Cek TROUBLESHOOTING.md** - Mungkin sudah ada solusinya
3. **Run quickstart.js** - Interactive setup helper

---

**Last Updated:** December 11, 2025

**Status:** ✅ Ready to use
