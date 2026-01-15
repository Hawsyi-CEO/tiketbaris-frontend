const express = require('express');
const multer = require('multer');
const path = require('path');
const pool = require('../config/database');
const { authenticateToken, checkRole } = require('../middleware/auth');

const router = express.Router();

// Setup multer untuk upload gambar
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.random().toString(36).substr(2, 9) + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File harus berupa gambar atau dokumen (PDF/Word)'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
});

// Get semua event aktif
router.get('/', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [events] = await conn.execute(
      `SELECT 
        e.id, e.title, e.description, e.date, e.location, e.price, 
        e.current_stock as stock, e.image_url, e.status,
        u.username as organizer
       FROM events e
       LEFT JOIN users u ON e.user_id = u.id
       WHERE e.status = ? AND e.is_hidden = 0 
       ORDER BY e.date ASC`,
      ['active']
    );
    await conn.release();
    res.json(events);
  } catch (error) {
    console.error('[EVENTS] Error getting events:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get event by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const conn = await pool.getConnection();
    const [events] = await conn.execute(
      `SELECT e.*, u.username as organizer, u.email as organizer_email
       FROM events e
       LEFT JOIN users u ON e.user_id = u.id
       WHERE e.id = ? AND e.status = ? AND e.is_hidden = 0`,
      [id, 'active']
    );
    await conn.release();

    if (events.length === 0) {
      return res.status(404).json({ error: 'Event tidak ditemukan' });
    }

    res.json(events[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create event (Panitia) - New workflow with terms agreement
router.post('/', authenticateToken, checkRole(['panitia']), upload.fields([
  { name: 'image_file', maxCount: 1 },
  { name: 'document_file', maxCount: 1 }
]), async (req, res) => {
  try {
    const { title, description, date, location, price, stock, category, terms_agreed } = req.body;
    const userId = req.user.id;

    // Validate terms agreement
    if (terms_agreed !== 'true') {
      return res.status(400).json({ error: 'Anda harus menyetujui syarat dan ketentuan' });
    }

    if (!req.files || !req.files.image_file) {
      return res.status(400).json({ error: 'Gambar harus diunggah' });
    }

    const imageUrl = `/uploads/${req.files.image_file[0].filename}`;
    const documentsUrl = req.files.document_file ? `/uploads/${req.files.document_file[0].filename}` : null;

    const conn = await pool.getConnection();
    
    try {
      await conn.beginTransaction();

      // Insert event with active status (auto-approved)
      const [result] = await conn.execute(
        'INSERT INTO events (user_id, title, description, date, location, price, stock, current_stock, image_url, documents, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, title, description, date, location, price, stock, stock, imageUrl, documentsUrl, 'active']
      );

      const eventId = result.insertId;

      await conn.commit();
      await conn.release();

      res.status(201).json({
        message: 'Event berhasil dipublikasikan dan langsung aktif!',
        eventId: eventId,
        status: 'active'
      });
    } catch (err) {
      await conn.rollback();
      await conn.release();
      throw err;
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's own events (Panitia)
router.get('/user/my-events', authenticateToken, checkRole(['panitia']), async (req, res) => {
  try {
    const userId = req.user.id;
    const conn = await pool.getConnection();
    const [events] = await conn.execute(
      `SELECT e.id, e.title, e.date, e.status, e.price, e.current_stock as stock,
       (SELECT COUNT(*) FROM tickets t WHERE t.event_id = e.id) as tickets_sold
       FROM events e
       WHERE e.user_id = ?
       ORDER BY e.created_at DESC`,
      [userId]
    );
    await conn.release();
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
