const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const conn = await pool.getConnection();

    const [users] = await conn.execute(
      'SELECT id, username as name, email, role, profile_picture, created_at FROM users WHERE id = ?',
      [userId]
    );

    await conn.release();

    if (users.length === 0) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Nama dan email harus diisi' });
    }

    const conn = await pool.getConnection();

    // Check if email already used by other user
    const [existingUsers] = await conn.execute(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, userId]
    );

    if (existingUsers.length > 0) {
      await conn.release();
      return res.status(400).json({ error: 'Email sudah digunakan' });
    }

    // Update profile
    await conn.execute(
      'UPDATE users SET username = ?, email = ? WHERE id = ?',
      [name, email, userId]
    );

    // Get updated user data
    const [users] = await conn.execute(
      'SELECT id, username as name, email, role, profile_picture, created_at FROM users WHERE id = ?',
      [userId]
    );

    await conn.release();

    res.json({ 
      success: true, 
      message: 'Profile berhasil diupdate',
      user: users[0] 
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Password lama dan baru harus diisi' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password baru minimal 6 karakter' });
    }

    const conn = await pool.getConnection();

    // Get current user
    const [users] = await conn.execute(
      'SELECT password FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      await conn.release();
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, users[0].password);
    if (!isValidPassword) {
      await conn.release();
      return res.status(400).json({ error: 'Password lama salah' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await conn.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, userId]
    );

    await conn.release();

    res.json({ 
      success: true, 
      message: 'Password berhasil diubah' 
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get transaction history
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const conn = await pool.getConnection();

    const [transactions] = await conn.execute(
      `SELECT t.id, t.midtrans_order_id, t.amount, t.status, t.transaction_date, e.title as event_name
       FROM transactions t
       JOIN events e ON t.event_id = e.id
       WHERE t.user_id = ?
       ORDER BY t.transaction_date DESC`,
      [userId]
    );

    await conn.release();
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's tickets
router.get('/my-tickets', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const conn = await pool.getConnection();

    const [tickets] = await conn.execute(
      `SELECT 
        tk.id,
        tk.ticket_code,
        tk.status,
        tk.created_at,
        tk.used_at,
        e.id as event_id,
        e.title as event_title,
        e.description as event_description,
        e.date as event_date,
        e.location as event_location,
        e.price as event_price,
        e.image_url as event_image,
        t.midtrans_order_id as order_id,
        t.amount as transaction_amount,
        t.status as transaction_status
       FROM tickets tk
       JOIN events e ON tk.event_id = e.id
       JOIN transactions t ON tk.transaction_id = t.id
       WHERE tk.user_id = ?
       ORDER BY tk.created_at DESC`,
      [userId]
    );

    await conn.release();
    res.json({ success: true, data: tickets });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
