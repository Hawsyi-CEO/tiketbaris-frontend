@echo off
echo ========================================
echo   Setup Database untuk Laragon
echo ========================================
echo.

REM Periksa apakah Laragon MySQL berjalan
echo [1/3] Memeriksa koneksi MySQL Laragon...
node check-laragon-db.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ MySQL tidak dapat diakses!
    echo.
    echo Silakan:
    echo 1. Buka Laragon
    echo 2. Klik tombol "Start All"
    echo 3. Tunggu hingga MySQL berjalan
    echo 4. Jalankan script ini lagi
    pause
    exit /b 1
)

echo.
echo [2/3] Apakah Anda ingin membuat/update database?
echo (Pastikan file u390486773_simtix.sql ada di folder ini)
choice /C YN /M "Lanjutkan"

if %ERRORLEVEL% EQU 1 (
    echo.
    echo [3/3] Menjalankan setup database...
    node setup-database.js
    echo.
    echo ✅ Setup database selesai!
) else (
    echo.
    echo Setup database dibatalkan.
)

echo.
echo ========================================
echo   Selesai!
echo ========================================
pause
