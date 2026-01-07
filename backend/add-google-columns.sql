ALTER TABLE users 
ADD COLUMN google_id VARCHAR(255) DEFAULT NULL AFTER email,
ADD COLUMN email_verified BOOLEAN DEFAULT 0 AFTER google_id,
ADD UNIQUE INDEX idx_google_id (google_id);
