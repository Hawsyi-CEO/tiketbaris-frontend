const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { logAuthEvent, logSuspiciousActivity } = require('./logger');
// TEMPORARILY DISABLED: Email notifications causing errors
// const { notifyBruteForceAttack } = require('./email-notifications');

// Enhanced JWT authentication with additional security
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    logAuthEvent('NO_TOKEN', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });
    return res.status(401).json({ error: 'Token tidak ditemukan' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      // Log different types of token errors
      let eventType = 'INVALID_TOKEN';
      if (err.name === 'TokenExpiredError') eventType = 'EXPIRED_TOKEN';
      if (err.name === 'JsonWebTokenError') eventType = 'MALFORMED_TOKEN';
      
      logAuthEvent(eventType, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        error: err.message,
        additional: { tokenPrefix: token.substring(0, 20) }
      });
      
      return res.status(403).json({ error: 'Token tidak valid' });
    }
    
    // Additional token validation
    if (!user.id || !user.role || !user.email) {
      logSuspiciousActivity('INCOMPLETE_TOKEN', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: user.id,
        additional: { tokenClaims: user }
      });
      return res.status(403).json({ error: 'Token tidak lengkap' });
    }
    
    // Check token age (additional security for sensitive operations)
    const tokenAge = Date.now() - (user.iat * 1000);
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    if (tokenAge > maxAge) {
      logAuthEvent('TOKEN_TOO_OLD', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: user.id,
        additional: { tokenAge: tokenAge }
      });
      return res.status(403).json({ error: 'Token expired, please login again' });
    }
    
    req.user = user;
    next();
  });
};

// Enhanced role checking with activity logging
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      logSuspiciousActivity('NO_USER_IN_REQUEST', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path
      });
      return res.status(401).json({ error: 'User tidak terautentikasi' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logSuspiciousActivity('UNAUTHORIZED_ACCESS_ATTEMPT', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        path: req.path
      });
      return res.status(403).json({ error: 'Anda tidak memiliki akses ke resource ini' });
    }

    next();
  };
};

// Login attempt tracking and brute force protection
const loginAttempts = new Map(); // In production, use Redis

const trackLoginAttempt = (identifier, success = false) => {
  const key = identifier;
  const now = Date.now();
  
  if (!loginAttempts.has(key)) {
    loginAttempts.set(key, { attempts: 0, lastAttempt: now, blockedUntil: null });
  }
  
  const record = loginAttempts.get(key);
  
  if (success) {
    // Reset on successful login
    loginAttempts.delete(key);
    return { allowed: true };
  }
  
  // Increment failed attempts
  record.attempts++;
  record.lastAttempt = now;
  
  // Block after 8 failed attempts
  if (record.attempts >= 8) {
    record.blockedUntil = now + (1 * 60 * 1000); // Block for 1 minute
    
    logSuspiciousActivity('BRUTE_FORCE_DETECTED', {
      ip: identifier.split('|')[0],
      email: identifier.split('|')[1],
      attempts: record.attempts,
      additional: { blockedUntil: new Date(record.blockedUntil) }
    });
    
    // TEMPORARILY DISABLED: Email notifications causing errors
    // Send immediate email alert for brute force attacks
    // notifyBruteForceAttack({
    //   timestamp: new Date().toISOString(),
    //   ip: identifier.split('|')[0],
    //   email: identifier.split('|')[1],
    //   attempts: record.attempts,
    //   userAgent: 'Unknown' // Will be set by calling function
    // });
  }
  
  loginAttempts.set(key, record);
  
  return {
    allowed: record.blockedUntil ? now > record.blockedUntil : true,
    attempts: record.attempts,
    blockedUntil: record.blockedUntil
  };
};

const checkBruteForce = (req, res, next) => {
  const identifier = `${req.ip}|${req.body.email || 'unknown'}`;
  const status = trackLoginAttempt(identifier);
  
  if (!status.allowed) {
    const timeLeft = Math.ceil((status.blockedUntil - Date.now()) / 1000 / 60);
    
    logSuspiciousActivity('BLOCKED_LOGIN_ATTEMPT', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      email: req.body.email,
      additional: { attempts: status.attempts, timeLeft: timeLeft }
    });
    
    return res.status(429).json({ 
      error: `Terlalu banyak percobaan login. Coba lagi dalam ${timeLeft} menit.`,
      code: 'BRUTE_FORCE_PROTECTION'
    });
  }
  
  req.loginTracker = { 
    identifier, 
    trackResult: (id, success) => {
      const result = trackLoginAttempt(id, success);
      // TEMPORARILY DISABLED: Email notifications causing errors
      // Update brute force notification with user agent if it was just detected
      // if (!success && result.blockedUntil && result.attempts >= 5) {
      //   notifyBruteForceAttack({
      //     timestamp: new Date().toISOString(),
      //     ip: req.ip,
      //     email: req.body.email,
      //     attempts: result.attempts,
      //     userAgent: req.get('User-Agent')
      //   });
      // }
      return result;
    }
  };
  next();
};

// Password strength validation
const validatePasswordStrength = (password) => {
  const requirements = {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[@$!%*?&]/.test(password),
    noCommon: !['password', '12345678', 'qwerty', 'admin123'].includes(password.toLowerCase())
  };
  
  const score = Object.values(requirements).filter(Boolean).length;
  
  return {
    isValid: score >= 5, // At least 5 out of 6 requirements
    score: score,
    requirements: requirements
  };
};

// Session security (for sensitive operations)
const generateSecureSession = () => {
  return crypto.randomBytes(32).toString('hex');
};

// CSRF token generation and validation
const csrfTokens = new Map(); // In production, use Redis

const generateCSRFToken = (userId) => {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = Date.now() + (60 * 60 * 1000); // 1 hour
  
  csrfTokens.set(`${userId}:${token}`, expires);
  
  // Cleanup old tokens
  setTimeout(() => {
    csrfTokens.delete(`${userId}:${token}`);
  }, 60 * 60 * 1000);
  
  return token;
};

const validateCSRFToken = (userId, token) => {
  const key = `${userId}:${token}`;
  const expires = csrfTokens.get(key);
  
  if (!expires || Date.now() > expires) {
    return false;
  }
  
  return true;
};

const csrfProtection = (req, res, next) => {
  // Only for state-changing operations
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const token = req.headers['x-csrf-token'] || req.body._csrf;
    
    if (!token) {
      logSuspiciousActivity('MISSING_CSRF_TOKEN', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id,
        path: req.path,
        method: req.method
      });
      return res.status(403).json({ error: 'CSRF token required' });
    }
    
    if (!req.user || !validateCSRFToken(req.user.id, token)) {
      logSuspiciousActivity('INVALID_CSRF_TOKEN', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id,
        path: req.path,
        method: req.method
      });
      return res.status(403).json({ error: 'Invalid CSRF token' });
    }
  }
  
  next();
};

module.exports = {
  authenticateToken,
  checkRole,
  checkBruteForce,
  trackLoginAttempt,
  validatePasswordStrength,
  generateSecureSession,
  generateCSRFToken,
  validateCSRFToken,
  csrfProtection
};