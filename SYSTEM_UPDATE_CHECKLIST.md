# ✅ CHECKLIST UPDATE SISTEM UNTUK IMPLEMENTASI PRICING

## 📋 APA SAJA YANG PERLU DI-UPDATE

Dokumen ini berisi semua update yang diperlukan agar konsep pricing bisa berfungsi dengan baik dan dapat dimengerti oleh Panitia/Event Organizer.

---

## 🔧 BACKEND UPDATES

### 1. Database Updates
**Status:** ⏳ PERLU DILAKUKAN

```sql
-- File: backend/migrations/001_add_pricing_columns.sql

-- 1. Add pricing columns ke table transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS (
  payment_method VARCHAR(50) COMMENT 'gopay, shopeepay, dana, bank, cc, minimarket, akulaku, kredivo',
  midtrans_fee_amount INT DEFAULT 0 COMMENT 'Biaya Midtrans',
  platform_fee_amount INT DEFAULT 0 COMMENT 'Biaya Platform',
  total_fee_amount INT DEFAULT 0 COMMENT 'Total Fee',
  net_amount_to_organizer INT DEFAULT 0 COMMENT 'Uang ke Panitia',
  fee_breakdown JSON COMMENT 'Breakdown detail biaya',
  
  INDEX idx_payment_method (payment_method),
  INDEX idx_fee_amounts (midtrans_fee_amount, platform_fee_amount)
);

-- 2. Create table untuk audit trail
CREATE TABLE IF NOT EXISTS transactions_fee_audit (
  id INT PRIMARY KEY AUTO_INCREMENT,
  transaction_id INT NOT NULL,
  gross_amount INT NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  midtrans_fee INT NOT NULL,
  platform_fee INT NOT NULL,
  net_amount INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (transaction_id) REFERENCES transactions(id),
  INDEX idx_transaction (transaction_id),
  INDEX idx_created (created_at)
);

-- 3. Add column untuk tracking settlement
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS (
  settlement_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending' COMMENT 'Status settlement ke panitia',
  settlement_date DATETIME COMMENT 'Tanggal settlement ke panitia',
  settlement_reference VARCHAR(100) COMMENT 'Reference number settlement',
  
  INDEX idx_settlement (settlement_status, settlement_date)
);

-- Run command:
-- mysql -u root -p database_name < backend/migrations/001_add_pricing_columns.sql
```

**Checklist:**
- [ ] Backup database terlebih dahulu
- [ ] Run migration SQL
- [ ] Verify kolom sudah terbuat: `mysql> DESCRIBE transactions;`
- [ ] Test insert data dengan fee columns

---

### 2. Environment Variables
**Status:** ⏳ PERLU DILAKUKAN

```env
# File: .env (atau .env.production)

# ============================================
# PRICING CONFIGURATION
# ============================================

# MIDTRANS FEES (Fixed per payment method - NON-NEGOTIABLE)
MIDTRANS_FEE_GOPAY=2                    # percentage
MIDTRANS_FEE_SHOPEEPAY=2                # percentage
MIDTRANS_FEE_DANA=1.5                   # percentage
MIDTRANS_FEE_BANK=4000                  # fixed rupiah
MIDTRANS_FEE_CC_PERCENTAGE=2.9          # percentage
MIDTRANS_FEE_CC_FIXED=2000              # fixed rupiah
MIDTRANS_FEE_MINIMARKET=5000            # fixed rupiah
MIDTRANS_FEE_AKULAKU=1.7                # percentage
MIDTRANS_FEE_KREDIVO=2                  # percentage

# PLATFORM COMMISSION (Flat 2% for ALL payments)
PLATFORM_COMMISSION_PERCENTAGE=2        # 2% flat untuk semua pembayaran
# Note: Komisi 2% ini tetap dipotong dari setiap pembelian tiket, 
# independent dari payment method yang dipilih pembeli

# SETTLEMENT CONFIGURATION
SETTLEMENT_DELAY_HOURS=24               # T+1 day
SETTLEMENT_CUTOFF_TIME=15:00            # Jam 3 sore daily
ENABLE_AUTO_SETTLEMENT=true             # Automatic settlement
SETTLEMENT_MIN_AMOUNT=1000              # Minimum untuk settlement
```

**Checklist:**
- [ ] Copy isi ke `.env` file
- [ ] Adjust nilai sesuai requirement
- [ ] Verify dengan: `echo $MIDTRANS_FEE_GOPAY`

---

### 3. Service Layer: PricingService.js
**Status:** ✅ SIAP DIBUAT

**File Location:** `backend/services/pricingService.js`

**Simplified PricingService untuk Flat 2% Commission:**

```javascript
class PricingService {
  /**
   * Calculate fees dengan model: 
   * - Midtrans fee (varies per payment method)
   * - Platform fee (flat 2%)
   */
  static calculateFees(grossAmount, paymentMethod) {
    // Midtrans fee calculation
    const midtransFee = this.getMidtransFee(grossAmount, paymentMethod);
    
    // Platform fee (flat 2%)
    const platformFee = Math.floor(grossAmount * 0.02);
    
    // Total fee
    const totalFee = midtransFee + platformFee;
    
    // Net amount to organizer (after all fees)
    const netAmount = grossAmount - totalFee;
    
    return {
      grossAmount,
      paymentMethod,
      midtransFee,
      platformFee,
      totalFee,
      netAmount,
      breakdown: {
        gross: grossAmount,
        midtrans: `${this.getFeePercentage(paymentMethod)}% / Rp${midtransFee}`,
        platform: `2% / Rp${platformFee}`,
        total: `${((totalFee/grossAmount)*100).toFixed(2)}% / Rp${totalFee}`,
        net: `Rp${netAmount}`
      }
    };
  }

  static getMidtransFee(amount, method) {
    switch(method) {
      case 'gopay':
      case 'shopeepay':
      case 'kredivo':
        return Math.floor(amount * 0.02);
      case 'dana':
      case 'akulaku':
        return Math.floor(amount * 0.015);
      case 'cc':
        return Math.floor(amount * 0.029) + 2000;
      case 'bank':
        return 4000;
      case 'minimarket':
        return 5000;
      default:
        return 0;
    }
  }

  static getFeePercentage(method) {
    switch(method) {
      case 'gopay':
      case 'shopeepay':
      case 'kredivo':
        return '2%';
      case 'dana':
      case 'akulaku':
        return '1.5%';
      case 'cc':
        return '2.9% + Rp2k';
      case 'bank':
        return 'Rp4k';
      case 'minimarket':
        return 'Rp5k';
      default:
        return '0%';
    }
  }
}

module.exports = PricingService;
```

**Checklist:**
- [ ] Create file `backend/services/pricingService.js`
- [ ] Copy code di atas
- [ ] Test dengan: `node -e "const P = require('./services/pricingService'); console.log(P.calculateFees(100000, 'gopay'))"`
- [ ] Expected output: 
  ```
  {
    grossAmount: 100000,
    paymentMethod: 'gopay',
    midtransFee: 2000,
    platformFee: 2000,
    totalFee: 4000,
    netAmount: 96000
  }
  ```

---

### 4. API Endpoints
**Status:** ⏳ PERLU DILAKUKAN

**File:** `backend/routes/pricing.js`

**Endpoints yang Perlu di-Add:**

```javascript
// 1. GET /api/pricing/methods
//    Response: List metode pembayaran + fee detail

// 2. POST /api/pricing/calculate
//    Body: { amount, paymentMethod }
//    Response: {
//      grossAmount: 100000,
//      midtransFee: 2000,
//      platformFee: 2000,    // Always 2%
//      totalFee: 4000,
//      netAmount: 96000
//    }

// 3. GET /api/pricing/event/:eventId/analytics
//    Response: Analytics event dengan fee breakdown
//    - Total penjualan, total Midtrans fee, total platform fee (2%)
```

**Checklist:**
- [ ] Create file `backend/routes/pricing.js`
- [ ] Implement 3 endpoints di atas
- [ ] Register route di `server.js`: `app.use('/api/pricing', require('./routes/pricing'))`
- [ ] Test dengan Postman:
  ```
  POST /api/pricing/calculate
  Body: { amount: 100000, paymentMethod: "gopay" }
  Expected: netAmount: 96000 (4% total fee: 2% Midtrans + 2% Platform)
  ```
- [ ] Verify response format

---

### 5. Integration dengan Checkout
**Status:** ⏳ PERLU DILAKUKAN

**File:** `backend/routes/checkout.js`

**Update yang Perlu:**

```javascript
// Saat mencatat transaksi, tambahkan:
const feeBreakdown = PricingService.calculateFees(totalPrice, paymentMethod);

// Insert ke database dengan fee info
await conn.execute(
  `INSERT INTO transactions 
   (..., payment_method, midtrans_fee_amount, platform_fee_amount, ...)
   VALUES (..., ?, ?, ?, ...)`,
  [..., paymentMethod, feeBreakdown.midtransFee, feeBreakdown.platformFee, ...]
);

// Juga simpan ke audit table
await conn.execute(
  `INSERT INTO transactions_fee_audit 
   (transaction_id, gross_amount, payment_method, midtrans_fee, platform_fee, net_amount)
   VALUES (?, ?, ?, ?, ?, ?)`,
  [transactionId, totalPrice, paymentMethod, feeBreakdown.midtransFee, feeBreakdown.platformFee, feeBreakdown.netAmount]
);
```

**Checklist:**
- [ ] Update checkout.js
- [ ] Test transaksi dengan berbagai payment method
- [ ] Verify fee tercatat dengan benar di database
- [ ] Test payment completion flow

---

### 6. Webhook Midtrans Update
**Status:** ⏳ PERLU DILAKUKAN

**File:** `backend/routes/midtrans-payment.js`

**Update yang Perlu:**

```javascript
// Saat payment success, ensure fee columns terisi:
const feeBreakdown = PricingService.calculateFees(
  transaction.total_amount,
  transaction.payment_method || 'gopay'
);

// Update transaction record jika belum ada fee
if (!transaction.fee_breakdown) {
  await pool.execute(
    `UPDATE transactions 
     SET midtrans_fee_amount = ?, platform_fee_amount = ?, 
         total_fee_amount = ?, net_amount_to_organizer = ?,
         fee_breakdown = ?
     WHERE id = ?`,
    [feeBreakdown.midtransFee, feeBreakdown.platformFee, 
     feeBreakdown.totalFee, feeBreakdown.netAmount,
     JSON.stringify(feeBreakdown), transaction.id]
  );
}
```

**Checklist:**
- [ ] Update webhook handler
- [ ] Test webhook dengan payment completion
- [ ] Verify fee data saved correctly

---

### 7. Settlement Service (Baru)
**Status:** ⏳ PERLU DIBUAT

**File:** `backend/services/settlementService.js`

```javascript
class SettlementService {
  /**
   * Process daily settlement untuk panitia
   */
  static async processDailySettlement() {
    // 1. Get semua completed transactions dari hari sebelumnya
    // 2. Group by organizer
    // 3. Calculate total net amount per organizer
    // 4. Create settlement records
    // 5. Transfer ke rekening panitia
    // 6. Send notification email
  }

  /**
   * Get settlement history untuk panitia
   */
  static async getSettlementHistory(userId) {
    // Query dari settlement table
    // Return settlement data dengan detail
  }
}
```

**Checklist:**
- [ ] Create file `backend/services/settlementService.js`
- [ ] Implement settlement logic
- [ ] Setup cron job: `node-cron` untuk daily settlement
- [ ] Setup email notification template
- [ ] Test settlement di development environment

---

## 🎨 FRONTEND UPDATES

### 1. Components (Already Created)
**Status:** ✅ SUDAH DIBUAT

- [ ] Copy `frontend/src/components/PricingCalculator.jsx`
- [ ] Copy `frontend/src/components/PaymentInfo.jsx`

---

### 2. Checkout Page Updates
**Status:** ⏳ PERLU DILAKUKAN

**File:** `frontend/src/pages/CheckoutPageResponsive.jsx`

**Update yang Perlu:**

```jsx
// 1. Import PaymentInfo component
import PaymentInfo from '../components/PaymentInfo';

// 2. Add di render method:
<PaymentInfo 
  selectedMethod={paymentMethod}
  ticketPrice={event.price}
  quantity={checkoutData.quantity}
/>

// 3. Tambah payment method selector dengan harga preview:
{Object.entries(PAYMENT_METHODS).map(([key, method]) => (
  <div key={key} className="payment-option">
    <label>
      <input 
        type="radio" 
        value={key} 
        onChange={(e) => setPaymentMethod(e.target.value)}
      />
      {method.icon} {method.name}
      <span className="price-preview">
        Total: {formatRupiah(calculateTotal(ticketPrice * quantity, key))}
      </span>
    </label>
  </div>
))}
```

**Checklist:**
- [ ] Update CheckoutPageResponsive.jsx
- [ ] Import PaymentInfo component
- [ ] Add payment method selector dengan preview
- [ ] Test di berbagai screen size (mobile, tablet, desktop)
- [ ] Verify price calculation accurate

---

### 3. Organizer Dashboard Pages
**Status:** ⏳ PERLU DILAKUKAN

**File:** `frontend/src/pages/organizer/OrganiserDashboard.jsx`

**Add Components:**

```jsx
// 1. Dashboard Summary Card
<div className="revenue-summary">
  <h2>Ringkasan Revenue</h2>
  <div className="card">Total Penjualan: Rp xxx</div>
  <div className="card">Total Potongan: Rp xxx</div>
  <div className="card">Uang Masuk: Rp xxx</div>
</div>

// 2. Add link ke analytics page
<Link to="/organizer/pricing-analytics">
  💰 Analisis Revenue & Biaya
</Link>

// 3. Add latest settlement info
<div className="settlement-info">
  <h3>Settlement Terakhir</h3>
  <p>Tanggal: {lastSettlement.date}</p>
  <p>Jumlah: {formatRupiah(lastSettlement.amount)}</p>
  <p>Status: {lastSettlement.status}</p>
</div>
```

**Checklist:**
- [ ] Add revenue summary cards
- [ ] Add link ke pricing analytics page
- [ ] Add settlement info section
- [ ] Style dengan Tailwind CSS
- [ ] Test responsive design

---

### 4. Pricing Analytics Page (Already Created)
**Status:** ✅ SUDAH DIBUAT

**File:** `frontend/src/pages/PricingAnalytics.jsx`

**Checklist:**
- [ ] Copy file ke project
- [ ] Test page bisa diakses dari organizer dashboard
- [ ] Verify data display accuracy
- [ ] Test dengan berbagai event

---

### 5. Payment Method Display
**Status:** ⏳ PERLU DILAKUKAN

**Update di CheckoutPage:**

```jsx
// Display payment methods dengan fee info
const PAYMENT_METHODS = {
  gopay: {
    name: 'GoPay',
    icon: '💚',
    feePercentage: 3.5,
    description: 'Termurah & Tercepat'
  },
  dana: {
    name: 'DANA',
    icon: '🔵',
    feePercentage: 3.0,
    description: 'Paling Hemat'
  },
  // ... etc
};

// Render dengan harga total
{PAYMENT_METHODS[method].icon} {PAYMENT_METHODS[method].name}
Total: Rp {calculateWithFee(price, PAYMENT_METHODS[method].feePercentage)}
Hemat: Rp {savingsAmount}
```

**Checklist:**
- [ ] Add payment method display logic
- [ ] Calculate fee & total untuk setiap method
- [ ] Display savings compared to most expensive
- [ ] Add tooltip/info tentang biaya
- [ ] Test calculation accuracy

---

## 📧 EMAIL & NOTIFICATION UPDATES

### 1. Email Templates
**Status:** ⏳ PERLU DIBUAT

**Template 1: Order Confirmation + Breakdown**
```
Subject: Tiket Anda Berhasil Dibeli - Rincian Biaya

Halo [Nama Pembeli],

Terima kasih telah membeli tiket!

Berikut rincian pembayaran Anda:
├─ Event: [nama event]
├─ Jumlah Tiket: X
├─ Harga Per Tiket: Rp XX.XXX
├─ Subtotal: Rp XXX.XXX
├─ Biaya Midtrans: Rp X.XXX
├─ Biaya Platform: Rp X.XXX
└─ TOTAL: Rp XXX.XXX

QR Code Anda:
[embedded QR code]

Tunjukkan QR code ini saat check-in event.

---

Pertanyaan? Hubungi support kami!
```

**Template 2: Settlement Notification (untuk Panitia)**
```
Subject: Settlement Dana Event Anda - [Event Name]

Halo [Nama Panitia],

Settlement event Anda sudah diproses!

Rincian Settlement:
├─ Event: [nama event]
├─ Total Penjualan: Rp XXX.XXX.XXX
├─ Biaya Midtrans: Rp X.XXX.XXX
├─ Komisi Platform: Rp X.XXX.XXX
├─ Total Potongan: Rp X.XXX.XXX
├─ Uang Masuk: Rp XXX.XXX.XXX
└─ Tanggal Transfer: [date/time]

Bukti Transfer:
├─ Reference: [ref number]
├─ Bank Tujuan: [bank account]
└─ Jumlah: Rp XXX.XXX.XXX

Terima kasih telah menggunakan platform kami!
```

**Checklist:**
- [ ] Create email templates di `backend/templates/`
- [ ] Setup email service (nodemailer / SendGrid)
- [ ] Test email sending
- [ ] Verify email formatting di berbagai email client

---

### 2. Push Notifications / In-App Alerts
**Status:** ⏳ PERLU DILAKUKAN

**Alert 1: Payment Confirmation**
```
"✓ Pembayaran berhasil! Tiket Anda dikirim ke email."
```

**Alert 2: Settlement Processing**
```
"💰 Settlement event Anda sedang diproses. Dana akan masuk dalam 24 jam."
```

**Alert 3: Settlement Success**
```
"✓ Settlement berhasil! Rp XXX.XXX telah masuk ke rekening Anda."
```

**Checklist:**
- [ ] Setup notification service
- [ ] Create alert templates
- [ ] Test notification delivery
- [ ] Verify timing (saat pembayaran, saat settlement, dll)

---

## 📊 DASHBOARD & REPORTING UPDATES

### 1. Organizer Dashboard Reports
**Status:** ⏳ PERLU DILAKUKAN

**Add Reports:**

```
1. Revenue Summary
   ├─ Total Penjualan (Rp)
   ├─ Total Potongan (Rp & %)
   ├─ Uang Masuk (Rp)
   └─ Compared to target

2. Payment Method Breakdown
   ├─ GoPay: X tiket, Rp XXX.XXX
   ├─ Bank: X tiket, Rp XXX.XXX
   ├─ CC: X tiket, Rp XXX.XXX
   └─ Pie chart visualization

3. Fee Breakdown
   ├─ Biaya Midtrans Total: Rp XXX.XXX
   ├─ Biaya Platform Total: Rp XXX.XXX
   └─ Bar chart perbandingan

4. Settlement History
   ├─ Date, Amount, Status, Reference
   └─ Table format untuk export
```

**Checklist:**
- [ ] Add SQL queries untuk report
- [ ] Create API endpoints untuk report data
- [ ] Build React components untuk display
- [ ] Add export to Excel functionality
- [ ] Test report accuracy dengan sample data

---

### 2. Admin Dashboard Reports
**Status:** ⏳ PERLU DILAKUKAN

**Admin Bisa Lihat:**

```
1. Platform Revenue
   ├─ Total Commission (Semua event)
   ├─ Commission per payment method
   ├─ Trend over time
   └─ Projected monthly revenue

2. Event Performance
   ├─ Top events by revenue
   ├─ Average ticket price
   ├─ Popular payment methods
   └─ Settlement success rate

3. Settlement Overview
   ├─ Pending settlements
   ├─ Completed settlements
   ├─ Failed settlements
   └─ Total volume
```

**Checklist:**
- [ ] Create admin report page
- [ ] Add SQL queries untuk aggregation
- [ ] Build charts & visualizations
- [ ] Setup data export

---

## 🔔 DOCUMENTATION UPDATES

### 1. Update README/Docs
**Status:** ⏳ PERLU DILAKUKAN

**Add Section:**

```markdown
## Pricing & Commission

### Structure
- [x] Transparent breakdown per payment method
- [x] Real-time fee calculation
- [x] Automated settlement

### For Organizers
- Payment method list with fees
- Dashboard analytics
- Settlement tracking
- [See DAFTAR_HARGA_DAN_KETENTUAN_PANITIA.md]

### For Customers
- Fee breakdown at checkout
- Payment method comparison
- [See PaymentInfo component]
```

**Checklist:**
- [ ] Update main README.md
- [ ] Add pricing section
- [ ] Link ke documentation files
- [ ] Update developer guide

---

### 2. Update API Documentation
**Status:** ⏳ PERLU DILAKUKAN

**Add Endpoints:**

```markdown
## API: Pricing

### GET /api/pricing/methods
Get available payment methods

### POST /api/pricing/calculate
Calculate fees for transaction

### GET /api/pricing/event/:eventId/analytics
Get event pricing analytics

### GET /api/pricing/panitia/dashboard
Get organizer's pricing dashboard
```

**Checklist:**
- [ ] Document all endpoints
- [ ] Add request/response examples
- [ ] Document error codes
- [ ] Add code samples

---

## 🧪 TESTING CHECKLIST

### Unit Tests
**Status:** ⏳ PERLU DILAKUKAN

```javascript
// Test PricingService dengan flat 2% commission
describe('PricingService', () => {
  it('should calculate GoPay fee correctly (2% Midtrans + 2% Platform)', () => {
    const result = PricingService.calculateFees(100000, 'gopay');
    expect(result.midtransFee).toBe(2000);      // 2%
    expect(result.platformFee).toBe(2000);      // 2% (platform fee tetap)
    expect(result.totalFee).toBe(4000);         // 4% total
    expect(result.netAmount).toBe(96000);       // Uang ke panitia
  });

  it('should calculate Bank Transfer fee correctly (Rp4k + 2% Platform)', () => {
    const result = PricingService.calculateFees(100000, 'bank');
    expect(result.midtransFee).toBe(4000);      // Fixed Rp4k
    expect(result.platformFee).toBe(2000);      // 2% (platform fee tetap)
    expect(result.totalFee).toBe(6000);         // Rp4k + 2%
    expect(result.netAmount).toBe(94000);
  });

  it('should apply 2% platform fee to all payment methods', () => {
    const methods = ['gopay', 'shopeepay', 'dana', 'bank', 'cc', 'minimarket', 'akulaku', 'kredivo'];
    methods.forEach(method => {
      const result = PricingService.calculateFees(100000, method);
      expect(result.platformFee).toBe(2000);    // All harus 2%
    });
  });
});
```

**Checklist:**
- [ ] Write unit tests
- [ ] Run `npm test`
- [ ] Achieve >80% code coverage
- [ ] Fix any failing tests

---

### Integration Tests
**Status:** ⏳ PERLU DILAKUKAN

```javascript
// Test end-to-end flow
describe('Pricing Integration', () => {
  it('should charge correct fee at checkout', async () => {
    // Simulate checkout dengan berbagai payment methods
    // Verify fee tercatat di database
  });

  it('should process settlement correctly', async () => {
    // Simulate settlement process
    // Verify amount di-transfer ke panitia
  });
});
```

**Checklist:**
- [ ] Write integration tests
- [ ] Test checkout flow end-to-end
- [ ] Test settlement flow
- [ ] Test dengan production-like data volume

---

### Manual Testing
**Status:** ⏳ PERLU DILAKUKAN

```
Scenarios to test:
□ Pembeli checkout dengan GoPay
  ├─ Verify fee calculation
  ├─ Verify QR code generated
  └─ Verify email sent

□ Pembeli checkout dengan Bank Transfer
  ├─ Verify fee calculation
  └─ Test pending/confirmation flow

□ Settlement processing
  ├─ Verify daily settlement runs
  ├─ Verify amount to organizer correct
  ├─ Verify email sent
  └─ Verify bank transfer successful

□ Dashboard analytics
  ├─ Verify calculations
  ├─ Verify data accuracy
  └─ Verify export functionality

□ Mobile checkout experience
  ├─ Test responsive design
  ├─ Test payment flow on mobile
  └─ Test QR code display
```

**Checklist:**
- [ ] Create test plan document
- [ ] Execute all test scenarios
- [ ] Document bugs found
- [ ] Retest fixes
- [ ] Sign off QA

---

## 🚀 DEPLOYMENT CHECKLIST

### Pre-Deployment
**Status:** ⏳ PERLU DILAKUKAN

```
□ Code Review
  ├─ Backend code reviewed
  ├─ Frontend code reviewed
  └─ No critical issues

□ Database
  ├─ Backup production database
  ├─ Test migration script
  ├─ Verify rollback plan
  └─ Run migration on staging

□ Configuration
  ├─ Update .env variables
  ├─ Verify API keys
  ├─ Setup email service
  └─ Setup payment gateway

□ Testing
  ├─ All unit tests pass
  ├─ All integration tests pass
  ├─ Manual testing complete
  └─ Performance testing OK
```

---

### Deployment Steps
**Status:** ⏳ PERLU DILAKUKAN

```
1. Database Migration (staging)
   $ mysql -u root -p db_staging < migrations/001_add_pricing_columns.sql

2. Deploy Backend
   $ git pull origin main
   $ npm install
   $ npm run build
   $ pm2 restart tiketbaris-backend

3. Deploy Frontend
   $ cd frontend && npm run build
   $ cp -r dist/* /var/www/tiketbaris/
   $ pm2 restart tiketbaris-frontend

4. Verify Deployment
   $ curl http://localhost:5000/api/pricing/methods
   $ Check frontend loads correctly

5. Run Smoke Tests
   $ Execute critical test scenarios

6. Monitor Logs
   $ tail -f logs/error.log
   $ Check for any issues
```

**Checklist:**
- [ ] Create deployment runbook
- [ ] Assign deployment team
- [ ] Schedule deployment window
- [ ] Prepare rollback plan
- [ ] Communicate with stakeholders

---

### Post-Deployment
**Status:** ⏳ PERLU DILAKUKAN

```
□ Monitor
  ├─ Check error logs
  ├─ Monitor API response time
  ├─ Monitor database queries
  └─ Check user feedback

□ Validate
  ├─ Test critical flows
  ├─ Verify fee calculations
  ├─ Verify settlement
  └─ Verify email delivery

□ Document
  ├─ Update runbook
  ├─ Document issues found & fixed
  ├─ Update team documentation
  └─ Create post-deployment report

□ Communicate
  ├─ Inform panitia about new features
  ├─ Share documentation
  ├─ Answer questions & support
```

**Checklist:**
- [ ] Monitor for 24 hours post-deployment
- [ ] Resolve any critical issues
- [ ] Send announcement to users
- [ ] Document lessons learned

---

## 📋 SUMMARY CHECKLIST

### Must Have (Critical)
```
□ Database schema updated
□ PricingService implemented
□ API endpoints working
□ Fee calculation accurate
□ Settlement service working
□ Organizer dashboard showing fees
□ Email notifications sent
□ Mobile checkout working
```

### Should Have (Important)
```
□ Analytics page for organizer
□ Fee breakdown at checkout for customer
□ Admin dashboard reports
□ Export functionality
□ Settlement history
```

### Nice to Have (Enhancement)
```
□ Predictive revenue calculator
□ Fee comparison UI
□ Bulk settlement report
□ API rate limiting
□ Advanced analytics
```

---

## 📞 CONTACT & ESCALATION

**If you have questions about updates:**

- Backend Team: [email]
- Frontend Team: [email]
- Database Team: [email]
- QA Team: [email]
- Product Manager: [email]

**Status Page:** [link to tracking]

---

**Document Version:** 1.0  
**Last Updated:** 2 Februari 2026  
**Next Review:** After Phase 1 deployment
