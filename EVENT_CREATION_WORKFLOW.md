# 🎪 Event Creation Workflow - Documentation

## Overview
Sistem baru untuk membuat event dengan 3-step wizard yang mencakup persetujuan syarat & ketentuan, pengisian detail event, dan konfirmasi sebelum publikasi.

## Flow Diagram
```
1. S&K Agreement → 2. Event Form → 3. Confirmation → 4. Published (Auto-Active)
```

---

## 📋 Features

### **Step 1: Syarat & Ketentuan**
- **Component**: `TermsAndConditions.jsx`
- **Features**:
  - Scroll detection (harus scroll sampai bawah untuk enable checkbox)
  - Mandatory checkbox agreement
  - Legal binding statement
  - Cancel/Accept buttons
  
- **S&K Content**:
  1. Komisi Platform: 2% dari setiap tiket terjual
  2. Kebijakan Refund & Pembatalan
  3. Tanggung Jawab Panitia
  4. Hak & Kewajiban Platform
  5. Pencairan Dana (Withdrawal)
  6. Privasi & Keamanan Data
  7. Perubahan Syarat & Ketentuan
  8. Hukum yang Berlaku

### **Step 2: Form Detail Event**
- **Component**: `CreateEventForm.jsx`
- **Fields**:
  - Judul Event (min 5 karakter)
  - Deskripsi (min 20 karakter)
  - Kategori (10 kategori tersedia)
  - Tanggal Event (tidak boleh di masa lalu)
  - Lokasi
  - Harga Tiket (min Rp 1.000)
  - Jumlah Tiket (max 1 juta)
  - Upload Gambar (max 5MB, JPG/PNG/GIF)
  
- **Validation**: Client-side validation untuk semua field
- **Preview**: Real-time calculation pendapatan setelah komisi 2%

### **Step 3: Konfirmasi & Publikasi**
- **Component**: `EventConfirmation.jsx`
- **Features**:
  - Preview lengkap event (image + details)
  - Proyeksi pendapatan jika semua tiket terjual:
    - Total penjualan
    - Komisi platform (2%)
    - Net revenue untuk panitia
  - Important notes & warnings
  - Buttons: Back to Edit | Cancel | Publish
  
- **Behavior**: Langsung publish tanpa approval admin

---

## 🗄️ Database Schema

### **New Table: event_agreements**
```sql
CREATE TABLE event_agreements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  event_id INT NOT NULL,
  user_id INT NOT NULL,
  terms_version VARCHAR(20) DEFAULT 'v1.0',
  agreed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### **Modified Table: events**
```sql
ALTER TABLE events 
ADD COLUMN commission_rate DECIMAL(5,2) DEFAULT 2.00,
ADD COLUMN setup_fee_paid TINYINT(1) DEFAULT 0;
```

---

## 🔧 Backend API Changes

### **POST /api/events** (Updated)
**New Parameters**:
- `terms_agreed` (required): Must be 'true'
- `category` (optional): Event category

**Behavior Changes**:
1. Validates terms agreement
2. Creates event with `status: 'active'` (auto-approved)
3. Records agreement in `event_agreements` table with:
   - IP address
   - User agent
   - Timestamp
   - Terms version
4. Uses database transaction for atomicity

**Response**:
```json
{
  "message": "Event berhasil dipublikasikan dan langsung aktif!",
  "eventId": 123,
  "status": "active"
}
```

---

## 📁 New Files Created

### Frontend Components
1. **src/components/TermsAndConditions.jsx**
   - Modal overlay with S&K content
   - Scroll-to-enable mechanism
   - Checkbox validation

2. **src/components/CreateEventForm.jsx**
   - Multi-field form with validation
   - Image upload with preview
   - Real-time commission calculation
   - Progress indicator (step 2/3)

3. **src/components/EventConfirmation.jsx**
   - Event preview
   - Financial summary
   - Final confirmation before publish
   - Progress indicator (step 3/3)

4. **src/pages/panitia/CreateEventWizard.jsx**
   - Main orchestrator component
   - Step management (1→2→3)
   - Data flow between steps
   - API submission logic

### Backend Files
1. **backend/migrations/add_event_agreements_table.sql**
   - SQL migration file

2. **backend/run-migration.js**
   - Node.js script to run migration
   - Error handling for existing columns

### Updates
- **App.jsx**: Updated route to use `CreateEventWizard` instead of `CreateEventPanitia`
- **routes/events.js**: Updated POST endpoint with new workflow
- **config/database.js**: Fixed database name to `u390486773_simtix`

---

## 🚀 Usage

### For Panitia (Event Organizer):
1. Login ke akun panitia
2. Klik "Buat Event Baru" di dashboard
3. **Step 1**: Baca S&K, scroll sampai bawah, centang persetujuan, klik "Saya Setuju"
4. **Step 2**: Isi semua field event, upload gambar, klik "Lanjut ke Konfirmasi"
5. **Step 3**: Review semua data, lihat proyeksi pendapatan, klik "Publikasikan Event"
6. Event langsung aktif dan muncul di homepage

### For Admin:
- Tidak perlu approve event lagi (auto-active)
- Bisa monitor agreements melalui tabel `event_agreements`
- Masih bisa edit/delete event dari dashboard admin jika diperlukan

---

## 💰 Commission System

### Calculation:
- **Gross Revenue**: `price × stock`
- **Platform Commission**: `gross × 2%`
- **Net Revenue (Panitia)**: `gross - commission`

### Example:
```
Harga tiket: Rp 100.000
Jumlah tiket: 500
─────────────────────────
Total penjualan: Rp 50.000.000
Komisi platform (2%): Rp 1.000.000
Pendapatan panitia: Rp 49.000.000
```

### Withdrawal:
- Dana dapat ditarik setelah event selesai
- Komisi sudah dipotong otomatis per transaksi
- Minimal withdrawal: Rp 50.000
- Proses: 3-5 hari kerja

---

## ⚠️ Important Notes

1. **Auto-Approval**: Event langsung aktif tanpa perlu approval admin
2. **Legal Binding**: Setiap event creation tercatat dengan:
   - IP address pembuat
   - User agent (browser)
   - Timestamp agreement
   - Terms version
3. **No Payment Required**: Tidak ada biaya pendaftaran/setup fee
4. **Commission Only**: Platform hanya mengambil 2% dari tiket terjual
5. **One Agreement Per Event**: Setiap buat event harus setuju S&K lagi

---

## 🔐 Security Features

- Terms agreement tracking (IP + User Agent)
- Transaction-based database operations
- File upload validation (size, type)
- Form validation (client + server side)
- Protected routes (authentication required)
- Role-based access (panitia only)

---

## 📊 Monitoring & Analytics

### Track Agreements:
```sql
SELECT 
  ea.id,
  e.title,
  u.username,
  ea.agreed_at,
  ea.ip_address,
  ea.terms_version
FROM event_agreements ea
JOIN events e ON ea.event_id = e.id
JOIN users u ON ea.user_id = u.id
ORDER BY ea.agreed_at DESC;
```

### Track Commission:
```sql
SELECT 
  e.title,
  e.price,
  e.stock - e.stock AS sold,
  (e.price * (e.stock - e.stock) * 0.02) AS platform_commission,
  (e.price * (e.stock - e.stock) * 0.98) AS panitia_revenue
FROM events e
WHERE e.status = 'active';
```

---

## 🎯 Next Steps (Payment Gateway Integration)

Untuk mengintegrasikan payment gateway nanti, tinggal:
1. Tambah field `payment_method` di form (Step 2)
2. Ubah Step 3 menjadi payment confirmation
3. Redirect ke payment gateway setelah konfirmasi
4. Webhook handler untuk update status setelah payment
5. Event status jadi `active` setelah payment success

Tapi untuk sekarang, event langsung aktif tanpa payment. 🚀

---

**Date**: 13 Desember 2025
**Version**: 1.0
**Developer**: GitHub Copilot + User
