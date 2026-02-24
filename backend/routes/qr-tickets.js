const express = require('express');
const QRCode = require('qrcode');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { emitToUser } = require('../socket-server');

const router = express.Router();

// Get user tickets with QR codes
router.get('/my-tickets', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const conn = await pool.getConnection();
    
    const [tickets] = await conn.execute(
      `SELECT 
        t.id as ticket_id,
        t.ticket_code,
        t.status as ticket_status,
        t.created_at as purchased_at,
        t.transaction_id,
        e.id as event_id,
        e.title as event_title,
        e.description as event_description,
        e.date as event_date,
        e.location as event_location,
        e.price as ticket_price,
        e.image_url as event_image,
        tr.amount as paid_amount,
        tr.status as payment_status,
        tr.transaction_date
      FROM tickets t
      JOIN events e ON t.event_id = e.id
      JOIN transactions tr ON t.transaction_id = tr.id
      WHERE t.user_id = ?
      ORDER BY t.created_at DESC`,
      [userId]
    );
    
    await conn.release();
    
    // Generate QR codes for each ticket
    const ticketsWithQR = await Promise.all(
      tickets.map(async (ticket) => {
        const qrData = {
          ticketId: ticket.ticket_id,
          ticketCode: ticket.ticket_code,
          eventId: ticket.event_id,
          userId: userId
          // REMOVED timestamp - agar QR code konsisten
        };
        
        const qrCodeUrl = await QRCode.toDataURL(JSON.stringify(qrData));
        
        return {
          ...ticket,
          qr_code: qrCodeUrl
        };
      })
    );
    
    res.json({
      tickets: ticketsWithQR,
      total: ticketsWithQR.length
    });
    
  } catch (error) {
    console.error('[TICKETS] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Scan QR code (for event organizers/panitia)
router.post('/scan', authenticateToken, async (req, res) => {
  try {
    const { qrData } = req.body;
    const scannerId = req.user.id;
    
    if (!qrData) {
      return res.status(400).json({ error: 'QR code data is required' });
    }
    
    let ticketInfo;
    try {
      ticketInfo = JSON.parse(qrData);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid QR code format' });
    }
    
    const conn = await pool.getConnection();
    
    try {
      await conn.beginTransaction();
      
      // Get ticket details
      const [tickets] = await conn.execute(
        `SELECT 
          t.id, t.ticket_code, t.status, t.user_id,
          e.id as event_id, e.title, e.user_id as organizer_id,
          u.username as ticket_holder
        FROM tickets t
        JOIN events e ON t.event_id = e.id
        JOIN users u ON t.user_id = u.id
        WHERE t.id = ? AND t.ticket_code = ?`,
        [ticketInfo.ticketId, ticketInfo.ticketCode]
      );
      
      if (tickets.length === 0) {
        await conn.rollback();
        await conn.release();
        return res.status(404).json({ error: 'Tiket tidak ditemukan' });
      }
      
      const ticket = tickets[0];
      
      // Check if scanner has permission (is the event organizer)
      if (ticket.organizer_id !== scannerId && req.user.role !== 'admin') {
        await conn.rollback();
        await conn.release();
        return res.status(403).json({ error: 'Anda tidak memiliki akses untuk scan tiket ini' });
      }
      
      // Check if ticket already used
      if (ticket.status === 'scanned' || ticket.status === 'used') {
        await conn.rollback();
        await conn.release();
        return res.status(400).json({ 
          error: 'Tiket sudah pernah digunakan',
          ticket_info: {
            code: ticket.ticket_code,
            holder: ticket.ticket_holder,
            event: ticket.title,
            status: ticket.status
          }
        });
      }
      
      // Update ticket status to scanned
      await conn.execute(
        'UPDATE tickets SET status = ?, scanned_at = NOW(), scanned_by = ? WHERE id = ?',
        ['scanned', scannerId, ticket.id]
      );
      
      await conn.commit();
      await conn.release();
      
      // Emit real-time notification to ticket holder
      try {
        emitToUser(ticket.user_id, 'ticketScanned', {
          ticket_id: ticket.id,
          ticket_code: ticket.ticket_code,
          status: 'scanned',
          scanned_at: new Date().toISOString(),
          scanner: req.user.username,
          event_title: ticket.title
        });
      } catch (socketError) {
        console.error('[SCAN] Socket emit error (non-critical):', socketError.message);
      }
      
      res.json({
        success: true,
        message: 'Tiket berhasil di-scan!',
        ticket_info: {
          code: ticket.ticket_code,
          holder: ticket.ticket_holder,
          event: ticket.title,
          scanned_at: new Date().toISOString(),
          scanner: req.user.username
        }
      });
      
    } catch (error) {
      await conn.rollback();
      await conn.release();
      throw error;
    }
    
  } catch (error) {
    console.error('[SCAN] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get scanning history for event organizer
router.get('/scan-history/:eventId', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;
    
    const conn = await pool.getConnection();
    
    // Verify user is the event organizer
    const [events] = await conn.execute(
      'SELECT user_id FROM events WHERE id = ?',
      [eventId]
    );
    
    if (events.length === 0) {
      await conn.release();
      return res.status(404).json({ error: 'Event tidak ditemukan' });
    }
    
    if (events[0].user_id !== userId && req.user.role !== 'admin') {
      await conn.release();
      return res.status(403).json({ error: 'Tidak memiliki akses' });
    }
    
    // Get scanned tickets for this event
    const [scannedTickets] = await conn.execute(
      `SELECT 
        t.ticket_code,
        t.status,
        t.scanned_at,
        u.username as ticket_holder,
        scanner.username as scanned_by
      FROM tickets t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN users scanner ON t.scanned_by = scanner.id
      WHERE t.event_id = ? AND t.status IN ('scanned', 'used')
      ORDER BY t.scanned_at DESC`,
      [eventId]
    );
    
    await conn.release();
    
    res.json({
      event_id: eventId,
      scanned_count: scannedTickets.length,
      tickets: scannedTickets
    });
    
  } catch (error) {
    console.error('[SCAN_HISTORY] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;