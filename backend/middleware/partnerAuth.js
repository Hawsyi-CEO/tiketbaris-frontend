/**
 * Partner Authentication Middleware
 * 
 * Handles authentication for external partners (e.g., Forbasi Jabar)
 * Uses API Key + Secret + JWT User Token approach
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/database');

/**
 * Cache for partner data (reduces DB lookups)
 */
const partnerCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get partner from cache or database
 */
async function getPartner(apiKey) {
  const cached = partnerCache.get(apiKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const conn = await pool.getConnection();
  try {
    const [partners] = await conn.execute(
      'SELECT * FROM partners WHERE api_key = ? AND is_active = 1',
      [apiKey]
    );
    
    if (partners.length === 0) {
      return null;
    }

    const partner = partners[0];
    partnerCache.set(apiKey, { data: partner, timestamp: Date.now() });
    return partner;
  } finally {
    conn.release();
  }
}

/**
 * Clear partner cache (call when partner is updated)
 */
function clearPartnerCache(apiKey = null) {
  if (apiKey) {
    partnerCache.delete(apiKey);
  } else {
    partnerCache.clear();
  }
}

/**
 * Authenticate Partner API Request
 * 
 * Required Headers:
 *   X-Partner-Key: API Key
 *   X-Partner-Secret: API Secret
 * 
 * Adds req.partner with partner info
 */
async function authenticatePartner(req, res, next) {
  const startTime = Date.now();
  
  try {
    const apiKey = req.headers['x-partner-key'];
    const apiSecret = req.headers['x-partner-secret'];

    if (!apiKey || !apiSecret) {
      return res.status(401).json({
        error: 'Missing authentication headers',
        required: ['X-Partner-Key', 'X-Partner-Secret']
      });
    }

    const partner = await getPartner(apiKey);

    if (!partner) {
      await logApiRequest(null, null, req, 401, Date.now() - startTime, 'Invalid API key');
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Verify API secret
    if (partner.api_secret !== apiSecret) {
      await logApiRequest(partner.id, null, req, 401, Date.now() - startTime, 'Invalid API secret');
      return res.status(401).json({ error: 'Invalid API secret' });
    }

    // Check IP whitelist if configured
    if (partner.allowed_ips) {
      const allowedIps = JSON.parse(partner.allowed_ips);
      const clientIp = req.ip || req.connection?.remoteAddress;
      
      if (allowedIps.length > 0 && !allowedIps.includes(clientIp)) {
        await logApiRequest(partner.id, null, req, 403, Date.now() - startTime, 'IP not allowed');
        return res.status(403).json({ error: 'IP address not allowed' });
      }
    }

    // Attach partner to request
    req.partner = partner;
    req.partnerStartTime = startTime;

    next();
  } catch (error) {
    console.error('[PARTNER AUTH] Error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
}

/**
 * Authenticate Partner User (from JWT in header)
 * 
 * Required Headers (in addition to partner auth):
 *   X-Partner-User: JWT token containing user info
 * 
 * JWT payload expected:
 *   {
 *     external_id: "user123",
 *     email: "user@email.com",
 *     name: "User Name",
 *     role: "user" | "panitia" | "admin",
 *     phone: "08123456789" (optional)
 *   }
 * 
 * Adds req.partnerUser with user info
 * Auto-creates internal user if not exists
 */
async function authenticatePartnerUser(req, res, next) {
  try {
    if (!req.partner) {
      return res.status(401).json({ error: 'Partner authentication required' });
    }

    const userToken = req.headers['x-partner-user'];

    if (!userToken) {
      return res.status(401).json({
        error: 'Missing user token',
        required: ['X-Partner-User']
      });
    }

    // Verify JWT with partner's secret
    let decoded;
    try {
      decoded = jwt.verify(userToken, req.partner.jwt_secret);
    } catch (jwtError) {
      await logApiRequest(req.partner.id, null, req, 401, Date.now() - req.partnerStartTime, 'Invalid user token');
      return res.status(401).json({ error: 'Invalid user token', details: jwtError.message });
    }

    // Validate required fields
    if (!decoded.external_id || !decoded.email || !decoded.name) {
      return res.status(400).json({
        error: 'Invalid user token payload',
        required: ['external_id', 'email', 'name']
      });
    }

    // Get or create partner user
    const partnerUser = await getOrCreatePartnerUser(req.partner.id, decoded);

    req.partnerUser = partnerUser;
    req.user = partnerUser.internalUser; // For compatibility with existing code

    next();
  } catch (error) {
    console.error('[PARTNER USER AUTH] Error:', error);
    res.status(500).json({ error: 'User authentication error' });
  }
}

/**
 * Get or create partner user and linked internal user
 */
async function getOrCreatePartnerUser(partnerId, userData) {
  const conn = await pool.getConnection();
  
  try {
    await conn.beginTransaction();

    // Check if partner user exists
    const [existingUsers] = await conn.execute(
      `SELECT pu.*, u.id as user_id, u.username, u.email as user_email, u.role as user_role
       FROM partner_users pu
       LEFT JOIN users u ON pu.internal_user_id = u.id
       WHERE pu.partner_id = ? AND pu.external_user_id = ?`,
      [partnerId, userData.external_id]
    );

    let partnerUser;
    let internalUser;

    if (existingUsers.length > 0) {
      partnerUser = existingUsers[0];

      // Update last access and any changed info
      await conn.execute(
        `UPDATE partner_users 
         SET external_email = ?, external_name = ?, external_phone = ?, 
             role = ?, last_access = NOW()
         WHERE id = ?`,
        [userData.email, userData.name, userData.phone || null, userData.role || 'user', partnerUser.id]
      );

      // Get internal user if linked
      if (partnerUser.internal_user_id) {
        const [users] = await conn.execute(
          'SELECT id, username, email, role FROM users WHERE id = ?',
          [partnerUser.internal_user_id]
        );
        internalUser = users[0];
      }
    }

    // Create internal user if not exists
    if (!internalUser) {
      // Generate unique username
      const username = `partner_${partnerId}_${userData.external_id}`;
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      // Map role (partner admin stays as 'user' in internal system for security)
      const internalRole = userData.role === 'admin' ? 'user' : (userData.role || 'user');

      const [userResult] = await conn.execute(
        `INSERT INTO users (username, email, password, role)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
           email = VALUES(email),
           role = VALUES(role)`,
        [username, userData.email, hashedPassword, internalRole]
      );

      const userId = userResult.insertId || (
        await conn.execute('SELECT id FROM users WHERE email = ?', [userData.email])
      )[0][0]?.id;

      internalUser = {
        id: userId,
        username,
        email: userData.email,
        role: internalRole
      };
    }

    // Create or update partner user link
    if (!partnerUser) {
      const [puResult] = await conn.execute(
        `INSERT INTO partner_users 
         (partner_id, external_user_id, internal_user_id, external_email, external_name, external_phone, role, last_access)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [partnerId, userData.external_id, internalUser.id, userData.email, userData.name, userData.phone || null, userData.role || 'user']
      );

      partnerUser = {
        id: puResult.insertId,
        partner_id: partnerId,
        external_user_id: userData.external_id,
        internal_user_id: internalUser.id,
        external_email: userData.email,
        external_name: userData.name,
        role: userData.role || 'user'
      };
    } else if (!partnerUser.internal_user_id) {
      // Link existing partner user to internal user
      await conn.execute(
        'UPDATE partner_users SET internal_user_id = ? WHERE id = ?',
        [internalUser.id, partnerUser.id]
      );
      partnerUser.internal_user_id = internalUser.id;
    }

    await conn.commit();

    return {
      ...partnerUser,
      internalUser
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

/**
 * Check if partner user has required role
 */
function requirePartnerRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.partnerUser) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    if (!roles.includes(req.partnerUser.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: roles,
        current: req.partnerUser.role
      });
    }

    next();
  };
}

/**
 * Log API request for audit trail
 */
async function logApiRequest(partnerId, partnerUserId, req, status, responseTimeMs, errorMessage = null) {
  try {
    // Sanitize request body (remove sensitive data)
    let sanitizedBody = null;
    if (req.body && Object.keys(req.body).length > 0) {
      const body = { ...req.body };
      delete body.password;
      delete body.api_secret;
      delete body.jwt_secret;
      sanitizedBody = JSON.stringify(body).substring(0, 5000);
    }

    await pool.execute(
      `INSERT INTO partner_api_logs 
       (partner_id, partner_user_id, endpoint, method, request_body, response_status, response_time_ms, ip_address, user_agent, error_message)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        partnerId,
        partnerUserId,
        req.originalUrl || req.url,
        req.method,
        sanitizedBody,
        status,
        responseTimeMs,
        req.ip || req.connection?.remoteAddress,
        req.headers['user-agent']?.substring(0, 500),
        errorMessage
      ]
    );
  } catch (error) {
    console.error('[PARTNER LOG] Failed to log request:', error.message);
  }
}

/**
 * Response wrapper to auto-log API requests
 */
function withLogging(req, res, next) {
  const originalJson = res.json.bind(res);
  
  res.json = function(data) {
    const status = res.statusCode;
    const responseTime = Date.now() - (req.partnerStartTime || Date.now());
    
    // Log asynchronously (don't block response)
    setImmediate(() => {
      logApiRequest(
        req.partner?.id,
        req.partnerUser?.id,
        req,
        status,
        responseTime,
        status >= 400 ? JSON.stringify(data.error || data.message) : null
      );
    });

    return originalJson(data);
  };

  next();
}

module.exports = {
  authenticatePartner,
  authenticatePartnerUser,
  requirePartnerRole,
  logApiRequest,
  withLogging,
  clearPartnerCache,
  getOrCreatePartnerUser
};
