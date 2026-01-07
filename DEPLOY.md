# 🚀 DEPLOYMENT GUIDE - Updated Structure

## ✅ What Has Been Fixed

### 1. **Unified API Configuration**
- **Before:** 2 config files (api-config.js & config/api.js) → konflik & hardcoded
- **After:** 1 unified config (`frontend/src/config/api.js`) dengan auto environment detection
  ```javascript
  // Auto-detect: localhost → local backend, production → tiketbaris.id
  const isDevelopment = window.location.hostname === 'localhost'
  ```

### 2. **Cache Busting Enabled**
- **Before:** No versioning → browser cache old files
- **After:** Hash-based filenames di build output
  ```
  assets/[name].[hash].js → app.a1b2c3d4.js
  ```

### 3. **Cleanup**
- ✅ Removed 5 backup files (.bak, .backup)
- ✅ Removed 4 duplicate server files
- ✅ Added comprehensive .gitignore

### 4. **Git Structure**
- ✅ Single repository dengan backend + frontend
- ✅ Dual remotes untuk deployment flexibility

---

## 📦 Deploy ke VPS

### Option 1: Push Backend Only
```bash
# Push backend code saja
cd backend
git init
git remote add origin https://github.com/Hawsyi-CEO/tiketbaris-backend.git
git add .
git commit -m "Update backend"
git push -u origin main
```

### Option 2: Push Frontend Only
```bash
# Build dulu
cd frontend
npm run build

# Push frontend (atau upload dist/ saja)
git init
git remote add origin https://github.com/Hawsyi-CEO/tiketbaris-frontend.git
git add .
git commit -m "Update frontend"
git push -u origin main
```

### Option 3: Manual Upload (Recommended for Quick Deploy)
```bash
# Build frontend
cd frontend
npm run build

# Upload ke VPS via SCP
scp -r dist/* root@72.61.140.193:/var/www/tiketbaris/frontend/
scp -r ../backend/* root@72.61.140.193:/var/www/tiketbaris/backend/

# Restart services di VPS
ssh root@72.61.140.193
pm2 restart tiketbaris-backend
nginx -s reload
```

---

## 🧪 Testing Locally

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend  
cd frontend
npm run dev

# Access: http://localhost:3000
# Backend: http://localhost:5000
```

**Environment Detection:**
- `localhost:3000` → hits `localhost:5000/api` ✅
- `tiketbaris.id` → hits `tiketbaris.id/api` ✅

---

## ✅ Verification Checklist

After deployment:
- [ ] Clear browser cache (Ctrl+Shift+Del)
- [ ] Test di browser: https://tiketbaris.id
- [ ] Check console for API errors
- [ ] Test login/register
- [ ] Test event creation
- [ ] Test payment flow
- [ ] Check di device lain (mobile)

---

## 🔧 Troubleshooting

### "Perubahan tidak terlihat"
1. Hard refresh: `Ctrl + Shift + R` (Chrome) atau `Cmd + Shift + R` (Mac)
2. Clear browser cache completely
3. Check file hash changed di Network tab (DevTools)
4. Verify file uploaded ke VPS dengan timestamp terbaru

### API Connection Error
1. Check [config/api.js](frontend/src/config/api.js#L6) environment detection
2. Verify backend running di VPS: `pm2 status`
3. Check Nginx config: `nginx -t`

---

## 📝 Git Workflow (Future Updates)

```bash
# Make changes
git add .
git commit -m "fix: your changes"

# Push ke GitHub
git push backend main    # Push to backend repo
# or
git push frontend main   # Push to frontend repo

# Deploy to VPS (manual for now)
# ... SCP or Git pull on VPS
```

---

## 🎯 Summary

**Fixed Issues:**
1. ✅ Cache busting → No more "old file" problem
2. ✅ Environment detection → Works on localhost & production
3. ✅ Unified config → No more confusion
4. ✅ Clean codebase → No duplicate/backup files

**Next Steps:**
- Deploy ke VPS
- Test di production
- Setup automated deployment (optional)
