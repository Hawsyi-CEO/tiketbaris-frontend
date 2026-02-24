SELECT COUNT(*) as total_pending FROM transactions WHERE status = 'pending' AND expired_at > NOW();
SELECT id, midtrans_order_id, user_id, status, expired_at, TIMESTAMPDIFF(SECOND, NOW(), expired_at) as seconds_remaining FROM transactions WHERE status = 'pending' AND expired_at > NOW() LIMIT 5;
