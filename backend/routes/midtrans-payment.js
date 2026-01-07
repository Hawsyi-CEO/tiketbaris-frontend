const express = require('express');
const midtransClient = require('midtrans-client');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { emitToUser } = require('../socket-server');

const router = express.Router();

// Test route untuk debugging
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Midtrans route is working - PRODUCTION MODE!',
    timestamp: new Date().toISOString(),
    mode: 'PRODUCTION',
    available_endpoints: [
      'GET /test',
      'POST /create-snap-token',
      'GET /status/:orderId',
      'POST /webhook'
    ]
  });
});

// Initialize Midtrans Core API
const coreApi = new midtransClient.CoreApi({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY
});

// Initialize Midtrans Snap (for popup payment)
const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY
});

// Create Midtrans Snap Token (Recommended - popup payment)
router.post('/create-snap-token', authenticateToken, async (req, res) => {
  try {
    console.log('[MIDTRANS] Create snap token request:', req.body);
    console.log('[MIDTRANS] User:', { userId: req.user.id, email: req.user.email });
    
    const { eventId, quantity } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;
    const username = req.user.username;

    if (!eventId || !quantity || quantity < 1) {
      console.log('[MIDTRANS] Validation error: invalid eventId or quantity');
      return res.status(400).json({ error: 'Event ID dan quantity harus diisi dengan benar' });
    }
    
    console.log('[MIDTRANS] Fetching event:', eventId);

    const conn = await pool.getConnection();
    console.log('[MIDTRANS] Database connected');

    // Get event details
    const [events] = await conn.execute(
      'SELECT id, title, description, price, current_stock FROM events WHERE id = ? AND status = ?',
      [eventId, 'active']
    );
    console.log('[MIDTRANS] Event query result:', events.length > 0 ? 'Found' : 'Not found');

    if (events.length === 0) {
      await conn.release();
      console.log('[MIDTRANS] Error: Event not found');
      return res.status(404).json({ error: 'Event tidak ditemukan' });
    }

    const event = events[0];
    console.log('[MIDTRANS] Event details:', { id: event.id, title: event.title, price: event.price, stock: event.current_stock });

    // Check stock
    if (quantity > event.current_stock || event.current_stock <= 0) {
      await conn.release();
      console.log('[MIDTRANS] Error: Insufficient stock');
      return res.status(400).json({ error: 'Stok tiket tidak mencukupi' });
    }

    const totalPrice = event.price * quantity;
    const orderId = 'SIMTIX-' + Date.now() + '-' + userId;
    console.log('[MIDTRANS] Order created:', { orderId, totalPrice });

    // Midtrans transaction parameter
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: totalPrice
      },
      credit_card: {
        secure: true
      },
      customer_details: {
        first_name: username,
        email: userEmail,
      },
      item_details: [{
        id: eventId,
        price: event.price,
        quantity: quantity,
        name: event.title,
        brand: 'SimTix',
        category: 'Event Ticket'
      }],
      // Enable semua metode pembayaran yang tersedia
      enabled_payments: [
        'credit_card',      // Kartu Kredit
        'bca_va',           // BCA Virtual Account
        'bni_va',           // BNI Virtual Account
        'bri_va',           // BRI Virtual Account
        'permata_va',       // Permata Virtual Account
        'echannel',         // Mandiri Bill Payment
        'other_va',         // VA Bank Lain
        'gopay',            // GoPay
        'shopeepay',        // ShopeePay
        'qris',             // QRIS (semua e-wallet)
        'indomaret',        // Indomaret
        'alfamart',         // Alfamart
        'akulaku'           // Akulaku (cicilan)
      ],
      callbacks: {
        finish: `${process.env.FRONTEND_URL}/payment/success?order_id=${orderId}`,
        error: `${process.env.FRONTEND_URL}/payment/error?order_id=${orderId}`,
        pending: `${process.env.FRONTEND_URL}/payment/pending?order_id=${orderId}`
      }
    };

    console.log('[MIDTRANS] Transaction parameter created');
    console.log('[MIDTRANS] Creating database transaction record...');

    // Create transaction record (pending)
    const [transResult] = await conn.execute(
      'INSERT INTO transactions (midtrans_order_id, user_id, event_id, quantity, unit_price, total_amount, final_amount, status, payment_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [orderId, userId, eventId, quantity, event.price, totalPrice, totalPrice, 'pending', 'midtrans_snap']
    );

    const transactionId = transResult.insertId;
    console.log('[MIDTRANS] Transaction record created:', transactionId);
    
    await conn.release();
    console.log('[MIDTRANS] Creating Snap token with Midtrans API...');

    // Create Snap Token
    const transaction = await snap.createTransaction(parameter);
    console.log('[MIDTRANS] Snap token created successfully');

    res.json({
      snap_token: transaction.token,
      redirect_url: transaction.redirect_url,
      order_id: orderId,
      transaction_id: transactionId,
      total_amount: totalPrice,
      event_title: event.title,
      quantity: quantity,
      // Sandbox testing cards for development
      test_cards: {
        success: '4811111111111114',
        challenge_3ds: '4811111111111147', 
        insufficient_funds: '4911111111111117',
        bank_timeout: '4911111111111125'
      }
    });

  } catch (error) {
    console.error('[MIDTRANS] Snap token error:', error);
    console.error('[MIDTRANS] Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Gagal membuat token pembayaran',
      details: error.message,
      type: error.name
    });
  }
});

// Midtrans notification handler (webhook)
router.post('/notification', async (req, res) => {
  try {
    const notification = req.body;
    
    console.log('[MIDTRANS] Notification received:', {
      order_id: notification.order_id,
      status_code: notification.status_code,
      transaction_status: notification.transaction_status,
      fraud_status: notification.fraud_status
    });

    // Verify notification authenticity
    const statusResponse = await coreApi.transaction.notification(notification);
    
    const orderId = statusResponse.order_id;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;

    console.log(`[MIDTRANS] Transaction ${orderId} status: ${transactionStatus}, fraud: ${fraudStatus}`);

    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      // Get transaction details
      const [transactions] = await conn.execute(
        'SELECT id, user_id, event_id, quantity, total_amount, status FROM transactions WHERE midtrans_order_id = ?',
        [orderId]
      );

      if (transactions.length === 0) {
        console.log(`[MIDTRANS] Transaction ${orderId} not found in database`);
        await conn.rollback();
        await conn.release();
        return res.status(404).json({ error: 'Transaction not found' });
      }

      const transaction = transactions[0];
      let newStatus = transaction.status;

      // Update status based on Midtrans response
      if (transactionStatus == 'capture') {
        if (fraudStatus == 'accept') {
          newStatus = 'completed';
        }
      } else if (transactionStatus == 'settlement') {
        newStatus = 'completed';
      } else if (transactionStatus == 'pending') {
        newStatus = 'pending';
      } else if (transactionStatus == 'deny' || transactionStatus == 'cancel' || transactionStatus == 'expire') {
        newStatus = 'cancelled';
      }

      // Update transaction status
      await conn.execute(
        'UPDATE transactions SET status = ? WHERE midtrans_order_id = ?',
        [newStatus, orderId]
      );

      // If payment successful, create tickets and update stock
      if (newStatus === 'completed') {
        // Get event details for stock update
        const [events] = await conn.execute(
          'SELECT current_stock FROM events WHERE id = ?',
          [transaction.event_id]
        );

        if (events.length > 0) {
          // Use quantity from transaction
          const quantity = transaction.quantity || 1;
          
          // Update stock
          await conn.execute(
            'UPDATE events SET current_stock = current_stock - ? WHERE id = ?',
            [quantity, transaction.event_id]
          );

          // Create tickets
          const ticketInserts = [];
          for (let i = 0; i < quantity; i++) {
            const ticketCode = 'TIX-' + orderId + '-' + (i + 1);
            ticketInserts.push([transaction.id, transaction.user_id, transaction.event_id, ticketCode, transaction.total_amount / quantity, 'active']);
          }

          if (ticketInserts.length > 0) {
            const placeholders = ticketInserts.map(() => '(?, ?, ?, ?, ?, ?)').join(',');
            const flatValues = ticketInserts.flat();
            await conn.execute(
              `INSERT INTO tickets (transaction_id, user_id, event_id, ticket_code, price, status) VALUES ${placeholders}`,
              flatValues
            );
          }

          console.log(`[MIDTRANS] Created ${quantity} tickets for transaction ${orderId}`);
        }
        
        // Emit real-time notification to user
        try {
          emitToUser(transaction.user_id, 'paymentSuccess', {
            orderId: orderId,
            transactionId: transaction.id,
            eventId: transaction.event_id,
            quantity: quantity,
            amount: transaction.total_amount,
            message: '🎉 Pembayaran berhasil! Tiket Anda sudah siap.',
            timestamp: new Date().toISOString()
          });
          console.log(`[MIDTRANS] Payment success notification sent to user ${transaction.user_id}`);
        } catch (socketError) {
          console.error('[MIDTRANS] Socket notification error (non-critical):', socketError.message);
        }
      }

      await conn.commit();
      await conn.release();

      res.status(200).json({ status: 'ok', message: 'Notification processed successfully' });

    } catch (error) {
      await conn.rollback();
      await conn.release();
      throw error;
    }

  } catch (error) {
    console.error('[MIDTRANS] Notification error:', error);
    res.status(500).json({ 
      error: 'Failed to process notification',
      details: error.message 
    });
  }
});

// ==========================================
// PRODUCTION MODE: Manual finish endpoint REMOVED
// Webhook akan handle payment completion otomatis
// ==========================================

// Get transaction status (for checking payment status)
router.get('/status/:orderId', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const conn = await pool.getConnection();
    
    const [transactions] = await conn.execute(
      `SELECT 
        t.id, t.midtrans_order_id, t.total_amount, t.status, t.transaction_date,
        e.title as event_title,
        (SELECT COUNT(*) FROM tickets tk WHERE tk.transaction_id = t.id) as tickets_count
      FROM transactions t
      JOIN events e ON t.event_id = e.id  
      WHERE t.midtrans_order_id = ? AND t.user_id = ?`,
      [orderId, userId]
    );

    await conn.release();

    if (transactions.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const transaction = transactions[0];

    // Check status with Midtrans
    try {
      const statusResponse = await coreApi.transaction.status(orderId);
      
      res.json({
        order_id: orderId,
        local_status: transaction.status,
        midtrans_status: statusResponse.transaction_status,
        amount: transaction.total_amount,
        event_title: transaction.event_title,
        tickets_count: transaction.tickets_count,
        transaction_date: transaction.transaction_date,
        payment_type: statusResponse.payment_type,
        va_numbers: statusResponse.va_numbers,
        bca_va_number: statusResponse.bca_va_number,
        bni_va_number: statusResponse.bni_va_number,
        bri_va_number: statusResponse.bri_va_number,
        permata_va_number: statusResponse.permata_va_number
      });

    } catch (midtransError) {
      res.json({
        order_id: orderId,
        local_status: transaction.status,
        midtrans_status: 'unknown',
        amount: transaction.total_amount,
        amount: transaction.amount,
        event_title: transaction.event_title,
        tickets_count: transaction.tickets_count,
        transaction_date: transaction.transaction_date,
        error: 'Failed to get Midtrans status'
      });
    }

  } catch (error) {
    console.error('[MIDTRANS] Status check error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Development/Testing endpoints
router.get('/test/simulate-success/:orderId', authenticateToken, async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Test endpoint not available in production' });
    }

    const { orderId } = req.params;
    const userId = req.user.id;

    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      // Get transaction
      const [transactions] = await conn.execute(
        'SELECT id, user_id, event_id, quantity, unit_price, total_amount FROM transactions WHERE midtrans_order_id = ? AND user_id = ?',
        [orderId, userId]
      );

      if (transactions.length === 0) {
        await conn.rollback();
        await conn.release();
        return res.status(404).json({ error: 'Transaction not found' });
      }

      const transaction = transactions[0];

      // Update to success
      await conn.execute(
        'UPDATE transactions SET status = ? WHERE midtrans_order_id = ?',
        ['success', orderId]
      );

      // Create tickets (simulate successful payment)
      const quantity = transaction.quantity || 1;
      
      // Update stock
      await conn.execute(
        'UPDATE events SET current_stock = current_stock - ?, sold_tickets = sold_tickets + ? WHERE id = ?',
        [quantity, quantity, transaction.event_id]
      );

      // Create tickets
      const ticketInserts = [];
      for (let i = 0; i < quantity; i++) {
        const ticketCode = 'TIX-TEST-' + orderId + '-' + (i + 1);
        ticketInserts.push([transaction.id, transaction.user_id, transaction.event_id, ticketCode, 'active']);
      }

      if (ticketInserts.length > 0) {
        const placeholders = ticketInserts.map(() => '(?, ?, ?, ?, ?)').join(',');
        const flatValues = ticketInserts.flat();
        await conn.execute(
          `INSERT INTO tickets (transaction_id, user_id, event_id, ticket_code, status) VALUES ${placeholders}`,
          flatValues
        );
      }

      await conn.commit();
      await conn.release();

      res.json({ 
        success: true, 
        message: 'Payment simulated successfully!',
        order_id: orderId,
        tickets_created: quantity
      });

    } catch (error) {
      await conn.rollback();
      await conn.release();
      throw error;
    }

  } catch (error) {
    console.error('[TEST] Simulate success error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// PRODUCTION MODE: Test payment endpoint REMOVED
// Only real payment with Midtrans allowed
// ==========================================

module.exports = router;