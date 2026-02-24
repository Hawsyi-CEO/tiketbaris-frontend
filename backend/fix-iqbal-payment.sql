UPDATE transactions SET status = 'completed', payment_type = 'bank_transfer' WHERE id = 112 AND user_id = 64;
SELECT id, midtrans_order_id, user_id, event_id, quantity, total_amount, status, transaction_date FROM transactions WHERE id = 112;
