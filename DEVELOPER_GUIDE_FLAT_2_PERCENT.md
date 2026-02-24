# 🔧 DEVELOPER GUIDE: IMPLEMENTASI FLAT 2% PRICING

## 📌 QUICK START

**Model Pricing:**
- Platform komisi = 2% FLAT dari harga tiket
- Berlaku untuk SEMUA payment method
- Tidak ada variasi per metode pembayaran

```javascript
// SIMPLE FORMULA:
netAmount = grossAmount - (midtransFee + platformFee)

// Dimana:
// - midtransFee = varies per payment method (dari Midtrans)
// - platformFee = ALWAYS grossAmount * 0.02
```

---

## 🛠️ IMPLEMENTATION STEPS

### 1. Create PricingService.js

**File:** `backend/services/pricingService.js`

```javascript
class PricingService {
  /**
   * Calculate fees dengan model: Midtrans + 2% platform komisi
   * @param {number} grossAmount - Total harga tiket
   * @param {string} paymentMethod - gopay, shopeepay, dana, bank, cc, minimarket, akulaku, kredivo
   * @returns {Object} Fee breakdown
   */
  static calculateFees(grossAmount, paymentMethod) {
    if (grossAmount < 0) {
      throw new Error('Gross amount must be positive');
    }

    // 1. Calculate Midtrans fee (non-negotiable)
    const midtransFee = this.getMidtransFee(grossAmount, paymentMethod);
    
    // 2. Calculate platform fee (FLAT 2%)
    const platformFee = Math.floor(grossAmount * 0.02);
    
    // 3. Total fee
    const totalFee = midtransFee + platformFee;
    
    // 4. Net amount to organizer
    const netAmount = grossAmount - totalFee;
    
    // 5. Fee breakdown for display
    const breakdown = {
      gross: this._formatCurrency(grossAmount),
      midtrans: {
        amount: this._formatCurrency(midtransFee),
        percentage: this.getMidtransFeePercentage(paymentMethod),
        note: this.getMidtransFeeNote(paymentMethod)
      },
      platform: {
        amount: this._formatCurrency(platformFee),
        percentage: '2%',
        note: 'Platform fee (fixed)'
      },
      total: {
        amount: this._formatCurrency(totalFee),
        percentage: `${((totalFee / grossAmount) * 100).toFixed(2)}%`
      },
      net: this._formatCurrency(netAmount)
    };

    return {
      grossAmount,
      paymentMethod,
      midtransFee,
      platformFee,
      totalFee,
      netAmount,
      breakdown,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get Midtrans fee based on payment method
   */
  static getMidtransFee(amount, method) {
    switch (method) {
      // E-Wallets: 2%
      case 'gopay':
      case 'shopeepay':
      case 'kredivo':
        return Math.floor(amount * 0.02);
      
      // E-Wallets: 1.5%
      case 'dana':
      case 'akulaku':
        return Math.floor(amount * 0.015);
      
      // Credit Card: 2.9% + fixed Rp2.000
      case 'cc':
      case 'credit_card':
        return Math.floor(amount * 0.029) + 2000;
      
      // Bank Transfer: Fixed Rp4.000
      case 'bank':
      case 'transfer':
        return 4000;
      
      // Minimarket: Fixed Rp5.000
      case 'minimarket':
        return 5000;
      
      default:
        return 0;
    }
  }

  static getMidtransFeePercentage(method) {
    switch (method) {
      case 'gopay':
      case 'shopeepay':
      case 'kredivo':
        return '2%';
      case 'dana':
      case 'akulaku':
        return '1.5%';
      case 'cc':
        return '2.9% + Rp2.000';
      case 'bank':
        return 'Rp4.000 (fixed)';
      case 'minimarket':
        return 'Rp5.000 (fixed)';
      default:
        return '0%';
    }
  }

  static getMidtransFeeNote(method) {
    switch (method) {
      case 'gopay':
      case 'shopeepay':
        return 'Midtrans e-wallet fee';
      case 'dana':
      case 'akulaku':
        return 'Midtrans e-wallet fee';
      case 'bank':
        return 'Midtrans bank transfer fee';
      case 'cc':
        return 'Midtrans credit card fee';
      case 'minimarket':
        return 'Midtrans cash payment fee';
      default:
        return '';
    }
  }

  static _formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Get list of available payment methods
   */
  static getPaymentMethods() {
    return {
      gopay: { name: 'GoPay', icon: '💚', feePercentage: 4 },
      shopeepay: { name: 'ShopeePay', icon: '🧡', feePercentage: 4 },
      dana: { name: 'DANA', icon: '💜', feePercentage: 3.5 },
      akulaku: { name: 'Akulaku', icon: '🎁', feePercentage: 3.7 },
      kredivo: { name: 'Kredivo', icon: '🎀', feePercentage: 4 },
      bank: { name: 'Transfer Bank', icon: '🏦', feePercentage: 6 },
      cc: { name: 'Kartu Kredit', icon: '💳', feePercentage: 6.9 },
      minimarket: { name: 'Minimarket', icon: '🏪', feePercentage: 7 }
    };
  }

  /**
   * Calculate total revenue untuk event (aggregate multiple transactions)
   */
  static calculateEventRevenue(transactions) {
    let totalGross = 0;
    let totalMidtransFee = 0;
    let totalPlatformFee = 0;
    let totalNet = 0;

    transactions.forEach(txn => {
      const fees = this.calculateFees(txn.amount, txn.paymentMethod);
      totalGross += fees.grossAmount;
      totalMidtransFee += fees.midtransFee;
      totalPlatformFee += fees.platformFee;
      totalNet += fees.netAmount;
    });

    return {
      totalGross,
      totalMidtransFee,
      totalPlatformFee,
      totalFee: totalMidtransFee + totalPlatformFee,
      totalNet,
      transactionCount: transactions.length,
      averagePerTransaction: Math.floor(totalGross / transactions.length),
      feePercentage: `${((totalMidtransFee + totalPlatformFee) / totalGross * 100).toFixed(2)}%`
    };
  }
}

module.exports = PricingService;
```

---

### 2. Update Checkout Endpoint

**File:** `backend/routes/checkout.js` (update the transaction recording part)

```javascript
// In your transaction creation/completion handler:

const PricingService = require('../services/pricingService');

// When recording transaction after successful payment:
const feeCalculation = PricingService.calculateFees(
  totalAmount,
  paymentMethod  // dari Midtrans snap response
);

// Update database with fee information
await db.query(
  `UPDATE transactions SET 
    payment_method = ?,
    midtrans_fee_amount = ?,
    platform_fee_amount = ?,
    total_fee_amount = ?,
    net_amount_to_organizer = ?,
    fee_breakdown = ?
   WHERE id = ?`,
  [
    paymentMethod,
    feeCalculation.midtransFee,
    feeCalculation.platformFee,
    feeCalculation.totalFee,
    feeCalculation.netAmount,
    JSON.stringify(feeCalculation.breakdown),
    transactionId
  ]
);

// Log to audit trail
await db.query(
  `INSERT INTO transactions_fee_audit 
   (transaction_id, gross_amount, payment_method, midtrans_fee, platform_fee, net_amount)
   VALUES (?, ?, ?, ?, ?, ?)`,
  [
    transactionId,
    totalAmount,
    paymentMethod,
    feeCalculation.midtransFee,
    feeCalculation.platformFee,
    feeCalculation.netAmount
  ]
);
```

---

### 3. Create API Endpoint

**File:** `backend/routes/pricing.js`

```javascript
const express = require('express');
const router = express.Router();
const PricingService = require('../services/pricingService');
const db = require('../utils/database');
const authMiddleware = require('../middleware/auth');

/**
 * GET /api/pricing/methods
 * Get available payment methods with fee info
 */
router.get('/methods', (req, res) => {
  try {
    const methods = PricingService.getPaymentMethods();
    res.json({
      status: 'success',
      data: methods
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * POST /api/pricing/calculate
 * Calculate fees for given amount and payment method
 */
router.post('/calculate', (req, res) => {
  try {
    const { amount, paymentMethod } = req.body;

    if (!amount || !paymentMethod) {
      return res.status(400).json({
        status: 'error',
        message: 'amount and paymentMethod are required'
      });
    }

    const calculation = PricingService.calculateFees(amount, paymentMethod);
    
    res.json({
      status: 'success',
      data: calculation
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * GET /api/pricing/event/:eventId/analytics
 * Get revenue analytics for specific event
 */
router.get('/event/:eventId/analytics', authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;

    // Get all completed transactions for this event
    const [transactions] = await db.query(
      `SELECT amount, payment_method FROM transactions 
       WHERE event_id = ? AND status = 'completed'`,
      [eventId]
    );

    const analytics = PricingService.calculateEventRevenue(transactions);

    res.json({
      status: 'success',
      data: {
        eventId,
        analytics,
        transactionDetails: transactions
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * GET /api/pricing/panitia/dashboard
 * Get pricing dashboard for authenticated organizer
 */
router.get('/panitia/dashboard', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all events for this organizer
    const [events] = await db.query(
      `SELECT id, name FROM events WHERE organizer_id = ?`,
      [userId]
    );

    // Get analytics for each event
    const dashboardData = await Promise.all(
      events.map(async (event) => {
        const [transactions] = await db.query(
          `SELECT amount, payment_method FROM transactions 
           WHERE event_id = ? AND status = 'completed'`,
          [event.id]
        );

        const analytics = PricingService.calculateEventRevenue(transactions);
        return {
          event: event.name,
          analytics
        };
      })
    );

    // Aggregate total
    const totalTransactions = dashboardData.reduce(
      (sum, d) => sum + d.analytics.transactionCount, 0
    );
    const totalGross = dashboardData.reduce(
      (sum, d) => sum + d.analytics.totalGross, 0
    );
    const totalNet = dashboardData.reduce(
      (sum, d) => sum + d.analytics.totalNet, 0
    );

    res.json({
      status: 'success',
      data: {
        organizer_id: userId,
        summary: {
          totalTransactions,
          totalGross,
          totalNet,
          totalFee: totalGross - totalNet
        },
        byEvent: dashboardData
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
```

---

### 4. Register Route in server.js

```javascript
// In your main server.js file:

const pricingRouter = require('./routes/pricing');
app.use('/api/pricing', pricingRouter);
```

---

## 🧪 TESTING

### Unit Test Example

```javascript
const PricingService = require('../services/pricingService');

describe('PricingService - Flat 2% Commission', () => {
  
  test('should calculate GoPay fee correctly', () => {
    const result = PricingService.calculateFees(100000, 'gopay');
    
    expect(result.grossAmount).toBe(100000);
    expect(result.midtransFee).toBe(2000);     // 2%
    expect(result.platformFee).toBe(2000);     // 2% ← ALWAYS
    expect(result.totalFee).toBe(4000);        // 4% total
    expect(result.netAmount).toBe(96000);
  });

  test('should always charge 2% platform fee', () => {
    const methods = ['gopay', 'shopeepay', 'dana', 'bank', 'cc', 'minimarket'];
    
    methods.forEach(method => {
      const result = PricingService.calculateFees(100000, method);
      expect(result.platformFee).toBe(2000);  // Must always be 2000 (2%)
    });
  });

  test('should handle different amounts', () => {
    const result50k = PricingService.calculateFees(50000, 'gopay');
    expect(result50k.platformFee).toBe(1000);  // 2% of 50k

    const result500k = PricingService.calculateFees(500000, 'gopay');
    expect(result500k.platformFee).toBe(10000); // 2% of 500k
  });

  test('should aggregate multiple transactions', () => {
    const transactions = [
      { amount: 100000, paymentMethod: 'gopay' },
      { amount: 100000, paymentMethod: 'gopay' },
      { amount: 100000, paymentMethod: 'dana' }
    ];

    const revenue = PricingService.calculateEventRevenue(transactions);
    
    expect(revenue.totalGross).toBe(300000);
    expect(revenue.totalPlatformFee).toBe(6000);  // 2% of 300k
    expect(revenue.totalNet).toBe(288500);
  });
});
```

---

## 📊 API RESPONSE EXAMPLES

### POST /api/pricing/calculate

**Request:**
```json
{
  "amount": 100000,
  "paymentMethod": "gopay"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "grossAmount": 100000,
    "paymentMethod": "gopay",
    "midtransFee": 2000,
    "platformFee": 2000,
    "totalFee": 4000,
    "netAmount": 96000,
    "breakdown": {
      "gross": "Rp100.000",
      "midtrans": {
        "amount": "Rp2.000",
        "percentage": "2%",
        "note": "Midtrans e-wallet fee"
      },
      "platform": {
        "amount": "Rp2.000",
        "percentage": "2%",
        "note": "Platform fee (fixed)"
      },
      "total": {
        "amount": "Rp4.000",
        "percentage": "4%"
      },
      "net": "Rp96.000"
    },
    "timestamp": "2026-02-02T10:30:00.000Z"
  }
}
```

---

## 📝 DATABASE MIGRATION

```sql
-- Add columns ke transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS (
  payment_method VARCHAR(50),
  midtrans_fee_amount INT DEFAULT 0,
  platform_fee_amount INT DEFAULT 0,
  total_fee_amount INT DEFAULT 0,
  net_amount_to_organizer INT DEFAULT 0,
  fee_breakdown JSON
);

-- Create audit table
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
  INDEX idx_transaction (transaction_id)
);
```

---

## ✅ DEPLOYMENT CHECKLIST

- [ ] Create PricingService.js
- [ ] Update checkout.js endpoint
- [ ] Create pricing.js route
- [ ] Register route in server.js
- [ ] Run database migration
- [ ] Write unit tests
- [ ] Test API endpoints with Postman
- [ ] Verify database records
- [ ] Deploy to staging
- [ ] Verify in production
- [ ] Monitor for errors

---

**Implementation Version:** 1.0  
**Effective Date:** 1 Maret 2026
