// Add this function before module.exports in device-tracker.js

const trackAdminDevice = async (adminId, req, sessionToken = null) => {
  try {
    const userAgent = req.get('User-Agent') || '';
    const ipAddress = req.ip || req.connection.remoteAddress;

    const deviceInfo = parseUserAgent(userAgent);

    // Generate unique session token if not provided
    const token = sessionToken || crypto.randomBytes(32).toString('hex');

    // Check if session already exists for this device
    const [existingSessions] = await db.query(
      `SELECT id FROM admin_sessions
       WHERE admin_id = ? AND user_agent = ? AND ip_address = ?
       ORDER BY last_active DESC LIMIT 1`,
      [adminId, userAgent, ipAddress]
    );

    if (existingSessions.length > 0) {
      // Update existing session
      await db.query(
        `UPDATE admin_sessions
         SET session_token = ?, last_active = NOW(), is_current = TRUE
         WHERE id = ?`,
        [token, existingSessions[0].id]
      );

      return { sessionId: existingSessions[0].id, sessionToken: token };
    } else {
      // Create new session
      const [result] = await db.query(
        `INSERT INTO admin_sessions
         (admin_id, session_token, device_name, device_type, browser, os,
          ip_address, user_agent, is_current)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
        [adminId, token, deviceInfo.deviceName, deviceInfo.deviceType,
         deviceInfo.browser, deviceInfo.os, ipAddress, userAgent]
      );

      return { sessionId: result.insertId, sessionToken: token };
    }
  } catch (error) {
    console.error('Error tracking admin device:', error);
    throw error;
  }
};

// Update module.exports to include trackAdminDevice:
module.exports = {
  trackDevice,
  listUserSessions,
  terminateSession,
  terminateAllOtherSessions,
  cleanupOldSessions,
  parseUserAgent,
  trackAdminDevice
};
