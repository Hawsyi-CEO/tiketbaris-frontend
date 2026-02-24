/**
 * Routes: Pricing dan Fee Calculation
 * 
 * Endpoints untuk:
 * - Lihat daftar payment methods dengan fee info
 * - Calculate fees untuk amount tertentu
 * - Get analytics untuk event (revenue breakdown)
 */

const express = require('express');
const router = express.Router();
const PricingService = require('../services/pricingService');
const pool = require('../config/database');
const { authenticateToken, checkRole } = require('../middleware/auth');

/**
 * GET /api/pricing/methods
 * Get available payment methods with fee information
 * 
 * Response: {
 *   status: 'success',
 *   data: { gopay, shopeepay, dana, ... }
 * }
 */
router.get('/methods', (req, res) => {
  try {
    const methods = PricingService.getPaymentMethods();
    res.json({
      status: 'success',
      data: methods
    });
  } catch (error) {
    console.error('Error getting payment methods:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
});

/**
 * POST /api/pricing/calculate
 * Calculate fees for given amount and payment method
 * 
 * Body: { amount, paymentMethod }
 * 
 * Response: {
 *   status: 'success',
 *   data: {
 *     grossAmount, paymentMethod, midtransFee, platformFee,
 *     totalFee, netAmount, breakdown
 *   }
 * }
 */
router.post('/calculate', (req, res) => {
  try {
    const { amount, paymentMethod } = req.body;

    if (!amount || amount <= 0 || !paymentMethod) {
      return res.status(400).json({
        status: 'error',
        message: 'amount dan paymentMethod harus diisi dengan benar'
      });
    }

    const calculation = PricingService.calculateFees(amount, paymentMethod);
    
    res.json({
      status: 'success',
      data: calculation
    });
  } catch (error) {
    console.error('Error calculating fees:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
});

/**
 * GET /api/pricing/event/:eventId/analytics
 * Get revenue analytics for specific event with fee breakdown
 * 
 * Query params:
 * - startDate (optional): YYYY-MM-DD format
 * - endDate (optional): YYYY-MM-DD format
 * 
 * Response: {
 *   status: 'success',
 *   data: {
 *     eventId, eventTitle,
 *     analytics: {
 *       totalGross, totalMidtransFee, totalPlatformFee,
 *       totalFee, totalNet, transactionCount,
 *       feePercentage, byPaymentMethod
 *     },
 *     transactions: [...]
 *   }
 * }
 */
router.get('/event/:eventId/analytics', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { startDate, endDate } = req.query;

    const conn = await pool.getConnection();

    // Get event details untuk verify access
    const [eventData] = await conn.execute(
      'SELECT id, title, user_id FROM events WHERE id = ?',
      [eventId]
    );

    if (!eventData || eventData.length === 0) {
      await conn.release();
      return res.status(404).json({
        status: 'error',
        message: 'Event tidak ditemukan'
      });
    }

    // Verify organizer access
    if (req.user.role === 'panitia' && eventData[0].user_id !== req.user.id) {
      await conn.release();
      return res.status(403).json({
        status: 'error',
        message: 'Tidak punya akses ke event ini'
      });
    }

    // Build query untuk get transactions
    let query = `
      SELECT 
        t.id, t.total_amount as amount, t.payment_method, t.quantity,
        t.midtrans_fee_amount, t.platform_fee_amount, 
        t.total_fee_amount, t.net_amount_to_organizer,
        t.status, t.created_at,
        u.username, e.title as event_title
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN events e ON t.event_id = e.id
      WHERE t.event_id = ? AND t.status = 'completed'
    `;

    const params = [eventId];

    // Add date filters if provided
    if (startDate) {
      query += ' AND DATE(t.created_at) >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND DATE(t.created_at) <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY t.created_at DESC';

    const [transactions] = await conn.execute(query, params);
    await conn.release();

    // Calculate analytics
    const analytics = PricingService.calculateEventRevenue(transactions);

    res.json({
      status: 'success',
      data: {
        eventId: parseInt(eventId),
        eventTitle: eventData[0].title,
        dateRange: {
          start: startDate || 'all',
          end: endDate || 'all'
        },
        analytics,
        transactionCount: transactions.length,
        transactions: transactions.slice(0, 20) // Return last 20 transactions
      }
    });

  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
});

/**
 * GET /api/pricing/panitia/dashboard
 * Get pricing dashboard for authenticated organizer
 * Shows summary across all their events
 * 
 * Response: {
 *   status: 'success',
 *   data: {
 *     summary: { totalTransactions, totalGross, totalNet, ... },
 *     byEvent: [ { eventId, eventName, analytics }, ... ]
 *   }
 * }
 */
router.get('/panitia/dashboard', authenticateToken, checkRole(['panitia']), async (req, res) => {
  try {
    const userId = req.user.id;
    const conn = await pool.getConnection();

    // Get all events untuk panitia ini
    const [events] = await conn.execute(
      'SELECT id, title FROM events WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    if (!events || events.length === 0) {
      await conn.release();
      return res.json({
        status: 'success',
        data: {
          summary: {
            totalTransactions: 0,
            totalGross: 0,
            totalNet: 0,
            totalFee: 0,
            feePercentage: '0%'
          },
          byEvent: []
        }
      });
    }

    // Get analytics untuk setiap event
    const byEvent = [];
    let totalTransactions = 0;
    let totalGross = 0;
    let totalNet = 0;
    let totalMidtransFee = 0;
    let totalPlatformFee = 0;

    for (const event of events) {
      const [transactions] = await conn.execute(
        `SELECT total_amount as amount, payment_method 
         FROM transactions 
         WHERE event_id = ? AND status = 'completed'`,
        [event.id]
      );

      if (transactions.length > 0) {
        const eventAnalytics = PricingService.calculateEventRevenue(transactions);
        
        byEvent.push({
          eventId: event.id,
          eventName: event.title,
          analytics: eventAnalytics
        });

        totalTransactions += eventAnalytics.transactionCount;
        totalGross += eventAnalytics.totalGross;
        totalNet += eventAnalytics.totalNet;
        totalMidtransFee += eventAnalytics.totalMidtransFee;
        totalPlatformFee += eventAnalytics.totalPlatformFee;
      }
    }

    await conn.release();

    const totalFee = totalMidtransFee + totalPlatformFee;

    res.json({
      status: 'success',
      data: {
        summary: {
          totalTransactions,
          totalGross,
          totalMidtransFee,
          totalPlatformFee,
          totalFee,
          totalNet,
          feePercentage: totalGross > 0 ? `${((totalFee / totalGross) * 100).toFixed(2)}%` : '0%'
        },
        byEvent: byEvent.sort((a, b) => b.analytics.totalGross - a.analytics.totalGross)
      }
    });

  } catch (error) {
    console.error('Error getting pricing dashboard:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
});

module.exports = router;
