-- Migration: Add pricing columns untuk flat 2% commission tracking
-- Date: 2 Februari 2026
-- Purpose: Track Midtrans fees dan platform komisi 2% per transaksi

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS (
  payment_method VARCHAR(50) DEFAULT NULL COMMENT 'Payment method: gopay, shopeepay, dana, bank, cc, minimarket, akulaku, kredivo',
  midtrans_fee_amount INT DEFAULT 0 COMMENT 'Biaya Midtrans (varies per payment method)',
  platform_fee_amount INT DEFAULT 0 COMMENT 'Komisi platform 2% (FLAT)',
  total_fee_amount INT DEFAULT 0 COMMENT 'Total fee = midtrans_fee + platform_fee',
  net_amount_to_organizer INT DEFAULT 0 COMMENT 'Uang yang diterima organizer = gross - total_fee',
  fee_breakdown JSON DEFAULT NULL COMMENT 'Breakdown detail: {midtrans, platform, total, percentages}'
);

-- Add indexes untuk query lebih cepat
ALTER TABLE transactions ADD INDEX IF NOT EXISTS idx_payment_method (payment_method);
ALTER TABLE transactions ADD INDEX IF NOT EXISTS idx_fee_amounts (platform_fee_amount, midtrans_fee_amount);

-- Create audit table untuk track perubahan fee (optional tapi useful untuk audit)
CREATE TABLE IF NOT EXISTS transactions_fee_audit (
  id INT PRIMARY KEY AUTO_INCREMENT,
  transaction_id INT NOT NULL,
  gross_amount INT NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  midtrans_fee INT NOT NULL,
  platform_fee INT NOT NULL,
  total_fee INT NOT NULL,
  net_amount INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (transaction_id) REFERENCES transactions(id),
  INDEX idx_transaction (transaction_id),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Verify migration
SELECT 
  COLUMN_NAME, 
  COLUMN_TYPE, 
  COLUMN_COMMENT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'transactions' 
AND COLUMN_NAME IN (
  'payment_method', 
  'midtrans_fee_amount', 
  'platform_fee_amount', 
  'total_fee_amount', 
  'net_amount_to_organizer', 
  'fee_breakdown'
);
