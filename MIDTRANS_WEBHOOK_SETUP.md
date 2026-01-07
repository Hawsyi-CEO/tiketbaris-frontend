# 🔔 MIDTRANS WEBHOOK CONFIGURATION

## ⚠️ **PENTING - HARUS UPDATE DI DASHBOARD MIDTRANS!**

Setelah deploy ke VPS, **WAJIB** update webhook URL di Midtrans dashboard:

---

## 📝 **Langkah Update Webhook**

### 1️⃣ **Login Midtrans Dashboard Production**
```
URL: https://dashboard.midtrans.com/
Email: [your_email]
Password: [your_password]
```

### 2️⃣ **Go to Settings**
- Klik **Settings** (gear icon di sidebar)
- Pilih **Configuration**
- Scroll ke bagian **Notification URL**

### 3️⃣ **Set Webhook URL**
```
Payment Notification URL:
https://tiketbaris.id/api/midtrans/webhook
```

**Method:** POST  
**Format:** JSON

### 4️⃣ **Enable Notifications**
Centang/Enable semua notification events:
- ✅ Payment Success
- ✅ Payment Pending  
- ✅ Payment Expire
- ✅ Payment Deny
- ✅ Payment Cancel
- ✅ Payment Refund

### 5️⃣ **Test Webhook**

Di dashboard Midtrans ada fitur **Test Notification**:
1. Pilih salah satu transaction
2. Klik "Send Notification"
3. Check backend logs: `pm2 logs tiketbaris-backend`
4. Harus muncul: `[WEBHOOK] Notification received`

---

## 🔍 **Verify Webhook Working**

### Check dari Backend Logs:
```bash
ssh root@72.61.140.193
pm2 logs tiketbaris-backend

# Setelah ada payment, harus muncul:
[WEBHOOK] Notification received: ORDER-123
[WEBHOOK] Transaction status: settlement
[WEBHOOK] ✅ Tiket created successfully
```

### Manual Test (dari local):
```bash
curl -X POST https://tiketbaris.id/api/midtrans/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_status": "settlement",
    "order_id": "TEST-WEBHOOK-123",
    "gross_amount": "10000"
  }'
```

---

## ⚡ **Production Webhook URL Summary**

| Environment | Webhook URL |
|------------|-------------|
| **Production** | `https://tiketbaris.id/api/midtrans/webhook` |
| VPS IP Fallback | `http://72.61.140.193/api/midtrans/webhook` |
| ~~Localhost~~ | ❌ **TIDAK BISA** (webhook butuh public URL) |

---

## 🔐 **Security**

Webhook endpoint sudah include:
- ✅ Signature verification (Server Key hash)
- ✅ IP whitelist Midtrans (optional)
- ✅ Transaction validation
- ✅ Duplicate check

---

## 🚨 **Troubleshooting**

### Webhook tidak terima notifikasi:

1. **Cek DNS/Domain:**
   ```bash
   nslookup tiketbaris.id
   # Harus return: 72.61.140.193
   ```

2. **Test endpoint manual:**
   ```bash
   curl -I https://tiketbaris.id/api/midtrans/webhook
   # Harus return: 200 OK atau 405 Method Not Allowed
   ```

3. **Cek Midtrans Dashboard:**
   - Settings → Configuration → Notification URL
   - Pastikan URL benar dan saved

4. **Check Backend Logs:**
   ```bash
   pm2 logs tiketbaris-backend --lines 50
   ```

5. **Test dengan real payment:**
   - Beli tiket di production
   - Bayar dengan kartu/bank real
   - Check logs immediately after payment

---

## 📞 **Support Contact**

Jika webhook masih tidak working setelah 10 menit:
1. Check SSL certificate: `curl -I https://tiketbaris.id`
2. Verify Nginx config: `nginx -t`
3. Contact Midtrans support: cs@midtrans.com

---

**✅ REMEMBER:**
Tanpa webhook configuration yang benar, tickets TIDAK akan ter-create otomatis setelah payment!
