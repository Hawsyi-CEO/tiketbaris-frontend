-- Add expired_at column to transactions table (safe, won't error if exists)
ALTER TABLE transactions 
ADD COLUMN expired_at TIMESTAMP NULL 
COMMENT '24 hours from transaction_date for payment deadline';

-- Update existing pending transactions
UPDATE transactions 
SET expired_at = DATE_ADD(transaction_date, INTERVAL 24 HOUR) 
WHERE status = 'pending' AND expired_at IS NULL;

-- Modify status enum to include 'expired'
ALTER TABLE transactions 
MODIFY COLUMN status ENUM('pending', 'completed', 'cancelled', 'expired') NOT NULL DEFAULT 'pending';

-- Verify
SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'tiket' 
  AND TABLE_NAME = 'transactions' 
  AND COLUMN_NAME IN ('expired_at', 'status');
