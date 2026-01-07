-- Clear event images from database
-- Run this di VPS phpMyAdmin untuk clear image_url sebelum panitia upload ulang

UPDATE events 
SET image_url = NULL 
WHERE image_url IS NOT NULL;

-- Verify hasil
SELECT id, title, image_url, status 
FROM events 
WHERE status = 'active' 
LIMIT 10;
