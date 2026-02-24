# FIX: User Login Google Malah Masuk ke Akun Panitia

## Root Cause
User **accidentally memilih role "Panitia"** saat pertama kali register dengan Google OAuth. Role tersebut tersimpan permanen di database, sehingga setiap login berikutnya selalu masuk sebagai Panitia.

## Kenapa Ini Bisa Terjadi?

### Flow Google OAuth:
1. User klik "Login dengan Google"
2. Jika email belum terdaftar → **Muncul modal pilih role** (User atau Panitia)
3. User pilih role (mungkin tidak sengaja klik Panitia karena tidak jelas)
4. Account dibuat dengan role tersebut
5. Role tersimpan **PERMANEN** di database
6. Login berikutnya selalu masuk sebagai role tersebut

### Penyebab User Salah Pilih:
- User tidak paham perbedaan User vs Panitia
- UI kurang jelas (sudah diperbaiki dengan warning)
- User klik terlalu cepat tanpa baca

---

## Solusi yang Sudah Diterapkan

### 1. ✅ Tambah Warning di Modal Role Selection
**File:** `frontend/src/components/RoleSelectionModal.jsx`

Sekarang ada warning merah untuk role Panitia:
```
⚠️ Pilih ini HANYA jika Anda ingin membuat event
```

### 2. ✅ Tambah Logging di Backend
**File:** `backend/routes/auth.js`

Sekarang backend log setiap user baru register dengan Google OAuth, termasuk role yang dipilih:
```javascript
console.log(`[GOOGLE AUTH] New user registering with role: ${selectedRole}`, {
  email: email,
  requestedRole: role,
  finalRole: selectedRole
});
```

Bisa dicek di PM2 logs:
```bash
pm2 logs tiketbaris-backend | grep "GOOGLE AUTH"
```

### 3. ✅ Default Role Tetap "User"
Modal sudah default select "User", jadi user harus **sengaja** klik Panitia untuk memilihnya.

---

## Cara Fix User yang Sudah Salah Role

### Opsi 1: Via phpMyAdmin / MySQL Client

1. **Cek user mana yang salah role:**
```sql
SELECT 
    id, 
    username, 
    email, 
    role, 
    created_at
FROM users 
WHERE google_id IS NOT NULL 
  AND role = 'panitia'
ORDER BY created_at DESC;
```

2. **Ubah role user yang salah:**
```sql
-- Ganti 'email@user.com' dengan email user yang salah
UPDATE users 
SET role = 'user' 
WHERE email = 'email@user.com' 
  AND google_id IS NOT NULL;
```

3. **User harus LOGOUT dan LOGIN LAGI** untuk melihat perubahan

### Opsi 2: Via Backend Script (Coming Soon)

Buat endpoint admin untuk mengubah role user:
```
POST /api/admin/users/:userId/change-role
Body: { "role": "user" }
```

---

## Cara Mencegah di Masa Depan

### 1. ✅ Warning Sudah Ditambahkan
Modal role selection sekarang ada warning jelas:
- User: "Beli tiket event favorit Anda" (default)
- Panitia: "⚠️ Pilih ini HANYA jika Anda ingin membuat event"

### 2. ✅ Logging Sudah Aktif
Setiap registrasi baru dengan Google OAuth akan tercatat di logs, termasuk role yang dipilih.

### 3. 📝 Rekomendasi Tambahan:

**A. Konfirmasi Dialog untuk Role Panitia**
Tambahkan konfirmasi dialog saat user pilih Panitia:
```
"Anda yakin ingin mendaftar sebagai Penyelenggara Event? 
Pilih 'User' jika Anda hanya ingin membeli tiket."
[Batal] [Ya, Saya Penyelenggara]
```

**B. Fitur Ganti Role Sendiri**
Buat halaman User Settings di mana user bisa switch role dari Panitia → User (satu arah, tidak bisa balik).

**C. Email Konfirmasi**
Kirim email ke user baru dengan role Panitia:
```
"Anda terdaftar sebagai Penyelenggara Event. 
Jika ini salah, klik di sini untuk mengubah ke User."
```

---

## File-File yang Diubah

### Frontend:
- ✅ `frontend/src/components/RoleSelectionModal.jsx` - Tambah warning

### Backend:
- ✅ `backend/routes/auth.js` - Tambah logging
- ✅ `backend/server.js` - Fix COOP header untuk Google OAuth

### Scripts:
- ✅ `backend/scripts/fix-wrong-google-oauth-roles.sql` - SQL untuk fix user

---

## Testing Checklist

- [ ] Test Google OAuth login untuk user existing
- [ ] Test Google OAuth register baru (pilih User)
- [ ] Test Google OAuth register baru (pilih Panitia - cek warning muncul)
- [ ] Cek PM2 logs untuk verify logging
- [ ] Test fix SQL script di database staging
- [ ] Verify user bisa logout dan login lagi setelah role diubah

---

## Contact Support

Jika ada user yang komplain salah role:
1. Cek email user di database
2. Jalankan SQL fix script
3. Minta user logout dan login lagi
4. Verify role sudah benar di dashboard

**Deploy Date:** 26 Januari 2026  
**Status:** ✅ DEPLOYED  
**Files Updated:** RoleSelectionModal.jsx, auth.js, server.js
