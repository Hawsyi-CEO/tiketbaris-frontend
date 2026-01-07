const express = require('express');
const pool = require('../config/database');
const { authenticateToken, checkRole } = require('../middleware/auth');

const router = express.Router();

// Get user withdrawals
router.get('/', authenticateToken, checkRole(['panitia']), async (req, res) => {
  try {
    const userId = req.user.id;
    const conn = await pool.getConnection();

    const [withdrawals] = await conn.execute(
      'SELECT id, amount, status, requested_at FROM withdrawals WHERE user_id = ? ORDER BY requested_at DESC',
      [userId]
    );

    await conn.release();
    res.json(withdrawals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Request withdrawal
router.post('/request', authenticateToken, checkRole(['panitia']), async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Nominal harus lebih dari 0' });
    }

    const conn = await pool.getConnection();

    const [result] = await conn.execute(
      'INSERT INTO withdrawals (user_id, amount, status) VALUES (?, ?, ?)',
      [userId, amount, 'pending']
    );

    await conn.release();

    res.status(201).json({
      message: 'Permintaan penarikan berhasil dibuat',
      withdrawalId: result.insertId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
