-- Migration: Add scanning functionality to tickets
-- Date: 2025-12-18

-- Add scanned_by and scanned_at columns to tickets table
ALTER TABLE `tickets`
ADD COLUMN IF NOT EXISTS `scanned_by` int(11) DEFAULT NULL COMMENT 'Panitia user_id who scanned the ticket',
ADD COLUMN IF NOT EXISTS `scanned_at` timestamp NULL DEFAULT NULL COMMENT 'When ticket was scanned for entry',
ADD CONSTRAINT `fk_ticket_scanned_by` FOREIGN KEY (`scanned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

-- Add quantity column to transactions for multiple tickets
ALTER TABLE `transactions`
ADD COLUMN IF NOT EXISTS `quantity` int(11) NOT NULL DEFAULT 1 COMMENT 'Number of tickets purchased';

-- Update tickets status enum to include 'scanned'
ALTER TABLE `tickets`
MODIFY COLUMN `status` enum('active','used','cancelled','scanned') NOT NULL DEFAULT 'active';
