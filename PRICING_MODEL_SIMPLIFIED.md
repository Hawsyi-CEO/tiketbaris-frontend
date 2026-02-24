# 💰 MODEL PRICING SIMPLIFIED: FLAT 2% COMMISSION

## 📌 RINGKASAN SINGKAT

**Platform kami menggunakan model pricing yang SANGAT SIMPLE dan FAIR:**

```
┌─────────────────────────────────────────────────────┐
│      PLATFORM KOMISI = FLAT 2% UNTUK SEMUA PANITIA  │
│     (Tidak peduli metode pembayaran atau harga)     │
└─────────────────────────────────────────────────────┘
```

---

## 🎯 RUMUS PERHITUNGAN

### Formula Dasar:

```
GROSS AMOUNT (Harga Tiket)
    ├─ Biaya Midtrans (varies per payment method)
    ├─ Komisi Platform = 2% FLAT
    │  └─ Contoh: Rp 100.000 × 2% = Rp 2.000
    └─ NET AMOUNT (ke Panitia) = Gross - (Midtrans Fee + Platform 2%)
```

### Contoh Perhitungan:

**Scenario 1: Pembeli pilih GoPay (Rp 100.000)**
```
Harga Tiket          : Rp 100.000 (gross)
├─ Biaya Midtrans   : Rp 2.000 (2%)
├─ Komisi Platform  : Rp 2.000 (2%) ← SELALU 2%
│
Total Potongan      : Rp 4.000 (4%)
Uang ke Panitia     : Rp 96.000 ✓
```

**Scenario 2: Pembeli pilih DANA (Rp 100.000)**
```
Harga Tiket          : Rp 100.000 (gross)
├─ Biaya Midtrans   : Rp 1.500 (1.5%)
├─ Komisi Platform  : Rp 2.000 (2%) ← SELALU 2%
│
Total Potongan      : Rp 3.500 (3.5%)
Uang ke Panitia     : Rp 96.500 ✓
```

**Scenario 3: Pembeli pilih Transfer Bank (Rp 100.000)**
```
Harga Tiket          : Rp 100.000 (gross)
├─ Biaya Midtrans   : Rp 4.000 (fixed)
├─ Komisi Platform  : Rp 2.000 (2%) ← SELALU 2%
│
Total Potongan      : Rp 6.000 (6%)
Uang ke Panitia     : Rp 94.000 ✓
```

---

## 💡 KEUNTUNGAN MODEL INI

### Untuk Panitia (Event Organizer):
✅ **Transparan** - Tahu persis berapa komisi kami (2%)  
✅ **Konsisten** - Semua panitia membayar komisi yang sama  
✅ **Adil** - Tidak ada perlakuan khusus  
✅ **Mudah dihitung** - Cukup kalikan harga × 2%  

### Untuk Platform:
✅ **Fair income** - Komisi stabil dan predictable  
✅ **Simple operations** - Tidak perlu logic berbeda per metode  
✅ **Easy to explain** - Mudah dipahami oleh semua stakeholder  
✅ **Trust building** - Panitia percaya tidak ada biaya tersembunyi  

### Untuk Pembeli (Customer):
✅ **Flexibility** - Bisa pilih metode pembayaran tanpa komisi berbeda  
✅ **Transparency** - Tahu semua biaya sebelum bayar  
✅ **Predictability** - Tidak ada surprise charge  

---

## 📊 PERBANDINGAN FEE DI SETIAP METODE

| Metode | Midtrans | Platform | Total Fee | Dari 100k |
|--------|----------|----------|-----------|----------|
| GoPay | 2% | 2% | 4% | Rp96.000 |
| ShopeePay | 2% | 2% | 4% | Rp96.000 |
| DANA | 1.5% | 2% | 3.5% | Rp96.500 |
| Akulaku | 1.7% | 2% | 3.7% | Rp96.300 |
| Kredivo | 2% | 2% | 4% | Rp96.000 |
| Bank Transfer | Rp4k | 2% | ~6% | Rp94.000 |
| Minimarket | Rp5k | 2% | ~7% | Rp93.000 |
| Kartu Kredit | 2.9%+Rp2k | 2% | ~6.9% | Rp93.100 |

**Catatan:** Platform komisi SELALU Rp 2.000 (dari Rp 100.000) = 2% FLAT

---

## 🔧 IMPLEMENTASI DI BACKEND

### PricingService Implementation

```javascript
class PricingService {
  static calculateFees(grossAmount, paymentMethod) {
    // 1. Hitung Midtrans fee (varies per payment method)
    const midtransFee = this.getMidtransFee(grossAmount, paymentMethod);
    
    // 2. Hitung platform fee = 2% FLAT
    const platformFee = Math.floor(grossAmount * 0.02);
    
    // 3. Total potongan
    const totalFee = midtransFee + platformFee;
    
    // 4. Uang ke panitia
    const netAmount = grossAmount - totalFee;
    
    return {
      grossAmount,
      paymentMethod,
      midtransFee,
      platformFee,        // ALWAYS 2%
      totalFee,
      netAmount,
      feePercentage: {
        midtrans: this.getMidtransFeePercentage(paymentMethod),
        platform: '2%',   // ALWAYS 2%
        total: `${((totalFee/grossAmount)*100).toFixed(2)}%`
      }
    };
  }

  static getMidtransFee(amount, method) {
    // Non-negotiable Midtrans fees (dari Midtrans)
    switch(method) {
      case 'gopay':
      case 'shopeepay':
      case 'kredivo':
        return Math.floor(amount * 0.02);
      case 'dana':
      case 'akulaku':
        return Math.floor(amount * 0.015);
      case 'cc':
        return Math.floor(amount * 0.029) + 2000;
      case 'bank':
        return 4000;
      case 'minimarket':
        return 5000;
      default:
        return 0;
    }
  }
}
```

---

## 📊 TESTING FORMULA

### Test Case 1: GoPay 100k
```
Input: { amount: 100000, method: 'gopay' }

Expected Output:
{
  grossAmount: 100000,
  midtransFee: 2000,      // 2%
  platformFee: 2000,      // 2% FLAT ← ini yang penting
  totalFee: 4000,
  netAmount: 96000
}
```

### Test Case 2: DANA 100k
```
Input: { amount: 100000, method: 'dana' }

Expected Output:
{
  grossAmount: 100000,
  midtransFee: 1500,      // 1.5%
  platformFee: 2000,      // 2% FLAT ← selalu sama
  totalFee: 3500,
  netAmount: 96500
}
```

### Test Case 3: Kartu Kredit 100k
```
Input: { amount: 100000, method: 'cc' }

Expected Output:
{
  grossAmount: 100000,
  midtransFee: 4900,      // 2.9% + 2000
  platformFee: 2000,      // 2% FLAT ← always 2k
  totalFee: 6900,
  netAmount: 93100
}
```

---

## 💬 KOMUNIKASI KE PANITIA

### Email/In-App Message:

```
Halo [Nama Panitia],

Kami ingin memperjelas struktur komisi platform kami yang SIMPLE dan FAIR:

🎯 KOMISI PLATFORM = 2% FLAT untuk setiap pembelian tiket

Ini berarti:
- Tidak peduli harga tiketnya berapa
- Tidak peduli metode pembayaran yang dipilih pembeli
- Komisi kami selalu 2% dari nominal tiket

Contoh:
✓ Tiket Rp 50.000 → Platform komisi Rp 1.000 (2%)
✓ Tiket Rp 100.000 → Platform komisi Rp 2.000 (2%)
✓ Tiket Rp 500.000 → Platform komisi Rp 10.000 (2%)

Biaya lain yang ada adalah biaya Midtrans (payment gateway) yang TIDAK BISA kami 
kurangi karena mereka adalah pihak ketiga.

Semua breakdown akan terlihat jelas saat pembeli checkout.

Terima kasih!
```

---

## ✅ IMPLEMENTATION CHECKLIST

### Backend
- [ ] Implementasi PricingService dengan flat 2% logic
- [ ] Update checkout.js untuk mencatat platform fee sebesar 2%
- [ ] Update API endpoint /api/pricing/calculate
- [ ] Test dengan berbagai amount dan payment method
- [ ] Verify platform fee selalu 2% regardless of method

### Frontend
- [ ] Update CheckoutPageResponsive untuk display 2% platform fee
- [ ] Update PaymentInfo component untuk show breakdown
- [ ] Test responsive design
- [ ] Verify fee calculation display

### Database
- [ ] Add platform_fee_amount column ke transactions
- [ ] Ensure platform_fee_amount always = 2% dari gross

### Documentation
- [ ] Update DAFTAR_HARGA_DAN_KETENTUAN_PANITIA.md ✅
- [ ] Update SYSTEM_UPDATE_CHECKLIST.md ✅
- [ ] Update API documentation
- [ ] Send email ke semua panitia tentang policy ini

---

## 🎓 FAQ: PERTANYAAN PANITIA

**Q: Apakah komisi 2% ini setiap transaksi?**  
A: Ya, setiap pembelian tiket pasti ada komisi 2% untuk platform.

**Q: Bagaimana kalau pembeli pakai Bank Transfer, apakah komisi lebih mahal?**  
A: Komisi platform tetap 2%. Yang berbeda adalah biaya Midtrans (Rp4k fixed untuk bank). 
Itu biaya payment gateway yang tidak bisa kami kurangi.

**Q: Bisa negosiasi komisi lebih rendah?**  
A: Untuk saat ini, 2% adalah rate standard kami untuk semua panitia. Ini untuk fairness 
dan konsistensi.

**Q: Mengapa harus ada komisi platform?**  
A: Komisi itu untuk:
- Maintenance server & infrastruktur
- Customer support 24/7
- Payment gateway integration
- Security & fraud prevention
- Fitur-fitur baru yang terus dikembangkan

---

**Model Pricing ini efektif mulai: 1 Maret 2026**  
**Questions? Email support@tiketbaris.com**
