const xss = require('xss');
const Joi = require('joi');
const { logSuspiciousActivity } = require('./logger');
// TEMPORARILY DISABLED: Email notifications causing errors
// const { notifyXSSAttempt, notifySQLInjectionAttempt } = require('./email-notifications');

// XSS Protection middleware
const sanitizeInput = (req, res, next) => {
  const sanitizeObject = (obj) => {
    if (typeof obj === 'string') {
      return xss(obj, {
        whiteList: {}, // Allow no HTML tags
        stripIgnoreTag: true,
        stripIgnoreTagBody: ['script', 'style']
      });
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const key in obj) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
      return sanitized;
    }
    
    return obj;
  };
  
  // Detect potential XSS attempts
  const detectXSS = (value) => {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi,
      /eval\s*\(/gi
    ];
    
    return xssPatterns.some(pattern => pattern.test(value));
  };
  
  // Check for XSS in request
  const checkForXSS = (obj, path = '') => {
    if (typeof obj === 'string' && detectXSS(obj)) {
      logSuspiciousActivity('XSS_ATTEMPT', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        field: path,
        value: obj.substring(0, 100), // Log first 100 chars
        additional: { fullRequest: req.method + ' ' + req.originalUrl }
      });
      
      // TEMPORARILY DISABLED: Email notifications causing errors
      // Send immediate email alert for XSS attempts
      // notifyXSSAttempt({
      //   timestamp: new Date().toISOString(),
      //   ip: req.ip,
      //   userAgent: req.get('User-Agent'),
      //   path: req.path,
      //   field: path,
      //   value: obj.substring(0, 100)
      // });
      
      return true;
    }
    
    if (Array.isArray(obj)) {
      return obj.some((item, index) => checkForXSS(item, `${path}[${index}]`));
    }
    
    if (obj && typeof obj === 'object') {
      return Object.keys(obj).some(key => checkForXSS(obj[key], path ? `${path}.${key}` : key));
    }
    
    return false;
  };
  
  // Check and sanitize body
  if (req.body && checkForXSS(req.body)) {
    return res.status(400).json({ 
      error: 'Invalid input detected. HTML/script content not allowed.',
      code: 'XSS_BLOCKED'
    });
  }
  
  // Check and sanitize query parameters
  if (req.query && checkForXSS(req.query)) {
    return res.status(400).json({ 
      error: 'Invalid query parameters detected.',
      code: 'XSS_BLOCKED'
    });
  }
  
  // Sanitize inputs
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  next();
};

// Input validation schemas
const validationSchemas = {
  register: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required()
      .messages({
        'string.alphanum': 'Username hanya boleh berisi huruf dan angka',
        'string.min': 'Username minimal 3 karakter',
        'string.max': 'Username maksimal 30 karakter'
      }),
    email: Joi.string().email().required()
      .messages({
        'string.email': 'Format email tidak valid'
      }),
    password: Joi.string().min(8).max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.min': 'Password minimal 8 karakter',
        'string.max': 'Password maksimal 128 karakter',
        'string.pattern.base': 'Password harus mengandung huruf besar, huruf kecil, angka, dan karakter khusus'
      }),
    role: Joi.string().valid('user', 'panitia').required()
  }),
  
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),
  
  createEvent: Joi.object({
    title: Joi.string().min(5).max(200).required(),
    description: Joi.string().min(10).max(2000).required(),
    date: Joi.date().greater('now').required(),
    location: Joi.string().min(5).max(200).required(),
    price: Joi.number().positive().max(10000000).required(),
    stock: Joi.number().integer().positive().max(10000).required(),
    category: Joi.string().max(50)
  }),
  
  payment: Joi.object({
    eventId: Joi.number().integer().positive().required(),
    quantity: Joi.number().integer().positive().max(10).required()
  })
};

// Validation middleware factory
const validateInput = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { 
      abortEarly: false,
      stripUnknown: true 
    });
    
    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      logSuspiciousActivity('VALIDATION_FAILED', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        errors: errorDetails,
        additional: { body: req.body }
      });
      
      return res.status(400).json({
        error: 'Input validation failed',
        details: errorDetails
      });
    }
    
    // Replace req.body with validated and sanitized data
    req.body = value;
    next();
  };
};

// SQL Injection detection
const detectSQLInjection = (value) => {
  const sqlPatterns = [
    /(\s|^)(select|insert|update|delete|drop|create|alter|exec|execute)\s/gi,
    /'[^']*;[^']*'/gi,
    /;\s*(drop|delete|insert|update)/gi,
    /union\s+(select|all)/gi,
    /\|\|/g, // SQL concatenation
    /--/g,   // SQL comments
    /\/\*/g  // SQL block comments
  ];
  
  return sqlPatterns.some(pattern => pattern.test(value));
};

// SQL Injection protection middleware
const preventSQLInjection = (req, res, next) => {
  const checkObject = (obj, path = '') => {
    if (typeof obj === 'string' && detectSQLInjection(obj)) {
      logSuspiciousActivity('SQL_INJECTION_ATTEMPT', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        field: path,
        value: obj.substring(0, 100),
        additional: { fullRequest: req.method + ' ' + req.originalUrl }
      });
      
      // TEMPORARILY DISABLED: Email notifications causing errors
      // Send immediate email alert for SQL injection attempts
      // notifySQLInjectionAttempt({
      //   timestamp: new Date().toISOString(),
      //   ip: req.ip,
      //   userAgent: req.get('User-Agent'),
      //   path: req.path,
      //   field: path,
      //   value: obj.substring(0, 100)
      // });
      
      return true;
    }
    
    if (Array.isArray(obj)) {
      return obj.some((item, index) => checkObject(item, `${path}[${index}]`));
    }
    
    if (obj && typeof obj === 'object') {
      return Object.keys(obj).some(key => checkObject(obj[key], path ? `${path}.${key}` : key));
    }
    
    return false;
  };
  
  if (req.body && checkObject(req.body)) {
    return res.status(400).json({ 
      error: 'Invalid input detected. Potential security threat blocked.',
      code: 'SQL_INJECTION_BLOCKED'
    });
  }
  
  if (req.query && checkObject(req.query)) {
    return res.status(400).json({ 
      error: 'Invalid query parameters detected.',
      code: 'SQL_INJECTION_BLOCKED'
    });
  }
  
  next();
};

module.exports = {
  sanitizeInput,
  validateInput,
  validationSchemas,
  preventSQLInjection
};