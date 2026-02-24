const db = require('../config/database');
const crypto = require('crypto');
const UAParser = require('ua-parser-js');

// Parse User Agent to extract device info (Enhanced version)
const parseUserAgent = (userAgent) => {
  if (!userAgent) {
    return {
      browser: 'Unknown',
      os: 'Unknown',
      deviceType: 'desktop',
      deviceName: 'Unknown Device'
    };
  }

  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  // Get browser info
  const browser = result.browser.name || 'Unknown';
  const browserVersion = result.browser.version ? ` ${result.browser.version.split('.')[0]}` : '';

  // Get OS info
  const os = result.os.name || 'Unknown';
  const osVersion = result.os.version ? ` ${result.os.version}` : '';

  // Determine device type
  let deviceType = 'desktop';
  if (result.device.type === 'mobile') deviceType = 'mobile';
  else if (result.device.type === 'tablet') deviceType = 'tablet';

  // Create device name
  const deviceName = `${os}${osVersion} - ${browser}${browserVersion}`;

  return {
    browser: `${browser}${browserVersion}`,
    os: `${os}${osVersion}`,
    deviceType,
    deviceName
  };
};

// Create or update session when user logs in
const trackDevice = async (userId, req, sessionToken = null) => {
  try {
    const userAgent = req.get('User-Agent') || '';
    const ipAddress = req.ip || req.connection.remoteAddress;
    
    const deviceInfo = parseUserAgent(userAgent);
    
    // Generate unique session token if not provided
    const token = sessionToken || crypto.randomBytes(32).toString('hex');
    
    // Check if session already exists for this device
    const [existingSessions] = await db.query(
      `SELECT id FROM user_sessions 
       WHERE user_id = ? AND user_agent = ? AND ip_address = ?
       ORDER BY last_active DESC LIMIT 1`,
      [userId, userAgent, ipAddress]
    );
    
    if (existingSessions.length > 0) {
      // Update existing session
      await db.query(
        `UPDATE user_sessions 
         SET session_token = ?, last_active = NOW(), is_current = TRUE
         WHERE id = ?`,
        [token, existingSessions[0].id]
      );
      
      return { sessionId: existingSessions[0].id, sessionToken: token };
    } else {
      // Create new session
      const [result] = await db.query(
        `INSERT INTO user_sessions 
         (user_id, session_token, device_name, device_type, browser, os, 
          ip_address, user_agent, is_current) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
        [userId, token, deviceInfo.deviceName, deviceInfo.deviceType, 
         deviceInfo.browser, deviceInfo.os, ipAddress, userAgent]
      );
      
      return { sessionId: result.insertId, sessionToken: token };
    }
  } catch (error) {
    console.error('Error tracking device:', error);
    return null;
  }
};

// Update last active timestamp
const updateSessionActivity = async (sessionToken) => {
  try {
    await db.query(
      `UPDATE user_sessions SET last_active = NOW() WHERE session_token = ?`,
      [sessionToken]
    );
  } catch (error) {
    console.error('Error updating session activity:', error);
  }
};

// Get all active sessions for a user
const getUserSessions = async (userId, currentToken = null) => {
  try {
    const [sessions] = await db.query(
      `SELECT 
        id, device_name, device_type, browser, os, 
        ip_address, last_active, created_at, is_current,
        session_token,
        CASE 
          WHEN last_active > DATE_SUB(NOW(), INTERVAL 5 MINUTE) THEN 'active'
          WHEN last_active > DATE_SUB(NOW(), INTERVAL 1 HOUR) THEN 'recent'
          ELSE 'inactive'
        END as status
       FROM user_sessions 
       WHERE user_id = ? AND is_active = 1
       ORDER BY last_active DESC`,
      [userId]
    );
    
    // Format sessions with device icons and formatted times
    return sessions.map(session => {
      // Device icon
      const deviceIcon = session.device_type === 'mobile' ? '📱' : 
                         session.device_type === 'tablet' ? '📱' : '💻';
      
      // Mask IP address
      const maskedIp = session.ip_address ? 
        session.ip_address.split('.').slice(0, 2).join('.') + '.xxx.xxx' : 
        'Unknown';
      
      // Format last active
      const lastActive = new Date(session.last_active);
      const now = new Date();
      const diffMs = now - lastActive;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      let lastActiveText = 'Baru saja';
      if (diffMins < 1) lastActiveText = 'Baru saja';
      else if (diffMins < 60) lastActiveText = `${diffMins} menit lalu`;
      else if (diffHours < 24) lastActiveText = `${diffHours} jam lalu`;
      else lastActiveText = `${diffDays} hari lalu`;
      
      // Format login time
      const loginTime = new Date(session.created_at).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Check if this is the current session by comparing tokens
      const isCurrentSession = currentToken && session.session_token === currentToken;
      
      return {
        id: session.id,
        deviceName: session.device_name || 'Unknown Device',
        deviceIcon,
        deviceType: session.device_type,
        browser: session.browser,
        os: session.os,
        ipAddress: maskedIp,
        lastActive: session.last_active,
        lastActiveText,
        loginTime,
        createdAt: session.created_at,
        isCurrent: isCurrentSession, // Boolean true/false based on token comparison
        status: session.status,
        // Don't expose session_token in response for security
      };
    });
  } catch (error) {
    console.error('Error getting user sessions:', error);
    return [];
  }
};

// Terminate a specific session
const terminateSession = async (sessionId, userId) => {
  try {
    const [result] = await db.query(
      `DELETE FROM user_sessions WHERE id = ? AND user_id = ?`,
      [sessionId, userId]
    );
    
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error terminating session:', error);
    return false;
  }
};

// Terminate all sessions except current
const terminateAllOtherSessions = async (userId, currentSessionToken) => {
  try {
    const [result] = await db.query(
      `DELETE FROM user_sessions 
       WHERE user_id = ? AND session_token != ?`,
      [userId, currentSessionToken]
    );
    
    return result.affectedRows;
  } catch (error) {
    console.error('Error terminating sessions:', error);
    return 0;
  }
};

// Cleanup old inactive sessions (older than 30 days)
const cleanupOldSessions = async () => {
  try {
    const [result] = await db.query(
      `DELETE FROM user_sessions 
       WHERE last_active < DATE_SUB(NOW(), INTERVAL 30 DAY)`
    );
    
    return result.affectedRows;
  } catch (error) {
    console.error('Error cleaning up old sessions:', error);
    return 0;
  }
};

module.exports = {
  trackDevice,
  updateSessionActivity,
  getUserSessions,
  terminateSession,
  terminateAllOtherSessions,
  cleanupOldSessions,
  parseUserAgent
};
