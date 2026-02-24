-- Cari user Iqbal
SELECT id, username, email, role, created_at 
FROM users 
WHERE username LIKE '%iqbal%' OR email LIKE '%iqbal%' 
ORDER BY created_at DESC;

-- Jika ada user, cek tiketnya
SELECT t.id, t.ticket_code, t.event_id, e.title as event_name, t.price, t.status, t.created_at
FROM tickets t
LEFT JOIN events e ON t.event_id = e.id
WHERE t.user_id = 64
ORDER BY t.created_at DESC;

-- Cek transaksi (jika tabel ada)
SELECT * FROM transactions 
WHERE user_id IN (SELECT id FROM users WHERE username LIKE '%iqbal%' OR email LIKE '%iqbal%')
LIMIT 10;
