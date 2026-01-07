# 🚀 DEPLOYMENT GUIDE - tiketbaris.id

## 📋 **Informasi Server**
- **Domain**: tiketbaris.id
- **VPS IP**: 72.61.140.193
- **Backend Port**: 5020
- **Frontend Port**: 80/443 (Nginx)

---

## ✅ **Yang Sudah Dikonfigurasi di Code**

### Backend (.env)
```env
BACKEND_URL=https://tiketbaris.id
FRONTEND_URL=https://tiketbaris.id
CORS_ORIGINS=https://tiketbaris.id,http://tiketbaris.id,http://72.61.140.193
```

### Frontend
- API URL: `https://tiketbaris.id/api`
- Socket URL: `https://tiketbaris.id`
- Semua hardcoded localhost sudah diganti

### Midtrans Webhook
```
https://tiketbaris.id/api/midtrans/webhook
```

---

## 📝 **DNS Configuration**

Arahkan domain **tiketbaris.id** ke VPS:

### Di DNS Provider (Cloudflare/Namecheap/dll):
```
Type: A
Name: @
Value: 72.61.140.193
TTL: Auto

Type: A  
Name: www
Value: 72.61.140.193
TTL: Auto
```

**Cek DNS Propagation:**
```bash
nslookup tiketbaris.id
# Should return: 72.61.140.193
```

---

## 🖥️ **VPS Setup Steps**

### 1️⃣ **Connect ke VPS**
```bash
ssh root@72.61.140.193
```

### 2️⃣ **Install Dependencies**
```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Install Nginx
apt install -y nginx

# Install PM2 (Process Manager)
npm install -g pm2

# Install MySQL (jika belum ada)
apt install -y mysql-server
```

### 3️⃣ **Upload Code ke VPS**

**Option A: Git Clone (Recommended)**
```bash
cd /var/www
git clone https://github.com/YOUR_USERNAME/simtix.git
cd simtix
```

**Option B: Upload via FTP/SCP**
```bash
# Dari local computer
scp -r c:\laragon\www\simtix root@72.61.140.193:/var/www/
```

### 4️⃣ **Setup Backend**
```bash
cd /var/www/tiketbaris/backend

# Install dependencies
npm install

# Upload database
mysql -u root -p < ../u390486773_simtix.sql

# Create MySQL user
mysql -u root -p
CREATE DATABASE tiket;
CREATE USER 'simtix'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON tiket.* TO 'simtix'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Edit .env jika perlu
nano .env
# Update DB credentials jika berbeda

# Start backend dengan PM2
pm2 start server.js --name tiketbaris-backend
pm2 save
pm2 startup
```

### 5️⃣ **Build Frontend**
```bash
cd /var/www/tiketbaris/frontend

# Install dependencies
npm install

# Build production
npm run build
# Output akan di folder: dist/
```

### 6️⃣ **Configure Nginx**

**Create Nginx config:**
```bash
nano /etc/nginx/sites-available/tiketbaris.id
```

**Paste config ini:**
```nginx
server {
    listen 80;
    server_name tiketbaris.id www.tiketbaris.id;

    # Frontend (React build)
    root /var/www/tiketbaris/frontend/dist;
    index index.html;

    # Frontend routes (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket untuk Socket.io
    location /socket.io/ {
        proxy_pass http://localhost:5000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploads folder
    location /uploads/ {
        alias /var/www/tiketbaris/backend/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

**Enable site:**
```bash
ln -s /etc/nginx/sites-available/tiketbaris.id /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 7️⃣ **Install SSL Certificate (HTTPS)**
```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d tiketbaris.id -d www.tiketbaris.id

# Auto-renewal (already configured by certbot)
certbot renew --dry-run
```

### 8️⃣ **Setup Firewall**
```bash
# Allow HTTP, HTTPS, SSH
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable
```

---

## 🎯 **Midtrans Webhook Setup**

1. Login ke **Midtrans Dashboard** (Production)
2. Go to: **Settings** → **Configuration** → **Notification URL**
3. Set webhook URL:
   ```
   https://tiketbaris.id/api/midtrans/webhook
   ```
4. Save changes

---

## ✅ **Testing Production**

### Test URLs:
- Frontend: https://tiketbaris.id
- Backend Health: https://tiketbaris.id/api/test
- Midtrans Test: https://tiketbaris.id/api/midtrans/test

### Test Payment:
1. Buka https://tiketbaris.id
2. Login sebagai user
3. Beli tiket → akan redirect ke Midtrans production
4. Bayar dengan kartu/bank real
5. Webhook akan otomatis create tickets

---

## 🔧 **Maintenance Commands**

### PM2 Management:
```bash
pm2 status              # Check status
pm2 logs tiketbaris-backend # View logs
pm2 restart tiketbaris-backend
pm2 stop tiketbaris-backend
pm2 delete tiketbaris-backend
```

### Update Code:
```bash
cd /var/www/tiketbaris

# Pull latest changes
git pull origin main

# Backend
cd backend
npm install
pm2 restart tiketbaris-backend

# Frontend
cd ../frontend
npm install
npm run build

# Reload Nginx
systemctl reload nginx
```

### View Logs:
```bash
# Backend logs
pm2 logs tiketbaris-backend

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

## 🔐 **Security Checklist**

- [ ] Change MySQL root password
- [ ] Create dedicated MySQL user (not root)
- [ ] Update JWT_SECRET in .env (random 64-char string)
- [ ] Enable UFW firewall
- [ ] Install SSL certificate (certbot)
- [ ] Disable root SSH login (edit /etc/ssh/sshd_config)
- [ ] Setup fail2ban for SSH protection
- [ ] Enable automatic security updates

---

## 📊 **Monitoring**

### Check if services running:
```bash
# Backend
pm2 status

# Nginx
systemctl status nginx

# MySQL
systemctl status mysql
```

### Check resources:
```bash
htop           # CPU/RAM usage
df -h          # Disk space
netstat -tulpn # Open ports
```

---

## 🚨 **Troubleshooting**

### Backend not working:
```bash
pm2 logs tiketbaris-backend --lines 100
# Check for errors in logs
```

### Frontend blank page:
```bash
# Check Nginx error logs
tail -f /var/log/nginx/error.log

# Verify build exists
ls -la /var/www/tiketbaris/frontend/dist/
```

### Database connection error:
```bash
# Test MySQL connection
mysql -u tiketbaris -p tiket

# Check .env DB credentials match
```

### Webhook not working:
- Check Midtrans dashboard settings
- Verify URL: https://tiketbaris.id/api/midtrans/webhook
- Check backend logs: `pm2 logs tiketbaris-backend`

---

## 📞 **Support**

Jika ada masalah saat deployment:
1. Check PM2 logs: `pm2 logs`
2. Check Nginx logs: `tail -f /var/log/nginx/error.log`
3. Verify DNS: `nslookup tiketbaris.id`
4. Test backend: `curl https://tiketbaris.id/api/test`

---

**🎉 DEPLOYMENT COMPLETE!**

Website live di: **https://tiketbaris.id**
