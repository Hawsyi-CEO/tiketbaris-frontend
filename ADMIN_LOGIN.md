# 👨‍💼 Admin Login & Credential

## Current Admin Account

| Field | Value |
|-------|-------|
| **Email** | admin@gmail.com |
| **Username** | Admin_Nobunaga |
| **Password Hash** | $2y$10$SMMW/evZ/h0tm20/lG./4uapS89Df9usS8SxvDplO/JfDEBln3QdO |
| **Role** | admin |

## ⚠️ Password Saat Ini

Password saat ini **sudah di-hash** dengan bcryptjs. Untuk mengetahui plain text password, ada beberapa cara:

### Cara 1: Reset Password ke Password Baru (RECOMMENDED)

Saya sudah membuat script untuk reset password admin dengan mudah:

#### Windows:
```powershell
cd "e:\Documents\Obi\tiket pembaris\file js\backend"
node reset-admin-password.js
```

Atau untuk password spesifik:
```powershell
node reset-admin-password.js admin123
```

#### Linux/Mac:
```bash
cd file\ js/backend
node reset-admin-password.js
```

**Default password baru:** `admin123`

### Cara 2: Reset Langsung via Database

Gunakan file SQL yang sudah disediakan:

```bash
mysql -u u390486773_simtix -p u390486773_simtix < reset-admin-password.sql
```

**Password baru:** `admin123`

---

## Test Login Admin

1. Buka http://localhost:3001/login
2. Email: `admin@gmail.com`
3. Password: `admin123` (setelah reset)
4. Klik "Login"
5. Akan redirect ke Admin Dashboard

---

## Test Accounts (Semua Password)

| Role | Email | Password | Function |
|------|-------|----------|----------|
| **Admin** | admin@gmail.com | `admin123` | Approve events, manage users |
| **Panitia** | pantia@gm | `pantia123` | Create events, withdraw money |
| **User** | user@gm | `user123` | Browse events, buy tickets |

---

## Jika Lupa Password Admin

### Opsi 1: Reset via Script (Recommended)
```powershell
cd backend
node reset-admin-password.js
```

### Opsi 2: Reset via SQL File
```bash
mysql -u u390486773_simtix -p u390486773_simtix < reset-admin-password.sql
```

### Opsi 3: Reset Manual di Database
Buka MySQL client dan jalankan:

```sql
-- Password baru: admin123
UPDATE admins SET password = '$2a$10$UD2m4O2CHjhqBrxFCOdzBOwzKlPr.4qVRXNnvF8M.YN6CKdM7.0t.' WHERE email = 'admin@gmail.com';
```

---

## File Helper yang Tersedia

1. **reset-admin-password.js** - Script untuk reset password
2. **reset-admin-password.sql** - SQL file untuk reset password

Kedua file ini **OTOMATIS DIBUAT** saat Anda menjalankan setup.

---

## ⚡ Quick Start Login Admin

1. **Reset password** (jika belum tahu):
   ```powershell
   cd "e:\Documents\Obi\tiket pembaris\file js\backend"
   node reset-admin-password.js
   ```

2. **Login ke http://localhost:3001/login**
   - Email: `admin@gmail.com`
   - Password: `admin123`

3. **Akses Admin Dashboard** di `/admin/dashboard`

---

## Admin Dashboard Features

Setelah login, Anda bisa:

✅ **Approve/Decline Events** - Review event dari panitia  
✅ **View All Transactions** - Lihat semua transaksi pembayaran  
✅ **Manage Users** - Lihat daftar user terdaftar  
✅ **Manage Partnerships** - Review permintaan kerjasama  
✅ **Approve Withdrawals** - Setujui request penarikan saldo panitia  

---

## Password Policy Recommendations

Untuk production, gunakan password yang lebih kuat:

1. Minimal 12 karakter
2. Kombinasi: uppercase + lowercase + numbers + symbols
3. Contoh: `Adm1n@Tiket2025#Secure`

Reset dengan:
```powershell
node reset-admin-password.js "Adm1n@Tiket2025#Secure"
```

---

## Troubleshooting

### Error: "Cannot find module 'bcryptjs'"
```powershell
cd backend
npm install bcryptjs
```

### Reset script tidak jalan
Pastikan Anda di folder `backend`:
```powershell
cd "e:\Documents\Obi\tiket pembaris\file js\backend"
node reset-admin-password.js
```

### Still can't login?
1. Database connection OK? → Cek `.env` file
2. Password sudah di-hash? → Run reset script
3. Email benar? → Cek tabel `admins` di database

---

## Additional Admin Info

**Admin Table Structure:**
```
admins
├── id (Primary Key)
├── username (Admin username)
├── email (Login email)
├── password (Hashed password)
├── profile_picture (Avatar image)
└── created_at (Timestamp)
```

**Admin dari Database:**
```
ID: 2
Username: Admin_Nobunaga
Email: admin@gmail.com
Created: 2025-08-11 12:37:16
```

---

## Security Tips

🔒 **ALWAYS:**
- ✅ Ubah password default setelah first login
- ✅ Gunakan password yang kuat
- ✅ Don't share admin credentials
- ✅ Log out saat selesai
- ✅ Update password secara berkala (3 bulan sekali)

---

**Last Updated:** December 11, 2025

**Need help?** Lihat TROUBLESHOOTING.md atau jalankan `node quickstart.js`
