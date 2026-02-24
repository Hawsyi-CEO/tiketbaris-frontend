SELECT id, midtrans_order_id, user_id, snap_token, expired_at, status, transaction_date 
FROM transactions 
WHERE midtrans_order_id LIKE '%1769026708776%' 
ORDER BY id DESC 
LIMIT 1;
