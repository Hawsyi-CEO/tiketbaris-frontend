@echo off
title Jalankan Server dengan Laragon
color 0A

echo.
echo ========================================
echo   SIMTIX - Sistem Tiket Event
echo   Menggunakan Laragon MySQL
echo ========================================
echo.

REM Periksa apakah di folder backend
if not exist "server.js" (
    echo [!] File server.js tidak ditemukan
    echo [!] Pastikan Anda menjalankan script ini dari folder backend
    echo.
    pause
    exit /b 1
)

REM Periksa koneksi database
echo [1/2] Memeriksa koneksi database...
node check-laragon-db.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [X] Database belum siap!
    echo.
    echo Ingin setup database sekarang? (Y/N)
    choice /C YN /M "Setup database"
    
    if %ERRORLEVEL% EQU 1 (
        echo.
        echo [*] Menjalankan setup database...
        node setup-laragon-db.js
        
        if %ERRORLEVEL% NEQ 0 (
            echo.
            echo [X] Setup database gagal!
            pause
            exit /b 1
        )
    ) else (
        echo.
        echo Setup database dibatalkan.
        pause
        exit /b 1
    )
)

echo.
echo [2/2] Menjalankan server...
echo.
echo ========================================
echo   Server akan berjalan di:
echo   http://localhost:5000
echo.
echo   Tekan Ctrl+C untuk menghentikan
echo ========================================
echo.

npm start
