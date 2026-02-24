-- Enhanced Sessions Table for Device Tracking
-- Menambahkan kolom untuk track device info secara detail

ALTER TABLE user_sessions 
ADD COLUMN IF NOT EXISTS browser VARCHAR(100),
ADD COLUMN IF NOT EXISTS os VARCHAR(100),
ADD COLUMN IF NOT EXISTS device_type VARCHAR(50), -- 'desktop', 'mobile', 'tablet'
ADD COLUMN IF NOT EXISTS location VARCHAR(255), -- City, Country
ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT 0; -- Mark current device

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_active ON user_sessions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_expires ON user_sessions(expires_at);
