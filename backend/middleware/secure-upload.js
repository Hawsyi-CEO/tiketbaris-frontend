const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const { logSuspiciousActivity, logSecurityEvent } = require('./logger');

// File type validation
const allowedImageTypes = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp'
};

const allowedDocumentTypes = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'text/plain': '.txt'
};

// Virus signature patterns (basic detection)
const virusPatterns = [
  Buffer.from('EICAR-STANDARD-ANTIVIRUS-TEST-FILE', 'utf8'), // EICAR test file
  Buffer.from('X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR', 'utf8'),
  Buffer.from('MZ'), // PE executable header
  Buffer.from('PK'), // ZIP/Office file header (when not expected)
];

// File validation functions
const validateFileContent = async (filePath, expectedType) => {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath, { start: 0, end: 1023 }); // Read first 1KB
    let chunks = [];
    
    stream.on('data', chunk => chunks.push(chunk));
    
    stream.on('end', () => {
      const buffer = Buffer.concat(chunks);
      
      // Basic virus scan
      for (const pattern of virusPatterns) {
        if (buffer.includes(pattern)) {
          logSuspiciousActivity('VIRUS_DETECTED', {
            fileName: path.basename(filePath),
            fileSize: fs.statSync(filePath).size,
            additional: { pattern: pattern.toString() }
          });
          return resolve({ valid: false, reason: 'Potential malware detected' });
        }
      }
      
      // File header validation
      const header = buffer.slice(0, 10);
      
      if (expectedType.startsWith('image/')) {
        // Image header validation
        const validHeaders = {
          'image/jpeg': [Buffer.from([0xFF, 0xD8, 0xFF])],
          'image/png': [Buffer.from([0x89, 0x50, 0x4E, 0x47])],
          'image/gif': [Buffer.from('GIF87a'), Buffer.from('GIF89a')],
          'image/webp': [Buffer.from('RIFF'), Buffer.from('WEBP')]
        };
        
        const headers = validHeaders[expectedType];
        if (!headers || !headers.some(validHeader => buffer.indexOf(validHeader) === 0)) {
          return resolve({ valid: false, reason: 'Invalid image file header' });
        }
      }
      
      resolve({ valid: true });
    });
    
    stream.on('error', reject);
  });
};

// Custom storage configuration
const secureStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '..', 'uploads');
    
    // Ensure upload directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate secure random filename
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const fileExtension = allowedImageTypes[file.mimetype] || allowedDocumentTypes[file.mimetype];
    
    if (!fileExtension) {
      return cb(new Error('File type not allowed'), null);
    }
    
    const secureFileName = `${Date.now()}-${uniqueSuffix}${fileExtension}`;
    cb(null, secureFileName);
  }
});

// File filter with enhanced security
const secureFileFilter = (req, file, cb) => {
  // Check file type
  const isImageAllowed = allowedImageTypes.hasOwnProperty(file.mimetype);
  const isDocumentAllowed = allowedDocumentTypes.hasOwnProperty(file.mimetype);
  
  if (!isImageAllowed && !isDocumentAllowed) {
    logSuspiciousActivity('INVALID_FILE_TYPE', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      fileName: file.originalname,
      mimeType: file.mimetype,
      additional: { fieldName: file.fieldname }
    });
    return cb(new Error(`File type ${file.mimetype} not allowed`), false);
  }
  
  // Check filename for suspicious patterns
  const suspiciousPatterns = [
    /\.{2,}/, // Path traversal
    /[<>:"|?*]/, // Invalid filename characters
    /\.(exe|bat|cmd|scr|vbs|js|jar|com|pif)$/i, // Executable extensions
    /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i // Reserved Windows names
  ];
  
  if (suspiciousPatterns.some(pattern => pattern.test(file.originalname))) {
    logSuspiciousActivity('SUSPICIOUS_FILENAME', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      fileName: file.originalname,
      additional: { fieldName: file.fieldname }
    });
    return cb(new Error('Suspicious filename detected'), false);
  }
  
  cb(null, true);
};

// Create multer instance with security configurations
const secureUpload = multer({
  storage: secureStorage,
  fileFilter: secureFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5, // Max 5 files
    fieldSize: 1024 * 1024, // 1MB field size limit
    fieldNameSize: 100, // Field name length limit
    headerPairs: 2000 // Header pairs limit
  }
});

// Post-upload validation middleware
const validateUploadedFile = async (req, res, next) => {
  if (!req.file && !req.files) {
    return next();
  }
  
  const files = req.files ? Object.values(req.files).flat() : [req.file];
  
  try {
    for (const file of files) {
      if (file) {
        // Validate file content
        const validation = await validateFileContent(file.path, file.mimetype);
        
        if (!validation.valid) {
          // Remove the uploaded file
          fs.unlinkSync(file.path);
          
          logSuspiciousActivity('INVALID_FILE_CONTENT', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            userId: req.user?.id,
            fileName: file.originalname,
            reason: validation.reason
          });
          
          return res.status(400).json({
            error: `File validation failed: ${validation.reason}`,
            code: 'INVALID_FILE_CONTENT'
          });
        }
        
        logSecurityEvent('info', 'FILE_UPLOADED', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          userId: req.user?.id,
          fileName: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
          additional: { savedAs: file.filename }
        });
      }
    }
    
    next();
  } catch (error) {
    // Clean up files on error
    files.forEach(file => {
      if (file && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    });
    
    logSuspiciousActivity('FILE_VALIDATION_ERROR', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      error: error.message
    });
    
    res.status(500).json({
      error: 'File validation error',
      code: 'FILE_VALIDATION_ERROR'
    });
  }
};

// Middleware to clean up old uploaded files
const cleanupOldFiles = () => {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  fs.readdir(uploadsDir, (err, files) => {
    if (err) return;
    
    files.forEach(file => {
      const filePath = path.join(uploadsDir, file);
      fs.stat(filePath, (err, stats) => {
        if (err) return;
        
        if (Date.now() - stats.mtime.getTime() > maxAge) {
          fs.unlink(filePath, (err) => {
            if (!err) {
              logSecurityEvent('info', 'OLD_FILE_CLEANED', {
                fileName: file,
                age: Date.now() - stats.mtime.getTime()
              });
            }
          });
        }
      });
    });
  });
};

// Run cleanup every hour
setInterval(cleanupOldFiles, 60 * 60 * 1000);

module.exports = {
  secureUpload,
  validateUploadedFile,
  allowedImageTypes,
  allowedDocumentTypes,
  cleanupOldFiles
};