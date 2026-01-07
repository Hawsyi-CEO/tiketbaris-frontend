const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { emitToEventRoom, emitToUser } = require('../socket-server');

// Get user's tickets
router.get('/my-tickets', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const conn = await pool.getConnection();
    
    const [tickets] = await conn.execute(`
      SELECT 
        t.id as ticket_id,
        t.ticket_code,
        t.status as ticket_status,
        t.created_at as purchased_at,
        t.scanned_at as scanned_at,
        t.scanned_by as scanned_by,
        e.id as event_id,
        e.title as event_title,
        e.description as event_description,
        e.date as event_date,
        e.location as event_location,
        e.price as ticket_price,
        e.image_url as event_image,
        tr.total_amount as paid_amount,
        tr.status as payment_status,
        tr.transaction_date,
        scanner.username as scanned_by_name
      FROM tickets t
      JOIN events e ON t.event_id = e.id
      JOIN transactions tr ON t.transaction_id = tr.id
      LEFT JOIN users scanner ON t.scanned_by = scanner.id
      WHERE t.user_id = ?
      ORDER BY t.created_at DESC
    `, [userId]);
    
    await conn.release();
    res.json({ tickets });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single ticket detail (for barcode display)
router.get('/ticket/:ticketCode', authenticateToken, async (req, res) => {
  try {
    const { ticketCode } = req.params;
    const userId = req.user.id;
    const conn = await pool.getConnection();
    
    const [tickets] = await conn.execute(`
      SELECT 
        t.id as ticket_id,
        t.ticket_code,
        t.status as ticket_status,
        t.created_at as purchased_at,
        t.scanned_at as scanned_at,
        t.scanned_by as scanned_by,
        e.id as event_id,
        e.title as event_title,
        e.description as event_description,
        e.date as event_date,
        e.location as event_location,
        e.price as ticket_price,
        e.image_url as event_image,
        e.user_id as organizer_id,
        tr.total_amount as paid_amount,
        tr.quantity,
        organizer.username as organizer_name,
        scanner.username as scanned_by_name
      FROM tickets t
      JOIN events e ON t.event_id = e.id
      JOIN transactions tr ON t.transaction_id = tr.id
      LEFT JOIN users organizer ON e.user_id = organizer.id
      LEFT JOIN users scanner ON t.scanned_by = scanner.id
      WHERE t.ticket_code = ? AND t.user_id = ?
    `, [ticketCode, userId]);
    
    if (tickets.length === 0) {
      await conn.release();
      return res.status(404).json({ error: 'Tiket tidak ditemukan' });
    }
    
    await conn.release();
    res.json({ ticket: tickets[0] });
  } catch (error) {
    console.error('Error fetching ticket detail:', error);
    res.status(500).json({ error: error.message });
  }
});

// Validate/Scan ticket (for panitia)
router.post('/scan-ticket', authenticateToken, async (req, res) => {
  try {
    const { ticketCode } = req.body;
    const panitiaId = req.user.id;
    const panitiaRole = req.user.role;
    
    // Check if user is panitia
    if (panitiaRole !== 'panitia') {
      return res.status(403).json({ error: 'Hanya panitia yang bisa scan tiket' });
    }
    
    const conn = await pool.getConnection();
    
    // Get ticket details
    const [tickets] = await conn.execute(`
      SELECT 
        t.id,
        t.ticket_code,
        t.status,
        t.scanned_at as scanned_at,
        t.user_id,
        e.id as event_id,
        e.title as event_title,
        e.date as event_date,
        e.location as event_location,
        e.user_id as organizer_id,
        buyer.username as buyer_name,
        buyer.email as buyer_email
      FROM tickets t
      JOIN events e ON t.event_id = e.id
      JOIN users buyer ON t.user_id = buyer.id
      WHERE t.ticket_code = ?
    `, [ticketCode]);
    
    if (tickets.length === 0) {
      await conn.release();
      return res.status(404).json({ error: 'Tiket tidak ditemukan' });
    }
    
    const ticket = tickets[0];
    
    // Check if panitia is the organizer of this event
    if (ticket.organizer_id !== panitiaId) {
      await conn.release();
      return res.status(403).json({ error: 'Anda bukan penyelenggara event ini' });
    }
    
    // Check if ticket already scanned
    if (ticket.status === 'used' || ticket.scanned_at) {
      await conn.release();
      return res.status(400).json({ 
        error: 'Tiket sudah pernah di-scan',
        scannedAt: ticket.scanned_at,
        ticket: ticket
      });
    }
    
    // Check if ticket is cancelled
    if (ticket.status === 'cancelled') {
      await conn.release();
      return res.status(400).json({ error: 'Tiket sudah dibatalkan' });
    }
    
    // Update ticket as scanned
    const [updateResult] = await conn.execute(`
      UPDATE tickets 
      SET status = 'used', 
          scanned_by = ?,
          scanned_at = NOW()
      WHERE id = ?
    `, [panitiaId, ticket.id]);
    
    console.log(`Ticket ${ticketCode} scanned successfully by panitia ${panitiaId}`);
    console.log(`Update result:`, updateResult);
    
    // Verify the update
    const [verifyTicket] = await conn.execute(
      'SELECT id, ticket_code, status, scanned_at, scanned_by FROM tickets WHERE id = ?',
      [ticket.id]
    );
    console.log(`Ticket after update:`, verifyTicket[0]);
    
    await conn.release();
    
    res.json({ 
      success: true,
      message: '✅ Tiket berhasil di-scan! Pengunjung boleh masuk.',
      ticket: {
        id: ticket.id,
        ticket_code: ticket.ticket_code,
        username: ticket.buyer_name,
        email: ticket.buyer_email,
        event_title: ticket.event_title,
        event_date: ticket.event_date,
        event_location: ticket.event_location,
        status: 'scanned',
        scanned_at: new Date(),
        scanned_by: panitiaId
      }
    });
  } catch (error) {
    console.error('Error scanning ticket:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get scanned tickets for panitia (entry log)
router.get('/scanned-tickets/:eventId', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const panitiaId = req.user.id;
    const panitiaRole = req.user.role;
    
    console.log(`\n=== Fetching scanned tickets ===`);
    console.log(`Event ID: ${eventId}`);
    console.log(`Panitia ID: ${panitiaId}`);
    console.log(`Panitia Role: ${panitiaRole}`);
    
    const conn = await pool.getConnection();
    
    // Verify panitia owns this event
    const [events] = await conn.execute(
      'SELECT id, user_id, title FROM events WHERE id = ?',
      [eventId]
    );
    
    console.log(`Event found:`, events[0]);
    
    if (events.length === 0) {
      await conn.release();
      console.log(`Event not found!`);
      return res.status(404).json({ error: 'Event tidak ditemukan' });
    }
    
    if (events[0].user_id !== panitiaId) {
      await conn.release();
      console.log(`Unauthorized! Event owner: ${events[0].user_id}, Panitia: ${panitiaId}`);
      return res.status(403).json({ error: 'Unauthorized - Anda bukan penyelenggara event ini' });
    }
    
    const [tickets] = await conn.execute(`
      SELECT 
        t.id,
        t.ticket_code,
        t.status,
        t.scanned_at as scanned_at,
        buyer.username,
        buyer.email,
        scanner.username as scanned_by_name,
        e.title as event_title
      FROM tickets t
      JOIN users buyer ON t.user_id = buyer.id
      JOIN events e ON t.event_id = e.id
      LEFT JOIN users scanner ON t.scanned_by = scanner.id
      WHERE t.event_id = ? AND t.status = 'used'
      ORDER BY t.scanned_at DESC
    `, [eventId]);
    
    // Also check all tickets for this event (for debugging)
    const [allTickets] = await conn.execute(`
      SELECT id, ticket_code, status, scanned_at 
      FROM tickets 
      WHERE event_id = ?
    `, [eventId]);
    console.log(`All tickets for event ${eventId}:`, allTickets);
    
    console.log(`Scanned tickets found: ${tickets.length}`);
    if (tickets.length > 0) {
      console.log(`First ticket:`, tickets[0]);
    }
    console.log(`=================================\n`);
    
    await conn.release();
    res.json({ tickets, count: tickets.length });
  } catch (error) {
    console.error('Error fetching scanned tickets:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get total scanned tickets count for panitia (all events)
router.get('/total-scanned', authenticateToken, async (req, res) => {
  try {
    const panitiaId = req.user.id;
    const conn = await pool.getConnection();
    
    const [result] = await conn.execute(`
      SELECT COUNT(*) as count
      FROM tickets t
      JOIN events e ON t.event_id = e.id
      WHERE e.user_id = ? AND t.status = 'scanned'
    `, [panitiaId]);
    
    await conn.release();
    res.json({ count: result[0].count });
  } catch (error) {
    console.error('Error fetching total scanned tickets:', error);
    res.status(500).json({ error: error.message });
  }
});

// Scan ticket - For panitia/organizer
router.post('/scan', authenticateToken, async (req, res) => {
  try {
    const { ticket_code } = req.body;
    const scannerId = req.user.id;
    
    console.log('\n=== TICKET SCAN REQUEST ===');
    console.log('Ticket Code:', ticket_code);
    console.log('Scanner ID:', scannerId);
    console.log('Scanner Role:', req.user.role);
    console.log('Scanner Username:', req.user.username);
    
    if (!ticket_code) {
      return res.status(400).json({ error: 'Kode tiket harus diisi' });
    }

    const conn = await pool.getConnection();
    console.log('Database connection acquired');
    
    try {
      await conn.beginTransaction();
      console.log('Transaction started');

      // Get ticket details
      const [tickets] = await conn.execute(`
        SELECT 
          t.id as ticket_id,
          t.ticket_code,
          t.status as ticket_status,
          t.scanned_at as scanned_at,
          t.scanned_by as scanned_by,
          t.user_id,
          e.id as event_id,
          e.title as event_title,
          e.date as event_date,
          e.location as event_location,
          e.user_id as organizer_id,
          u.username as user_name,
          u.email as user_email,
          scanner.username as scanned_by_name
        FROM tickets t
        JOIN events e ON t.event_id = e.id
        JOIN users u ON t.user_id = u.id
        LEFT JOIN users scanner ON t.scanned_by = scanner.id
        WHERE t.ticket_code = ?
      `, [ticket_code]);

      console.log('Ticket query result:', tickets.length > 0 ? 'Found' : 'Not found');
      if (tickets.length > 0) {
        console.log('Ticket details:', {
          id: tickets[0].ticket_id,
          code: tickets[0].ticket_code,
          status: tickets[0].ticket_status,
          event: tickets[0].event_title,
          organizer: tickets[0].organizer_id
        });
      }

      if (tickets.length === 0) {
        await conn.rollback();
        await conn.release();
        return res.status(404).json({
          status: 'error',
          message: '❌ Tiket tidak ditemukan',
          error: 'Kode tiket tidak valid'
        });
      }

      const ticket = tickets[0];

      // Check if event is today or future
      const eventDate = new Date(ticket.event_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (eventDate < today) {
        await conn.rollback();
        await conn.release();
        return res.status(400).json({
          status: 'error',
          message: '❌ Event sudah berlalu',
          error: 'Tiket tidak dapat digunakan untuk event yang sudah lewat'
        });
      }

      // Check if ticket already scanned
      if (ticket.ticket_status === 'scanned' || ticket.ticket_status === 'used') {
        await conn.rollback();
        await conn.release();
        
        // Emit duplicate scan alert via WebSocket (with error handling)
        try {
          emitToEventRoom(ticket.event_id, 'duplicateAlert', {
            ticket_code: ticket.ticket_code,
            event_id: ticket.event_id,
            event_title: ticket.event_title,
            user_id: ticket.user_id,
            user_name: ticket.user_name,
            scanned_at: ticket.scanned_at,
            scanned_by: ticket.scanned_by_name,
            attempted_by: req.user.username,
            message: 'Tiket sudah pernah di-scan'
          });
        } catch (socketError) {
          console.error('Socket emit error (non-critical):', socketError.message);
        }
        
        return res.status(400).json({
          status: 'error',
          message: '⚠️ Tiket sudah pernah di-scan',
          ticket: {
            ticket_code: ticket.ticket_code,
            event_title: ticket.event_title,
            user_name: ticket.user_name,
            scanned_at: ticket.scanned_at,
            scanned_by: ticket.scanned_by_name
          },
          error: `Tiket ini sudah di-scan pada ${new Date(ticket.scanned_at).toLocaleString('id-ID')}`
        });
      }

      // Check if ticket is cancelled
      console.log('Updating ticket status to scanned...');
      await conn.execute(`
        UPDATE tickets 
        SET status = 'scanned', 
            scanned_at = NOW(), 
            scanned_by = ?
        WHERE id = ?
      `, [scannerId, ticket.ticket_id]);

      await conn.commit();
      console.log('Transaction committed successfully');
      await conn.release();
      console.log('Database connection released');

      const scanData = {
        ticket_code: ticket.ticket_code,
        event_id: ticket.event_id,
        event_title: ticket.event_title,
        event_date: ticket.event_date,
        event_location: ticket.event_location,
        user_id: ticket.user_id,
        user_name: ticket.user_name,
        user_email: ticket.user_email,
        scanned_at: new Date().toISOString(),
        scanned_by: req.user.username,
        scanned_by_id: scannerId,
        status: 'scanned'
      };

      // Emit real-time events via WebSocket (with error handling)
      try {
        // 1. Notify all users in the event room (panitia dashboard)
        emitToEventRoom(ticket.event_id, 'ticketScanned', scanData);
        
        // 2. Notify the ticket owner specifically
        emitToUser(ticket.user_id, 'myTicketScanned', {
          ...scanData,
          message: 'Tiket Anda telah di-scan dan siap digunakan'
        });
      } catch (socketError) {
        console.error('Socket emit error (non-critical):', socketError.message);
        // Continue with response even if socket fails
      }

      res.json({
        status: 'success',
        message: '✅ Tiket berhasil di-scan! Selamat menikmati event.',
        ticket: scanData
      });
      
      console.log('Scan completed successfully');
      console.log('=========================\n');

    } catch (error) {
      console.error('Error in scan transaction:', error);
      await conn.rollback();
      await conn.release();
      throw error;
    }

  } catch (error) {
    console.error('Error scanning ticket:', error);
    res.status(500).json({
      status: 'error',
      message: '❌ Gagal scan tiket',
      error: error.message
    });
  }
});

module.exports = router;
