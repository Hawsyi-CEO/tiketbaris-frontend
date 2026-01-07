@echo off
REM Setup script untuk Tiket Pembaris Frontend di Windows

echo.
echo 🚀 Setting up Tiket Pembaris Frontend...
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

echo.
echo ✅ Frontend setup complete!
echo.
echo 📝 Next steps:
echo 1. Pastikan backend server sudah running di port 5000
echo 2. Run: npm run dev (untuk development) atau npm run build (untuk production)
echo.
echo 🌐 Frontend akan berjalan di: http://localhost:3000
echo.
pause
