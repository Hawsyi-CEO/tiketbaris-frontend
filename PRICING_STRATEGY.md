# 📊 STRATEGI PRICING & KOMISI TIKET

## 1. STRUKTUR BIAYA MIDTRANS (Per Transaksi)

### Payment Methods & Fee Structure
```
┌─────────────────────┬──────────────────────────────┐
│ Payment Method      │ Fee/Charge                   │
├─────────────────────┼──────────────────────────────┤
│ Transfer Bank       │ Rp 4.000 (Fixed)             │
│ GoPay              │ 2% (dari total)              │
│ ShopeePay          │ 2% (dari total)              │
│ DANA               │ 1.5% (dari total)            │
│ Kartu Kredit       │ 2.9% + Rp 2.000 (Fixed)     │
│ Minimarket         │ Rp 5.000 (Fixed)             │
│ Akulaku            │ 1.7% (dari total)            │
│ Kredivo            │ 2% (dari total)              │
└─────────────────────┴──────────────────────────────┘
```

---

## 2. CONTOH PERHITUNGAN PER PAYMENT METHOD

### A. E-Wallet (GoPay/ShopeePay) - 2%
```
Harga Tiket                     : Rp 100.000
Fee Midtrans (2%)              : Rp 2.000
─────────────────────────────────────────
Uang Masuk ke Akun             : Rp 98.000
```

**Jika User ambil komisi 2%:**
```
Uang ke Organizer (100.000 - 2.000 - 2.000) : Rp 96.000
Komisi User (2% + Midtrans)    : Rp 4.000
```

---

### B. Transfer Bank - Rp 4.000 Fixed
```
Harga Tiket                     : Rp 100.000
Fee Midtrans (Fixed)            : Rp 4.000
─────────────────────────────────────────
Uang Masuk ke Akun             : Rp 96.000
```

**Jika User ambil komisi 2%:**
```
Komisi User (2% dari 100.000)  : Rp 2.000
─────────────────────────────────────────
Uang ke Organizer (100.000 - 4.000 - 2.000) : Rp 94.000
Total Potongan                 : Rp 6.000 (6%)
```

---

### C. Kartu Kredit - 2.9% + Rp 2.000
```
Harga Tiket                     : Rp 100.000
Fee Midtrans (2.9% + 2.000)    : Rp 4.900
─────────────────────────────────────────
Uang Masuk ke Akun             : Rp 95.100
```

**Jika User ambil komisi 2%:**
```
Komisi User (2% dari 100.000)  : Rp 2.000
─────────────────────────────────────────
Uang ke Organizer (100.000 - 4.900 - 2.000) : Rp 93.100
Total Potongan                 : Rp 6.900 (6.9%)
```

---

## 3. ANALISIS MARGIN DAN REKOMENDASI HARGA

### Opsi 1: Fixed 2% Komisi (Paling Sederhana)
```
Breakdown untuk Tiket Rp 100.000:
├─ Midtrans Fee (Bervariasi)     : Rp 2.000 - Rp 4.900
├─ Komisi User (2% Fixed)        : Rp 2.000
├─ Ke Organizer                  : Rp 93.100 - Rp 96.000
└─ Total Potongan                : 4% - 6.9%

✅ Pro: Sederhana, mudah dijelaskan
❌ Kontra: Tidak seimbang untuk semua metode pembayaran
```

### Opsi 2: Dynamic Fee (Berdasarkan Payment Method) - RECOMMENDED ⭐
```
GoPay/ShopeePay (2% Midtrans):
  └─ Komisi User: 1.5% + Rp 500
  └─ Total: 3.5% + Rp 500

Transfer Bank (Rp 4.000 Midtrans):
  └─ Komisi User: 2% + Rp 1.000
  └─ Total: 2% + Rp 5.000

Kartu Kredit (2.9% + Rp 2.000):
  └─ Komisi User: 1.5% + Rp 1.000
  └─ Total: 4.4% + Rp 3.000

E-Wallet lainnya (1.5-2%):
  └─ Komisi User: 1.5% + Rp 500
  └─ Total: 3% - 3.5% + Rp 500

Convenience Store (Rp 5.000):
  └─ Komisi User: 1% + Rp 2.000
  └─ Total: 1% + Rp 7.000

✅ Pro: Fair untuk semua pihak, transparansi lebih baik
❌ Kontra: Sedikit kompleks, perlu interface yang baik
```

### Opsi 3: Margin-Based (Persentase Konsisten)
```
Total Margin Target: 4%

Untuk masing-masing payment method:
  Total Potongan = Midtrans Fee + User Komisi = ±4%

GoPay (2%):
  └─ User Komisi: 2%
  └─ Total: 4%

Bank Transfer (Rp 4.000):
  └─ User Komisi: 4.000 + 2% = ~4%

Kartu Kredit (2.9% + 2.000):
  └─ User Komisi: 1.5% + Rp 1.000 = ~4%

✅ Pro: Konsisten untuk customer, fair untuk semua metode
❌ Kontra: Perlu kalkulasi per transaksi
```

---

## 4. TABEL REKOMENDASI PRICING (Opsi 2 - RECOMMENDED)

### untuk Tiket Rp 100.000

```
┌────────────────────┬──────────────┬──────────────┬───────────────┬─────────────┐
│ Payment Method     │ Midtrans Fee │ User Komisi  │ Ke Organizer  │ Total Cut   │
├────────────────────┼──────────────┼──────────────┼───────────────┼─────────────┤
│ GoPay              │ Rp 2.000     │ Rp 1.500     │ Rp 96.500     │ 3.5%        │
│ ShopeePay          │ Rp 2.000     │ Rp 1.500     │ Rp 96.500     │ 3.5%        │
│ DANA               │ Rp 1.500     │ Rp 1.500     │ Rp 97.000     │ 3%          │
│ Transfer Bank      │ Rp 4.000     │ Rp 3.000     │ Rp 93.000     │ 7%          │
│ Kartu Kredit       │ Rp 4.900     │ Rp 2.500     │ Rp 92.600     │ 7.4%        │
│ Minimarket         │ Rp 5.000     │ Rp 2.000     │ Rp 93.000     │ 7%          │
│ Akulaku            │ Rp 1.700     │ Rp 1.700     │ Rp 96.600     │ 3.4%        │
│ Kredivo            │ Rp 2.000     │ Rp 1.700     │ Rp 96.300     │ 3.7%        │
└────────────────────┴──────────────┴──────────────┴───────────────┴─────────────┘
```

---

## 5. CARA MENJELASKAN KE CUSTOMER

### ✅ TEMPLATE PENJELASAN (Transparent & Jelas)

```markdown
## 💰 Cara Kerja Potongan Tiket di Platform Kami

Setiap penjualan tiket melalui platform kami memiliki dua biaya:

### 1️⃣ Biaya Gerbang Pembayaran (Midtrans)
Ini adalah biaya yang dipotong **langsung oleh Midtrans** saat customer membayar.
Besarnya tergantung metode pembayaran yang dipilih customer.

### 2️⃣ Biaya Layanan Platform (Kami)
Ini adalah biaya untuk menjaga dan mengelola platform, support organizer, dll.

### 📊 DETAIL POTONGAN PER METODE PEMBAYARAN

| Metode Pembayaran | Biaya Midtrans | Biaya Platform | Total Potongan | Uang Masuk |
|---|---|---|---|---|
| 💚 GoPay | 2% | 1.5% | 3.5% | 96.5% |
| 🧡 ShopeePay | 2% | 1.5% | 3.5% | 96.5% |
| 🔵 DANA | 1.5% | 1.5% | 3% | 97% |
| 🏦 Transfer Bank | Rp 4.000 | Rp 3.000 | Rp 7.000 | *Lihat contoh |
| 💳 Kartu Kredit | 2.9% + Rp 2.000 | 2.5% | ~7.4% | ~92.6% |
| 🏪 Minimarket | Rp 5.000 | Rp 2.000 | Rp 7.000 | *Lihat contoh |
| 🛍️ Akulaku | 1.7% | 1.7% | 3.4% | 96.6% |
| 🎁 Kredivo | 2% | 1.7% | 3.7% | 96.3% |

### 💡 CONTOH PERHITUNGAN

**Jika Anda jual 100 tiket @ Rp 100.000 via GoPay:**

```
Total Penjualan             : Rp 10.000.000
└─ Biaya Midtrans (2%)      : Rp 200.000
└─ Biaya Platform (1.5%)    : Rp 150.000
────────────────────────────
Uang Masuk Ke Akun Anda     : Rp 9.650.000

Rata-rata potongan per tiket: Rp 3.500 (dari Rp 100.000)
```

**Jika Anda jual via Transfer Bank:**

```
Total Penjualan             : Rp 10.000.000
└─ Biaya Midtrans (Fixed)   : Rp 400.000 (Rp 4.000 × 100 tiket)
└─ Biaya Platform (Fixed)   : Rp 300.000 (Rp 3.000 × 100 tiket)
────────────────────────────
Uang Masuk Ke Akun Anda     : Rp 9.300.000

Rata-rata potongan per tiket: Rp 7.000 (dari Rp 100.000)
```

### ⚠️ PENTING DIKETAHUI

1. **Biaya Midtrans** adalah biaya yang WAJIB dan tidak bisa dinegosiasikan
   - Ini biaya resmi dari payment gateway Midtrans
   - Berbeda untuk setiap metode pembayaran
   - Tidak ada komisi tersembunyi

2. **Biaya Platform** adalah untuk:
   - Maintenance server & keamanan data
   - Customer support 24/7
   - Fitur-fitur premium (analytics, QR code, dll)
   - Development & improvement berkelanjutan

3. **Kenapa beda-beda?**
   - E-Wallet (GoPay, ShopeePay) → Lebih murah karena proses cepat
   - Transfer Bank → Lebih mahal karena proses manual/admin
   - Kartu Kredit → Biaya tinggi karena risiko chargeback
   - Minimarket → Biaya tinggi karena proses verifikasi lama

### ✅ Tips Maksimalkan Profit

1. **Promosikan metode pembayaran murah**
   - Gunakan GoPay/ShopeePay → Total potongan hanya 3.5%
   - Buat kampanye "Bayar pake GoPay dapat diskon"

2. **Sesuaikan harga**
   - Harga dasar bisa disamakan untuk semua metode
   - Platform sudah transparansi untuk customer

3. **Bulk Discount**
   - Jika organizer beli banyak tiket per batch, bisa kurangi potongan
   - Contoh: 10%+ penjualan → potongan turun jadi 2.5%

4. **Monitor Dashboard**
   - Lihat metode pembayaran paling populer
   - Optimalkan pricing berdasarkan preferensi customer
```

---

## 6. INTERFACE YANG DISARANKAN (Untuk Transparansi)

### A. Saat Organizer Setup Event
```
┌─────────────────────────────────────────┐
│  💰 KALKULASI BIAYA PENJUALAN TIKET      │
├─────────────────────────────────────────┤
│                                          │
│  Harga Tiket yang Anda Tetapkan:        │
│  ┌────────────────────────────────────┐ │
│  │ Rp 100.000                     [📝] │ │
│  └────────────────────────────────────┘ │
│                                          │
│  Estimasi Penjualan:                    │
│  ┌────────────────────────────────────┐ │
│  │ 100 tiket                      [📝] │ │
│  └────────────────────────────────────┘ │
│                                          │
├─────────────────────────────────────────┤
│  📊 PROYEKSI PENDAPATAN                 │
├─────────────────────────────────────────┤
│                                          │
│  GoPay/ShopeePay (Potongan 3.5%):       │
│  💰 Rp 9.650.000 (dari Rp 10.000.000)  │
│  💸 Potongan: Rp 350.000                │
│                                          │
│  Transfer Bank (Potongan 7%):           │
│  💰 Rp 9.300.000 (dari Rp 10.000.000)  │
│  💸 Potongan: Rp 700.000                │
│                                          │
│  Kartu Kredit (Potongan 7.4%):          │
│  💰 Rp 9.260.000 (dari Rp 10.000.000)  │
│  💸 Potongan: Rp 740.000                │
│                                          │
├─────────────────────────────────────────┤
│  ℹ️  Potongan termasuk:                 │
│  • Biaya Midtrans (payment gateway)     │
│  • Biaya Platform (maintenance, support)│
│                                          │
│  ✅ Terima   ❌ Ubah Harga              │
└─────────────────────────────────────────┘
```

### B. Saat Customer Checkout
```
┌─────────────────────────────────────────┐
│  🎟️ RINGKASAN PEMBAYARAN TIKET          │
├─────────────────────────────────────────┤
│                                          │
│  Event: Konser Musik Besar              │
│  Jumlah: 2 tiket                        │
│  Harga Satuan: Rp 100.000               │
│  ────────────────────────────────────   │
│  Harga Tiket: Rp 200.000                │
│                                          │
│  Pilih Metode Pembayaran:               │
│  ○ 💚 GoPay (Total: Rp 207.000) *      │
│  ○ 🧡 ShopeePay (Total: Rp 207.000)    │
│  ○ 🏦 Transfer Bank (Total: Rp 214.000)|
│  ○ 💳 Kartu Kredit (Total: Rp 214.800) │
│  ○ 🏪 Minimarket (Total: Rp 214.000)   │
│                                          │
│  * Pilihan Termurah! Hemat Rp 7.000    │
│                                          │
│  💡 Penjelasan Biaya:                   │
│  "Setiap metode pembayaran punya biaya" │
│  "yang berbeda. GoPay paling murah!"    │
│  [Lihat Detail Biaya ↗]                 │
│                                          │
│  ✅ Lanjut Pembayaran                   │
└─────────────────────────────────────────┘
```

### C. Detail Biaya Pop-up
```
┌──────────────────────────────────┐
│  💰 DETAIL BIAYA PEMBAYARAN       │
├──────────────────────────────────┤
│                                   │
│  Harga Tiket (2×)  Rp 200.000    │
│                                   │
│  GoPay (Total: Rp 207.000)       │
│  ├─ Harga Tiket    Rp 200.000    │
│  ├─ Biaya Midtrans Rp 4.000 (2%) │
│  └─ Biaya Platform Rp 3.000 (1.5%)│
│                                   │
│  Transfer Bank (Total: Rp 214.000)│
│  ├─ Harga Tiket     Rp 200.000   │
│  ├─ Biaya Midtrans  Rp 8.000 (Fixed)│
│  └─ Biaya Platform  Rp 6.000     │
│                                   │
│  📌 Biaya Midtrans:              │
│  Biaya dari payment gateway,     │
│  tidak bisa diubah               │
│                                   │
│  📌 Biaya Platform:              │
│  Untuk maintenance, support,     │
│  dan improvement system          │
│                                   │
│  ✅ Saya Mengerti                │
└──────────────────────────────────┘
```

---

## 7. RINGKASAN REKOMENDASI

### ✅ STRATEGI FINAL (Paling Balanced)

**Komisi User yang Disarankan:**

| Payment Method | User Komisi | Total Potongan | Keseimbangan |
|---|---|---|---|
| GoPay/ShopeePay | 1.5% | 3.5% | ⭐⭐⭐⭐⭐ Optimal |
| DANA | 1.5% | 3% | ⭐⭐⭐⭐⭐ Optimal |
| Kartu Kredit | 2.5% | ~7.4% | ⭐⭐⭐ Wajar |
| Transfer Bank | Rp 3.000 | ~7% | ⭐⭐⭐ Wajar |
| Minimarket | Rp 2.000 | ~7% | ⭐⭐⭐ Wajar |
| Akulaku | 1.7% | 3.4% | ⭐⭐⭐⭐⭐ Optimal |
| Kredivo | 1.7% | 3.7% | ⭐⭐⭐⭐ Baik |

### 💡 Kesimpulan

1. **Transparansi adalah kunci** → Jelaskan breakdown lengkap
2. **E-Wallet lebih murah** → Dorong customer pakai GoPay/ShopeePay
3. **Komisi bervariasi wajar** → Berbeda metode = berbeda overhead
4. **Interface yang baik** → Organizer & customer harus mengerti
5. **Dokumentasi jelas** → Buat FAQ & contoh kalkulasi

---

## 8. FAQ UNTUK CUSTOMER

**Q: Kenapa GoPay lebih murah dari Transfer Bank?**
A: GoPay adalah e-wallet, prosesnya instant dan automated. Transfer bank butuh verifikasi manual, jadi biayanya lebih mahal.

**Q: Apakah Anda ambil keuntungan besar?**
A: Tidak. Komisi kami sama dengan standar industry (1.5-2.5%). Mayoritas biaya berasal dari Midtrans yang wajib dibayar.

**Q: Bisa negosiasi harga?**
A: Untuk organizer besar (>Rp 50juta/bulan), bisa diskusi special rate. Hubungi support.

**Q: Kenapa berbeda dengan platform lain?**
A: Struktur biaya kami transparan 100%. Platform lain mungkin ambil komisi besar tapi sembunyikan detail Midtrans.

---

**Created**: 2026-02-02
**Last Updated**: 2026-02-02
```