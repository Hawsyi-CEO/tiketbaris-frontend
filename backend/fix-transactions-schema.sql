-- Fix transactions table schema to match backend code
USE tiket;

-- Add missing columns
ALTER TABLE transactions 
ADD COLUMN quantity INT DEFAULT 1 AFTER event_id,
ADD COLUMN unit_price DECIMAL(10,2) AFTER quantity,
ADD COLUMN total_amount DECIMAL(10,2) AFTER unit_price,
ADD COLUMN final_amount DECIMAL(10,2) AFTER total_amount,
ADD COLUMN payment_type VARCHAR(50) DEFAULT 'midtrans_snap' AFTER final_amount;

-- Rename 'amount' to match or keep both (keep both for compatibility)
-- We'll use total_amount as primary and sync amount

-- Update existing data
UPDATE transactions 
SET quantity = 1, 
    unit_price = amount,
    total_amount = amount,
    final_amount = amount,
    payment_type = 'midtrans_snap'
WHERE quantity IS NULL;

-- Show updated structure
DESCRIBE transactions;
