const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

// Import security middleware
const { logger, logSecurityEvent } = require('./middleware/logger');
const { sanitizeInput, preventSQLInjection } = require('./middleware/security');
const { checkBruteForce } = require('./middleware/enhanced-auth');

// Import and start session cleanup scheduler
const { startSessionCleanup } = require('./scheduler/session-cleanup');
const { startTransactionExpiryScheduler } = require('./scheduler/transaction-expiry');

const app = express();

// Enhanced rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: { error: 'Terlalu banyak request, coba lagi dalam 15 menit' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting untuk Google OAuth
    return req.path === '/api/auth/google' || req.path === '/api/auth/verify';
  },
  handler: (req, res) => {
    logSecurityEvent('warn', 'RATE_LIMIT_EXCEEDED', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });
    res.status(429).json({ error: 'Terlalu banyak request, coba lagi dalam 15 menit' });
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts per 15 minutes
  message: { error: 'Terlalu banyak percobaan login, coba lagi dalam 15 menit' },
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    logSecurityEvent('warn', 'AUTH_RATE_LIMIT_EXCEEDED', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      email: req.body?.email
    });
    res.status(429).json({ error: 'Terlalu banyak percobaan login, coba lagi dalam 15 menit' });
  }
});

// Security middleware stack
app.use(helmet({
  crossOriginEmbedderPolicy: false, // Disable untuk Midtrans iframe
  crossOriginOpenerPolicy: false, // Disable untuk Google OAuth popup
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://app.midtrans.com", "https://app.sandbox.midtrans.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "http://localhost:5000"],
      connectSrc: ["'self'", "https://api.midtrans.com", "https://api.sandbox.midtrans.com"]
    }
  }
}));
app.use(compression());

// Trust proxy for rate limiting behind Nginx
app.set('trust proxy', 1);

// Request logging
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// CORS configuration for production
const corsOptions = {
  origin: [
    'https://tiketbaris.id',
    'http://tiketbaris.id',
    'https://jabar.forbasi.or.id',
    'http://jabar.forbasi.or.id',
    'https://forbasi.or.id',
    // Development only - remove in strict production
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://localhost',
    'http://127.0.0.1'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-API-Secret', 'X-User-Token', 'X-Partner-Key', 'X-Partner-Secret']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files dengan CORS headers yang eksplisit
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Security middleware
app.use(sanitizeInput);
app.use(preventSQLInjection);

// Apply rate limiting
app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter, checkBruteForce);
app.use('/api/auth/register', authLimiter);
// Google OAuth tidak pakai authLimiter karena bisa retry dari Google side

// Import routes
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const checkoutRoutes = require('./routes/checkout');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/users');
const withdrawalRoutes = require('./routes/withdrawals');
const panitiaRoutes = require('./routes/panitia');
const ticketRoutes = require('./routes/tickets');
const qrTicketRoutes = require('./routes/qr-tickets');
const midtransPaymentRoutes = require('./routes/midtrans-payment');
const securityRoutes = require('./routes/security');
const sessionsRoutes = require('./routes/sessions');
const imageCleanupRoutes = require('./routes/image-cleanup');
const pricingRoutes = require('./routes/pricing');
const partnerRoutes = require('./routes/partner');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', imageCleanupRoutes);
app.use('/api/user', userRoutes);
app.use('/api/users', userRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/panitia', panitiaRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/qr-tickets', qrTicketRoutes);
app.use('/api/midtrans', midtransPaymentRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/partner', partnerRoutes);

// Debug middleware untuk log semua requests (commented out untuk testing)
// app.use((req, res, next) => {
//   console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
//   next();
// });

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server berjalan dengan baik' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route tidak ditemukan' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5020;

// Create HTTP server
const http = require('http');
const server = http.createServer(app);

// Initialize Socket.io
const { initSocketServer } = require('./socket-server');
initSocketServer(server);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('🔌 WebSocket server ready for real-time connections');
  
  // Start session cleanup scheduler
  const sessionCleanup = startSessionCleanup();
  
  // Start transaction expiry scheduler (auto-cancel expired pending transactions)
  startTransactionExpiryScheduler();
  
  // Store cleanup function globally for API access
  global.runManualSessionCleanup = sessionCleanup.runManualCleanup;
});
