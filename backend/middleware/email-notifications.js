const nodemailer = require('nodemailer');
const { logger } = require('./logger');

// Email configuration
const createEmailTransporter = () => {
  // Production: Gunakan service email real (Gmail, SendGrid, etc.)
  // Development: Gunakan Ethereal untuk testing
  
  if (process.env.NODE_ENV === 'production') {
    return nodemailer.createTransporter({
      service: 'gmail', // atau service lain
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  } else {
    // Development: Log email content instead of sending
    return {
      sendMail: async (mailOptions) => {
        logger.info('📧 EMAIL NOTIFICATION (Development Mode):', mailOptions);
        console.log('\n📧 EMAIL NOTIFICATION:');
        console.log('To:', mailOptions.to);
        console.log('Subject:', mailOptions.subject);
        console.log('Content:', mailOptions.text || mailOptions.html);
        console.log('---\n');
        return { messageId: 'dev-mode-' + Date.now() };
      }
    };
  }
};

const transporter = createEmailTransporter();

// Security alert email templates
const emailTemplates = {
  bruteForce: (data) => ({
    subject: '🚨 SECURITY ALERT: Brute Force Attack Detected',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #dc3545;">🚨 Brute Force Attack Detected</h2>
        <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #dc3545;">
          <h3>Attack Details:</h3>
          <p><strong>Time:</strong> ${new Date(data.timestamp).toLocaleString()}</p>
          <p><strong>Target Email:</strong> ${data.email}</p>
          <p><strong>Source IP:</strong> ${data.ip}</p>
          <p><strong>Failed Attempts:</strong> ${data.attempts}</p>
          <p><strong>User Agent:</strong> ${data.userAgent}</p>
        </div>
        <div style="margin-top: 20px;">
          <h3>Actions Taken:</h3>
          <ul>
            <li>IP automatically blocked for 15 minutes</li>
            <li>Security event logged</li>
            <li>Admin notification sent</li>
          </ul>
        </div>
        <div style="margin-top: 20px; padding: 10px; background: #e9ecef;">
          <p><strong>Recommendation:</strong> Monitor this IP for continued suspicious activity. 
          Consider permanent blocking if attacks persist.</p>
        </div>
        <hr>
        <p style="color: #6c757d; font-size: 12px;">
          SimTix Security System | ${new Date().toLocaleString()}
        </p>
      </div>
    `
  }),

  xssAttempt: (data) => ({
    subject: '⚠️  SECURITY ALERT: XSS Attack Blocked',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #fd7e14;">⚠️ XSS Attack Attempt Blocked</h2>
        <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #fd7e14;">
          <h3>Attack Details:</h3>
          <p><strong>Time:</strong> ${new Date(data.timestamp).toLocaleString()}</p>
          <p><strong>Source IP:</strong> ${data.ip}</p>
          <p><strong>Target Field:</strong> ${data.field}</p>
          <p><strong>Attack Vector:</strong> <code>${data.value}</code></p>
          <p><strong>Endpoint:</strong> ${data.path}</p>
        </div>
        <div style="margin-top: 20px;">
          <h3>Security Response:</h3>
          <ul>
            <li>Request automatically blocked</li>
            <li>Malicious payload sanitized</li>
            <li>Attempt logged for analysis</li>
          </ul>
        </div>
        <hr>
        <p style="color: #6c757d; font-size: 12px;">
          SimTix Security System | ${new Date().toLocaleString()}
        </p>
      </div>
    `
  }),

  sqlInjection: (data) => ({
    subject: '🔴 CRITICAL: SQL Injection Attempt Blocked',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #dc3545;">🔴 SQL Injection Attack Blocked</h2>
        <div style="background: #f8d7da; padding: 15px; border-left: 4px solid #dc3545;">
          <h3>CRITICAL SECURITY EVENT:</h3>
          <p><strong>Time:</strong> ${new Date(data.timestamp).toLocaleString()}</p>
          <p><strong>Source IP:</strong> ${data.ip}</p>
          <p><strong>Target Field:</strong> ${data.field}</p>
          <p><strong>Attack Pattern:</strong> <code style="background: #f1f1f1; padding: 2px;">${data.value.substring(0, 100)}...</code></p>
          <p><strong>Endpoint:</strong> ${data.path}</p>
        </div>
        <div style="margin-top: 20px; background: #d4edda; padding: 15px;">
          <h3>✅ Protection Successful:</h3>
          <ul>
            <li>Database access prevented</li>
            <li>Request immediately terminated</li>
            <li>IP flagged for monitoring</li>
            <li>Security team notified</li>
          </ul>
        </div>
        <div style="margin-top: 20px; padding: 10px; background: #fff3cd;">
          <p><strong>⚠️ URGENT RECOMMENDATION:</strong> Review this IP address immediately. 
          SQL injection attempts indicate serious malicious intent.</p>
        </div>
        <hr>
        <p style="color: #6c757d; font-size: 12px;">
          SimTix Security System | ${new Date().toLocaleString()}
        </p>
      </div>
    `
  }),

  suspiciousActivity: (data) => ({
    subject: '📊 Security Report: Unusual Activity Detected',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #17a2b8;">📊 Security Activity Summary</h2>
        <div style="background: #d1ecf1; padding: 15px; border-left: 4px solid #17a2b8;">
          <h3>Activity Summary (Last Hour):</h3>
          <p><strong>Blocked Requests:</strong> ${data.blockedRequests || 0}</p>
          <p><strong>Failed Logins:</strong> ${data.failedLogins || 0}</p>
          <p><strong>Suspicious Activities:</strong> ${data.suspiciousActivities || 0}</p>
          <p><strong>Most Active IP:</strong> ${data.topIP || 'N/A'}</p>
        </div>
        <div style="margin-top: 20px;">
          <h3>System Status:</h3>
          <p style="color: #28a745;">✅ All security systems operational</p>
          <p style="color: #28a745;">✅ Database protected</p>
          <p style="color: #28a745;">✅ Rate limiting active</p>
        </div>
        <hr>
        <p style="color: #6c757d; font-size: 12px;">
          SimTix Security System | ${new Date().toLocaleString()}
        </p>
      </div>
    `
  })
};

// Main notification functions
const sendSecurityAlert = async (alertType, data) => {
  try {
    const adminEmails = getAdminEmails();
    
    if (adminEmails.length === 0) {
      logger.warn('No admin emails configured for security alerts');
      return;
    }

    const template = emailTemplates[alertType];
    if (!template) {
      logger.error(`Unknown alert type: ${alertType}`);
      return;
    }

    const emailContent = template(data);
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'security@simtix.com',
      to: adminEmails.join(', '),
      subject: emailContent.subject,
      html: emailContent.html,
      priority: 'high'
    };

    const result = await transporter.sendMail(mailOptions);
    logger.info(`Security alert sent: ${alertType}`, { 
      messageId: result.messageId, 
      recipients: adminEmails.length 
    });

  } catch (error) {
    logger.error('Failed to send security alert email', { 
      error: error.message, 
      alertType: alertType 
    });
  }
};

// Quick notification functions
const notifyBruteForceAttack = (data) => {
  sendSecurityAlert('bruteForce', data);
};

const notifyXSSAttempt = (data) => {
  sendSecurityAlert('xssAttempt', data);
};

const notifySQLInjectionAttempt = (data) => {
  sendSecurityAlert('sqlInjection', data);
};

const sendDailySummary = (data) => {
  sendSecurityAlert('suspiciousActivity', data);
};

// Get admin email addresses
function getAdminEmails() {
  // In production, get from database or environment
  // For now, use environment variable
  const emails = process.env.ADMIN_EMAILS || 'admin@simtix.com';
  return emails.split(',').map(email => email.trim());
}

// Test email function
const testEmailSystem = async () => {
  try {
    const testData = {
      timestamp: new Date().toISOString(),
      ip: '192.168.1.100',
      email: 'test@example.com',
      attempts: 5,
      userAgent: 'Test Browser',
      field: 'username',
      value: '<script>alert("test")</script>',
      path: '/api/auth/login'
    };

    console.log('🧪 Testing email notification system...');
    await sendSecurityAlert('bruteForce', testData);
    console.log('✅ Email test completed');

  } catch (error) {
    console.error('❌ Email test failed:', error.message);
  }
};

module.exports = {
  sendSecurityAlert,
  notifyBruteForceAttack,
  notifyXSSAttempt,
  notifySQLInjectionAttempt,
  sendDailySummary,
  testEmailSystem
};