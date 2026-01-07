#!/bin/bash
# Setup script untuk Tiket Pembaris Backend

echo "🚀 Setting up Tiket Pembaris Backend..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js tidak terinstall. Silakan install dari https://nodejs.org"
    exit 1
fi

echo "✅ Node.js: $(node -v)"
echo "✅ npm: $(npm -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create uploads directory
mkdir -p uploads

echo "✅ Backend setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Pastikan file .env sudah dikonfigurasi dengan benar"
echo "2. Pastikan MySQL database sudah running"
echo "3. Run: npm start (untuk production) atau npm run dev (untuk development)"
echo ""
echo "🌐 Backend akan berjalan di: http://localhost:5000"
