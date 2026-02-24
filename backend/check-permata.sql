-- Check Permata transaction in database
SELECT id, midtrans_order_id, status, payment_type, bank_name, va_number, payment_code, bill_key
FROM transactions 
WHERE bank_name LIKE '%permata%' OR bank_name LIKE '%PERMATA%'
ORDER BY id DESC 
LIMIT 5;

-- Check recent webhook logs for Permata
SELECT id, order_id, transaction_status, payment_type, created_at, 
       JSON_EXTRACT(payload, '$.va_numbers') as va_data,
       JSON_EXTRACT(payload, '$.permata_va_number') as permata_va
FROM webhook_logs 
WHERE payment_type = 'bank_transfer' 
  AND (payload LIKE '%permata%' OR payload LIKE '%PERMATA%')
ORDER BY created_at DESC 
LIMIT 3;

-- Check latest bank_transfer transactions
SELECT id, midtrans_order_id, status, payment_type, bank_name, va_number
FROM transactions 
WHERE payment_type LIKE '%bank%' 
ORDER BY id DESC 
LIMIT 10;
