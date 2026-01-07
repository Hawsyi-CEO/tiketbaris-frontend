# PAYMENT INTEGRATION GUIDE
## Frontend Midtrans Integration dengan QR Code System

### 🚀 **STATUS IMPLEMENTASI**
✅ **SELESAI** - Payment gateway terintegrasi penuh dengan:
- Midtrans Snap Token Integration
- QR Code Ticket Generation
- Real-time Payment Status
- Test Cards untuk Development

### 📁 **FILE STRUKTUR BARU**
```
frontend/src/
├── components/
│   └── MidtransPayment.jsx          ✅ Komponen payment utama
└── pages/
    └── MyTickets.jsx                ✅ Halaman tiket dengan QR codes
```

### 🛠 **KOMPONEN YANG DIUPDATE**
1. **CheckoutPage.jsx** - Menggunakan MidtransPayment component
2. **App.jsx** - Route baru `/user/my-tickets`
3. **DashboardUser.jsx** - Tombol navigasi ke halaman tiket

### 💳 **FITUR MIDTRANS PAYMENT**

#### **MidtransPayment Component**
- **Auto-load Midtrans Snap script** dari sandbox
- **Quantity selector** dengan validasi stok
- **Test card notification** untuk development
- **Real-time payment callbacks** (success, pending, error, close)
- **Payment status checking** setelah transaksi

#### **Test Cards Development**
```javascript
// Test Cards yang tersedia:
✅ SUCCESS: 4811111111111114
🔐 3DS CHALLENGE: 4911111111111113  
❌ INSUFFICIENT FUNDS: 4411111111111118
💳 CVV: 123
📅 EXP: 12/25
```

### 🎫 **QR CODE TICKET SYSTEM**

#### **MyTickets Page Features**
- **Grid layout** dengan preview QR codes
- **Ticket status indicators** (Active, Used, Expired)
- **Download QR code** functionality
- **Copy ticket code** to clipboard
- **Detail modal** dengan full ticket info
- **Auto-refresh** ticket status

#### **Ticket Status Colors**
```css
✅ Active: Green (siap digunakan)
✔️ Used: Gray (sudah discan)  
❌ Expired: Red (expired)
```

### 🔄 **PAYMENT FLOW**

#### **1. Checkout Process**
```javascript
User Pilih Event → Input Quantity → Klik "Bayar Sekarang"
→ Generate Snap Token → Midtrans Popup → Payment Input
→ Payment Success → Generate QR Ticket → Redirect ke My Tickets
```

#### **2. Payment Callbacks**
```javascript
onSuccess: (result) => {
  // Auto-check payment status
  // Show success notification
  // Redirect ke my-tickets page
}

onPending: (result) => {
  // Show pending message
  // User dapat complete payment nanti
}

onError: (result) => {
  // Show error notification
  // Allow retry
}

onClose: () => {
  // User close popup tanpa bayar
  // Show close notification
}
```

### 🔐 **SECURITY & VALIDATION**

#### **Frontend Security**
- **JWT Token validation** untuk semua API calls
- **Client-side input validation** (quantity, stock)
- **HTTPS requirement** untuk production Midtrans
- **CORS protection** untuk API calls

#### **Payment Validation**
- **Server-side verification** untuk semua payment
- **Webhook notification** untuk payment status update
- **Database transaction** untuk consistency
- **QR Code signature** untuk anti-fraud

### 🌐 **API ENDPOINTS DIGUNAKAN**

#### **Frontend ke Backend**
```javascript
// Payment Creation
POST /api/midtrans/create-snap-token
Body: { eventId, quantity }
Headers: { Authorization: "Bearer <token>" }

// Payment Status Check  
GET /api/midtrans/status/:orderId
Headers: { Authorization: "Bearer <token>" }

// Get User Tickets
GET /api/qr-tickets/my-tickets  
Headers: { Authorization: "Bearer <token>" }

// Scan QR Code
POST /api/qr-tickets/scan
Body: { ticketCode }
```

### 🚀 **CARA TESTING**

#### **1. Start Development Servers**
```bash
# Backend
cd "C:\laragon\www\tiket baris\backend"
node server.js  # Port 5000

# Frontend  
cd "C:\laragon\www\tiket baris\frontend"
npm run dev     # Port 3000
```

#### **2. Test Payment Flow**
1. **Login** ke sistem sebagai user
2. **Pilih event** dan klik "Beli Tiket"
3. **Atur quantity** dan klik "Bayar Sekarang"
4. **Gunakan test card** 4811111111111114 untuk success
5. **Lihat QR ticket** di halaman "My Tickets"

#### **3. Test QR Code**
1. **Download QR image** dari halaman tickets
2. **Scan dengan mobile app** atau QR reader
3. **Verify ticket** melalui API endpoint `/scan`

### ⚙️ **KONFIGURASI ENVIRONMENT**

#### **Midtrans Configuration**
```javascript
// Sudah dikonfigurasi di backend:
SERVER_KEY: '<YOUR_SERVER_KEY_HERE>'
CLIENT_KEY: '<YOUR_CLIENT_KEY_HERE>'  
ENVIRONMENT: 'sandbox' // Development
```

#### **Database Tables**
```sql
✅ transactions (order_id, snap_token, status, etc)
✅ tickets (ticket_code, qr_code, status, etc) 
✅ events (title, price, stock, etc)
✅ users (authentication data)
```

### 🔧 **TROUBLESHOOTING**

#### **Common Issues**
1. **"Midtrans Snap belum dimuat"**
   - Solution: Tunggu script loading, check network

2. **"Payment tidak generate QR"**
   - Check: Database tickets table structure
   - Check: QR code generation di backend

3. **"Test card tidak work"**
   - Pastikan: Environment = sandbox
   - Gunakan: 4811111111111114, CVV 123, EXP 12/25

#### **Development Notes**
- **Frontend berjalan di port 3000**
- **Backend berjalan di port 5000** 
- **Database: tiket (MySQL di Laragon)**
- **QR Codes disimpan sebagai base64 di database**

### 🎯 **NEXT STEPS**
1. **Testing payment flow** dengan berbagai scenarios
2. **Mobile responsive** optimization
3. **Production deployment** dengan Midtrans production keys
4. **Email notifications** setelah purchase
5. **Bulk QR download** untuk multiple tickets

### 📝 **LOG TESTING**
```
✅ Midtrans sandbox configuration
✅ Snap token generation  
✅ Payment popup integration
✅ QR code ticket generation
✅ My Tickets page dengan download
✅ Navigation dari checkout ke tickets
✅ Test cards working
🔄 Ready for full testing
```

**STATUS: READY FOR FULL TESTING** 🚀