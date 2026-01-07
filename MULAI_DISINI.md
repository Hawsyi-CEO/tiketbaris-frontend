# 🎯 PANDUAN SINGKAT - SIMTIX dengan Laragon

> **Panduan super cepat untuk mulai menggunakan aplikasi**

---

## 🚦 LANGKAH 1: Pastikan Laragon Berjalan

1. Buka aplikasi **Laragon**
2. Klik tombol **"Start All"**
3. Tunggu hingga **Apache** dan **MySQL** berwarna **HIJAU** ✅

---

## 💿 LANGKAH 2: Install Dependencies (PERTAMA KALI SAJA)

Buka PowerShell/CMD di folder project:

```bash
# Install backend
cd backend
npm install

# Install frontend
cd ../frontend
npm install
```

---

## 🗄️ LANGKAH 3: Setup Database (PERTAMA KALI SAJA)

```bash
cd backend
npm run setup-db
```

**Atau** double-click file: `backend\setup-laragon.bat`

---

## 🚀 LANGKAH 4: Jalankan Aplikasi

### ⭐ CARA TERMUDAH (Recommended)

**Double-click file ini:**
```
START_ALL.bat
```

Tunggu beberapa detik, browser akan terbuka otomatis!

---

### 💻 CARA MANUAL

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

---

## 🌐 BUKA DI BROWSER

- **Aplikasi:** http://localhost:5173
- **API:** http://localhost:5000

---

## ⛔ STOP APLIKASI

**Double-click file:**
```
STOP_ALL.bat
```

**Atau** tekan `Ctrl + C` di terminal backend dan frontend

---

## 🔧 COMMAND REFERENCE

| Command | Fungsi |
|---------|--------|
| `npm run check-db` | Cek status database |
| `npm run setup-db` | Setup/reset database |
| `npm start` | Jalankan server |
| `npm run dev` | Development mode (auto-reload) |

---

## ❓ ADA MASALAH?

### MySQL tidak bisa connect
```
1. Buka Laragon
2. Klik "Start All"
3. Tunggu MySQL hijau
4. Coba lagi
```

### Port 5000 sudah digunakan
```
Double-click: STOP_ALL.bat
Lalu jalankan ulang
```

### Database tidak ditemukan
```bash
cd backend
npm run setup-db
```

### Error lainnya
```bash
cd backend
npm run check-db
```
Lihat pesan error dan ikuti instruksinya.

---

## 📚 DOKUMENTASI LENGKAP

- **Quick Reference:** [QUICK_START_LARAGON.md](QUICK_START_LARAGON.md)
- **Panduan Lengkap:** [CARA_MENJALANKAN_LARAGON.md](CARA_MENJALANKAN_LARAGON.md)
- **Summary:** [LARAGON_CONFIGURATION_SUMMARY.md](LARAGON_CONFIGURATION_SUMMARY.md)

---

## ✅ CHECKLIST SEBELUM MULAI

- [ ] Laragon terinstall
- [ ] Node.js terinstall
- [ ] Dependencies sudah di-install (`npm install`)
- [ ] Database sudah di-setup (`npm run setup-db`)
- [ ] Laragon sudah running (MySQL hijau)

---

## 🎉 SELESAI!

Sekarang kamu bisa mulai development dengan tenang.

**Database akan selalu auto-reconnect jika ada masalah!**

---

**Butuh bantuan lebih lanjut?**
Baca dokumentasi lengkap di folder project.

**Happy Coding! 🚀**
