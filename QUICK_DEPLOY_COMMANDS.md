# 🚀 QUICK DEPLOYMENT COMMANDS

## 📦 **Upload ke VPS (Pilih Salah Satu)**

### Option 1: SCP Upload
```bash
# Compress project
tar -czf simtix.tar.gz c:\laragon\www\simtix

# Upload to VPS
scp simtix.tar.gz root@72.61.140.193:/var/www/

# SSH ke VPS dan extract
ssh root@72.61.140.193
cd /var/www
tar -xzf simtix.tar.gz
```

### Option 2: Git Push (Recommended)
```bash
# Dari local
cd c:\laragon\www\simtix
git init
git add .
git commit -m "Production ready"
git remote add origin YOUR_GITHUB_REPO
git push origin main

# Di VPS
ssh root@72.61.140.193
cd /var/www
git clone YOUR_GITHUB_REPO simtix
```

---

## ⚡ **One-Command Setup (Copy-Paste di VPS)**

```bash
# SSH ke VPS
ssh root@72.61.140.193

# Install semua dependencies
apt update && apt upgrade -y && \
curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
apt install -y nodejs nginx mysql-server && \
npm install -g pm2

# Setup backend
cd /var/www/simtix/backend && \
npm install && \
pm2 start server.js --name tiketbaris-backend && \
pm2 save && \
pm2 startup

# Build frontend
cd /var/www/simtix/frontend && \
npm install && \
npm run build

# Setup firewall
ufw allow 22 && ufw allow 80 && ufw allow 443 && ufw --force enable

echo "✅ Setup complete!"
```

---

## 🔧 **Nginx Configuration (Quick)**

```bash
# Create config
cat > /etc/nginx/sites-available/tiketbaris.id << 'EOF'
server {
    listen 80;
    server_name tiketbaris.id www.tiketbaris.id;
    root /var/www/simtix/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io/ {
        proxy_pass http://localhost:5000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
    }

    location /uploads/ {
        alias /var/www/simtix/backend/uploads/;
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/tiketbaris.id /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

---

## 🔐 **SSL Certificate (One Command)**

```bash
apt install -y certbot python3-certbot-nginx && \
certbot --nginx -d tiketbaris.id -d www.tiketbaris.id --non-interactive --agree-tos --email your@email.com
```

---

## 📊 **Quick Health Check**

```bash
# Check all services
echo "=== PM2 Status ===" && pm2 status
echo "=== Nginx Status ===" && systemctl status nginx --no-pager
echo "=== MySQL Status ===" && systemctl status mysql --no-pager
echo "=== Disk Space ===" && df -h
echo "=== Memory Usage ===" && free -h
```

---

## 🔄 **Update Code (After Git Push)**

```bash
ssh root@72.61.140.193

cd /var/www/simtix && \
git pull origin main && \
cd backend && npm install && pm2 restart tiketbaris-backend && \
cd ../frontend && npm install && npm run build && \
systemctl reload nginx && \
echo "✅ Update complete!"
```

---

## 🗄️ **Database Setup (One Time)**

```bash
# Create database and user
mysql -u root -p << 'EOF'
CREATE DATABASE IF NOT EXISTS tiket;
CREATE USER IF NOT EXISTS 'simtix'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON tiket.* TO 'simtix'@'localhost';
FLUSH PRIVILEGES;
EOF

# Import database
mysql -u root -p tiket < /var/www/simtix/u390486773_simtix.sql

# Update backend .env
cd /var/www/simtix/backend
sed -i 's/DB_USER=root/DB_USER=simtix/' .env
sed -i 's/DB_PASSWORD=/DB_PASSWORD=your_strong_password/' .env
```

---

## 🚨 **Emergency Commands**

### Backend crashed:
```bash
pm2 restart tiketbaris-backend
pm2 logs tiketbaris-backend --lines 50
```

### High memory:
```bash
pm2 restart tiketbaris-backend
pm2 flush  # Clear logs
```

### Nginx error:
```bash
nginx -t  # Test config
systemctl restart nginx
tail -f /var/log/nginx/error.log
```

### Check what's using port:
```bash
netstat -tulpn | grep :5000
netstat -tulpn | grep :80
```

---

## 📱 **Test URLs**

```bash
# Health checks
curl https://tiketbaris.id
curl https://tiketbaris.id/api/test
curl https://tiketbaris.id/api/midtrans/test

# Test dengan browser
open https://tiketbaris.id
```

---

## 🎯 **Post-Deployment Checklist**

```bash
# Run this after deployment
cat << 'EOF'
🔍 POST-DEPLOYMENT VERIFICATION:

[ ] DNS propagated (nslookup tiketbaris.id → 72.61.140.193)
[ ] Backend running (pm2 status)
[ ] Frontend built (ls /var/www/simtix/frontend/dist/)
[ ] Nginx running (systemctl status nginx)
[ ] SSL certificate active (https://tiketbaris.id)
[ ] Database imported (mysql -u simtix -p tiket)
[ ] Webhook URL updated in Midtrans dashboard
[ ] Test payment successful
[ ] WebSocket connection working

✅ ALL GREEN? Production ready!
EOF
```

---

## 📞 **Quick Troubleshoot**

| Problem | Solution |
|---------|----------|
| 502 Bad Gateway | `pm2 restart tiketbaris-backend` |
| 404 Not Found | `nginx -t && systemctl reload nginx` |
| Can't connect DB | Check .env DB credentials |
| High CPU | `pm2 restart tiketbaris-backend && pm2 flush` |
| Webhook not working | Update URL in Midtrans dashboard |
| SSL expired | `certbot renew --force-renewal` |

---

**SAVE THIS FILE!** Copy commands as needed 🚀
