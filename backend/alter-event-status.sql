ALTER TABLE events MODIFY COLUMN status ENUM('pending','active','completed','cancelled','sold_out') NOT NULL DEFAULT 'pending';
