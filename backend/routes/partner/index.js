/**
 * Partner API Routes Index
 * 
 * Main router for all Partner API endpoints
 * Base path: /api/partner
 */

const express = require('express');
const router = express.Router();
const { authenticatePartner, withLogging } = require('../../middleware/partnerAuth');

// Import route modules
const usersRoutes = require('./users');
const eventsRoutes = require('./events');
const checkoutRoutes = require('./checkout');
const ticketsRoutes = require('./tickets');
const adminRoutes = require('./admin');

// Apply partner authentication to all routes
router.use(authenticatePartner);

// Log all partner requests for audit
router.use(withLogging);

/**
 * GET /api/partner/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'Tiket Baris Partner API',
    version: '1.0.0',
    partner: req.partner.name,
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/partner/info
 * Get partner information
 */
router.get('/info', (req, res) => {
  res.json({
    success: true,
    partner: {
      name: req.partner.name,
      code: req.partner.code,
      rate_limit: req.partner.rate_limit_per_minute
    },
    endpoints: {
      users: '/api/partner/users',
      events: '/api/partner/events',
      checkout: '/api/partner/checkout',
      tickets: '/api/partner/tickets',
      admin: '/api/partner/admin'
    }
  });
});

// Mount route modules
router.use('/users', usersRoutes);
router.use('/events', eventsRoutes);
router.use('/checkout', checkoutRoutes);
router.use('/tickets', ticketsRoutes);
router.use('/admin', adminRoutes);

// Error handler for partner API
router.use((err, req, res, next) => {
  console.error('[PARTNER API] Error:', err);
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Invalid partner credentials',
      code: 'UNAUTHORIZED'
    });
  }

  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
});

module.exports = router;
