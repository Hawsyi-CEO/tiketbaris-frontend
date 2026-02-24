/**
 * Partner Users API
 * 
 * Manages user synchronization between partner systems and Tiket Baris
 */

const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const { authenticatePartnerUser, requirePartnerRole } = require('../../middleware/partnerAuth');

/**
 * GET /api/partner/users/me
 * Get current authenticated user info
 */
router.get('/me', authenticatePartnerUser, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        external_id: req.partnerUser.external_user_id,
        internal_id: req.partnerUser.internal_user_id,
        email: req.partnerUser.external_email,
        name: req.partnerUser.external_name,
        phone: req.partnerUser.external_phone,
        role: req.partnerUser.role,
        partner: req.partner.name,
        created_at: req.partnerUser.created_at,
        last_access: req.partnerUser.last_access
      }
    });
  } catch (error) {
    console.error('[PARTNER USERS] Error getting user:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

/**
 * GET /api/partner/users/:externalId
 * Get user by external ID (admin only)
 */
router.get('/:externalId', authenticatePartnerUser, requirePartnerRole(['admin']), async (req, res) => {
  try {
    const { externalId } = req.params;
    const conn = await pool.getConnection();

    try {
      const [users] = await conn.execute(
        `SELECT pu.*, u.username, u.email as internal_email
         FROM partner_users pu
         LEFT JOIN users u ON pu.internal_user_id = u.id
         WHERE pu.partner_id = ? AND pu.external_user_id = ?`,
        [req.partner.id, externalId]
      );

      if (users.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = users[0];
      res.json({
        success: true,
        user: {
          external_id: user.external_user_id,
          internal_id: user.internal_user_id,
          email: user.external_email,
          name: user.external_name,
          phone: user.external_phone,
          role: user.role,
          created_at: user.created_at,
          last_access: user.last_access
        }
      });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('[PARTNER USERS] Error getting user:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

/**
 * GET /api/partner/users
 * List all users for this partner (admin only)
 */
router.get('/', authenticatePartnerUser, requirePartnerRole(['admin']), async (req, res) => {
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

      // Get total count
      const [countResult] = await conn.execute(
        `SELECT COUNT(*) as total FROM partner_users pu ${whereClause}`,
        params
      );
      const total = countResult[0].total;

      // Get users
      const [users] = await conn.execute(
        `SELECT pu.external_user_id, pu.external_email, pu.external_name, 
                pu.external_phone, pu.role, pu.created_at, pu.last_access
         FROM partner_users pu
         ${whereClause}
         ORDER BY pu.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
      );

      res.json({
        success: true,
        users,
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
    console.error('[PARTNER USERS] Error listing users:', error);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

/**
 * PUT /api/partner/users/:externalId/role
 * Update user role (admin only)
 */
router.put('/:externalId/role', authenticatePartnerUser, requirePartnerRole(['admin']), async (req, res) => {
  try {
    const { externalId } = req.params;
    const { role } = req.body;

    if (!['user', 'panitia', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be: user, panitia, or admin' });
    }

    const conn = await pool.getConnection();

    try {
      const [result] = await conn.execute(
        'UPDATE partner_users SET role = ? WHERE partner_id = ? AND external_user_id = ?',
        [role, req.partner.id, externalId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        success: true,
        message: `User role updated to ${role}`
      });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('[PARTNER USERS] Error updating role:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

module.exports = router;
