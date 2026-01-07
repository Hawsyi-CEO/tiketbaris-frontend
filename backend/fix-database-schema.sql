-- Add missing columns to users table
ALTER TABLE users 
ADD COLUMN phone VARCHAR(20) DEFAULT NULL AFTER email,
ADD COLUMN address TEXT DEFAULT NULL AFTER phone;

-- Fix user_sessions structure
ALTER TABLE user_sessions
DROP COLUMN device_info,
ADD COLUMN device_name VARCHAR(255) AFTER session_token,
ADD COLUMN device_type VARCHAR(50) AFTER device_name,
ADD COLUMN browser VARCHAR(100) AFTER device_type,
ADD COLUMN os VARCHAR(100) AFTER browser,
MODIFY COLUMN is_active BOOLEAN DEFAULT 1,
ADD COLUMN is_current BOOLEAN DEFAULT FALSE AFTER is_active;

-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_code VARCHAR(255) NOT NULL UNIQUE,
  event_id INT NOT NULL,
  user_id INT NOT NULL,
  transaction_id INT DEFAULT NULL,
  price INT NOT NULL,
  status ENUM('active', 'used', 'cancelled') DEFAULT 'active',
  scanned_at DATETIME DEFAULT NULL,
  scanned_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_event_id (event_id),
  INDEX idx_user_id (user_id),
  INDEX idx_ticket_code (ticket_code),
  INDEX idx_status (status),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
