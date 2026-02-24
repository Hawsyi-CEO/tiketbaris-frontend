/**
 * Partner Tickets API
 * 
 * Manage tickets via partner API
 */

const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const QRCode = require('qrcode');
const { authenticatePartnerUser, requirePartnerRole } = require('../../middleware/partnerAuth');

/**
 * GET /api/partner/tickets
 * List tickets for current user
 */
router.get('/', authenticatePartnerUser, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, event_id } = req.query;
    const offset = (page - 1) * limit;
    const conn = await pool.getConnection();

    try {
      let whereClause = 'WHERE t.user_id = ?';
      const params = [req.partnerUser.internal_user_id];

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
        `SELECT COUNT(*) as total FROM tickets t ${whereClause}`,
        params
      );

      // Get tickets with event info
      const [tickets] = await conn.execute(
        `SELECT t.*, e.title as event_title, e.date as event_date, 
                e.time as event_time, e.location as event_location
         FROM tickets t
         JOIN events e ON t.event_id = e.id
         ${whereClause}
         ORDER BY e.date ASC, t.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
      );

      res.json({
        success: true,
        tickets: tickets.map(t => ({
          ticket_code: t.ticket_code,
          event: {
            id: t.event_id,
            title: t.event_title,
            date: t.event_date,
            time: t.event_time,
            location: t.event_location
          },
          price: t.price,
          status: t.status,
          scanned_at: t.scanned_at,
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
    console.error('[PARTNER TICKETS] Error listing tickets:', error);
    res.status(500).json({ error: 'Failed to list tickets' });
  }
});

/**
 * GET /api/partner/tickets/:code
 * Get ticket detail with QR code
 */
router.get('/:code', authenticatePartnerUser, async (req, res) => {
  try {
    const { code } = req.params;
    const conn = await pool.getConnection();

    try {
      const [tickets] = await conn.execute(
        `SELECT t.*, e.title as event_title, e.date as event_date, 
                e.time as event_time, e.location as event_location, e.address,
                tr.midtrans_order_id as order_id
         FROM tickets t
         JOIN events e ON t.event_id = e.id
         JOIN transactions tr ON t.transaction_id = tr.id
         WHERE t.ticket_code = ?`,
        [code]
      );

      if (tickets.length === 0) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      const ticket = tickets[0];

      // Check ownership (user or event organizer)
      const isOwner = ticket.user_id === req.partnerUser.internal_user_id;
      const [eventOwner] = await conn.execute(
        'SELECT user_id FROM events WHERE id = ?',
        [ticket.event_id]
      );
      const isOrganizer = eventOwner[0]?.user_id === req.partnerUser.internal_user_id;
      const isAdmin = req.partnerUser.role === 'admin';

      if (!isOwner && !isOrganizer && !isAdmin) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Generate QR code
      const qrData = JSON.stringify({
        code: ticket.ticket_code,
        event_id: ticket.event_id,
        valid: ticket.status === 'active'
      });
      const qrCode = await QRCode.toDataURL(qrData);

      res.json({
        success: true,
        ticket: {
          ticket_code: ticket.ticket_code,
          qr_code: qrCode,
          event: {
            id: ticket.event_id,
            title: ticket.event_title,
            date: ticket.event_date,
            time: ticket.event_time,
            location: ticket.event_location,
            address: ticket.address
          },
          order_id: ticket.order_id,
          price: ticket.price,
          status: ticket.status,
          scanned_at: ticket.scanned_at,
          created_at: ticket.created_at
        }
      });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('[PARTNER TICKETS] Error getting ticket:', error);
    res.status(500).json({ error: 'Failed to get ticket' });
  }
});

/**
 * POST /api/partner/tickets/:code/scan
 * Scan/validate ticket (panitia only)
 */
router.post('/:code/scan', authenticatePartnerUser, requirePartnerRole(['panitia', 'admin']), async (req, res) => {
  try {
    const { code } = req.params;
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      // Get ticket and verify event ownership
      const [tickets] = await conn.execute(
        `SELECT t.*, e.user_id as event_owner_id, e.title as event_title, e.date as event_date
         FROM tickets t
         JOIN events e ON t.event_id = e.id
         WHERE t.ticket_code = ?`,
        [code]
      );

      if (tickets.length === 0) {
        await conn.rollback();
        return res.status(404).json({ 
          success: false,
          error: 'Ticket not found',
          code: 'TICKET_NOT_FOUND'
        });
      }

      const ticket = tickets[0];

      // Check if user owns the event or is admin
      const isOrganizer = ticket.event_owner_id === req.partnerUser.internal_user_id;
      const isAdmin = req.partnerUser.role === 'admin';

      if (!isOrganizer && !isAdmin) {
        await conn.rollback();
        return res.status(403).json({
          success: false,
          error: 'You can only scan tickets for your own events',
          code: 'NOT_EVENT_OWNER'
        });
      }

      // Check ticket status
      if (ticket.status === 'used') {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          error: 'Ticket already used',
          code: 'ALREADY_USED',
          scanned_at: ticket.scanned_at
        });
      }

      if (ticket.status !== 'active') {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          error: `Ticket status is ${ticket.status}`,
          code: 'INVALID_STATUS'
        });
      }

      // Check event date (allow scanning on event day and day before)
      const eventDate = new Date(ticket.event_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dayBefore = new Date(eventDate);
      dayBefore.setDate(dayBefore.getDate() - 1);

      if (today < dayBefore) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          error: 'Event has not started yet',
          code: 'EVENT_NOT_STARTED',
          event_date: ticket.event_date
        });
      }

      // Mark ticket as used
      await conn.execute(
        "UPDATE tickets SET status = 'used', scanned_at = NOW() WHERE id = ?",
        [ticket.id]
      );

      await conn.commit();

      res.json({
        success: true,
        message: 'Ticket validated successfully',
        ticket: {
          ticket_code: ticket.ticket_code,
          event: {
            id: ticket.event_id,
            title: ticket.event_title,
            date: ticket.event_date
          },
          status: 'used',
          scanned_at: new Date().toISOString(),
          scanned_by: req.partnerUser.external_name
        }
      });
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('[PARTNER TICKETS] Error scanning ticket:', error);
    res.status(500).json({ error: 'Failed to scan ticket' });
  }
});

/**
 * GET /api/partner/tickets/event/:eventId
 * List all tickets for an event (panitia only)
 */
router.get('/event/:eventId', authenticatePartnerUser, requirePartnerRole(['panitia', 'admin']), async (req, res) => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 50, status } = req.query;
    const offset = (page - 1) * limit;
    const conn = await pool.getConnection();

    try {
      // Verify event ownership
      const [events] = await conn.execute(
        'SELECT * FROM events WHERE id = ? AND partner_id = ?',
        [eventId, req.partner.id]
      );

      if (events.length === 0) {
        return res.status(404).json({ error: 'Event not found' });
      }

      const event = events[0];

      // Check if user owns event or is admin
      if (event.user_id !== req.partnerUser.internal_user_id && req.partnerUser.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
      }

      let whereClause = 'WHERE t.event_id = ?';
      const params = [eventId];

      if (status) {
        whereClause += ' AND t.status = ?';
        params.push(status);
      }

      // Get ticket stats
      const [stats] = await conn.execute(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN status = 'used' THEN 1 ELSE 0 END) as used,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
         FROM tickets WHERE event_id = ?`,
        [eventId]
      );

      // Get tickets
      const [tickets] = await conn.execute(
        `SELECT t.ticket_code, t.status, t.price, t.scanned_at, t.created_at,
                pu.external_name as buyer_name, pu.external_email as buyer_email
         FROM tickets t
         LEFT JOIN partner_users pu ON t.user_id = pu.internal_user_id AND pu.partner_id = ?
         ${whereClause}
         ORDER BY t.created_at DESC
         LIMIT ? OFFSET ?`,
        [req.partner.id, ...params, parseInt(limit), offset]
      );

      res.json({
        success: true,
        event: {
          id: event.id,
          title: event.title,
          date: event.date
        },
        stats: stats[0],
        tickets: tickets,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: stats[0].total,
          pages: Math.ceil(stats[0].total / limit)
        }
      });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('[PARTNER TICKETS] Error listing event tickets:', error);
    res.status(500).json({ error: 'Failed to list tickets' });
  }
});

module.exports = router;
