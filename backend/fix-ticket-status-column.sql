-- Fix tickets status column to support 'scanned' value
-- Error: Data truncated for column 'status' at row 1

-- First, check current column definition
SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'tiket' 
AND TABLE_NAME = 'tickets' 
AND COLUMN_NAME = 'status';

-- Update the column to support all status values
ALTER TABLE tickets 
MODIFY COLUMN status ENUM(
  'pending',
  'active', 
  'used',
  'scanned',
  'cancelled',
  'expired'
) DEFAULT 'active';

-- Verify the change
SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'tiket' 
AND TABLE_NAME = 'tickets' 
AND COLUMN_NAME = 'status';

-- Show sample tickets
SELECT id, ticket_code, status, scanned_at, scanned_by 
FROM tickets 
LIMIT 5;
