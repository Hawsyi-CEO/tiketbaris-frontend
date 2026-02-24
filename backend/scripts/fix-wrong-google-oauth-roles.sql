-- Script untuk memperbaiki user yang salah pilih role saat Google OAuth
-- 
-- CARA PAKAI:
-- 1. Login ke MySQL/phpMyAdmin
-- 2. Jalankan query berikut untuk cek user Google OAuth yang role-nya panitia:

SELECT 
    id, 
    username, 
    email, 
    role, 
    created_at
FROM users 
WHERE google_id IS NOT NULL 
  AND role = 'panitia'
ORDER BY created_at DESC;

-- 3. Untuk user yang memang seharusnya role 'user', ubah dengan query:
--    (Ganti EMAIL_USER_DISINI dengan email user yang salah)

-- UPDATE users 
-- SET role = 'user' 
-- WHERE email = 'EMAIL_USER_DISINI' 
--   AND google_id IS NOT NULL;

-- Contoh:
-- UPDATE users 
-- SET role = 'user' 
-- WHERE email = 'john.doe@gmail.com' 
--   AND google_id IS NOT NULL;

-- 4. User harus LOGOUT dan LOGIN LAGI untuk melihat perubahan
