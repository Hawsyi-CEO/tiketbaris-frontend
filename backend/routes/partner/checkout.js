/**
 * Partner Checkout API
 * 
 * Handles checkout and payment processing for partner integrations
 * Uses Tiket Baris Midtrans account - money goes to Tiket Baris
 */

const express = require('express');
const router = express.Router();
const midtransClient = require('midtrans-client');
const pool = require('../../config/database');
const { authenticatePartnerUser } = require('../../middleware/partnerAuth');
const { sendPartnerWebhook } = require('../../services/partnerWebhook');

// Initialize Midtrans Snap
const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY
});

/**
 * POST /api/partner/checkout
 * Create checkout transaction and return Midtrans snap token
 * 
 * Body:
 *   event_id: number (required)
 *   quantity: number (required)
 *   partner_order_id: string (optional - external order ID from partner)
 */
router.post('/', authenticatePartnerUser, async (req, res) => {
  try {
    const { event_id, quantity, partner_order_id } = req.body;

    if (!event_id || !quantity || quantity < 1) {
      return res.status(400).json({
        error: 'Invalid request',
        required: ['event_id', 'quantity (min: 1)']
      });
    }

    const conn = await pool.getConnection();

    try {
      // Get event details
      const [events] = await conn.execute(
        `SELECT e.*, u.email as organizer_email
         FROM events e
         LEFT JOIN users u ON e.user_id = u.id
         WHERE e.id = ? AND e.status = 'active'`,
        [event_id]
      );

      if (events.length === 0) {
        return res.status(404).json({ error: 'Event not found or not active' });
      }

      const event = events[0];

      // Check stock
      if (event.current_stock < quantity) {
        return res.status(400).json({
          error: 'Insufficient stock',
          available: event.current_stock,
          requested: quantity
        });
      }

      // Check if event date has passed
      const eventDate = new Date(event.date);
      if (eventDate < new Date()) {
        return res.status(400).json({ error: 'Event has already passed' });
      }

      // Calculate totals
      const unitPrice = event.price;
      const totalAmount = unitPrice * quantity;

      // Generate order ID
      const orderId = `PARTNER-${req.partner.code}-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      // Create transaction record
      const [transResult] = await conn.execute(
        `INSERT INTO transactions 
         (midtrans_order_id, user_id, event_id, quantity, unit_price, total_amount, 
          final_amount, status, partner_id, partner_user_id, partner_order_id, expired_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))`,
        [
          orderId,
          req.partnerUser.internal_user_id,
          event_id,
          quantity,
          unitPrice,
          totalAmount,
          totalAmount,
          req.partner.id,
          req.partnerUser.id,
          partner_order_id || null
        ]
      );

      const transactionId = transResult.insertId;

      // Create Midtrans transaction
      const midtransParams = {
        transaction_details: {
          order_id: orderId,
          gross_amount: totalAmount
        },
        item_details: [{
          id: event_id.toString(),
          price: unitPrice,
          quantity: quantity,
          name: event.title.substring(0, 50),
          brand: 'Tiket Baris',
          category: event.category || 'Event'
        }],
        customer_details: {
          first_name: req.partnerUser.external_name.split(' ')[0],
          last_name: req.partnerUser.external_name.split(' ').slice(1).join(' ') || '',
          email: req.partnerUser.external_email,
          phone: req.partnerUser.external_phone || ''
        },
        enabled_payments: [
          'credit_card', 'bca_va', 'bni_va', 'bri_va', 'permata_va',
          'echannel', 'gopay', 'shopeepay', 'qris', 'indomaret', 'alfamart'
        ],
        callbacks: {
          finish: req.partner.callback_url || `${process.env.FRONTEND_URL}/payment/success`,
          error: req.partner.callback_url || `${process.env.FRONTEND_URL}/payment/error`,
          pending: req.partner.callback_url || `${process.env.FRONTEND_URL}/payment/pending`
        }
      };

      const midtransTransaction = await snap.createTransaction(midtransParams);

      // Update transaction with snap token
      await conn.execute(
        'UPDATE transactions SET snap_token = ? WHERE id = ?',
        [midtransTransaction.token, transactionId]
      );

      res.status(201).json({
        success: true,
        checkout: {
          order_id: orderId,
          partner_order_id: partner_order_id || null,
          transaction_id: transactionId,
          snap_token: midtransTransaction.token,
          redirect_url: midtransTransaction.redirect_url,
          event: {
            id: event.id,
            title: event.title,
            date: event.date,
            location: event.location
          },
          quantity,
          unit_price: unitPrice,
          total_amount: totalAmount,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        },
        // Midtrans client key for frontend popup
        midtrans_client_key: process.env.MIDTRANS_CLIENT_KEY,
        is_production: process.env.MIDTRANS_IS_PRODUCTION === 'true'
      });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('[PARTNER CHECKOUT] Error:', error);
    res.status(500).json({ error: 'Failed to create checkout' });
  }
});

/**
 * GET /api/partner/checkout/:orderId/status
 * Check payment status for an order
 */
router.get('/:orderId/status', authenticatePartnerUser, async (req, res) => {
  try {
    const { orderId } = req.params;
    const conn = await pool.getConnection();

    try {
      const [transactions] = await conn.execute(
        `SELECT t.*, e.title as event_title, e.date as event_date, e.location as event_location
         FROM transactions t
         JOIN events e ON t.event_id = e.id
         WHERE t.midtrans_order_id = ? AND t.partner_id = ?`,
        [orderId, req.partner.id]
      );

      if (transactions.length === 0) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      const transaction = transactions[0];

      // Get tickets if payment completed
      let tickets = [];
      if (transaction.status === 'completed') {
        const [ticketRows] = await conn.execute(
          'SELECT ticket_code, status, scanned_at FROM tickets WHERE transaction_id = ?',
          [transaction.id]
        );
        tickets = ticketRows;
      }

      res.json({
        success: true,
        transaction: {
          order_id: transaction.midtrans_order_id,
          partner_order_id: transaction.partner_order_id,
          status: transaction.status,
          event: {
            id: transaction.event_id,
            title: transaction.event_title,
            date: transaction.event_date,
            location: transaction.event_location
          },
          quantity: transaction.quantity,
          unit_price: transaction.unit_price,
          total_amount: transaction.total_amount,
          payment_type: transaction.payment_type,
          paid_at: transaction.paid_at,
          created_at: transaction.created_at,
          tickets: tickets
        }
      });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('[PARTNER CHECKOUT] Error getting status:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

/**
 * GET /api/partner/transactions
 * List transactions for current user
 */
router.get('/transactions', authenticatePartnerUser, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, event_id } = req.query;
    const offset = (page - 1) * limit;
    const conn = await pool.getConnection();

    try {
      let whereClause = 'WHERE t.partner_id = ? AND t.partner_user_id = ?';
      const params = [req.partner.id, req.partnerUser.id];

      if (status) {
        whereClause += ' AND t.status = ?';
        params.push(status);
      }

      if (event_id) {
        whereClause += ' AND t.event_id = ?';
        params.push(event_id);
      }

      // Get count
      const [countResult] = await conn.execute(
        `SELECT COUNT(*) as total FROM transactions t ${whereClause}`,
        params
      );

      // Get transactions
      const [transactions] = await conn.execute(
        `SELECT t.*, e.title as event_title, e.date as event_date,
         (SELECT COUNT(*) FROM tickets tk WHERE tk.transaction_id = t.id) as ticket_count
         FROM transactions t
         JOIN events e ON t.event_id = e.id
         ${whereClause}
         ORDER BY t.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
      );

      res.json({
        success: true,
        transactions: transactions.map(t => ({
          order_id: t.midtrans_order_id,
          partner_order_id: t.partner_order_id,
          event: { id: t.event_id, title: t.event_title, date: t.event_date },
          quantity: t.quantity,
          total_amount: t.total_amount,
          status: t.status,
          payment_type: t.payment_type,
          ticket_count: t.ticket_count,
          created_at: t.created_at
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          pages: Math.ceil(countResult[0].total / limit)
        }
      });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('[PARTNER CHECKOUT] Error listing transactions:', error);
    res.status(500).json({ error: 'Failed to list transactions' });
  }
});

/**
 * POST /api/partner/checkout/:orderId/cancel
 * Cancel pending transaction
 */
router.post('/:orderId/cancel', authenticatePartnerUser, async (req, res) => {
  try {
    const { orderId } = req.params;
    const conn = await pool.getConnection();

    try {
      const [transactions] = await conn.execute(
        `SELECT * FROM transactions 
         WHERE midtrans_order_id = ? AND partner_id = ? AND partner_user_id = ? AND status = 'pending'`,
        [orderId, req.partner.id, req.partnerUser.id]
      );

      if (transactions.length === 0) {
        return res.status(404).json({ error: 'Pending transaction not found' });
      }

      await conn.execute(
        "UPDATE transactions SET status = 'cancelled' WHERE id = ?",
        [transactions[0].id]
      );

      res.json({
        success: true,
        message: 'Transaction cancelled'
      });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('[PARTNER CHECKOUT] Error cancelling:', error);
    res.status(500).json({ error: 'Failed to cancel transaction' });
  }
});

module.exports = router;
