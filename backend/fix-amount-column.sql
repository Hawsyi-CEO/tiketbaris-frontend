-- Fix amount column to allow NULL
USE tiket;

ALTER TABLE transactions 
MODIFY COLUMN amount DECIMAL(10,2) DEFAULT NULL;

-- Verify
DESCRIBE transactions;
