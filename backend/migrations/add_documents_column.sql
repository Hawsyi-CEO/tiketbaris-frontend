-- Add documents column to events table if it doesn't exist
ALTER TABLE events ADD COLUMN documents LONGTEXT DEFAULT NULL AFTER image_url;

-- Add documents column to events table if it doesn't exist (alternative syntax)
-- ALTER TABLE events ADD COLUMN IF NOT EXISTS documents LONGTEXT DEFAULT NULL AFTER image_url;
