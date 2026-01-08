const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const fs = require('fs');
const path = require('path');
const { OAuth2Client } = require('google-auth-library');

// Import security middleware
const { validateInput, validationSchemas } = require('../middleware/security');
const { trackLoginAttempt, validatePasswordStrength, generateCSRFToken } = require('../middleware/enhanced-auth');
const { logAuthEvent, logSuspiciousActivity } = require('../middleware/logger');
const { trackDevice, trackAdminDevice } = require('../middleware/device-tracker');

const router = express.Router();

// Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const DEBUG_LOG = path.join(__dirname, '..', 'auth-debug.log');
function dbg(msg) {
  try { fs.appendFileSync(DEBUG_LOG, `[${new Date().toISOString()}] ${msg}\n`); } catch (e) { console.error('Failed to write debug log', e); }
}

// Register with enhanced security
router.post('/register', validateInput(validationSchemas.register), async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    
    // Enhanced password validation
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      logSuspiciousActivity('WEAK_PASSWORD_ATTEMPT', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        email: email,
        additional: { requirements: passwordValidation.requirements }
      });
      
      return res.status(400).json({ 
        error: 'Password tidak memenuhi kriteria keamanan',
        requirements: {
          minLength: 'Minimal 8 karakter',
          hasUpper: 'Harus ada huruf besar',
          hasLower: 'Harus ada huruf kecil', 
          hasNumber: 'Harus ada angka',
          hasSpecial: 'Harus ada karakter khusus (@$!%*?&)',
          noCommon: 'Tidak boleh password umum'
        },
        score: passwordValidation.score
      });
    }
    let conn;
    try {
      conn = await pool.getConnection();
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return res.status(500).json({ error: 'Database connection failed' });
    }

    // Cek apakah email sudah terdaftar
    const [existingUser] = await conn.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      await conn.release();
      
      logSuspiciousActivity('DUPLICATE_REGISTRATION_ATTEMPT', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        email: email
      });
      
      return res.status(400).json({ error: 'Email sudah terdaftar' });
    }

    // Hash password dengan salt rounds optimal
    const hashedPassword = await bcrypt.hash(password, 12); // Increased from 8 to 12 for better security

    // Insert user baru
    const [result] = await conn.execute(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, role]
    );

    await conn.release();

    // Log successful registration
    logAuthEvent('REGISTRATION_SUCCESS', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      email: email,
      role: role,
      userId: result.insertId
    });

    res.status(201).json({ message: 'Registrasi berhasil! Silakan login.' });
  } catch (error) {
    logAuthEvent('REGISTRATION_ERROR', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      email: req.body?.email,
      error: error.message
    });
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login with enhanced security  
router.post('/login', validateInput(validationSchemas.login), async (req, res) => {
  try {
    const { email, password } = req.body;
    const clientIP = req.ip;
    const userAgent = req.get('User-Agent');
    console.log('[AUTH] Login attempt:', { email });
    dbg(`Login attempt: ${email}`);
    let conn;
    try {
      conn = await pool.getConnection();
    } catch (dbError) {
      console.error('Database connection failed in login:', dbError);
      return res.status(500).json({ error: 'Database connection failed' });
    }

    // Cek admin terlebih dahulu
    const [admins] = await conn.execute(
      'SELECT id, username, password, email FROM admins WHERE email = ?',
      [email]
    );

    if (admins.length > 0) {
      const admin = admins[0];
      console.log('[AUTH] Found admin record for', email);
      dbg(`Found admin record for: ${email}`);
      // Timeout 5 detik untuk mencegah hang
      const passwordMatch = await Promise.race([
        bcrypt.compare(password, admin.password),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Password verification timeout')), 5000))
      ]);

      if (passwordMatch) {
        // Track device for admin login
        const deviceInfo = await trackAdminDevice(admin.id, req);
        
        const token = jwt.sign(
          { 
            id: admin.id, 
            username: admin.username, 
            role: 'admin', 
            email: admin.email,
            sessionToken: deviceInfo?.sessionToken 
          },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );

        await conn.release();
        
        logAuthEvent('LOGIN_SUCCESS', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          email: admin.email,
          role: 'admin',
          userId: admin.id
        });
        
        return res.json({
          message: 'Login admin berhasil',
          token,
          sessionToken: deviceInfo?.sessionToken,
          user: { id: admin.id, username: admin.username, role: 'admin' }
        });
      }
      console.log('[AUTH] Admin password mismatch for', email);
      dbg(`Admin password mismatch: ${email}`);
    }

    // Cek users
    const [users] = await conn.execute(
      'SELECT id, username, password, role, profile_picture FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      console.log('[AUTH] No user record for', email);
      dbg(`No user record for: ${email}`);
      await conn.release();
      return res.status(401).json({ error: 'Email atau password salah' });
    }

    const user = users[0];
    // Timeout 5 detik untuk mencegah hang
    const passwordMatch = await Promise.race([
      bcrypt.compare(password, user.password),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Password verification timeout')), 5000))
    ]);

    if (!passwordMatch) {
      console.log('[AUTH] Password mismatch for user', email);
      dbg(`User password mismatch: ${email}`);
      await conn.release();
      
      // Track failed login attempt
      const identifier = `${req.ip}|${email}`;
      trackLoginAttempt(identifier, false);
      
      logAuthEvent('LOGIN_FAILED', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        email: email,
        reason: 'Invalid password'
      });
      
      return res.status(401).json({ error: 'Email atau password salah' });
    }

    // Track device for user login
    const deviceInfo = await trackDevice(user.id, req);
    
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role, 
        email: email,
        sessionToken: deviceInfo?.sessionToken
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    await conn.release();

    // Track successful login
    const identifier = `${req.ip}|${email}`;
    trackLoginAttempt(identifier, true);
    
    logAuthEvent('LOGIN_SUCCESS', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      email: email,
      role: user.role,
      userId: user.id
    });

    res.json({
      message: `Login ${user.role} berhasil`,
      token,
      sessionToken: deviceInfo?.sessionToken,
      user: { id: user.id, username: user.username, role: user.role, profile_picture: user.profile_picture }
    });
  } catch (error) {
    console.error('[AUTH] Error during login:', error);
    dbg(`Error during login for ${req.body?.email || 'unknown'}: ${error?.message || error}`);
    res.status(500).json({ error: error.message });
  }
});

// Verify token
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token tidak ditemukan' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Token tidak valid' });
      }
      res.json({ valid: true, user });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Google OAuth Register/Login
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    
    if (!credential) {
      return res.status(400).json({ error: 'Google credential required' });
    }

    let ticket;
    try {
      // Verify Google token
      ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (googleError) {
      console.error('[AUTH] Google token verification error:', googleError.message);
      return res.status(401).json({ error: 'Invalid Google token. Please try again.' });
    }
    
    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    let conn;
    try {
      conn = await pool.getConnection();
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return res.status(500).json({ error: 'Database connection failed' });
    }

    // Check if user exists
    const [existingUsers] = await conn.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    let user;
    let isNewUser = false;

    if (existingUsers.length > 0) {
      // User exists - login
      user = existingUsers[0];
      
      // Update profile picture if changed
      if (picture && user.profile_picture !== picture) {
        await conn.execute(
          'UPDATE users SET profile_picture = ?, email_verified = 1 WHERE id = ?',
          [picture, user.id]
        );
        user.profile_picture = picture;
      }

      logAuthEvent('GOOGLE_LOGIN_SUCCESS', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        email: email,
        userId: user.id
      });
    } else {
      // New user - register
      isNewUser = true;
      const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
      const hashedPassword = await bcrypt.hash(randomPassword, 12);

      const [result] = await conn.execute(
        'INSERT INTO users (username, email, password, role, email_verified, profile_picture, google_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name || email.split('@')[0], email, hashedPassword, 'user', 1, picture || null, googleId]
      );

      user = {
        id: result.insertId,
        username: name || email.split('@')[0],
        email: email,
        role: 'user',
        email_verified: 1,
        profile_picture: picture || null
      };

      logAuthEvent('GOOGLE_REGISTRATION_SUCCESS', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        email: email,
        userId: user.id
      });
    }

    await conn.release();

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        username: user.username 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: isNewUser ? 'Registrasi dengan Google berhasil!' : 'Login dengan Google berhasil!',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        email_verified: user.email_verified,
        profile_picture: user.profile_picture
      },
      isNewUser
    });

  } catch (error) {
    console.error('[AUTH] Error during Google authentication:', error);
    
    logAuthEvent('GOOGLE_AUTH_ERROR', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      error: error.message
    });

    if (error.message && error.message.includes('Token used too early')) {
      return res.status(400).json({ error: 'Token Google tidak valid. Silakan coba lagi.' });
    }
    
    res.status(500).json({ error: 'Gagal autentikasi dengan Google. Silakan coba lagi.' });
  }
});

module.exports = router;
