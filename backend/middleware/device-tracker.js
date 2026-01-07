const db = require('../config/database');
const crypto = require('crypto');

// Parse User Agent to extract device info
const parseUserAgent = (userAgent) => {
  const ua = userAgent || '';
  
  // Detect Browser
  let browser = 'Unknown';
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';
  
  // Detect OS
  let os = 'Unknown';
  if (ua.includes('Windows NT 10.0')) os = 'Windows 10';
  else if (ua.includes('Windows NT 6.3')) os = 'Windows 8.1';
  else if (ua.includes('Windows NT 6.2')) os = 'Windows 8';
  else if (ua.includes('Windows NT 6.1')) os = 'Windows 7';
  else if (ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Linux')) os = 'Linux';
  
  // Detect Device Type
  let deviceType = 'desktop';
  if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')) {
    deviceType = 'mobile';
  } else if (ua.includes('Tablet') || ua.includes('iPad')) {
    deviceType = 'tablet';
  }
  
  // Generate Device Name
  const deviceName = `${os} - ${browser}`;
  
  return { browser, os, deviceType, deviceName };
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
const getUserSessions = async (userId) => {
  try {
    const [sessions] = await db.query(
      `SELECT 
        id, device_name, device_type, browser, os, 
        ip_address, last_active, created_at, is_current,
        CASE 
          WHEN last_active > DATE_SUB(NOW(), INTERVAL 5 MINUTE) THEN 'active'
          WHEN last_active > DATE_SUB(NOW(), INTERVAL 1 HOUR) THEN 'recent'
          ELSE 'inactive'
        END as status
       FROM user_sessions 
       WHERE user_id = ?
       ORDER BY last_active DESC`,
      [userId]
    );
    
    return sessions;
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
