-- Check VA data for pending transactions
SELECT id, midtrans_order_id, status, payment_type, bank_name, va_number, payment_code, bill_key, biller_code
FROM transactions 
WHERE status = 'pending' 
ORDER BY id DESC 
LIMIT 10;

-- Check all transactions with VA numbers
SELECT id, midtrans_order_id, status, payment_type, bank_name, va_number
FROM transactions 
WHERE va_number IS NOT NULL
ORDER BY id DESC;
