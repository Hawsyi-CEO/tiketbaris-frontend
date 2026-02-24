/**
 * Partner Events API
 * 
 * CRUD operations for events via partner API
 */

const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const { authenticatePartnerUser, requirePartnerRole } = require('../../middleware/partnerAuth');

/**
 * GET /api/partner/events
 * List all active events
 * Public for partner (no user auth required, only partner auth)
 */
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category,
      search,
      date_from,
      date_to,
      min_price,
      max_price,
      sort = 'date',
      order = 'asc'
    } = req.query;
    
    const offset = (page - 1) * limit;
    const conn = await pool.getConnection();

    try {
      let whereClause = "WHERE e.status = 'active'";
      const params = [];

      // Only show events from this partner OR public events
      if (req.partner) {
        whereClause += ' AND (e.partner_id = ? OR e.partner_id IS NULL)';
        params.push(req.partner.id);
      }

      if (category) {
        whereClause += ' AND e.category = ?';
        params.push(category);
      }

      if (search) {
        whereClause += ' AND (e.title LIKE ? OR e.description LIKE ? OR e.location LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      if (date_from) {
        whereClause += ' AND e.date >= ?';
        params.push(date_from);
      }

      if (date_to) {
        whereClause += ' AND e.date <= ?';
        params.push(date_to);
      }

      if (min_price) {
        whereClause += ' AND e.price >= ?';
        params.push(parseInt(min_price));
      }

      if (max_price) {
        whereClause += ' AND e.price <= ?';
        params.push(parseInt(max_price));
      }

      // Validate sort field
      const allowedSorts = ['date', 'price', 'title', 'created_at'];
      const sortField = allowedSorts.includes(sort) ? sort : 'date';
      const sortOrder = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

      // Get total count
      const [countResult] = await conn.execute(
        `SELECT COUNT(*) as total FROM events e ${whereClause}`,
        params
      );
      const total = countResult[0].total;

      // Get events
      const [events] = await conn.execute(
        `SELECT 
          e.id,
          e.title,
          e.description,
          e.date,
          e.location,
          e.price,
          e.stock,
          e.image_url,
          e.status,
          e.partner_event_id,
          e.created_at,
          u.username as organizer_name
         FROM events e
         LEFT JOIN users u ON e.user_id = u.id
         ${whereClause}
         ORDER BY e.${sortField} ${sortOrder}
         LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
        [...params]
      );

      // Format response
      const formattedEvents = events.map(event => ({
        id: event.id,
        partner_event_id: event.partner_event_id,
        title: event.title,
        description: event.description,
        date: event.date,
        location: event.location,
        price: event.price,
        stock: {
          total: event.stock,
          available: event.stock // fallback jika current_stock tidak ada
        },
        image_url: event.image_url ? `${process.env.BACKEND_URL}${event.image_url}` : null,
        organizer: event.organizer_name,
        status: event.status,
        created_at: event.created_at
      }));

      res.json({
        success: true,
        events: formattedEvents,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('[PARTNER EVENTS] Error listing events:', error);
    res.status(500).json({ error: 'Failed to list events' });
  }
});

/**
 * GET /api/partner/events/:id
 * Get event detail by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const conn = await pool.getConnection();

    try {
      const [events] = await conn.execute(
        `SELECT 
          e.*,
          u.username as organizer_name
         FROM events e
         LEFT JOIN users u ON e.user_id = u.id
         WHERE e.id = ? AND e.status = 'active'`,
        [id]
      );

      if (events.length === 0) {
        return res.status(404).json({ error: 'Event not found' });
      }

      const event = events[0];

      res.json({
        success: true,
        event: {
          id: event.id,
          partner_event_id: event.partner_event_id,
          title: event.title,
          description: event.description,
          date: event.date,
          location: event.location,
          price: event.price,
          stock: {
            total: event.stock,
            available: event.stock
          },
          image_url: event.image_url ? `${process.env.BACKEND_URL}${event.image_url}` : null,
          organizer: {
            name: event.organizer_name
          },
          status: event.status,
          created_at: event.created_at
        }
      });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('[PARTNER EVENTS] Error getting event:', error);
    res.status(500).json({ error: 'Failed to get event' });
  }
});

/**
 * POST /api/partner/events
 * Create new event (panitia only)
 */
router.post('/', authenticatePartnerUser, requirePartnerRole(['panitia', 'admin']), async (req, res) => {
  try {
    const {
      partner_event_id, // External event ID from partner
      title,
      description,
      date,
      location,
      price,
      stock,
      image_url
    } = req.body;

    // Validate required fields
    if (!title || !date || !location || !price || !stock) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['title', 'date', 'location', 'price', 'stock']
      });
    }

    const conn = await pool.getConnection();

    try {
      // Check partner settings for auto-approve
      let autoApprove = false;
      try {
        if (req.partner.settings && typeof req.partner.settings === 'string') {
          const settings = JSON.parse(req.partner.settings);
          autoApprove = settings.auto_approve_events || false;
        }
      } catch (e) {
        // ignore JSON parse errors
      }
      const status = autoApprove ? 'active' : 'pending';

      const [result] = await conn.execute(
        `INSERT INTO events 
         (user_id, partner_id, partner_event_id, title, description, date, 
          location, price, stock, image_url, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.partnerUser.internal_user_id,
          req.partner.id,
          partner_event_id || null,
          title,
          description || null,
          date,
          location,
          price,
          stock,
          image_url || null,
          status
        ]
      );

      res.status(201).json({
        success: true,
        message: autoApprove ? 'Event created and active' : 'Event created, pending approval',
        event: {
          id: result.insertId,
          partner_event_id,
          title,
          status
        }
      });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('[PARTNER EVENTS] Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

/**
 * PUT /api/partner/events/:id
 * Update event (panitia only, own events)
 */
router.put('/:id', authenticatePartnerUser, requirePartnerRole(['panitia', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const conn = await pool.getConnection();

    try {
      // Check ownership
      const [events] = await conn.execute(
        'SELECT * FROM events WHERE id = ? AND partner_id = ?',
        [id, req.partner.id]
      );

      if (events.length === 0) {
        return res.status(404).json({ error: 'Event not found or access denied' });
      }

      const event = events[0];

      // Only allow update if user owns the event or is admin
      if (event.user_id !== req.partnerUser.internal_user_id && req.partnerUser.role !== 'admin') {
        return res.status(403).json({ error: 'You can only update your own events' });
      }

      // Build update query dynamically
      const allowedFields = ['title', 'description', 'date', 'time', 'location', 'address', 
                           'category', 'price', 'stock', 'image_url', 'terms_conditions'];
      const updates = [];
      const values = [];

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates.push(`${field} = ?`);
          values.push(req.body[field]);
        }
      }

      // Handle stock update (also update current_stock if increasing total)
      if (req.body.stock !== undefined && req.body.stock > event.stock) {
        const stockDiff = req.body.stock - event.stock;
        updates.push('current_stock = current_stock + ?');
        values.push(stockDiff);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      values.push(id);

      await conn.execute(
        `UPDATE events SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      res.json({
        success: true,
        message: 'Event updated successfully'
      });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('[PARTNER EVENTS] Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

/**
 * DELETE /api/partner/events/:id
 * Delete event (panitia only, own events)
 */
router.delete('/:id', authenticatePartnerUser, requirePartnerRole(['panitia', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const conn = await pool.getConnection();

    try {
      // Check ownership
      const [events] = await conn.execute(
        `SELECT e.* FROM events e
         WHERE e.id = ? AND e.partner_id = ?`,
        [id, req.partner.id]
      );

      if (events.length === 0) {
        return res.status(404).json({ error: 'Event not found or access denied' });
      }

      const event = events[0];

      // Only allow delete if user owns the event or is admin
      if (event.user_id !== req.partnerUser.internal_user_id && req.partnerUser.role !== 'admin') {
        return res.status(403).json({ error: 'You can only delete your own events' });
      }

      // Check if any transactions exist for this event
      const [transactions] = await conn.execute(
        'SELECT COUNT(*) as count FROM transactions WHERE event_id = ?',
        [id]
      );
      
      if (transactions[0].count > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete event with transactions',
          transactions_count: transactions[0].count
        });
      }

      await conn.execute('DELETE FROM events WHERE id = ?', [id]);

      res.json({
        success: true,
        message: 'Event deleted successfully'
      });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('[PARTNER EVENTS] Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

/**
 * GET /api/partner/events/my/list
 * List events created by current user (panitia)
 */
router.get('/my/list', authenticatePartnerUser, requirePartnerRole(['panitia', 'admin']), async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;
    const conn = await pool.getConnection();

    try {
      let whereClause = 'WHERE e.user_id = ? AND e.partner_id = ?';
      const params = [req.partnerUser.internal_user_id, req.partner.id];

      if (status) {
        whereClause += ' AND e.status = ?';
        params.push(status);
      }

      const [events] = await conn.execute(
        `SELECT e.*, 
         (SELECT COALESCE(SUM(t.amount), 0) FROM transactions t WHERE t.event_id = e.id AND t.status = 'completed') as total_revenue
         FROM events e
         ${whereClause}
         ORDER BY e.created_at DESC
         LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
        [...params]
      );

      res.json({
        success: true,
        events: events.map(e => ({
          id: e.id,
          partner_event_id: e.partner_event_id,
          title: e.title,
          date: e.date,
          location: e.location,
          price: e.price,
          stock: { total: e.stock, available: e.stock },
          total_revenue: e.total_revenue || 0,
          status: e.status,
          created_at: e.created_at
        }))
      });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('[PARTNER EVENTS] Error listing my events:', error);
    res.status(500).json({ error: 'Failed to list events' });
  }
});

module.exports = router;
