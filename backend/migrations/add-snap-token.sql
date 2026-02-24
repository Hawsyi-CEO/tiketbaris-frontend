ALTER TABLE transactions ADD COLUMN snap_token VARCHAR(255) NULL COMMENT 'Midtrans Snap token for re-opening payment';
SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'transactions' AND COLUMN_NAME = 'snap_token';
