-- Hapus event yang user_id-nya tidak ditemukan di tabel users (orphan events)
DELETE e FROM events e
LEFT JOIN users u ON e.user_id = u.id
WHERE u.id IS NULL;

-- (Opsional) Cek lagi setelah hapus
SELECT e.id, e.title, e.user_id
FROM events e
LEFT JOIN users u ON e.user_id = u.id
WHERE u.id IS NULL;
