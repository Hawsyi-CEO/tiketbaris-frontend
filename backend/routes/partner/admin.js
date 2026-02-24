/**
 * Partner Admin API
 * 
 * Admin endpoints for partner system (e.g., Forbasi Jabar admin dashboard)
 * Only accessible by users with 'admin' role from the partner
 */

const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const { authenticatePartnerUser, requirePartnerRole } = require('../../middleware/partnerAuth');

// All admin routes require admin role
router.use(authenticatePartnerUser, requirePartnerRole(['admin']));

/**
 * GET /api/partner/admin/dashboard
 * Get dashboard statistics
 */
router.get('/dashboard', async (req, res) => {
  try {
    const conn = await pool.getConnection();

    try {
      // Get overall stats
      const [eventStats] = await conn.execute(
        `SELECT 
          COUNT(*) as total_events,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_events,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_events
         FROM events WHERE partner_id = ?`,
        [req.partner.id]
      );

      const [transactionStats] = await conn.execute(
        `SELECT 
          COUNT(*) as total_transactions,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_revenue
         FROM transactions WHERE partner_id = ?`,
        [req.partner.id]
      );

      const [userStats] = await conn.execute(
        `SELECT 
          COUNT(*) as total_users,
          SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as users,
          SUM(CASE WHEN role = 'panitia' THEN 1 ELSE 0 END) as organizers,
          SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins
         FROM partner_users WHERE partner_id = ?`,
        [req.partner.id]
      );

      // Skip tickets stats untuk database lokal yang tidak punya tabel tickets
      const ticketStats = [{ total_tickets: 0, active: 0, used: 0 }];

      // Today's stats - simplified
      const [todayStats] = await conn.execute(
        `SELECT 
          (SELECT COUNT(*) FROM transactions WHERE partner_id = ? AND DATE(transaction_date) = CURDATE()) as today_transactions,
          (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE partner_id = ? AND DATE(transaction_date) = CURDATE() AND status = 'completed') as today_revenue,
          0 as today_scanned
        `,
        [req.partner.id, req.partner.id]
      );

      // Recent activity - simplified
      const [recentTransactions] = await conn.execute(
        `SELECT t.midtrans_order_id, t.amount, t.status, t.transaction_date as created_at,
                e.title as event_title, pu.external_name as buyer_name
         FROM transactions t
         JOIN events e ON t.event_id = e.id
         LEFT JOIN partner_users pu ON t.partner_user_id = pu.id
         WHERE t.partner_id = ?
         ORDER BY t.transaction_date DESC
         LIMIT 10`,
        [req.partner.id]
      );

      res.json({
        success: true,
        dashboard: {
          events: eventStats[0],
          transactions: transactionStats[0],
          users: userStats[0],
          tickets: ticketStats[0],
          today: todayStats[0],
          recent_transactions: recentTransactions
        }
      });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('[PARTNER ADMIN] Error getting dashboard:', error);
    res.status(500).json({ error: 'Failed to get dashboard' });
  }
});

/**
 * GET /api/partner/admin/events
 * List all events (including pending)
 */
router.get('/events', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (page - 1) * limit;
    const conn = await pool.getConnection();

    try {
      let whereClause = 'WHERE e.partner_id = ?';
      const params = [req.partner.id];

      if (status) {
        whereClause += ' AND e.status = ?';
        params.push(status);
      }

      if (search) {
        whereClause += ' AND (e.title LIKE ? OR e.location LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      const [countResult] = await conn.execute(
        `SELECT COUNT(*) as total FROM events e ${whereClause}`,
        params
      );

      const [events] = await conn.execute(
        `SELECT e.*, 
         pu.external_name as organizer_name,
         (SELECT COUNT(*) FROM tickets t WHERE t.event_id = e.id) as tickets_sold,
         (SELECT COALESCE(SUM(total_amount), 0) FROM transactions t WHERE t.event_id = e.id AND t.status = 'completed') as revenue
         FROM events e
         LEFT JOIN partner_users pu ON e.user_id = pu.internal_user_id AND pu.partner_id = e.partner_id
         ${whereClause}
         ORDER BY e.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
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
          stock: { total: e.stock, available: e.current_stock },
          tickets_sold: e.tickets_sold,
          revenue: e.revenue,
          organizer: e.organizer_name,
          status: e.status,
          created_at: e.created_at
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
    console.error('[PARTNER ADMIN] Error listing events:', error);
    res.status(500).json({ error: 'Failed to list events' });
  }
});

/**
 * PUT /api/partner/admin/events/:id/approve
 * Approve pending event
 */
router.put('/events/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const conn = await pool.getConnection();

    try {
      const [result] = await conn.execute(
        "UPDATE events SET status = 'active' WHERE id = ? AND partner_id = ? AND status = 'pending'",
        [id, req.partner.id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Pending event not found' });
      }

      res.json({
        success: true,
        message: 'Event approved successfully'
      });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('[PARTNER ADMIN] Error approving event:', error);
    res.status(500).json({ error: 'Failed to approve event' });
  }
});

/**
 * PUT /api/partner/admin/events/:id/reject
 * Reject pending event
 */
router.put('/events/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const conn = await pool.getConnection();

    try {
      const [result] = await conn.execute(
        "UPDATE events SET status = 'rejected' WHERE id = ? AND partner_id = ? AND status = 'pending'",
        [id, req.partner.id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Pending event not found' });
      }

      res.json({
        success: true,
        message: 'Event rejected'
      });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('[PARTNER ADMIN] Error rejecting event:', error);
    res.status(500).json({ error: 'Failed to reject event' });
  }
});

/**
 * GET /api/partner/admin/transactions
 * List all transactions
 */
router.get('/transactions', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, event_id, date_from, date_to } = req.query;
    const offset = (page - 1) * limit;
    const conn = await pool.getConnection();

    try {
      let whereClause = 'WHERE t.partner_id = ?';
      const params = [req.partner.id];

      if (status) {
        whereClause += ' AND t.status = ?';
        params.push(status);
      }

      if (event_id) {
        whereClause += ' AND t.event_id = ?';
        params.push(event_id);
      }

      if (date_from) {
        whereClause += ' AND DATE(t.created_at) >= ?';
        params.push(date_from);
      }

      if (date_to) {
        whereClause += ' AND DATE(t.created_at) <= ?';
        params.push(date_to);
      }

      const [countResult] = await conn.execute(
        `SELECT COUNT(*) as total, SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END) as total_revenue
         FROM transactions t ${whereClause}`,
        params
      );

      const [transactions] = await conn.execute(
        `SELECT t.*, e.title as event_title, pu.external_name as buyer_name, pu.external_email as buyer_email
         FROM transactions t
         JOIN events e ON t.event_id = e.id
         LEFT JOIN partner_users pu ON t.partner_user_id = pu.id
         ${whereClause}
         ORDER BY t.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
      );

      res.json({
        success: true,
        summary: {
          total_transactions: countResult[0].total,
          total_revenue: countResult[0].total_revenue || 0
        },
        transactions: transactions.map(t => ({
          order_id: t.midtrans_order_id,
          partner_order_id: t.partner_order_id,
          event: { id: t.event_id, title: t.event_title },
          buyer: { name: t.buyer_name, email: t.buyer_email },
          quantity: t.quantity,
          total_amount: t.total_amount,
          status: t.status,
          payment_type: t.payment_type,
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
    console.error('[PARTNER ADMIN] Error listing transactions:', error);
    res.status(500).json({ error: 'Failed to list transactions' });
  }
});

/**
 * GET /api/partner/admin/reports/revenue
 * Get revenue report
 */
router.get('/reports/revenue', async (req, res) => {
  try {
    const { period = 'daily', date_from, date_to } = req.query;
    const conn = await pool.getConnection();

    try {
      let groupBy;
      let dateFormat;

      switch (period) {
        case 'monthly':
          groupBy = "DATE_FORMAT(created_at, '%Y-%m')";
          dateFormat = '%Y-%m';
          break;
        case 'weekly':
          groupBy = "YEARWEEK(created_at)";
          dateFormat = '%Y-%W';
          break;
        default:
          groupBy = "DATE(created_at)";
          dateFormat = '%Y-%m-%d';
      }

      let whereClause = "WHERE t.partner_id = ? AND t.status = 'completed'";
      const params = [req.partner.id];

      if (date_from) {
        whereClause += ' AND DATE(t.created_at) >= ?';
        params.push(date_from);
      }

      if (date_to) {
        whereClause += ' AND DATE(t.created_at) <= ?';
        params.push(date_to);
      }

      const [report] = await conn.execute(
        `SELECT 
          ${groupBy} as period,
          COUNT(*) as transactions,
          SUM(quantity) as tickets_sold,
          SUM(total_amount) as revenue
         FROM transactions t
         ${whereClause}
         GROUP BY ${groupBy}
         ORDER BY period DESC
         LIMIT 30`,
        params
      );

      // Get totals
      const [totals] = await conn.execute(
        `SELECT COUNT(*) as total_transactions, SUM(quantity) as total_tickets, SUM(total_amount) as total_revenue
         FROM transactions t ${whereClause}`,
        params
      );

      res.json({
        success: true,
        period,
        totals: totals[0],
        data: report
      });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('[PARTNER ADMIN] Error getting revenue report:', error);
    res.status(500).json({ error: 'Failed to get report' });
  }
});

/**
 * GET /api/partner/admin/users
 * List all partner users
 */
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const offset = (page - 1) * limit;
    const conn = await pool.getConnection();

    try {
      let whereClause = 'WHERE pu.partner_id = ?';
      const params = [req.partner.id];

      if (role) {
        whereClause += ' AND pu.role = ?';
        params.push(role);
      }

      if (search) {
        whereClause += ' AND (pu.external_name LIKE ? OR pu.external_email LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      const [countResult] = await conn.execute(
        `SELECT COUNT(*) as total FROM partner_users pu ${whereClause}`,
        params
      );

      const [users] = await conn.execute(
        `SELECT pu.*,
         (SELECT COUNT(*) FROM transactions t WHERE t.partner_user_id = pu.id AND t.status = 'completed') as total_purchases,
         (SELECT COALESCE(SUM(total_amount), 0) FROM transactions t WHERE t.partner_user_id = pu.id AND t.status = 'completed') as total_spent
         FROM partner_users pu
         ${whereClause}
         ORDER BY pu.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
      );

      res.json({
        success: true,
        users: users.map(u => ({
          external_id: u.external_user_id,
          email: u.external_email,
          name: u.external_name,
          phone: u.external_phone,
          role: u.role,
          total_purchases: u.total_purchases,
          total_spent: u.total_spent,
          last_access: u.last_access,
          created_at: u.created_at
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
    console.error('[PARTNER ADMIN] Error listing users:', error);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

module.exports = router;
