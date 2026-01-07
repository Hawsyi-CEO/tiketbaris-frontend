-- Migration: Add event_agreements table
-- Purpose: Track terms & conditions acceptance for each event creation
-- Date: 2025-12-13

CREATE TABLE IF NOT EXISTS `event_agreements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `event_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `terms_version` varchar(20) NOT NULL DEFAULT 'v1.0',
  `agreed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `event_id` (`event_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `fk_agreement_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_agreement_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Add commission tracking to events table
ALTER TABLE `events` 
ADD COLUMN IF NOT EXISTS `commission_rate` decimal(5,2) NOT NULL DEFAULT 2.00 COMMENT 'Commission percentage (default 2%)';

-- Add payment status for event creation (if needed in future)
ALTER TABLE `events`
ADD COLUMN IF NOT EXISTS `setup_fee_paid` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Setup fee payment status (currently not used)';
