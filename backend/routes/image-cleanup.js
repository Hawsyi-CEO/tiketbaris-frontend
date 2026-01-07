const express = require('express');
const pool = require('../config/database');
const { authenticateToken, checkRole } = require('../middleware/auth');

const router = express.Router();

/**
 * ADMIN ONLY: Clear all event images from database
 * POST /api/admin/clear-event-images
 * 
 * Useful when:
 * - Bulk re-upload event images
 * - Database cleanup
 * - Fixing image path issues
 */
router.post('/clear-event-images', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const conn = await pool.getConnection();
    
    // Count events dengan image sebelum clear
    const [beforeCount] = await conn.execute(
      'SELECT COUNT(*) as count FROM events WHERE image_url IS NOT NULL'
    );
    
    // Clear semua image_url
    const [result] = await conn.execute(
      'UPDATE events SET image_url = NULL WHERE image_url IS NOT NULL'
    );
    
    // Count setelah clear
    const [afterCount] = await conn.execute(
      'SELECT COUNT(*) as count FROM events WHERE image_url IS NOT NULL'
    );
    
    await conn.release();
    
    res.json({
      success: true,
      message: `✅ Successfully cleared ${result.affectedRows} event images`,
      affected_rows: result.affectedRows,
      before: beforeCount[0].count,
      after: afterCount[0].count
    });
    
  } catch (error) {
    console.error('❌ Error clearing images:', error);
    res.status(500).json({ 
      error: 'Failed to clear event images',
      details: error.message 
    });
  }
});

/**
 * ADMIN ONLY: Verify image status
 * GET /api/admin/verify-images
 */
router.get('/verify-images', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const conn = await pool.getConnection();
    
    const [results] = await conn.execute(`
      SELECT 
        id, 
        title, 
        image_url,
        CASE 
          WHEN image_url IS NULL THEN 'No Image'
          ELSE 'Has Image URL'
        END as status
      FROM events 
      WHERE status = 'active'
      LIMIT 20
    `);
    
    await conn.release();
    
    res.json({
      total: results.length,
      events: results
    });
    
  } catch (error) {
    console.error('❌ Error verifying images:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * ADMIN ONLY: Delete single event image
 * DELETE /api/admin/event/:id/image
 * 
 * Request body: { id: event_id }
 */
router.delete('/event/:id/image', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const conn = await pool.getConnection();
    
    // Get event image URL
    const [event] = await conn.execute(
      'SELECT id, title, image_url FROM events WHERE id = ?',
      [id]
    );
    
    if (event.length === 0) {
      await conn.release();
      return res.status(404).json({ error: 'Event tidak ditemukan' });
    }
    
    if (!event[0].image_url) {
      await conn.release();
      return res.status(400).json({ error: 'Event ini tidak memiliki image' });
    }
    
    // Delete image URL dari database
    const [result] = await conn.execute(
      'UPDATE events SET image_url = NULL WHERE id = ?',
      [id]
    );
    
    await conn.release();
    
    res.json({
      success: true,
      message: `✅ Image untuk event "${event[0].title}" berhasil dihapus`,
      event_id: id,
      deleted_image_url: event[0].image_url
    });
    
  } catch (error) {
    console.error('❌ Error deleting image:', error);
    res.status(500).json({ 
      error: 'Failed to delete image',
      details: error.message 
    });
  }
});

/**
 * ADMIN ONLY: Delete ALL event images (with confirmation)
 * DELETE /api/admin/clear-all-images
 */
router.delete('/clear-all-images', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const { confirm } = req.body;
    
    // Require confirmation dari admin
    if (confirm !== true) {
      return res.status(400).json({ 
        error: 'Confirmation required. Send { confirm: true } in request body' 
      });
    }
    
    const conn = await pool.getConnection();
    
    // Get count sebelum delete
    const [beforeCount] = await conn.execute(
      'SELECT COUNT(*) as count FROM events WHERE image_url IS NOT NULL'
    );
    
    // Delete semua images
    const [result] = await conn.execute(
      'UPDATE events SET image_url = NULL WHERE image_url IS NOT NULL'
    );
    
    await conn.release();
    
    res.json({
      success: true,
      message: `✅ Berhasil menghapus ${result.affectedRows} event images`,
      affected_rows: result.affectedRows,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error deleting all images:', error);
    res.status(500).json({ 
      error: 'Failed to delete all images',
      details: error.message 
    });
  }
});

module.exports = router;
