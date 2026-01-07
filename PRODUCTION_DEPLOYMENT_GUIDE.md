# 🚀 PANDUAN DEPLOY PRODUCTION - MIDTRANS & HOSTING

## 💳 STEP 1: AKTIVASI MIDTRANS PRODUCTION

### A. Daftar Akun Midtrans Business
1. **Buka:** https://dashboard.midtrans.com/register
2. **Pilih:** Business Account
3. **Isi data perusahaan:**
   - Nama perusahaan
   - Alamat lengkap
   - NPWP (jika ada)
   - Rekening bank utama

### B. Upload Dokumen Verifikasi
**Dokumen Required:**
- KTP/Passport owner
- NPWP (recommended)
- SIUP/Akta perusahaan (optional)
- Rekening koran bank 3 bulan terakhir
- Website/media online bisnis

### C. Tunggu Approval (1-3 hari kerja)
- Status: "Under Review"
- Email notification saat approved

---

## 🔑 STEP 2: DAPATKAN PRODUCTION KEYS

Setelah approved, login ke Midtrans Dashboard:

### A. Dapatkan Keys:
```
Settings > Access Keys
✅ Server Key: Mid-server-XXXXXXXXXXXXX
✅ Client Key: Mid-client-XXXXXXXXXXXXX
```

### B. Update Environment Production:
```env
# PRODUCTION CONFIG
DB_HOST=your_production_db_host
DB_USER=your_production_db_user  
DB_PASSWORD=your_production_db_password
DB_NAME=your_production_db_name

MIDTRANS_IS_PRODUCTION=true
MIDTRANS_SERVER_KEY=Mid-server-PRODUCTION_KEY_HERE
MIDTRANS_CLIENT_KEY=Mid-client-PRODUCTION_KEY_HERE

JWT_SECRET=d656771144942c02d2b71f450d55bdf6089817ff5026d7b0a3494bf252963d4654f8e918f714d2d44f7920ca8cd35067f2905b355d5fb5c3f6a08743a42ca16b

NODE_ENV=production
```

---

## 🌐 STEP 3: SETUP HOSTING

### A. BACKEND (Heroku/Railway/DigitalOcean)

#### Option 1: Heroku (Mudah & Cepat)
```bash
# Install Heroku CLI
npm install -g heroku

# Login & create app
heroku login
heroku create simtix-backend

# Set environment variables
heroku config:set DB_HOST=your_db_host
heroku config:set DB_USER=your_db_user
heroku config:set DB_PASSWORD=your_db_password
heroku config:set MIDTRANS_IS_PRODUCTION=true
heroku config:set MIDTRANS_SERVER_KEY=your_server_key

# Deploy
git add .
git commit -m "Production ready"
git push heroku main
```

#### Option 2: Railway (Alternative)
1. Connect GitHub repo
2. Set environment variables di dashboard
3. Auto deploy from main branch

### B. FRONTEND (Vercel/Netlify)

#### Vercel (Recommended):
```bash
# Install Vercel CLI
npm i -g vercel

# Di folder frontend:
cd frontend
vercel login
vercel

# Follow prompts, set:
# - Build command: npm run build
# - Output directory: dist
```

### C. DATABASE (JawsDB/PlanetScale)

#### JawsDB MySQL (Heroku Add-on):
```bash
heroku addons:create jawsdb:kitefin
heroku config:get JAWSDB_URL
# Use this URL for DB_HOST, DB_USER, etc
```

---

## ⚙️ STEP 4: PRODUCTION KONFIGURASI

### A. Update Frontend API URL:
```javascript
// frontend/src/services/api.js
const API_BASE_URL = 'https://your-backend-domain.herokuapp.com/api';
```

### B. Update Midtrans Script:
```javascript
// frontend/src/components/MidtransPayment.jsx
script.src = 'https://app.midtrans.com/snap/snap.js'; // Remove 'sandbox'
script.setAttribute('data-client-key', 'Mid-client-PRODUCTION_KEY');
```

### C. Setup SSL Certificate (Wajib):
- Heroku/Railway: Automatic SSL
- Custom domain: Install Let's Encrypt

---

## 🔗 STEP 5: WEBHOOK CONFIGURATION

### A. Set Webhook URL di Midtrans:
```
Midtrans Dashboard > Settings > Webhook Configuration
Payment Notification URL: https://your-backend-domain.com/api/midtrans/webhook
```

### B. Webhook Handler sudah ready di:
```javascript
// backend/routes/midtrans-payment.js
router.post('/webhook', async (req, res) => {
  // Auto handle payment notifications
});
```

---

## ✅ CHECKLIST DEPLOYMENT:

### Pre-Deploy:
- [ ] Midtrans business account approved
- [ ] Production keys obtained  
- [ ] SSL certificate ready
- [ ] Database hosted (not localhost)

### Deploy:
- [ ] Backend deployed dengan HTTPS
- [ ] Frontend deployed
- [ ] Environment variables set
- [ ] Database migrated

### Post-Deploy:
- [ ] Test payment dengan real card
- [ ] Webhook notifications working
- [ ] QR codes generating correctly
- [ ] Stock management working

---

## 🧪 TESTING PRODUCTION:

### A. Test Cards (Small Amount):
Gunakan kartu kredit asli dengan nominal kecil (Rp 1.000)

### B. Check Webhook:
```bash
# Monitor backend logs
heroku logs --tail -a simtix-backend
```

### C. Verify Payment Flow:
1. User create payment → Midtrans
2. Payment success → Webhook notification
3. Ticket generated → QR code created
4. Stock updated

---

## 🎯 ESTIMASI WAKTU DEPLOYMENT:

- **Midtrans approval:** 1-3 hari
- **Backend deploy:** 30 menit  
- **Frontend deploy:** 15 menit
- **Testing & fixes:** 1-2 jam

**Total: 1-3 hari** (tunggu Midtrans approval)

---

## 📞 TROUBLESHOOTING PRODUCTION:

### Payment Gagal:
1. Check Midtrans dashboard for error logs
2. Verify SSL certificate active
3. Test webhook URL accessibility

### Database Connection:
1. Verify production DB credentials
2. Check connection limits
3. Ensure DB allows external connections

### CORS Errors:
1. Update CORS origin in server.js
2. Add production domain to allowed origins