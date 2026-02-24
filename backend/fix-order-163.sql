-- Manual fix order SIMTIX-1769026708776-9
-- Set expired_at (24 jam dari sekarang) dan snap_token

-- Get snap token from Midtrans (we'll use dummy for now, will regenerate)
UPDATE transactions 
SET expired_at = DATE_ADD(NOW(), INTERVAL 24 HOUR)
WHERE id = 163;

SELECT id, midtrans_order_id, user_id, snap_token, expired_at, status 
FROM transactions 
WHERE id = 163;
