const express = require('express');
const router = express.Router();
const { authenticateToken, checkRole } = require('../middleware/enhanced-auth');
const {
  getUserSessions,
  terminateSession,
  terminateAllOtherSessions,
  cleanupOldSessions
} = require('../middleware/device-tracker');

// Get all sessions for current user
router.get('/my-devices', authenticateToken, async (req, res) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const currentToken = authHeader ? authHeader.replace('Bearer ', '') : null;
    
    const sessions = await getUserSessions(req.user.id, currentToken);
    
    res.json({
      success: true,
      devices: sessions,
      total: sessions.length
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Gagal mengambil data devices' });
  }
});

// Terminate specific session
router.delete('/device/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const success = await terminateSession(sessionId, req.user.id);
    
    if (success) {
      res.json({ success: true, message: 'Device berhasil dihapus' });
    } else {
      res.status(404).json({ error: 'Device tidak ditemukan' });
    }
  } catch (error) {
    console.error('Error terminating session:', error);
    res.status(500).json({ error: 'Gagal menghapus device' });
  }
});

// Terminate all other sessions
router.post('/logout-all-others', authenticateToken, async (req, res) => {
  try {
    const { sessionToken } = req.body;
    
    if (!sessionToken) {
      return res.status(400).json({ error: 'Session token required' });
    }
    
    const count = await terminateAllOtherSessions(req.user.id, sessionToken);
    
    res.json({
      success: true,
      message: `${count} device(s) berhasil di-logout`,
      count
    });
  } catch (error) {
    console.error('Error terminating all sessions:', error);
    res.status(500).json({ error: 'Gagal logout semua device' });
  }
});

// Manual cleanup old sessions (Admin only)
router.post('/cleanup', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const deletedCount = await cleanupOldSessions();
    
    res.json({
      success: true,
      message: `${deletedCount} session lama berhasil dibersihkan`,
      deletedCount
    });
  } catch (error) {
    console.error('Error manual cleanup:', error);
    res.status(500).json({ error: 'Gagal membersihkan session lama' });
  }
});

// Get cleanup info (how many old sessions would be deleted)
router.get('/cleanup-info', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const [result] = await require('../config/database').query(
      `SELECT COUNT(*) as count FROM user_sessions 
       WHERE last_active < DATE_SUB(NOW(), INTERVAL 30 DAY)`
    );
    
    res.json({
      success: true,
      oldSessionsCount: result[0].count,
      message: `${result[0].count} session lama akan dihapus`
    });
  } catch (error) {
    console.error('Error getting cleanup info:', error);
    res.status(500).json({ error: 'Gagal mengambil info cleanup' });
  }
});

module.exports = router;
