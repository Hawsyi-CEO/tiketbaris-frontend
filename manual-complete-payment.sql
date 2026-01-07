-- Update transaction 40 to completed
UPDATE transactions SET status = 'completed' WHERE id = 40;

-- Create ticket for transaction 40
INSERT INTO tickets (transaction_id, user_id, event_id, ticket_code, price, status) 
SELECT 40, user_id, event_id, CONCAT('TIX-SIMTIX-1766783145370-9-1'), 2500, 'active'
FROM transactions WHERE id = 40;

-- Update event stock
UPDATE events SET current_stock = current_stock - 1 WHERE id = 5;
