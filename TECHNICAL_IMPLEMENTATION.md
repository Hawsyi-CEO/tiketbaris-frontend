# 💻 TECHNICAL IMPLEMENTATION GUIDE

## STRUKTUR IMPLEMENTASI DI BACKEND

### 1. Configuration File (Environment Variables)

**File: `.env` atau `config/pricing.json`**

```env
# MIDTRANS FEES (tidak bisa diubah)
MIDTRANS_FEE_GOPAY=2                    # percentage
MIDTRANS_FEE_SHOPEEPAY=2                # percentage
MIDTRANS_FEE_DANA=1.5                   # percentage
MIDTRANS_FEE_BANK=4000                  # fixed rupiah
MIDTRANS_FEE_CC_PERCENTAGE=2.9          # percentage
MIDTRANS_FEE_CC_FIXED=2000              # fixed rupiah
MIDTRANS_FEE_MINIMARKET=5000            # fixed rupiah
MIDTRANS_FEE_AKULAKU=1.7                # percentage
MIDTRANS_FEE_KREDIVO=2                  # percentage

# PLATFORM COMMISSION (bisa diubah)
PLATFORM_COMMISSION_GOPAY=1.5           # percentage
PLATFORM_COMMISSION_SHOPEEPAY=1.5       # percentage
PLATFORM_COMMISSION_DANA=1.5            # percentage
PLATFORM_COMMISSION_BANK=3000           # fixed rupiah
PLATFORM_COMMISSION_CC_PERCENTAGE=2.5   # percentage
PLATFORM_COMMISSION_CC_FIXED=0          # fixed rupiah
PLATFORM_COMMISSION_MINIMARKET=2000     # fixed rupiah
PLATFORM_COMMISSION_AKULAKU=1.7         # percentage
PLATFORM_COMMISSION_KREDIVO=1.7         # percentage

# SETTLEMENT
SETTLEMENT_DELAY_DAYS=1                 # Settlement dalam 1 hari kerja
ENABLE_INSTANT_SETTLEMENT=false         # Untuk organizer premium nanti
```

---

### 2. Pricing Calculation Service

**File: `backend/services/pricingService.js`**

```javascript
class PricingService {
  /**
   * Payment method fee structure
   */
  static paymentMethods = {
    gopay: { 
      name: 'GoPay',
      midtransType: 'percent',
      midtransRate: 2,
      platformType: 'percent',
      platformRate: 1.5
    },
    shopeepay: {
      name: 'ShopeePay',
      midtransType: 'percent',
      midtransRate: 2,
      platformType: 'percent',
      platformRate: 1.5
    },
    dana: {
      name: 'DANA',
      midtransType: 'percent',
      midtransRate: 1.5,
      platformType: 'percent',
      platformRate: 1.5
    },
    bank: {
      name: 'Transfer Bank',
      midtransType: 'fixed',
      midtransRate: 4000,
      platformType: 'fixed',
      platformRate: 3000
    },
    cc: {
      name: 'Kartu Kredit',
      midtransType: 'mixed',
      midtransPercentage: 2.9,
      midtransFixed: 2000,
      platformType: 'percent',
      platformRate: 2.5
    },
    minimarket: {
      name: 'Minimarket',
      midtransType: 'fixed',
      midtransRate: 5000,
      platformType: 'fixed',
      platformRate: 2000
    },
    akulaku: {
      name: 'Akulaku',
      midtransType: 'percent',
      midtransRate: 1.7,
      platformType: 'percent',
      platformRate: 1.7
    },
    kredivo: {
      name: 'Kredivo',
      midtransType: 'percent',
      midtransRate: 2,
      platformType: 'percent',
      platformRate: 1.7
    }
  };

  /**
   * Calculate all fees for a transaction
   * @param {number} amount - Nominal transaksi
   * @param {string} paymentMethod - Metode pembayaran
   * @returns {object} Fee breakdown
   */
  static calculateFees(amount, paymentMethod) {
    const method = this.paymentMethods[paymentMethod];
    
    if (!method) {
      throw new Error(`Unknown payment method: ${paymentMethod}`);
    }

    let midtransFee = 0;
    let platformFee = 0;

    // Hitung Midtrans Fee
    if (method.midtransType === 'percent') {
      midtransFee = Math.round((amount * method.midtransRate) / 100);
    } else if (method.midtransType === 'fixed') {
      midtransFee = method.midtransRate;
    } else if (method.midtransType === 'mixed') {
      midtransFee = Math.round((amount * method.midtransPercentage) / 100) + method.midtransFixed;
    }

    // Hitung Platform Fee
    if (method.platformType === 'percent') {
      platformFee = Math.round((amount * method.platformRate) / 100);
    } else if (method.platformType === 'fixed') {
      platformFee = method.platformRate;
    }

    const totalFee = midtransFee + platformFee;
    const netAmount = amount - totalFee;
    const feePercentage = ((totalFee / amount) * 100).toFixed(2);

    return {
      originalAmount: amount,
      midtransFee,
      platformFee,
      totalFee,
      netAmount,
      feePercentage,
      breakdown: {
        method: method.name,
        paymentType: paymentMethod,
        grossAmount: amount,
        midtransBreakdown: {
          type: method.midtransType,
          amount: midtransFee,
          percentage: method.midtransType === 'percent' ? method.midtransRate : null
        },
        platformBreakdown: {
          type: method.platformType,
          amount: platformFee,
          percentage: method.platformType === 'percent' ? method.platformRate : null
        },
        netForOrganizer: netAmount
      }
    };
  }

  /**
   * Calculate fees for multiple transactions
   * @param {array} transactions - Array of transactions
   * @returns {object} Aggregated stats
   */
  static calculateAggregated(transactions) {
    let totalGross = 0;
    let totalMidtrans = 0;
    let totalPlatform = 0;
    const methodBreakdown = {};

    transactions.forEach(txn => {
      const fees = this.calculateFees(txn.amount, txn.paymentMethod);
      
      totalGross += txn.amount;
      totalMidtrans += fees.midtransFee;
      totalPlatform += fees.platformFee;

      // Group by method
      if (!methodBreakdown[txn.paymentMethod]) {
        methodBreakdown[txn.paymentMethod] = {
          count: 0,
          gross: 0,
          midtrans: 0,
          platform: 0
        };
      }
      
      methodBreakdown[txn.paymentMethod].count++;
      methodBreakdown[txn.paymentMethod].gross += txn.amount;
      methodBreakdown[txn.paymentMethod].midtrans += fees.midtransFee;
      methodBreakdown[txn.paymentMethod].platform += fees.platformFee;
    });

    const totalFees = totalMidtrans + totalPlatform;
    const netForOrganizers = totalGross - totalFees;

    return {
      summary: {
        totalTransactions: transactions.length,
        totalGross,
        totalMidtransFees: totalMidtrans,
        totalPlatformFees: totalPlatform,
        totalFees,
        netForOrganizers,
        averageFeePercentage: ((totalFees / totalGross) * 100).toFixed(2)
      },
      methodBreakdown,
      transactions: transactions.map(txn => ({
        ...txn,
        fees: this.calculateFees(txn.amount, txn.paymentMethod)
      }))
    };
  }

  /**
   * Get available payment methods
   */
  static getPaymentMethods() {
    return Object.entries(this.paymentMethods).map(([key, value]) => ({
      id: key,
      name: value.name,
      midtransRate: value.midtransType === 'percent' ? value.midtransRate : null,
      platformRate: value.platformType === 'percent' ? value.platformRate : null
    }));
  }
}

module.exports = PricingService;
```

---

### 3. Transaction Recording (Database)

**File: `backend/migrations/add_fee_columns.sql`**

```sql
-- Add fee tracking columns ke transactions table
ALTER TABLE transactions ADD COLUMN (
  midtrans_fee_amount INT NOT NULL DEFAULT 0 COMMENT 'Biaya Midtrans',
  platform_fee_amount INT NOT NULL DEFAULT 0 COMMENT 'Biaya Platform',
  total_fee_amount INT NOT NULL DEFAULT 0 COMMENT 'Total Fee (Midtrans + Platform)',
  net_amount INT NOT NULL DEFAULT 0 COMMENT 'Uang ke Organizer',
  payment_method VARCHAR(50) COMMENT 'Payment method code',
  fee_breakdown JSON COMMENT 'Detailed fee breakdown',
  
  -- Indexes untuk query cepat
  INDEX idx_payment_method (payment_method),
  INDEX idx_fee_tracking (midtrans_fee_amount, platform_fee_amount)
);

-- Create transactions_fees table untuk audit trail
CREATE TABLE transactions_fees (
  id INT PRIMARY KEY AUTO_INCREMENT,
  transaction_id INT NOT NULL,
  midtrans_fee INT NOT NULL,
  platform_fee INT NOT NULL,
  total_fee INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (transaction_id) REFERENCES transactions(id),
  INDEX idx_transaction (transaction_id)
);
```

---

### 4. API Endpoint untuk Pricing Info

**File: `backend/routes/pricing.js`**

```javascript
const express = require('express');
const router = express.Router();
const PricingService = require('../services/pricingService');
const { authenticateToken } = require('../middleware/auth');
const pool = require('../config/database');

/**
 * GET /api/pricing/methods
 * Get all available payment methods with fee info
 */
router.get('/methods', (req, res) => {
  try {
    const methods = PricingService.getPaymentMethods();
    res.json({
      success: true,
      data: methods
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/pricing/calculate
 * Calculate fees for a transaction
 */
router.post('/calculate', (req, res) => {
  try {
    const { amount, paymentMethod } = req.body;
    
    if (!amount || !paymentMethod) {
      return res.status(400).json({ 
        error: 'Amount dan payment method harus diisi' 
      });
    }

    const fees = PricingService.calculateFees(amount, paymentMethod);
    
    res.json({
      success: true,
      data: fees
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/pricing/event/:eventId/analytics
 * Get pricing analytics for an event
 */
router.get('/event/:eventId/analytics', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    // Get all completed transactions for this event
    const [transactions] = await pool.execute(
      `SELECT id, total_amount, payment_method, status
       FROM transactions
       WHERE event_id = ? AND user_id = ? AND status = 'completed'
       ORDER BY created_at DESC`,
      [eventId, userId]
    );

    if (transactions.length === 0) {
      return res.json({
        success: true,
        data: {
          summary: {
            totalTransactions: 0,
            totalGross: 0,
            totalFees: 0,
            netForOrganizer: 0
          },
          methodBreakdown: {}
        }
      });
    }

    // Calculate all fees
    const txnsForCalculation = transactions.map(txn => ({
      amount: txn.total_amount,
      paymentMethod: txn.payment_method || 'gopay' // Default
    }));

    const analytics = PricingService.calculateAggregated(txnsForCalculation);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/pricing/calculator
 * Get calculator info for frontend
 */
router.get('/calculator', (req, res) => {
  try {
    const methods = PricingService.getPaymentMethods();
    const paymentMethods = {};
    
    methods.forEach(method => {
      paymentMethods[method.id] = {
        name: method.name,
        midtransRate: method.midtransRate,
        platformRate: method.platformRate
      };
    });

    res.json({
      success: true,
      data: {
        paymentMethods,
        description: 'Fee breakdown untuk pricing calculator'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

---

### 5. Integration dengan Checkout

**File: `backend/routes/checkout.js` (Modified)**

```javascript
// ... existing code ...

// Record transaction dengan fee breakdown
router.post('/process', authenticateToken, checkRole(['user']), async (req, res) => {
  try {
    const { eventId, quantity, paymentMethod = 'gopay' } = req.body;
    
    // ... validation ...

    const totalPrice = event.price * quantity;
    
    // Calculate fees
    const feeBreakdown = PricingService.calculateFees(totalPrice, paymentMethod);
    
    // ... create transaction di Midtrans ...

    // Record ke database dengan fee info
    const [transResult] = await conn.execute(
      `INSERT INTO transactions 
       (midtrans_order_id, user_id, event_id, quantity, unit_price, total_amount, 
        final_amount, payment_method, status, 
        midtrans_fee_amount, platform_fee_amount, total_fee_amount, net_amount,
        fee_breakdown)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId, userId, eventId, quantity, event.price, totalPrice,
        totalPrice, paymentMethod, 'pending',
        feeBreakdown.midtransFee,
        feeBreakdown.platformFee,
        feeBreakdown.totalFee,
        feeBreakdown.netAmount,
        JSON.stringify(feeBreakdown.breakdown)
      ]
    );

    // ... rest of code ...
  } catch (error) {
    // ... error handling ...
  }
});
```

---

### 6. Real-time Dashboard Query

**File: `backend/routes/organizer-analytics.js`**

```javascript
router.get('/revenue-analytics', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { eventId, period = 'month' } = req.query; // month, week, year, all

    let dateFilter = '';
    if (period === 'month') {
      dateFilter = 'AND DATE(t.created_at) >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)';
    } else if (period === 'week') {
      dateFilter = 'AND DATE(t.created_at) >= DATE_SUB(CURDATE(), INTERVAL 1 WEEK)';
    }

    const query = `
      SELECT 
        e.id as event_id,
        e.title as event_title,
        COUNT(t.id) as transaction_count,
        SUM(t.total_amount) as gross_revenue,
        SUM(t.midtrans_fee_amount) as total_midtrans_fees,
        SUM(t.platform_fee_amount) as total_platform_fees,
        SUM(t.total_fee_amount) as total_fees,
        SUM(t.net_amount) as net_revenue,
        GROUP_CONCAT(DISTINCT t.payment_method) as payment_methods
      FROM transactions t
      JOIN events e ON t.event_id = e.id
      WHERE e.user_id = ? AND t.status = 'completed'
      ${eventId ? 'AND e.id = ?' : ''}
      ${dateFilter}
      GROUP BY e.id, e.title
      ORDER BY e.created_at DESC
    `;

    const params = [userId];
    if (eventId) params.push(eventId);

    const [results] = await pool.execute(query, params);

    // Format response
    const data = results.map(row => ({
      eventId: row.event_id,
      eventTitle: row.event_title,
      transactionCount: row.transaction_count,
      grossRevenue: row.gross_revenue,
      midtransFeesTotal: row.total_midtrans_fees,
      platformFeesTotal: row.total_platform_fees,
      totalFeesDeducted: row.total_fees,
      netRevenueToOrganizer: row.net_revenue,
      averageFeePercentage: ((row.total_fees / row.gross_revenue) * 100).toFixed(2),
      paymentMethods: row.payment_methods.split(',')
    }));

    res.json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

### 7. Webhook Midtrans (Update dengan Fee)

**File: `backend/routes/midtrans-payment.js` (Modified)**

```javascript
router.post('/webhook', async (req, res) => {
  try {
    const notification = req.body;
    const orderId = notification.order_id;

    // ... existing validation ...

    // Get transaction dengan payment method
    const [transactions] = await pool.execute(
      'SELECT * FROM transactions WHERE midtrans_order_id = ?',
      [orderId]
    );

    const transaction = transactions[0];
    const paymentMethod = transaction.payment_method || 'gopay';

    // Recalculate fees (untuk validasi)
    const feeBreakdown = PricingService.calculateFees(
      transaction.total_amount,
      paymentMethod
    );

    // Update transaction dengan fee info jika belum ada
    if (!transaction.fee_breakdown) {
      await pool.execute(
        `UPDATE transactions 
         SET midtrans_fee_amount = ?,
             platform_fee_amount = ?,
             total_fee_amount = ?,
             net_amount = ?,
             fee_breakdown = ?
         WHERE id = ?`,
        [
          feeBreakdown.midtransFee,
          feeBreakdown.platformFee,
          feeBreakdown.totalFee,
          feeBreakdown.netAmount,
          JSON.stringify(feeBreakdown.breakdown),
          transaction.id
        ]
      );
    }

    // ... rest of webhook processing ...
  } catch (error) {
    // ... error handling ...
  }
});
```

---

## DEPLOYMENT STEPS

### 1. Database Migration
```bash
# Run migration untuk add fee columns
mysql -u root -p database_name < backend/migrations/add_fee_columns.sql
```

### 2. Backend Updates
```bash
# Copy new files
cp backend/services/pricingService.js server/services/

# Install dependencies jika diperlukan
npm install

# Restart server
pm2 restart tiketbaris-backend
```

### 3. Frontend Updates
```bash
# Copy components
cp frontend/src/components/PricingCalculator.jsx server/frontend/src/components/
cp frontend/src/components/PaymentInfo.jsx server/frontend/src/components/
cp frontend/src/pages/PricingAnalytics.jsx server/frontend/src/pages/

# Build
npm run build

# Deploy
pm2 restart tiketbaris-frontend
```

---

**Status:** Ready for Production
**Last Updated:** 2 Februari 2026
