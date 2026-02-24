# 🎨 VISUAL INFOGRAPHICS & DIAGRAMS

## 1. ALUR UANG (Money Flow Diagram)

```
PEMBELI AKHIR
    │
    ↓ Bayar Rp 100.000
    │
SISTEM PEMBAYARAN
(Midtrans)
    │
    ├─→ Midtrans Fee (2%) = Rp 2.000 ❌ (Pergi ke Midtrans)
    │
    ↓ Rp 98.000 masuk ke Platform
    │
    ├─→ Platform Fee (1.5%) = Rp 1.500 ✓ (Masuk ke Anda)
    │
    ↓ Rp 96.500
    │
ORGANIZER/EVENT OWNER
    └─ Dapat: Rp 96.500 ✓✓

RINGKAS:
Pembeli: Rp 100.000 (Keluar dari kantong)
├─ Midtrans: Rp 2.000 (Wajib, tidak negotiable)
├─ Anda: Rp 1.500 (Fee platform Anda)
└─ Organizer: Rp 96.500 (Mereka dapat)
```

---

## 2. PERBANDINGAN METODE PEMBAYARAN

### Visual Bar Chart Format:

```
BIAYA PER TIKET (Rp 100.000)

GoPay          ▓▓▓░░░░░░░  3.5%  (TERMURAH ✓)
ShopeePay      ▓▓▓░░░░░░░  3.5%
DANA           ▓▓░░░░░░░░  3.0%
Akulaku        ▓▓▓░░░░░░░  3.4%
Kredivo        ▓▓▓░░░░░░░  3.7%
Bank Transfer  ▓▓▓▓▓▓▓░░░  7.0%
Minimarket     ▓▓▓▓▓▓▓░░░  7.0%
Kartu Kredit   ▓▓▓▓▓▓▓░░░  7.4%  (TERMAHAL)

UANG KE ORGANIZER:

GoPay          ███████████ Rp 96.500  ← LEBIH BANYAK
Kartu Kredit   ██████████░ Rp 92.600  ← LEBIH SEDIKIT

HEMAT HINGGA: Rp 3.900 PER TIKET dengan GoPay!
```

---

## 3. KOMPOSISI BIAYA (Pie Chart Style)

### Untuk Transaksi GoPay:

```
        ┌──────────────────────┐
        │   TOTAL: 3.5%        │
        └──────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
    ┌─────────┐       ┌──────────┐
    │ Midtrans│       │ Platform │
    │   2%    │       │   1.5%   │
    │ WAJIB   │       │ (Kami)   │
    └─────────┘       └──────────┘


BREAKDOWN DETAIL (Rp 100.000):

    Harga Tiket
    │
    ├── Rp 2.000 → Midtrans (Payment Processing)
    │             • Fraud detection
    │             • Payment security
    │             • Settlement
    │
    ├── Rp 1.500 → Platform (Kami)
    │             • Server & Infrastructure
    │             • Support 24/7
    │             • Feature Development
    │             • Keamanan Data
    │
    └── Rp 96.500 → Organizer ✓
                   (96.5% dari nominal)
```

---

## 4. CUSTOMER DECISION TREE

```
PEMBELI: "Mau beli tiket, pilih metode pembayaran apa?"

                    PILIH METODE
                        │
        ┌───────────────┼───────────────┐
        │               │               │
    WALLET?         BANK?           CICILAN?
        │               │               │
        ├─ GoPay    Transfer Bank    Akulaku
        ├─ ShopeePay                 Kredivo
        └─ DANA

PERTIMBANGAN:

GoPay ← PILIH INI! (Paling murah 3.5%)
    ✓ Cepat instant
    ✓ Biaya rendah
    ✓ Sudah punya? Langsung bayar
    └ Bonus: Poin GoPay!

Transfer Bank (7%)
    ○ Prosesnya 1-2 hari kerja
    ○ Lebih mahal
    ○ Ribet di rekap laporan

Kartu Kredit (7.4%)
    ○ Paling mahal!
    ○ Ada risiko chargeback
    ○ Biaya tertinggi
    └ Hanya gunakan jika terpaksa

→ REKOMENDASI: Gunakan GoPay & hemat Rp 3.500 per tiket!
```

---

## 5. ORGANISASI vs PLATFORM vs PEMBELI (Triangle Model)

```
                 PEMBELI
                    △
                   /│\
                  / │ \
        Rp 103.5K/  │  \
                /   │   \
               /    │    \
              /     │     \
             /      │      \
            /       │       \
    PLATFORM ◁─────┼─────▶ ORGANIZER
    (Kami)   \     │     /    (Event Owner)
      1.5K    \    │    /   Rp 96.500
               \   │   /
                \  │  /
              Rp 2K │
               (Midtrans)

HUBUNGAN:
• Pembeli ↔ Platform: Lihat breakdown biaya
• Pembeli ↔ Organizer: Tahu harga tiket jelas
• Platform ↔ Organizer: Transparent commission
• Semua pihak PUAS → Sustainable Business ✓
```

---

## 6. TIMELINE PEMBAYARAN & SETTLEMENT

```
HARI 1: Pembeli Bayar
├─ 10:00 AM: Pembeli klik "Bayar" → Pilih GoPay
├─ 10:02 AM: Transaksi berhasil, tiket langsung deliver
└─ Status: PAID

HARI 1: System Kami Memproses
├─ Midtrans fee dipotong
├─ Platform fee diakumulasi
└─ Status: PROCESSING

HARI 2: Dana Settlement ke Organizer
├─ 09:00 AM: Dana dikirim ke rekening organizer
├─ Jumlah: Total penjualan - semua fee
└─ Status: COMPLETED ✓

Dashboard Timeline:
────────────────────────────────────────────
│ Jan 1 │ Jan 2 │ Jan 3 │ Jan 4 │ Jan 5 │
├─ PAID ├─ PROC ├─ SETTLEMENT DONE ─┤
│ 10 tx │ 15 tx │      → Rp 24.5 juta
└────────────────────────────────────────────

Rata-rata settlement: T+1 hari kerja
```

---

## 7. COMPETITIVE LANDSCAPE (Positioning)

```
POSITIONING MATRIX:

                 TRANSPARANSI
                     △
                     │ 100%
                     │     ┌─── KAMI ⭐
                  80%│    ◇ Tix ID
                     │   ◇  Loket
                  60%│   ◇
                     │
                  40%├────────────── Ticketmaster
                     │           ◇ ◇ EVENT Brite
                  20%│        ◇
                     │
                  0% └──────────┬────────────────▶
                      2%      4%      6%      8%
                            KOMISI

POSITIONING KAMI:
• Transparansi TERTINGGI (100%)
• Komisi COMPETITIVE (3.5-7% sesuai metode)
• No hidden fee
• Real-time dashboard
• Support lokal


UNIQUE VALUE PROPOSITION:
"Yang pertama dan satu-satunya platform ticketing
dengan transparansi 100% dan komisi fair
untuk semua stakeholder"
```

---

## 8. ORGANIZER REVENUE CALCULATOR

```
EVENT ANDA:
┌─ Judul: Konser Musik
├─ Tanggal: 1 Maret 2026
├─ Harga Tiket: Rp 500.000
├─ Kapasitas: 1000 tiket
└─ Target Penjualan: 500 tiket

ESTIMASI REVENUE:

Total Penjualan:
500 tiket × Rp 500.000 = Rp 250.000.000
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
              60% GoPay        20% CC          20% Bank
              (3.5%)          (7.4%)           (7%)
                 │               │               │
         Rp 150M × 3.5%   Rp 50M × 7.4%   Rp 50M × 7%
         = Rp 5.25M fee   = Rp 3.7M fee   = Rp 3.5M fee
                 │               │               │
                 └───────────────┬───────────────┘
                                 │
                    Total Fee: Rp 12.45M (5%)
                                 │
                    NET REVENUE: Rp 237.55M (95%)
                    
💰 UANG KE AKUN ANDA: Rp 237.550.000
   (Profit Rp 237.5 juta untuk event)


MONTHLY PROJECTION:
Jika 50 event/bulan dengan rata-rata 500 tiket:
= 25.000 tiket/bulan
= Rp 12.5 miliar volume transaksi
= Organizer dapat: Rp 11.875 miliar (95%)
= Anda dapat: Rp 625 juta (5%)
```

---

## 9. TRUST BADGES & CERTIFICATION

```
┌──────────────────────────────────────┐
│    ✓ 100% TRANSPARENT PRICING        │
│    • Breakdown biaya terlihat jelas   │
│    • No hidden fee                    │
│    • Real-time dashboard analytics    │
│    • Sertifikat dari Midtrans        │
│    • PCI DSS compliant                │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│    ✓ SECURE PAYMENT PROCESSING       │
│    • Enkripsi SSL 256-bit             │
│    • Fraud detection 24/7             │
│    • Certified by Midtrans            │
│    • Money-back guarantee             │
│    • Support 24/7                     │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│    ✓ ORGANIZER-FRIENDLY              │
│    • Real-time settlement (T+1)       │
│    • No minimum transaction           │
│    • Instant withdrawal               │
│    • Dedicated account manager        │
│    • Free training & onboarding       │
└──────────────────────────────────────┘
```

---

## 10. TESTIMONIAL FORMAT

```
⭐⭐⭐⭐⭐ (5 STARS)

"Pertama kali berjualan tiket, langsung paham
karena sistem mereka transparan. Tahu persis
berapa komisi Midtrans, berapa komisi mereka.
Tidak ada biaya tersembunyi."

— Budi, Event Organizer
  250 tiket @ Rp 100.000 = Rp 24.5M net


⭐⭐⭐⭐⭐ (5 STARS)

"Support mereka super helpful. Pas ada masalah
dengan pembayaran, langsung dibantu dalam
hitungan menit. Ini yang jadi beda dengan
platform lain."

— Dina, Community Events
  5000 tiket @ Rp 150.000 = Rp 712.5M net


⭐⭐⭐⭐⭐ (5 STARS)

"Pembeli saya bertanya kenapa ada biaya
tambahan. Saya tunjukkan breakdown dari
dashboard. Mereka langsung paham dan
bahkan puas karena transparan."

— Roni, Concert Organizer
  500 tiket @ Rp 500.000 = Rp 237.5M net
```

---

**File ini untuk:** Marketing materials, website, presentation deck
**Format:** Bisa di-convert ke Figma, Canva, atau PowerPoint
**Update:** Kapan saja ada perubahan pricing/strategy
