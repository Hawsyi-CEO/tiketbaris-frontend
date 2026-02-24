-- Migration: Partner API System for External Integrations
-- Date: 23 Februari 2026
-- Purpose: Enable Tiket Baris as "Ticketing as a Service" for partners like Forbasi Jabar

-- =====================================================
-- TABLE: partners
-- Stores partner/client information (e.g., Forbasi Jabar)
-- =====================================================
CREATE TABLE IF NOT EXISTS partners (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL COMMENT 'Partner name (e.g., Forbasi Jabar)',
  code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Unique partner code (e.g., JABAR)',
  api_key VARCHAR(64) NOT NULL UNIQUE COMMENT 'API Key for authentication',
  api_secret VARCHAR(128) NOT NULL COMMENT 'API Secret for signing requests',
  jwt_secret VARCHAR(128) NOT NULL COMMENT 'Secret to verify partner JWT tokens',
  webhook_url VARCHAR(255) DEFAULT NULL COMMENT 'URL to send webhook notifications',
  callback_url VARCHAR(255) DEFAULT NULL COMMENT 'Frontend callback URL after payment',
  logo_url VARCHAR(255) DEFAULT NULL COMMENT 'Partner logo URL',
  is_active TINYINT(1) DEFAULT 1 COMMENT '1 = active, 0 = disabled',
  rate_limit INT DEFAULT 1000 COMMENT 'Max requests per hour',
  allowed_ips TEXT DEFAULT NULL COMMENT 'JSON array of allowed IPs (null = all)',
  settings JSON DEFAULT NULL COMMENT 'Additional partner settings',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_api_key (api_key),
  INDEX idx_code (code),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: partner_users
-- Links external users to Tiket Baris internal users
-- =====================================================
CREATE TABLE IF NOT EXISTS partner_users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  partner_id INT NOT NULL COMMENT 'FK to partners table',
  external_user_id VARCHAR(100) NOT NULL COMMENT 'User ID from partner system',
  internal_user_id INT DEFAULT NULL COMMENT 'FK to users table (created after first access)',
  external_email VARCHAR(255) NOT NULL COMMENT 'Email from partner',
  external_name VARCHAR(255) NOT NULL COMMENT 'Name from partner',
  external_phone VARCHAR(20) DEFAULT NULL COMMENT 'Phone from partner',
  role ENUM('user', 'panitia', 'admin') DEFAULT 'user' COMMENT 'Role in partner system',
  metadata JSON DEFAULT NULL COMMENT 'Additional user data from partner',
  last_access TIMESTAMP DEFAULT NULL COMMENT 'Last API access time',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY uk_partner_external (partner_id, external_user_id),
  INDEX idx_partner (partner_id),
  INDEX idx_internal_user (internal_user_id),
  INDEX idx_external_email (external_email),
  INDEX idx_role (role),
  
  FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE,
  FOREIGN KEY (internal_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: partner_api_logs
-- Audit log for all partner API requests
-- =====================================================
CREATE TABLE IF NOT EXISTS partner_api_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  partner_id INT NOT NULL,
  partner_user_id INT DEFAULT NULL,
  endpoint VARCHAR(255) NOT NULL COMMENT 'API endpoint called',
  method VARCHAR(10) NOT NULL COMMENT 'HTTP method',
  request_body TEXT DEFAULT NULL COMMENT 'Request payload (sanitized)',
  response_status INT NOT NULL COMMENT 'HTTP response status',
  response_time_ms INT DEFAULT NULL COMMENT 'Response time in milliseconds',
  ip_address VARCHAR(45) DEFAULT NULL COMMENT 'Client IP address',
  user_agent VARCHAR(500) DEFAULT NULL,
  error_message TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_partner (partner_id),
  INDEX idx_partner_user (partner_user_id),
  INDEX idx_created (created_at),
  INDEX idx_endpoint (endpoint),
  INDEX idx_status (response_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: partner_webhooks
-- Log outgoing webhooks to partners
-- =====================================================
CREATE TABLE IF NOT EXISTS partner_webhooks (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  partner_id INT NOT NULL,
  event_type VARCHAR(50) NOT NULL COMMENT 'Event type (payment.success, ticket.created, etc)',
  payload JSON NOT NULL COMMENT 'Webhook payload sent',
  webhook_url VARCHAR(255) NOT NULL,
  response_status INT DEFAULT NULL COMMENT 'Partner response status',
  response_body TEXT DEFAULT NULL,
  attempts INT DEFAULT 1 COMMENT 'Number of delivery attempts',
  delivered_at TIMESTAMP DEFAULT NULL,
  next_retry_at TIMESTAMP DEFAULT NULL,
  status ENUM('pending', 'delivered', 'failed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_partner (partner_id),
  INDEX idx_event_type (event_type),
  INDEX idx_status (status),
  INDEX idx_created (created_at),
  
  FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- INSERT: First Partner - Forbasi Jabar
-- =====================================================
INSERT INTO partners (name, code, api_key, api_secret, jwt_secret, webhook_url, callback_url, is_active, rate_limit, settings)
VALUES (
  'Forbasi Jabar',
  'FORBASI_JABAR',
  CONCAT('pk_', REPLACE(UUID(), '-', '')),
  CONCAT('sk_', SHA2(CONCAT(UUID(), NOW(), RAND()), 256)),
  CONCAT('jwt_', SHA2(CONCAT(UUID(), NOW(), RAND()), 256)),
  'https://jabar.forbasi.or.id/api/webhook/tiketbaris',
  'https://jabar.forbasi.or.id/payment/callback',
  1,
  5000,
  JSON_OBJECT(
    'allow_event_creation', true,
    'auto_approve_events', false,
    'commission_rate', 2,
    'branding', JSON_OBJECT(
      'powered_by', true,
      'logo_position', 'footer'
    )
  )
) ON DUPLICATE KEY UPDATE name = VALUES(name);

-- =====================================================
-- Add partner_id column to events table (MySQL compatible)
-- =====================================================
-- Using procedure to safely add columns
DELIMITER //

DROP PROCEDURE IF EXISTS add_partner_columns//

CREATE PROCEDURE add_partner_columns()
BEGIN
    -- Events table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'events' AND column_name = 'partner_id') THEN
        ALTER TABLE events ADD COLUMN partner_id INT DEFAULT NULL COMMENT 'Partner that created this event';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'events' AND column_name = 'partner_event_id') THEN
        ALTER TABLE events ADD COLUMN partner_event_id VARCHAR(100) DEFAULT NULL COMMENT 'External event ID from partner';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'events' AND index_name = 'idx_partner') THEN
        ALTER TABLE events ADD INDEX idx_partner (partner_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'events' AND index_name = 'idx_partner_event') THEN
        ALTER TABLE events ADD INDEX idx_partner_event (partner_event_id);
    END IF;

    -- Transactions table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'transactions' AND column_name = 'partner_id') THEN
        ALTER TABLE transactions ADD COLUMN partner_id INT DEFAULT NULL COMMENT 'Partner for this transaction';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'transactions' AND column_name = 'partner_user_id') THEN
        ALTER TABLE transactions ADD COLUMN partner_user_id INT DEFAULT NULL COMMENT 'Partner user who made purchase';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'transactions' AND column_name = 'partner_order_id') THEN
        ALTER TABLE transactions ADD COLUMN partner_order_id VARCHAR(100) DEFAULT NULL COMMENT 'External order ID from partner';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'transactions' AND index_name = 'idx_trans_partner') THEN
        ALTER TABLE transactions ADD INDEX idx_trans_partner (partner_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'transactions' AND index_name = 'idx_trans_partner_user') THEN
        ALTER TABLE transactions ADD INDEX idx_trans_partner_user (partner_user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'transactions' AND index_name = 'idx_trans_partner_order') THEN
        ALTER TABLE transactions ADD INDEX idx_trans_partner_order (partner_order_id);
    END IF;

    -- Tickets table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'tickets' AND column_name = 'partner_ticket_id') THEN
        ALTER TABLE tickets ADD COLUMN partner_ticket_id VARCHAR(100) DEFAULT NULL COMMENT 'External ticket ID from partner';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'tickets' AND index_name = 'idx_partner_ticket') THEN
        ALTER TABLE tickets ADD INDEX idx_partner_ticket (partner_ticket_id);
    END IF;
END//

DELIMITER ;

CALL add_partner_columns();
DROP PROCEDURE IF EXISTS add_partner_columns;

-- =====================================================
-- TABLE: partner_webhooks_log
-- Log for webhook retry system
-- =====================================================
CREATE TABLE IF NOT EXISTS partner_webhooks_log (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  partner_id INT NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  payload JSON NOT NULL,
  response_status INT DEFAULT NULL,
  success TINYINT(1) DEFAULT 0,
  error_message TEXT DEFAULT NULL,
  retry_count INT DEFAULT 0,
  last_retry_at TIMESTAMP DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_partner (partner_id),
  INDEX idx_success (success),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Verification Query
-- =====================================================
SELECT 'Partner tables created successfully!' as status;
SELECT id, name, code, api_key, is_active FROM partners;
