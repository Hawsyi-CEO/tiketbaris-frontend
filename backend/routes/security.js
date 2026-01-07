const express = require('express');
const fs = require('fs');
const path = require('path');
const { authenticateToken, checkRole } = require('../middleware/enhanced-auth');
const router = express.Router();

// Security dashboard (admin only)
router.get('/dashboard', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const logsDir = path.join(__dirname, '..', 'logs');
    
    // Read security log
    const securityLogPath = path.join(logsDir, 'security.log');
    let securityEvents = [];
    
    if (fs.existsSync(securityLogPath)) {
      const logContent = fs.readFileSync(securityLogPath, 'utf8');
      securityEvents = logContent
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(event => event && event.timestamp)
        .slice(-100) // Last 100 events
        .reverse();
    }
    
    // Analyze security metrics
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentEvents = securityEvents.filter(event => 
      new Date(event.timestamp) > last24h
    );
    
    const metrics = {
      totalEvents: securityEvents.length,
      last24hEvents: recentEvents.length,
      eventTypes: {},
      topIPs: {},
      suspiciousActivity: recentEvents.filter(event => 
        event.level === 'warn' || event.message.includes('SUSPICIOUS')
      ).length,
      failedLogins: recentEvents.filter(event => 
        event.message.includes('LOGIN_FAILED')
      ).length,
      blockedRequests: recentEvents.filter(event => 
        event.message.includes('BLOCKED') || event.message.includes('XSS') || event.message.includes('SQL_INJECTION')
      ).length
    };
    
    // Count event types
    recentEvents.forEach(event => {
      const eventType = event.message.split(':')[1]?.split('_')[0] || 'OTHER';
      metrics.eventTypes[eventType] = (metrics.eventTypes[eventType] || 0) + 1;
      
      if (event.ip) {
        metrics.topIPs[event.ip] = (metrics.topIPs[event.ip] || 0) + 1;
      }
    });
    
    // Security status
    const securityStatus = {
      level: metrics.suspiciousActivity > 10 ? 'HIGH' : 
             metrics.suspiciousActivity > 5 ? 'MEDIUM' : 'LOW',
      rateLimit: metrics.blockedRequests > 20 ? 'ACTIVE' : 'NORMAL',
      bruteForce: metrics.failedLogins > 15 ? 'DETECTED' : 'NONE',
      overall: 'SECURE'
    };
    
    if (metrics.suspiciousActivity > 20 || metrics.blockedRequests > 50) {
      securityStatus.overall = 'UNDER_ATTACK';
    } else if (metrics.suspiciousActivity > 5 || metrics.blockedRequests > 10) {
      securityStatus.overall = 'MONITORING';
    }
    
    res.json({
      status: 'OK',
      timestamp: now.toISOString(),
      metrics,
      securityStatus,
      recentEvents: recentEvents.slice(0, 20), // Last 20 events
      recommendations: generateRecommendations(metrics, securityStatus)
    });
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to load security dashboard',
      details: error.message 
    });
  }
});

// Real-time security alerts
router.get('/alerts', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const logsDir = path.join(__dirname, '..', 'logs');
    const securityLogPath = path.join(logsDir, 'security.log');
    
    if (!fs.existsSync(securityLogPath)) {
      return res.json({ alerts: [] });
    }
    
    const now = new Date();
    const last1h = new Date(now.getTime() - 60 * 60 * 1000);
    
    const logContent = fs.readFileSync(securityLogPath, 'utf8');
    const alerts = logContent
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(event => event && 
        new Date(event.timestamp) > last1h &&
        (event.level === 'warn' || event.message.includes('SUSPICIOUS') || event.message.includes('BLOCKED'))
      )
      .slice(-20)
      .reverse();
    
    res.json({ alerts });
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to load security alerts',
      details: error.message 
    });
  }
});

// Security configuration info
router.get('/config', authenticateToken, checkRole(['admin']), (req, res) => {
  const config = {
    security: {
      rateLimiting: {
        general: '100 requests/15min',
        auth: '5 attempts/15min'
      },
      password: {
        minLength: 8,
        complexity: 'Required',
        hashRounds: 12
      },
      jwt: {
        expiry: '24h (users), 8h (admin)',
        algorithm: 'HS256'
      },
      upload: {
        maxSize: '5MB',
        allowedTypes: ['jpg', 'png', 'gif', 'webp', 'pdf'],
        virusCheck: 'Basic patterns'
      },
      logging: {
        level: 'info',
        retention: '5 files × 5MB',
        separate: 'security.log'
      }
    },
    protection: {
      xss: 'Active',
      sqlInjection: 'Active', 
      csrf: 'Active',
      bruteForce: 'Active',
      headers: 'Helmet enabled'
    }
  };
  
  res.json(config);
});

function generateRecommendations(metrics, securityStatus) {
  const recommendations = [];
  
  if (metrics.suspiciousActivity > 10) {
    recommendations.push({
      type: 'WARNING',
      message: 'High suspicious activity detected',
      action: 'Review security logs and consider IP blocking'
    });
  }
  
  if (metrics.failedLogins > 20) {
    recommendations.push({
      type: 'ALERT',
      message: 'Potential brute force attack',
      action: 'Enable additional rate limiting for login endpoints'
    });
  }
  
  if (metrics.blockedRequests > 30) {
    recommendations.push({
      type: 'INFO',
      message: 'High number of blocked malicious requests',
      action: 'Security is working effectively, monitor trends'
    });
  }
  
  if (Object.keys(metrics.topIPs).length > 0) {
    const suspiciousIPs = Object.entries(metrics.topIPs)
      .filter(([ip, count]) => count > 50)
      .map(([ip]) => ip);
      
    if (suspiciousIPs.length > 0) {
      recommendations.push({
        type: 'ACTION',
        message: `IPs with high activity: ${suspiciousIPs.join(', ')}`,
        action: 'Consider implementing IP whitelist/blacklist'
      });
    }
  }
  
  if (recommendations.length === 0) {
    recommendations.push({
      type: 'SUCCESS',
      message: 'Security systems operating normally',
      action: 'Continue monitoring'
    });
  }
  
  return recommendations;
}

module.exports = router;