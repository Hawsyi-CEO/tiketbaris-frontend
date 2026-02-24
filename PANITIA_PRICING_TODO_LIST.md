# 📋 TODO LIST & ANALYSIS - PANITIA PRICING UPDATE

## ✅ STATUS: INITIAL EXPLORATION COMPLETE

Saya sudah explore code di VPS Anda. Berikut hasil analisa dan todo list untuk update Panitia pricing feature.

---

## 🔍 FINDINGS - CODE STRUCTURE

### Backend Current:
- ✅ **checkout.js** - Payment processing dengan enabledPayments (QRIS fix sudah ada)
- ✅ **panitia.js** - Panitia endpoints (events, profile, tickets, etc)
- ✅ **transactions table** - Ada, tapi belum ada fee columns

### Frontend Current:
- ✅ **DashboardPanitiaResponsive.jsx** - Main dashboard (1220 lines)
  - Tabs: dashboard, events, scan, reports, profile
  - Fungsi: event management, ticket scanning, basic display
  - ❌ TIDAK ADA: revenue summary, fee breakdown, analytics
  
### Database Current:
- ✅ Transactions table ada dengan: midtrans_order_id, user_id, event_id, quantity, unit_price, total_amount, final_amount, status
- ❌ MISSING: platform_fee_amount, midtrans_fee_amount, total_fee_amount, net_amount_to_organizer, payment_method, fee_breakdown

---

## 📊 CHANGES NEEDED (11 TASKS)

### PHASE 1: DATABASE & BACKEND SETUP (3 tasks)

#### Task 1: Database Schema Update ⚠️ CRITICAL
**SQL Migration:**
```sql
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS (
  payment_method VARCHAR(50) COMMENT 'gopay, shopeepay, dana, bank, cc, minimarket, akulaku, kredivo',
  platform_fee_amount INT DEFAULT 0 COMMENT 'Komisi platform 2%',
  midtrans_fee_amount INT DEFAULT 0 COMMENT 'Biaya Midtrans (varies per method)',
  total_fee_amount INT DEFAULT 0 COMMENT 'Total semua fee',
  net_amount_to_organizer INT DEFAULT 0 COMMENT 'Uang yang diterima panitia',
  fee_breakdown JSON COMMENT 'Breakdown detail untuk display'
);
```

**Status:** ⚠️ PENDING USER APPROVAL
**Action:** Boleh tidak kami add columns ini? Ini penting untuk track komisi 2%.

---

#### Task 2: Create PricingService.js
**Location:** `backend/services/pricingService.js`
**Size:** ~400 lines
**Dari:** DEVELOPER_GUIDE_FLAT_2_PERCENT.md (ready to copy)

**Methods:**
- `calculateFees(amount, paymentMethod)` - Calculate 2% flat + Midtrans fee
- `getMidtransFee(amount, method)` - Get Midtrans fee per method
- `getPaymentMethods()` - List available methods
- `calculateEventRevenue(transactions)` - Aggregate fees

**Status:** ⏳ READY TO IMPLEMENT

---

#### Task 3: Create pricing.js Route
**Location:** `backend/routes/pricing.js`
**Size:** ~300 lines
**Dari:** DEVELOPER_GUIDE_FLAT_2_PERCENT.md (ready to copy)

**Endpoints:**
- `GET /api/pricing/methods` - Available payment methods
- `POST /api/pricing/calculate` - Calculate fees for amount
- `GET /api/pricing/event/:eventId/analytics` - Event revenue analytics

**Status:** ⏳ READY TO IMPLEMENT

---

### PHASE 2: BACKEND INTEGRATION (2 tasks)

#### Task 4: Update checkout.js
**Current:** Sudah ada enabledPayments untuk QRIS
**Perlu Ditambah:**
- Import PricingService
- Saat transaksi berhasil: calculate fees
- Simpan ke transactions table
- Simpan payment_method dari Midtrans

**Lines Affected:** ~20-30 lines baru di area INSERT transaksi
**Status:** ⏳ READY TO IMPLEMENT

---

#### Task 5: Create Revenue Endpoint (panitia.js)
**Endpoints Baru:**
- `GET /api/panitia/revenue` - Dashboard summary
  - total_sold, total_platform_fee, total_net, by_payment_method
  
- `GET /api/panitia/event/:eventId/revenue` - Per-event detail
  - Same breakdown tapi per event

**Lines:** ~100 lines SQL + logic
**Status:** ⏳ READY TO IMPLEMENT

---

### PHASE 3: FRONTEND UPDATES (3 tasks)

#### Task 6: Update Panitia Dashboard
**File:** `frontend/src/pages/panitia/DashboardPanitiaResponsive.jsx` (1220 lines)

**Add Sections:**
1. **Revenue Summary Card:**
   - Total Penjualan: Rp XXX.XXX.XXX
   - Komisi Platform (2%): Rp X.XXX.XXX
   - Total Fee: Rp X.XXX.XXX
   - Uang Masuk: Rp XX.XXX.XXX

2. **Payment Method Breakdown:**
   - Pie chart / table showing breakdown
   - GoPay: X tiket, Rp XXX, Fee Rp XXX
   - DANA: X tiket, Rp XXX, Fee Rp XXX
   - Dll

3. **Recent Transactions Table:**
   - Tanggal, Event, Metode, Gross, Fee Platform, Fee Midtrans, Net
   - Show 10 recent transactions

4. **Link ke Detail Analytics:**
   - Button "View Detailed Analytics"

**Status:** ⏳ READY - CODE READY

---

#### Task 7: Create RevenueAnalytics Component
**Location:** `frontend/src/pages/panitia/RevenueAnalytics.jsx`
**Size:** ~800 lines

**Features:**
- Event selector
- Date range filter
- Payment method breakdown with charts
- Fee comparison visualization
- Export to CSV

**Status:** ⏳ READY - BASED ON EXISTING PricingAnalytics.jsx

---

#### Task 8: Update Event List Display
**File:** `DashboardPanitiaResponsive.jsx` (events tab)

**Add:**
- Revenue per event column
- Quick stat: total sold, net earnings
- Color coding: green if above target, red if below

**Status:** ⏳ SIMPLE UPDATE

---

### PHASE 4: TESTING (1 task)

#### Task 9: End-to-End Testing
**Scenarios:**
1. Create event Rp 100.000 x 10 tiket
2. Simulate payment dengan GoPay (expect 4% fee)
3. Check transaction recorded dengan fee benar
4. Check dashboard summary accuracy
5. Check analytics calculation
6. Repeat dengan DANA, Bank Transfer, CC

**Status:** ⏳ AFTER IMPLEMENTATION

---

### PHASE 5: DEPLOYMENT (1 task)

#### Task 10: Deploy to Production VPS
**Steps:**
1. Backup database
2. Run migration SQL
3. Deploy backend (services, routes, updated checkout)
4. Deploy frontend (components, pages)
5. Register new route di server.js
6. Restart PM2
7. Test di production
8. Monitor errors 24 jam

**Status:** ⏳ FINAL STEP

---

## 🎯 PRIORITY & SEQUENCE

```
CRITICAL (Must do first):
1. ✅ Database migration (fees columns)
2. ✅ PricingService.js
3. ✅ Update checkout.js

HIGH (Next):
4. ✅ pricing.js route
5. ✅ Revenue endpoint
6. ✅ Dashboard update

MEDIUM (Can do after):
7. ✅ RevenueAnalytics component
8. ✅ Event list update

FINAL:
9. ✅ Testing
10. ✅ Production deployment
```

---

## ⚠️ IMPORTANT - THINGS TO CONFIRM

### Q1: Database Changes - APPROVAL NEEDED
**Question:** Boleh kami add 5 kolom baru ke transactions table?
- platform_fee_amount
- midtrans_fee_amount
- total_fee_amount
- net_amount_to_organizer
- payment_method
- fee_breakdown (JSON)

**Why:** Critical untuk track komisi 2% per transaksi dan calculate panitia earnings.

**Impact:** ✅ MINIMAL - hanya add columns, tidak delete/modify existing data

**Your Input Needed:** Yes/No

---

### Q2: Register New Routes - CONFIRMATION
**New Routes to Add di server.js:**
- `/api/pricing` - pricing route (3 endpoints)
- `/api/panitia/revenue` - dashboard endpoint

**Impact:** ✅ NO BREAKING CHANGES

**Your Input Needed:** Confirm OK?

---

## 📈 IMPLEMENTATION TIMELINE

```
IF APPROVED:
┌─────────────────────────────────────────┐
│ Day 1: Database + Backend (Tasks 1-5)   │
│ - Migration SQL
│ - PricingService.js
│ - pricing.js route
│ - Update checkout.js
│ - Revenue endpoint
├─────────────────────────────────────────┤
│ Day 2: Frontend (Tasks 6-8)             │
│ - Dashboard update
│ - RevenueAnalytics component
│ - Event list update
│ - Build & test locally
├─────────────────────────────────────────┤
│ Day 3: Testing & Deploy (Tasks 9-10)    │
│ - E2E testing
│ - Deployment
│ - Monitoring
└─────────────────────────────────────────┘

Estimate: 3 days untuk FULL implementation
```

---

## 📂 FILES YANG AKAN DI-CREATE/UPDATE

### CREATE (4 files):
- ✨ `backend/services/pricingService.js` - NEW
- ✨ `backend/routes/pricing.js` - NEW
- ✨ `frontend/src/pages/panitia/RevenueAnalytics.jsx` - NEW
- (Optional) Database migration file - NEW

### UPDATE (3 files):
- ✏️ `backend/routes/checkout.js` - Add fee calculation
- ✏️ `backend/routes/panitia.js` - Add revenue endpoint
- ✏️ `frontend/src/pages/panitia/DashboardPanitiaResponsive.jsx` - Add revenue sections
- ✏️ `backend/server.js` - Register new routes

### NO CHANGE (Critical files - SAFE):
- ✅ `auth.js` - UNTOUCHED
- ✅ `events.js` - UNTOUCHED (only read for analytics)
- ✅ `users.js` - UNTOUCHED
- ✅ Other critical files - SAFE

---

## ✅ NEXT STEPS

### IMMEDIATE:
1. **Review** todo list ini
2. **Approve/Reject**:
   - ✅ Database changes (add fee columns)
   - ✅ New routes & endpoints
   - ✅ Timeline 3 days
3. **Tell me:** Ready to start? Any changes?

### THEN:
- Saya akan start implementation secara bertahap
- Update per task, minta confirmation sebelum deploy
- Jangan ubah hal penting tanpa tanya

---

## 💡 NOTES

**Database Columns:**
- Safe to add (tidak menghapus/mengubah existing)
- Bisa di-rollback jika ada issue
- Critical untuk fee calculation

**Code:**
- Ready to copy-paste dari DEVELOPER_GUIDE_FLAT_2_PERCENT.md
- Sudah di-test logic-nya
- Tinggal di-integrate

**Risk Level:** 🟢 LOW
- No breaking changes
- Backward compatible
- Hanya add new features

---

**Waiting for your approval to start! 🚀**
