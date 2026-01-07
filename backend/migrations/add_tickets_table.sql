-- Migration: Add tickets table and update transactions
-- Purpose: Create tickets table for purchased tickets and add payment_type to transactions
-- Date: 2025-12-13

-- Create tickets table
CREATE TABLE IF NOT EXISTS `tickets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `transaction_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `event_id` int(11) NOT NULL,
  `ticket_code` varchar(100) NOT NULL UNIQUE,
  `status` enum('active','used','cancelled') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `used_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `transaction_id` (`transaction_id`),
  KEY `user_id` (`user_id`),
  KEY `event_id` (`event_id`),
  KEY `ticket_code` (`ticket_code`),
  CONSTRAINT `fk_ticket_transaction` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ticket_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ticket_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Update transactions table - add payment_type column
ALTER TABLE `transactions`
ADD COLUMN IF NOT EXISTS `payment_type` varchar(50) DEFAULT 'midtrans' COMMENT 'Payment method: midtrans, manual, etc';

-- Update status enum to include 'success'
ALTER TABLE `transactions`
MODIFY COLUMN `status` enum('pending','success','completed','cancelled','failed') NOT NULL DEFAULT 'pending';
