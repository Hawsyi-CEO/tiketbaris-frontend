const winston = require('winston');
const path = require('path');

// Create logs directory if not exists
const fs = require('fs');
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Winston logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'simtix-backend' },
  transports: [
    // Error log
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // Combined log
    new winston.transports.File({ 
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // Security audit log
    new winston.transports.File({ 
      filename: path.join(logsDir, 'security.log'),
      level: 'warn',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Add console logging in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Security event logger
const logSecurityEvent = (level, event, details = {}) => {
  const logData = {
    event,
    timestamp: new Date().toISOString(),
    ip: details.ip || 'unknown',
    userAgent: details.userAgent || 'unknown',
    userId: details.userId || null,
    details: details.additional || {}
  };
  
  logger.log(level, `SECURITY_EVENT: ${event}`, logData);
};

// Authentication event logger
const logAuthEvent = (event, details = {}) => {
  logSecurityEvent('info', `AUTH_${event}`, details);
};

// Suspicious activity logger
const logSuspiciousActivity = (activity, details = {}) => {
  logSecurityEvent('warn', `SUSPICIOUS_${activity}`, details);
};

// Payment event logger
const logPaymentEvent = (event, details = {}) => {
  logSecurityEvent('info', `PAYMENT_${event}`, details);
};

module.exports = {
  logger,
  logSecurityEvent,
  logAuthEvent,
  logSuspiciousActivity,
  logPaymentEvent
};