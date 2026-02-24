const express = require('express');
const midtransClient = require('midtrans-client');
const pool = require('../config/database');
const { authenticateToken, checkRole } = require('../middleware/auth');
const PricingService = require('../services/pricingService');

const router = express.Router();

// Initialize Midtrans Snap
const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY
});

// Create checkout transaction
router.post('/process', authenticateToken, checkRole(['user']), async (req, res) => {
  try {
    const { eventId, quantity } = req.body;
    const userId = req.user.id;
    const username = req.user.username;

    if (!eventId || !quantity || quantity < 1) {
      return res.status(400).json({ error: 'Event ID dan quantity harus diisi dengan benar' });
    }

    const conn = await pool.getConnection();

    // Get event details
    const [events] = await conn.execute(
      'SELECT title, price, current_stock as stock, date FROM events WHERE id = ?',
      [eventId]
    );

    if (events.length === 0) {
      await conn.release();
      return res.status(404).json({ error: 'Event tidak ditemukan' });
    }

    const event = events[0];

    // Validasi event sudah lewat
    const eventDate = new Date(event.date);
    const now = new Date();
    if (eventDate < now) {
      await conn.release();
      return res.status(400).json({ error: 'Event ini sudah lewat dan tidak dapat dibeli' });
    }

    // Validasi stock
    if (quantity > event.stock || event.stock <= 0) {
      await conn.release();
      return res.status(400).json({ error: 'Stok tiket tidak mencukupi' });
    }

    const totalPrice = event.price * quantity;
    const orderId = 'simtix-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

    // Get user email
    const [users] = await conn.execute(
      'SELECT email FROM users WHERE id = ?',
      [userId]
    );

    const userEmail = users[0]?.email || 'dummy@example.com';

    // Save transaction to database with 24-hour expiration
    const [transResult] = await conn.execute(
      'INSERT INTO transactions (midtrans_order_id, user_id, event_id, quantity, unit_price, total_amount, final_amount, status, expired_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))',
      [orderId, userId, eventId, quantity, event.price, totalPrice, totalPrice, 'pending']
    );

    // Prepare Midtrans transaction
    const transactionParams = {
      transaction_details: {
        order_id: orderId,
        gross_amount: totalPrice
      },
      item_details: [
        {
          id: eventId,
          price: event.price,
          quantity: quantity,
          name: event.title
        }
      ],
      customer_details: {
        first_name: username,
        email: userEmail
      },
      enabledPayments: [
        "gopay", 
        "shopeepay", 
        "other_qris",  // QRIS akan muncul di semua device
        "bca_va", 
        "bni_va", 
        "bri_va",
        "permata_va"
      ],
      callbacks: {
        finish: process.env.CALLBACK_FINISH_URL || 'http://localhost:3000/payment-success'
      }
    };

    // Create Midtrans transaction
    const midtransTransaction = await snap.createTransaction(transactionParams);
    const token = midtransTransaction.token;

    // Update transaction with snap_token for re-use
    await conn.execute(
      'UPDATE transactions SET snap_token = ? WHERE id = ?',
      [token, transResult.insertId]
    );

    await conn.release();

    res.json({
      token,
      orderId,
      transactionId: transResult.insertId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Manual checkout (for testing without payment gateway)
router.post('/manual', authenticateToken, checkRole(['user']), async (req, res) => {
  try {
    const { eventId, quantity, totalAmount } = req.body;
    const userId = req.user.id;

    if (!eventId || !quantity || quantity < 1) {
      return res.status(400).json({ error: 'Event ID dan quantity harus diisi dengan benar' });
    }

    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      // Get event details
      const [events] = await conn.execute(
        'SELECT id, title, price, current_stock as stock, user_id, date FROM events WHERE id = ? AND status = ?',
        [eventId, 'active']
      );

      if (events.length === 0) {
        await conn.rollback();
        await conn.release();
        return res.status(404).json({ error: 'Event tidak ditemukan atau tidak aktif' });
      }

      const event = events[0];

      // Validasi event sudah lewat
      const eventDate = new Date(event.date);
      const now = new Date();
      if (eventDate < now) {
        await conn.rollback();
        await conn.release();
        return res.status(400).json({ error: 'Event ini sudah lewat dan tidak dapat dibeli' });
      }

      // Validasi stock
      if (quantity > event.stock || event.stock <= 0) {
        await conn.rollback();
        await conn.release();
        return res.status(400).json({ error: 'Stok tiket tidak mencukupi' });
      }

      // Validasi harga
      const calculatedAmount = event.price * quantity;
      if (calculatedAmount !== totalAmount) {
        await conn.rollback();
        await conn.release();
        return res.status(400).json({ error: 'Total amount tidak sesuai' });
      }

      const orderId = 'MANUAL-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();

      // Create transaction
      const [transResult] = await conn.execute(
        'INSERT INTO transactions (midtrans_order_id, user_id, event_id, quantity, unit_price, total_amount, final_amount, status, payment_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [orderId, userId, eventId, quantity, event.price, totalAmount, totalAmount, 'success', 'manual']
      );

      const transactionId = transResult.insertId;

      // Update event stock (reduce by quantity)
      await conn.execute(
        'UPDATE events SET current_stock = current_stock - ?, sold_tickets = sold_tickets + ? WHERE id = ?',
        [quantity, quantity, eventId]
      );

      // Create tickets for the user
      const ticketInserts = [];
      for (let i = 0; i < quantity; i++) {
        const ticketCode = 'TIX-' + orderId + '-' + (i + 1);
        ticketInserts.push([transactionId, userId, eventId, ticketCode]);
      }

      // Bulk insert tickets
      if (ticketInserts.length > 0) {
        const placeholders = ticketInserts.map(() => '(?, ?, ?, ?)').join(',');
        const flatValues = ticketInserts.flat();
        await conn.execute(
          `INSERT INTO tickets (transaction_id, user_id, event_id, ticket_code) VALUES ${placeholders}`,
          flatValues
        );
      }

      await conn.commit();
      await conn.release();

      res.status(201).json({
        success: true,
        message: 'Pembayaran manual berhasil!',
        transactionId: transactionId,
        orderId: orderId,
        status: 'success',
        ticketCount: quantity,
        totalAmount: totalAmount
      });

    } catch (err) {
      await conn.rollback();
      await conn.release();
      throw err;
    }

  } catch (error) {
    console.error('Manual checkout error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get transaction details
router.get('/transaction/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const conn = await pool.getConnection();

    const [transactions] = await conn.execute(
      'SELECT * FROM transactions WHERE midtrans_order_id = ?',
      [orderId]
    );

    await conn.release();

    if (transactions.length === 0) {
      return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
    }

    res.json(transactions[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
