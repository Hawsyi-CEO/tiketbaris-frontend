@echo off
REM Setup script untuk Tiket Pembaris Backend di Windows

echo.
echo 🚀 Setting up Tiket Pembaris Backend...
echo.

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js tidak terinstall. Silakan install dari https://nodejs.org
    pause
    exit /b 1
)

echo ✅ Node.js: 
node --version
echo ✅ npm:
npm --version

REM Install dependencies
echo.
echo 📦 Installing dependencies...
call npm install

REM Create uploads directory
if not exist "uploads" (
    mkdir uploads
    echo ✅ Created uploads folder
)

echo.
echo ✅ Backend setup complete!
echo.
echo 📝 Next steps:
echo 1. Pastikan file .env sudah dikonfigurasi dengan benar
echo 2. Pastikan MySQL database sudah running
echo 3. Run: npm start (untuk production) atau npm run dev (untuk development)
echo.
echo 🌐 Backend akan berjalan di: http://localhost:5000
echo.
pause
