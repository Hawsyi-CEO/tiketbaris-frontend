const express = require('express');
const pool = require('../config/database');
const { authenticateToken, checkRole } = require('../middleware/auth');

const router = express.Router();

// Get admin profile
router.get('/profile', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const adminId = req.user.id || req.user.userId;
    const conn = await pool.getConnection();
    const [admins] = await conn.execute(
      'SELECT id, username, email, created_at FROM admins WHERE id = ?',
      [adminId]
    );
    await conn.release();
    
    if (admins.length === 0) {
      return res.status(404).json({ error: 'Admin tidak ditemukan' });
    }
    
    res.json({ admin: admins[0] });
  } catch (error) {
    console.error('Admin profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all events (all statuses) - alias untuk frontend
router.get('/events', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [events] = await conn.execute(
      `SELECT e.id, e.title, e.description, e.date, e.location, e.price, e.stock, e.current_stock, e.status, e.image_url, e.is_hidden, e.created_at, u.username, u.email
       FROM events e 
       JOIN users u ON e.user_id = u.id 
       ORDER BY e.created_at DESC`
    );
    await conn.release();
    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all tickets
router.get('/tickets', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [tickets] = await conn.execute(
      `SELECT t.*, e.title as event_title, u.username, u.email,
       tr.final_amount as amount, tr.status as transaction_status
       FROM tickets t
       JOIN events e ON t.event_id = e.id
       JOIN users u ON t.user_id = u.id
       LEFT JOIN transactions tr ON t.transaction_id = tr.id
       ORDER BY t.created_at DESC`
    );
    await conn.release();
    res.json(tickets);
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get analytics
router.get('/analytics', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const conn = await pool.getConnection();
    
    // Total revenue
    const [revenueResult] = await conn.execute(
      `SELECT SUM(final_amount) as total_revenue FROM transactions WHERE status = 'completed'`
    );
    
    // Revenue by month (last 6 months)
    const [monthlyRevenue] = await conn.execute(
      `SELECT DATE_FORMAT(transaction_date, '%Y-%m') as month, 
       SUM(final_amount) as revenue, COUNT(*) as transactions
       FROM transactions 
       WHERE status = 'completed' AND transaction_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY month
       ORDER BY month DESC`
    );
    
    // Top events by ticket sales
    const [topEvents] = await conn.execute(
      `SELECT e.title, e.id, COUNT(t.id) as tickets_sold, SUM(tr.final_amount) as revenue
       FROM events e
       LEFT JOIN tickets t ON e.id = t.event_id
       LEFT JOIN transactions tr ON t.transaction_id = tr.id AND tr.status = 'completed'
       GROUP BY e.id
       ORDER BY tickets_sold DESC
       LIMIT 5`
    );
    
    // User growth (last 6 months)
    const [userGrowth] = await conn.execute(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as new_users
       FROM users
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY month
       ORDER BY month DESC`
    );
    
    await conn.release();
    
    res.json({
      totalRevenue: revenueResult[0].total_revenue || 0,
      monthlyRevenue,
      topEvents,
      userGrowth
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all events (all statuses) - keep old endpoint for backward compatibility
router.get('/pending-events', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [events] = await conn.execute(
      `SELECT e.id, e.title, e.description, e.date, e.location, e.price, e.current_stock as stock, e.status, e.created_at, u.username 
       FROM events e 
       JOIN users u ON e.user_id = u.id 
       ORDER BY e.created_at DESC`
    );
    await conn.release();
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single event detail
router.get('/event/:id', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const conn = await pool.getConnection();
    const [events] = await conn.execute(
      `SELECT e.*, u.username, u.email 
       FROM events e 
       JOIN users u ON e.user_id = u.id 
       WHERE e.id = ?`,
      [id]
    );
    await conn.release();
    
    if (events.length === 0) {
      return res.status(404).json({ error: 'Event tidak ditemukan' });
    }
    
    res.json(events[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve event
router.put('/approve-event/:id', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const conn = await pool.getConnection();

    const [result] = await conn.execute(
      'UPDATE events SET status = ? WHERE id = ?',
      ['active', id]
    );

    await conn.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Event tidak ditemukan' });
    }

    res.json({ message: 'Event berhasil disetujui' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Decline event
router.put('/decline-event/:id', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const conn = await pool.getConnection();

    const [result] = await conn.execute(
      'UPDATE events SET status = ? WHERE id = ?',
      ['cancelled', id]
    );

    await conn.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Event tidak ditemukan' });
    }

    res.json({ message: 'Event ditolak' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete event
router.delete('/event/:id', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const conn = await pool.getConnection();

    // Delete related transactions first
    await conn.execute(
      'DELETE FROM transactions WHERE event_id = ?',
      [id]
    );

    // Delete event
    const [result] = await conn.execute(
      'DELETE FROM events WHERE id = ?',
      [id]
    );

    await conn.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Event tidak ditemukan' });
    }

    res.json({ message: 'Event berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all users
router.get('/users', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [users] = await conn.execute(
      'SELECT id, username as name, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    await conn.release();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user
router.delete('/user/:id', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const conn = await pool.getConnection();

    // Check if user exists
    const [users] = await conn.execute('SELECT id FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      await conn.release();
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    // Delete related data first (cascade will handle some, but be explicit)
    await conn.execute('DELETE FROM transactions WHERE user_id = ?', [id]);
    await conn.execute('DELETE FROM tickets WHERE user_id = ?', [id]);
    await conn.execute('DELETE FROM user_sessions WHERE user_id = ?', [id]);

    // Delete user
    const [result] = await conn.execute('DELETE FROM users WHERE id = ?', [id]);
    await conn.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Gagal menghapus user' });
    }

    res.json({ message: 'User berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Payment Development Mode - Create test transaction (admin only)
router.post('/payment/dev-mode', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const { event_id, user_id, quantity, notes } = req.body;
    
    if (!event_id || !user_id || !quantity) {
      return res.status(400).json({ error: 'event_id, user_id, dan quantity required' });
    }

    const conn = await pool.getConnection();

    // Get event details
    const [events] = await conn.execute(
      'SELECT id, title, price, current_stock FROM events WHERE id = ?',
      [event_id]
    );

    if (events.length === 0) {
      await conn.release();
      return res.status(404).json({ error: 'Event tidak ditemukan' });
    }

    const event = events[0];
    
    if (event.current_stock < quantity) {
      await conn.release();
      return res.status(400).json({ error: 'Stok tiket tidak mencukupi' });
    }

    const totalAmount = event.price * quantity;
    const orderId = `DEV-${Date.now()}-${event_id}`;

    // Create transaction (status: completed for dev mode)
    const [txResult] = await conn.execute(
      `INSERT INTO transactions 
       (user_id, event_id, order_id, quantity, unit_price, total_amount, final_amount, 
        payment_type, status, transaction_date, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
      [user_id, event_id, orderId, quantity, event.price, totalAmount, totalAmount, 
       'dev_mode', 'completed', notes || 'Development Mode Transaction']
    );

    const transactionId = txResult.insertId;

    // Create tickets
    for (let i = 0; i < quantity; i++) {
      const ticketCode = `DEV-${Date.now()}-${i}`;
      await conn.execute(
        `INSERT INTO tickets 
         (user_id, event_id, transaction_id, ticket_code, status, purchased_at) 
         VALUES (?, ?, ?, ?, 'valid', NOW())`,
        [user_id, event_id, transactionId, ticketCode]
      );
    }

    // Update stock
    await conn.execute(
      'UPDATE events SET current_stock = current_stock - ? WHERE id = ?',
      [quantity, event_id]
    );

    await conn.release();

    res.json({
      message: 'Dev mode transaction created successfully',
      orderId,
      transactionId,
      quantity,
      totalAmount,
      eventTitle: event.title
    });
  } catch (error) {
    console.error('Dev mode payment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all partnerships
router.get('/partnerships', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [partnerships] = await conn.execute(
      `SELECT p.id, p.company_name, p.proposal_text, p.status, p.submitted_at, u.username
       FROM partnerships p
       JOIN users u ON p.user_id = u.id
       ORDER BY p.submitted_at DESC`
    );
    await conn.release();
    res.json(partnerships);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get event details with stats
router.get('/event/:id/details', authenticateToken, checkRole(['admin']), async (req, res) => {
  console.log('=== EVENT DETAILS REQUEST ===');
  try {
    const { id } = req.params;
    console.log('Event ID requested:', id);
    
    const conn = await pool.getConnection();
    console.log('Database connection obtained');

    // Get event details
    console.log('Executing main event query...');
    const [events] = await conn.execute(
      `SELECT e.*, u.username, u.email as organizer_email
       FROM events e
       JOIN users u ON e.user_id = u.id
       WHERE e.id = ?`,
      [id]
    );
    console.log('Events query result:', events);

    if (events.length === 0) {
      console.log('No event found for ID:', id);
      await conn.release();
      return res.status(404).json({ error: 'Event tidak ditemukan' });
    }

    const event = events[0];
    console.log('Event found:', { id: event.id, title: event.title });

    // Get tickets sold count
    console.log('Getting tickets sold count...');
    const [soldResult] = await conn.execute(
      `SELECT COUNT(*) as tickets_sold FROM tickets WHERE event_id = ?`,
      [id]
    );
    event.tickets_sold = soldResult[0].tickets_sold || 0;
    console.log('Tickets sold:', event.tickets_sold);

    // Get tickets scanned count
    console.log('Getting tickets scanned count...');
    const [scannedResult] = await conn.execute(
      `SELECT COUNT(*) as tickets_scanned FROM tickets WHERE event_id = ? AND status = 'scanned'`,
      [id]
    );
    event.tickets_scanned = scannedResult[0].tickets_scanned || 0;
    console.log('Tickets scanned:', event.tickets_scanned);

    // Get unpaid transactions
    console.log('Getting unpaid transactions...');
    const [transactions] = await conn.execute(
      `SELECT t.id, t.user_id, u.username, u.email, t.amount, t.status, t.transaction_date as created_at
       FROM transactions t
       JOIN users u ON t.user_id = u.id
       WHERE t.event_id = ? AND t.status != 'completed'
       ORDER BY t.transaction_date DESC`,
      [id]
    );
    console.log('Unpaid transactions count:', transactions.length);

    await conn.release();
    console.log('Database connection released');

    const responseData = {
      ...event,
      unpaidTransactions: transactions,
      totalUnpaid: transactions.length
    };
    
    console.log('Sending successful response...');
    res.json(responseData);
  } catch (error) {
    console.error('=== ERROR IN EVENT DETAILS ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('================================');
    res.status(500).json({ error: error.message });
  }
});

// Update event (for admin editing)
router.put('/event/:id', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, date, location, price, stock, status } = req.body;
    const conn = await pool.getConnection();

    const [result] = await conn.execute(
      `UPDATE events SET 
       title = ?, description = ?, date = ?, location = ?, 
       price = ?, stock = ?, status = ?
       WHERE id = ?`,
      [title, description, date, location, price, stock, status, id]
    );

    await conn.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Event tidak ditemukan' });
    }

    res.json({ message: 'Event berhasil diperbarui' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update event status (completed, cancelled, sold out, etc)
router.put('/update-event-status/:id', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'active', 'completed', 'cancelled', 'sold_out'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status tidak valid' });
    }

    const conn = await pool.getConnection();
    const [result] = await conn.execute(
      'UPDATE events SET status = ? WHERE id = ?',
      [status, id]
    );
    await conn.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Event tidak ditemukan' });
    }

    res.json({ message: 'Status event berhasil diperbarui' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel event
router.put('/cancel-event/:id', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const conn = await pool.getConnection();
    
    // Update event status to cancelled
    const [result] = await conn.execute(
      'UPDATE events SET status = ? WHERE id = ?',
      ['cancelled', id]
    );

    if (result.affectedRows === 0) {
      await conn.release();
      return res.status(404).json({ error: 'Event tidak ditemukan' });
    }

    // Optional: Add cancellation reason to a log table if needed
    // await conn.execute('INSERT INTO event_logs (event_id, action, reason) VALUES (?, ?, ?)', [id, 'cancelled', reason]);

    await conn.release();
    res.json({ message: 'Event berhasil dibatalkan', reason });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Edit event (full edit including title, description, date, price, stock, status)
router.put('/edit-event/:id', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, date, location, price, stock, status } = req.body;

    const conn = await pool.getConnection();
    
    // Build dynamic update query
    let updates = [];
    let values = [];
    
    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (date !== undefined) {
      updates.push('date = ?');
      values.push(date);
    }
    if (location !== undefined) {
      updates.push('location = ?');
      values.push(location);
    }
    if (price !== undefined) {
      updates.push('price = ?');
      values.push(price);
    }
    if (stock !== undefined) {
      updates.push('current_stock = ?');
      values.push(stock);
    }
    if (status !== undefined) {
      const validStatuses = ['pending', 'active', 'completed', 'cancelled', 'sold_out'];
      if (!validStatuses.includes(status)) {
        await conn.release();
        return res.status(400).json({ error: 'Status tidak valid' });
      }
      updates.push('status = ?');
      values.push(status);
    }

    if (updates.length === 0) {
      await conn.release();
      return res.status(400).json({ error: 'Tidak ada data untuk diupdate' });
    }

    values.push(id);
    const query = `UPDATE events SET ${updates.join(', ')} WHERE id = ?`;
    
    const [result] = await conn.execute(query, values);
    await conn.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Event tidak ditemukan' });
    }

    res.json({ message: 'Event berhasil diperbarui' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle hide/show event (admin only)
router.put('/event/:id/toggle-visibility', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const conn = await pool.getConnection();
    
    // Get current visibility status
    const [events] = await conn.execute('SELECT is_hidden FROM events WHERE id = ?', [id]);
    
    if (events.length === 0) {
      await conn.release();
      return res.status(404).json({ error: 'Event tidak ditemukan' });
    }
    
    const newVisibility = events[0].is_hidden ? 0 : 1;
    
    await conn.execute('UPDATE events SET is_hidden = ? WHERE id = ?', [newVisibility, id]);
    await conn.release();
    
    res.json({ 
      message: newVisibility ? 'Event disembunyikan dari user' : 'Event ditampilkan ke user',
      is_hidden: newVisibility
    });
  } catch (error) {
    console.error('Toggle visibility error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all transactions with filters and pagination
router.get('/transactions', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const { 
      status, 
      search, 
      event_id, 
      date_from, 
      date_to,
      payment_type,
      page = 1,
      limit = 20
    } = req.query;

    const conn = await pool.getConnection();
    
    // Build WHERE clause
    let whereConditions = [];
    let queryParams = [];
    
    if (status && status !== 'all') {
      whereConditions.push('t.status = ?');
      queryParams.push(status);
    }
    
    if (payment_type && payment_type !== 'all') {
      whereConditions.push('t.payment_type = ?');
      queryParams.push(payment_type);
    }
    
    if (search) {
      whereConditions.push('(u.username LIKE ? OR u.email LIKE ? OR t.midtrans_order_id LIKE ?)');
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern);
    }
    
    if (event_id) {
      whereConditions.push('t.event_id = ?');
      queryParams.push(event_id);
    }
    
    if (date_from) {
      whereConditions.push('t.transaction_date >= ?');
      queryParams.push(date_from);
    }
    
    if (date_to) {
      whereConditions.push('t.transaction_date <= ?');
      queryParams.push(date_to);
    }
    
    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    
    // Count total
    const [countResult] = await conn.execute(
      `SELECT COUNT(*) as total 
       FROM transactions t 
       JOIN users u ON t.user_id = u.id 
       JOIN events e ON t.event_id = e.id 
       ${whereClause}`,
      queryParams
    );
    
    const total = countResult[0].total;
    const limitNum = parseInt(limit) || 20;
    const pageNum = parseInt(page) || 1;
    const offset = (pageNum - 1) * limitNum;
    
    // Get transactions with payment method info
    const query = `SELECT 
        t.id,
        t.midtrans_order_id,
        t.user_id,
        u.username,
        u.email,
        t.event_id,
        e.title as event_name,
        t.quantity,
        t.total_amount,
        t.status,
        t.payment_type,
        t.bank_name,
        t.va_number,
        t.payment_code,
        t.bill_key,
        t.biller_code,
        t.transaction_date,
        (SELECT COUNT(*) FROM tickets tk WHERE tk.transaction_id = t.id) as tickets_count
       FROM transactions t 
       JOIN users u ON t.user_id = u.id 
       JOIN events e ON t.event_id = e.id 
       ${whereClause}
       ORDER BY t.transaction_date DESC
       LIMIT ${limitNum} OFFSET ${offset}`;
    
    const [transactions] = await conn.query(query, queryParams);
    
    await conn.release();
    
    res.json({
      transactions,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get transaction details with tickets
router.get('/transactions/:id', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const conn = await pool.getConnection();
    
    // Get transaction details
    const [transactions] = await conn.execute(
      `SELECT 
        t.*,
        u.username,
        u.email,
        e.title as event_name,
        e.date as event_date,
        e.location as event_location
       FROM transactions t 
       JOIN users u ON t.user_id = u.id 
       JOIN events e ON t.event_id = e.id 
       WHERE t.id = ?`,
      [id]
    );
    
    if (transactions.length === 0) {
      await conn.release();
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    // Get tickets
    const [tickets] = await conn.execute(
      `SELECT id, ticket_code, price, status, created_at, scanned_at, scanned_by
       FROM tickets 
       WHERE transaction_id = ?
       ORDER BY id`,
      [id]
    );
    
    await conn.release();
    
    res.json({
      transaction: transactions[0],
      tickets
    });
  } catch (error) {
    console.error('Get transaction details error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update transaction status manually
router.post('/transactions/:id/update-status', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    
    if (!['pending', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const conn = await pool.getConnection();
    
    // Get transaction
    const [transactions] = await conn.execute(
      'SELECT * FROM transactions WHERE id = ?',
      [id]
    );
    
    if (transactions.length === 0) {
      await conn.release();
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    const transaction = transactions[0];
    const oldStatus = transaction.status;
    
    // Start transaction
    await conn.beginTransaction();
    
    try {
      // Update transaction status
      await conn.execute(
        'UPDATE transactions SET status = ? WHERE id = ?',
        [status, id]
      );
      
      // If changing to completed and no tickets exist, generate them
      if (status === 'completed' && oldStatus !== 'completed') {
        const [existingTickets] = await conn.execute(
          'SELECT COUNT(*) as count FROM tickets WHERE transaction_id = ?',
          [id]
        );
        
        if (existingTickets[0].count === 0) {
          // Generate tickets
          const quantity = transaction.quantity;
          const eventId = transaction.event_id;
          const userId = transaction.user_id;
          const unitPrice = transaction.unit_price || transaction.total_amount / quantity;
          
          for (let i = 0; i < quantity; i++) {
            const ticketCode = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            await conn.execute(
              `INSERT INTO tickets (user_id, event_id, transaction_id, ticket_code, price, status, created_at) 
               VALUES (?, ?, ?, ?, ?, 'active', NOW())`,
              [userId, eventId, id, ticketCode, unitPrice]
            );
          }
        }
      }
      
      await conn.commit();
      await conn.release();
      
      res.json({ 
        message: 'Transaction status updated successfully',
        old_status: oldStatus,
        new_status: status,
        reason: reason || 'Manual update by admin'
      });
    } catch (error) {
      await conn.rollback();
      await conn.release();
      throw error;
    }
  } catch (error) {
    console.error('Update transaction status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get transaction statistics
router.get('/transactions/stats/summary', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const conn = await pool.getConnection();
    
    const [stats] = await conn.execute(
      `SELECT 
        COUNT(*) as total_transactions,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count,
        SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END) as total_revenue,
        SUM(quantity) as total_tickets_sold
       FROM transactions`
    );
    
    await conn.release();
    
    res.json(stats[0]);
  } catch (error) {
    console.error('Get transaction stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get payment method statistics
router.get('/analytics/payment-methods', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const conn = await pool.getConnection();
    
    // Get payment method distribution
    const [paymentMethods] = await conn.execute(
      `SELECT 
        t.payment_type,
        t.bank_name,
        COUNT(*) as transaction_count,
        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_count,
        SUM(CASE WHEN t.status = 'completed' THEN t.total_amount ELSE 0 END) as total_revenue
       FROM transactions t
       WHERE t.payment_type IS NOT NULL
       GROUP BY t.payment_type, t.bank_name
       ORDER BY transaction_count DESC`
    );
    
    // Get payment type summary (grouped by payment type only)
    const [paymentTypeSummary] = await conn.execute(
      `SELECT 
        t.payment_type,
        COUNT(*) as transaction_count,
        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_count,
        SUM(CASE WHEN t.status = 'completed' THEN t.total_amount ELSE 0 END) as total_revenue
       FROM transactions t
       WHERE t.payment_type IS NOT NULL
       GROUP BY t.payment_type
       ORDER BY transaction_count DESC`
    );
    
    await conn.release();
    
    res.json({
      paymentMethods,
      paymentTypeSummary
    });
  } catch (error) {
    console.error('Get payment method stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


