#!/bin/bash

# VPS - Clear event images dan verify
# Run: bash clear-event-images-vps.sh

echo "🗑️  Clearing event images from database..."

# MySQL command to clear images
mysql -h localhost -u tiketbaris_user -p'YOUR_PASSWORD' tiketbaris_db << EOF
UPDATE events 
SET image_url = NULL 
WHERE image_url IS NOT NULL;

SELECT CONCAT('✅ Cleared! Total events: ', COUNT(*)) as status
FROM events;
EOF

echo "✅ Done! Panitia bisa upload ulang sekarang."
