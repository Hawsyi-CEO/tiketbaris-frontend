-- Generate 4 tickets untuk Iqbal (Transaction 112, Event 6)
-- Ticket codes akan unique dengan format: TIX-[timestamp]-[random]

INSERT INTO tickets (transaction_id, user_id, event_id, ticket_code, price, status, created_at) VALUES
(112, 64, 6, CONCAT('TIX-', UNIX_TIMESTAMP(), '-', FLOOR(RAND() * 10000)), 15000.00, 'active', NOW()),
(112, 64, 6, CONCAT('TIX-', UNIX_TIMESTAMP(), '-', FLOOR(RAND() * 10000)), 15000.00, 'active', NOW()),
(112, 64, 6, CONCAT('TIX-', UNIX_TIMESTAMP(), '-', FLOOR(RAND() * 10000)), 15000.00, 'active', NOW()),
(112, 64, 6, CONCAT('TIX-', UNIX_TIMESTAMP(), '-', FLOOR(RAND() * 10000)), 15000.00, 'active', NOW());

-- Verify tickets created
SELECT id, ticket_code, event_id, user_id, transaction_id, price, status, created_at 
FROM tickets 
WHERE transaction_id = 112 
ORDER BY id DESC 
LIMIT 4;
