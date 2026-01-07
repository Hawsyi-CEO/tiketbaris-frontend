#!/bin/bash
# Setup script untuk Tiket Pembaris Frontend

echo "🚀 Setting up Tiket Pembaris Frontend..."

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

echo "✅ Frontend setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Pastikan backend server sudah running di port 5000"
echo "2. Run: npm run dev (untuk development) atau npm run build (untuk production)"
echo ""
echo "🌐 Frontend akan berjalan di: http://localhost:3000"
