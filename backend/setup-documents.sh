#!/bin/bash
# Run this script to add documents column to events table

mysql -h localhost -u root tiket_pembaris << EOF
ALTER TABLE events ADD COLUMN IF NOT EXISTS documents LONGTEXT DEFAULT NULL;
EOF

echo "Documents column added to events table successfully!"
