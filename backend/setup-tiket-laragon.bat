@echo off
echo ========================================
echo    SETUP DATABASE TIKET UNTUK LARAGON
echo ========================================
echo.

echo 📋 Memulai setup database...
echo.

:: Check if Laragon is running
echo 🔍 Mengecek Laragon...
tasklist /FI "IMAGENAME eq laragon.exe" 2>NUL | find /I /N "laragon.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo ✅ Laragon terdeteksi berjalan
) else (
    echo ❌ Laragon tidak terdeteksi!
    echo 💡 Silakan jalankan Laragon terlebih dahulu
    echo    - Buka Laragon
    echo    - Klik "Start All"
    echo    - Tunggu sampai semua service hijau
    pause
    exit /b 1
)

echo.
echo 📦 Menginstall dependencies...
call npm install

echo.
echo 🗄️ Membuat dan setup database "tiket"...
node setup-laragon-tiket.js

if errorlevel 1 (
    echo.
    echo ❌ Setup database gagal!
    echo 💡 Pastikan:
    echo    - Laragon sudah running dengan benar
    echo    - MySQL service aktif di Laragon
    echo    - Tidak ada error di console Laragon
    pause
    exit /b 1
)

echo.
echo ========================================
echo    🎉 SETUP BERHASIL!
echo ========================================
echo.
echo 📊 Database "tiket" sudah siap digunakan
echo.
echo 🚀 Untuk menjalankan server:
echo    npm start
echo.
echo 🌐 Untuk mengakses aplikasi:
echo    http://localhost:5000 (backend)
echo    http://localhost:3000 (frontend)
echo.
echo ⚙️  Untuk mengelola database:
echo    - Buka phpMyAdmin di Laragon
echo    - Pilih database "tiket"
echo.
pause