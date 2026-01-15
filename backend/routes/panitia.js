const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../config/database');
const { authenticateToken, checkRole } = require('../middleware/auth');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Setup multer untuk upload gambar
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.random().toString(36).substr(2, 9) + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File harus berupa gambar'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

// Setup multer untuk upload dokumen (multiple file types)
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/documents');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.random().toString(36).substr(2, 9) + path.extname(file.originalname));
  }
});

const uploadDocuments = multer({
  storage: documentStorage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

// Combined storage for both image and documents
const combinedStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Documents go to documents folder, images to uploads
    const dir = file.fieldname === 'documents' 
      ? path.join(__dirname, '../uploads/documents')
      : path.join(__dirname, '../uploads');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.random().toString(36).substr(2, 9) + path.extname(file.originalname));
  }
});

// Combined upload handler for image + documents
const uploadFields = multer({
  storage: combinedStorage,
  limits: { fileSize: 10 * 1024 * 1024 }
}).fields([
  { name: 'image_file', maxCount: 1 },
  { name: 'documents', maxCount: 10 }
]);

// Get panitia's own events
router.get('/events', authenticateToken, checkRole(['panitia']), async (req, res) => {
  try {
    const userId = req.user.id;
    const conn = await pool.getConnection();
    const [events] = await conn.execute(
      `SELECT 
        e.id, e.title, e.description, e.date, e.location, 
        e.price, e.stock, e.current_stock,
        e.image_url, e.documents, e.status, e.created_at,
        (SELECT COUNT(*) FROM tickets t WHERE t.event_id = e.id) as tickets_sold
       FROM events e
       WHERE e.user_id = ? 
       ORDER BY e.created_at DESC`,
      [userId]
    );
    await conn.release();
    res.json(events || []);
  } catch (error) {
    console.error('Error fetching panitia events:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new event with file upload (Panitia)
router.post('/events-upload', authenticateToken, checkRole(['panitia']), uploadFields, async (req, res) => {
  try {
    console.log('=== POST /events-upload ===');
    console.log('Body:', req.body);
    console.log('Files:', req.files);

    const { title, description, date, location, capacity, price } = req.body;
    const userId = req.user.id;

    // Validasi field required
    if (!title || !date || !location || !capacity || !price) {
      return res.status(400).json({ error: 'Field required harus diisi' });
    }

    // Parse numeric values - capacity dan price dari FormData adalah string
    const parsedCapacity = parseInt(capacity, 10);
    const parsedPrice = parseFloat(price);

    // Validate parsed values
    if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
      return res.status(400).json({ error: 'Capacity harus berupa angka positif' });
    }
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({ error: 'Price harus berupa angka positif' });
    }

    // Get image file from req.files
    const imageUrl = req.files?.image_file?.[0] ? `/uploads/${req.files.image_file[0].filename}` : null;

    // Process documents
    let documentsJson = null;
    if (req.files?.documents && req.files.documents.length > 0) {
      const documents = req.files.documents.map(file => ({
        name: file.originalname,
        url: `/uploads/documents/${file.filename}`,
        size: file.size,
        type: file.mimetype
      }));
      documentsJson = JSON.stringify(documents);
    }

    const conn = await pool.getConnection();
    
    const [result] = await conn.execute(
      `INSERT INTO events 
        (user_id, title, description, date, location, price, stock, image_url, documents, status) 
       VALUES 
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, title, description || '', date, location, parsedPrice, parsedCapacity, imageUrl, documentsJson, 'pending']
    );
    
    await conn.release();

    res.status(201).json({
      message: 'Event berhasil dibuat! Menunggu persetujuan admin.',
      eventId: result.insertId,
      event: {
        id: result.insertId,
        title,
        date,
        location,
        status: 'pending',
        image_url: imageUrl,
        documents: documentsJson
      }
    });
  } catch (error) {
    console.error('Error creating event with upload:', error.message);
    res.status(500).json({ error: error.message || 'Terjadi kesalahan saat membuat event' });
  }
});

// Create new event (Panitia) - tanpa file upload
router.post('/events', authenticateToken, checkRole(['panitia']), async (req, res) => {
  try {
    const { title, description, date, location, capacity, price, image_url } = req.body;
    const userId = req.user.id;

    // Validasi field required
    if (!title || !date || !location || !capacity || !price) {
      return res.status(400).json({ error: 'Field required harus diisi' });
    }

    const conn = await pool.getConnection();
    
    const [result] = await conn.execute(
      `INSERT INTO events 
        (user_id, title, description, date, location, price, stock, image_url, status) 
       VALUES 
        (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, title, description || '', date, location, price, capacity, image_url || null, 'pending']
    );
    
    await conn.release();

    res.status(201).json({
      message: 'Event berhasil dibuat! Menunggu persetujuan admin.',
      eventId: result.insertId,
      event: {
        id: result.insertId,
        title,
        date,
        location,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get event by ID (for panitia to edit/view their own event)
router.get('/events/:eventId', authenticateToken, checkRole(['panitia']), async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;
    const conn = await pool.getConnection();
    
    const [events] = await conn.execute(
      `SELECT id, user_id, title, description, date, location, price, stock as capacity, stock, 
              image_url, documents, status, created_at 
       FROM events WHERE id = ? AND user_id = ?`,
      [eventId, userId]
    );
    
    await conn.release();

    if (events.length === 0) {
      return res.status(404).json({ error: 'Event tidak ditemukan atau Anda tidak memiliki akses' });
    }

    res.json(events[0]);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update event with file upload (panitia)
router.put('/events/:eventId-upload', authenticateToken, checkRole(['panitia']), uploadFields, async (req, res) => {
  try {
    console.log('=== PUT /events/:eventId-upload ===');
    console.log('Params:', req.params);
    console.log('Body:', req.body);
    console.log('Files:', req.files);

    const eventId = req.params.eventId.replace('-upload', '');
    const userId = req.user.id;
    const { title, description, date, location, capacity, price } = req.body;

    // Parse numeric values - capacity dan price dari FormData adalah string
    const parsedCapacity = parseInt(capacity, 10);
    const parsedPrice = parseFloat(price);

    // Validate parsed values
    if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
      return res.status(400).json({ error: 'Capacity harus berupa angka positif' });
    }
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({ error: 'Price harus berupa angka positif' });
    }

    const conn = await pool.getConnection();
    
    // Verify ownership
    const [events] = await conn.execute(
      'SELECT id, image_url, documents FROM events WHERE id = ? AND user_id = ?',
      [eventId, userId]
    );

    if (events.length === 0) {
      await conn.release();
      return res.status(404).json({ error: 'Event tidak ditemukan atau Anda tidak memiliki akses' });
    }

    // Get image file from req.files
    const imageUrl = req.files?.image_file?.[0] ? `/uploads/${req.files.image_file[0].filename}` : events[0].image_url;

    // Process new documents (append to existing)
    let documentsJson = events[0].documents;
    if (req.files?.documents && req.files.documents.length > 0) {
      let existingDocs = [];
      if (documentsJson) {
        try {
          existingDocs = JSON.parse(documentsJson);
        } catch (e) {
          existingDocs = [];
        }
      }
      
      const newDocs = req.files.documents.map(file => ({
        name: file.originalname,
        url: `/uploads/documents/${file.filename}`,
        size: file.size,
        type: file.mimetype
      }));
      
      documentsJson = JSON.stringify([...existingDocs, ...newDocs]);
    }

    // Update event
    await conn.execute(
      `UPDATE events 
       SET title = ?, description = ?, date = ?, location = ?, price = ?, stock = ?, image_url = ?, documents = ?
       WHERE id = ? AND user_id = ?`,
      [title, description, date, location, parsedPrice, parsedCapacity, imageUrl, documentsJson, eventId, userId]
    );

    await conn.release();

    res.json({
      message: 'Event berhasil diupdate',
      eventId,
      image_url: imageUrl,
      documents: documentsJson
    });
  } catch (error) {
    console.error('Error updating event with upload:', error.message);
    res.status(500).json({ error: error.message || 'Terjadi kesalahan saat update event' });
  }
});

// Update event (panitia) - tanpa file upload
router.put('/events/:eventId', authenticateToken, checkRole(['panitia']), async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;
    const { title, description, date, location, capacity, price, image_url } = req.body;

    // Parse numeric values
    const parsedCapacity = parseInt(capacity, 10);
    const parsedPrice = parseFloat(price);

    // Validate parsed values
    if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
      return res.status(400).json({ error: 'Capacity harus berupa angka positif' });
    }
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({ error: 'Price harus berupa angka positif' });
    }

    const conn = await pool.getConnection();
    
    // Verify ownership
    const [events] = await conn.execute(
      'SELECT id, image_url FROM events WHERE id = ? AND user_id = ?',
      [eventId, userId]
    );

    if (events.length === 0) {
      await conn.release();
      return res.status(404).json({ error: 'Event tidak ditemukan atau Anda tidak memiliki akses' });
    }

    // Use existing image_url if not provided (undefined or null)
    const finalImageUrl = image_url !== undefined && image_url !== null ? image_url : events[0].image_url;

    // Update event - ensure no undefined values
    await conn.execute(
      `UPDATE events 
       SET title = ?, description = ?, date = ?, location = ?, price = ?, stock = ?, image_url = ?
       WHERE id = ? AND user_id = ?`,
      [
        title || null, 
        description || null, 
        date || null, 
        location || null, 
        parsedPrice, 
        parsedCapacity, 
        finalImageUrl || null, 
        eventId, 
        userId
      ]
    );

    await conn.release();

    res.json({
      message: 'Event berhasil diupdate',
      eventId
    });
  } catch (error) {
    console.error('Error updating event:', error.message);
    res.status(500).json({ error: error.message || 'Terjadi kesalahan saat update event' });
  }
});

// Delete event (panitia)
router.delete('/events/:eventId', authenticateToken, checkRole(['panitia']), async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;
    const conn = await pool.getConnection();

    // Verify ownership
    const [events] = await conn.execute(
      'SELECT id FROM events WHERE id = ? AND user_id = ?',
      [eventId, userId]
    );

    if (events.length === 0) {
      await conn.release();
      return res.status(404).json({ error: 'Event tidak ditemukan atau Anda tidak memiliki akses' });
    }

    // Delete event
    await conn.execute('DELETE FROM events WHERE id = ? AND user_id = ?', [eventId, userId]);

    await conn.release();

    res.json({
      message: 'Event berhasil dihapus',
      eventId
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get panitia profile
router.get('/profile', authenticateToken, checkRole(['panitia']), async (req, res) => {
  try {
    const userId = req.user.id;
    const conn = await pool.getConnection();
    
    const [users] = await conn.execute(
      'SELECT id, username, email, role, profile_picture, phone, address, created_at FROM users WHERE id = ?',
      [userId]
    );
    
    await conn.release();
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }
    
    res.json({ user: users[0] });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update panitia profile
router.put('/profile', authenticateToken, checkRole(['panitia']), async (req, res) => {
  try {
    const userId = req.user.id;
    const { email } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({ error: 'Email harus diisi' });
    }

    const conn = await pool.getConnection();

    // Check if email already used by other user
    const [existingUsers] = await conn.execute(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, userId]
    );

    if (existingUsers.length > 0) {
      await conn.release();
      return res.status(400).json({ error: 'Email sudah digunakan oleh user lain' });
    }

    // Update profile
    await conn.execute(
      'UPDATE users SET email = ? WHERE id = ?',
      [email, userId]
    );

    await conn.release();

    res.json({ 
      message: 'Profile berhasil diupdate',
      user: { email }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get my events (alias untuk /events)
router.get('/my-events', authenticateToken, checkRole(['panitia']), async (req, res) => {
  try {
    const userId = req.user.id;
    const conn = await pool.getConnection();
    const [events] = await conn.execute(
      `SELECT 
        e.id, e.title, e.description, e.date, e.location, 
        e.price, e.stock, e.current_stock,
        e.image_url, e.documents, e.status, e.created_at,
        (SELECT COUNT(*) FROM tickets t WHERE t.event_id = e.id) as tickets_sold
       FROM events e
       WHERE e.user_id = ? 
       ORDER BY e.created_at DESC`,
      [userId]
    );
    await conn.release();
    res.json(events || []);
  } catch (error) {
    console.error('Error fetching my events:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get event tickets for panitia
router.get('/event-tickets', authenticateToken, checkRole(['panitia']), async (req, res) => {
  try {
    const userId = req.user.id;
    const conn = await pool.getConnection();
    
    const [tickets] = await conn.execute(
      `SELECT 
        t.id, t.ticket_code, t.status, t.price, t.scanned_at, t.created_at,
        e.id as event_id, e.title as event_title, e.date as event_date,
        u.username as holder_name, u.email as buyer_email
       FROM tickets t
       JOIN events e ON t.event_id = e.id
       LEFT JOIN users u ON t.user_id = u.id
       WHERE e.user_id = ?
       ORDER BY t.created_at DESC`,
      [userId]
    );
    
    await conn.release();
    res.json(tickets || []);
  } catch (error) {
    console.error('Error fetching event tickets:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
