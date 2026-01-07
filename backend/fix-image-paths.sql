-- Fix relative image paths to absolute paths
USE tiket;

-- Update events with ../uploads/ to /uploads/
UPDATE events 
SET image_url = REPLACE(image_url, '../uploads/', '/uploads/') 
WHERE image_url LIKE '../uploads/%';

-- Show affected rows
SELECT id, title, image_url 
FROM events 
WHERE image_url LIKE '/uploads/%' OR image_url LIKE '../uploads/%';
