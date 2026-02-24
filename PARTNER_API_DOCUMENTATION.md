# Tiket Baris Partner API Documentation

## Overview

Tiket Baris menyediakan **Partner API** yang memungkinkan website eksternal (seperti Forbasi Jabar) untuk mengintegrasikan sistem tiket tanpa perlu membangun infrastructure sendiri.

**Konsep:** Tiket Baris menjadi "Headless Ticketing Backend" - partner menampilkan UI di website mereka, semua processing dilakukan oleh Tiket Baris.

---

## Autentikasi

### 1. Partner Authentication (Wajib untuk semua endpoint)

Setiap request harus menyertakan header:

```http
X-Partner-Key: your_api_key
X-Partner-Secret: your_api_secret
```

### 2. User Authentication (Untuk endpoint yang membutuhkan login user)

Untuk endpoint yang memerlukan data user, sertakan JWT token:

```http
X-Partner-User: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**JWT Payload:**
```json
{
  "external_id": "user123",
  "email": "user@example.com",
  "name": "Nama User",
  "role": "user",
  "phone": "08123456789"
}
```

**Roles yang didukung:**
- `user` - Pembeli tiket biasa
- `panitia` - Penyelenggara event
- `admin` - Admin website partner

---

## Base URL

```
Production: https://tiketbaris.com/api/partner
Development: http://localhost:5000/api/partner
```

---

## Endpoints

### Health Check

**GET** `/health`

Cek status API.

**Response:**
```json
{
  "success": true,
  "service": "Tiket Baris Partner API",
  "version": "1.0.0",
  "partner": "Forbasi Jabar",
  "timestamp": "2026-02-23T10:00:00.000Z"
}
```

---

## Events API

### List Events

**GET** `/events`

Ambil daftar event yang aktif. **Tidak memerlukan user authentication.**

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 12) |
| search | string | Search by title/location |
| category | string | Filter by category |
| date_from | string | Filter date (YYYY-MM-DD) |
| date_to | string | Filter date (YYYY-MM-DD) |
| sort | string | "date_asc", "date_desc", "price_asc", "price_desc", "newest" |

**Response:**
```json
{
  "success": true,
  "events": [
    {
      "id": 1,
      "partner_event_id": null,
      "title": "Konser Musik Sunda",
      "description": "...",
      "date": "2026-03-15T19:00:00.000Z",
      "location": "GOR Padjajaran",
      "image": "/uploads/events/event-1.jpg",
      "price": 150000,
      "stock": { "total": 1000, "available": 850 },
      "category": "music",
      "organizer": { "id": 5, "name": "Panitia Seni" },
      "created_at": "2026-02-20T..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 45,
    "pages": 4
  }
}
```

---

### Get Event Detail

**GET** `/events/:id`

**Response:**
```json
{
  "success": true,
  "event": {
    "id": 1,
    "title": "Konser Musik Sunda",
    "description": "Deskripsi lengkap...",
    "date": "2026-03-15T19:00:00.000Z",
    "time": "19:00",
    "location": "GOR Padjajaran",
    "address": "Jl. Raya Bandung No. 123",
    "image": "/uploads/events/event-1.jpg",
    "price": 150000,
    "stock": { "total": 1000, "available": 850 },
    "category": "music",
    "organizer": { "id": 5, "name": "Panitia Seni" },
    "terms": "Syarat dan ketentuan...",
    "status": "active"
  }
}
```

---

### Create Event (Panitia Only)

**POST** `/events`

**Headers:** User JWT dengan role `panitia`

**Body:**
```json
{
  "title": "Event Baru",
  "description": "Deskripsi event...",
  "date": "2026-04-01",
  "time": "14:00",
  "location": "Gedung Sate",
  "address": "Jl. Diponegoro No. 22",
  "price": 100000,
  "stock": 500,
  "category": "seminar",
  "partner_event_id": "EXT-001"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Event created successfully",
  "event": { "id": 25, "title": "Event Baru", "status": "pending" }
}
```

---

### Update Event (Panitia Only)

**PUT** `/events/:id`

**Body:** Same as create (partial update supported)

---

### Delete Event (Panitia Only)

**DELETE** `/events/:id`

---

### My Events (Panitia)

**GET** `/events/panitia/my-events`

Ambil daftar event milik panitia yang login.

---

## Checkout API

### Create Checkout

**POST** `/checkout`

**Headers:** User JWT required

**Body:**
```json
{
  "event_id": 1,
  "quantity": 2,
  "partner_order_id": "ORDER-123"
}
```

**Response:**
```json
{
  "success": true,
  "order": {
    "order_id": "JABAR-1708678800-ABC12",
    "partner_order_id": "ORDER-123",
    "event": { "id": 1, "title": "Konser Musik" },
    "quantity": 2,
    "price_per_ticket": 150000,
    "subtotal": 300000,
    "service_fee": 6000,
    "total_amount": 306000,
    "status": "pending"
  },
  "payment": {
    "snap_token": "abc123-xyz789...",
    "redirect_url": "https://app.sandbox.midtrans.com/snap/v2/vtweb/abc123..."
  }
}
```

**Integrasi dengan Midtrans Snap:**

```javascript
// Di frontend partner
snap.pay(response.payment.snap_token, {
  onSuccess: function(result) {
    // Payment berhasil
  },
  onPending: function(result) {
    // Menunggu pembayaran
  },
  onError: function(result) {
    // Payment gagal
  }
});
```

---

### Get Transaction Status

**GET** `/checkout/:orderId`

**Response:**
```json
{
  "success": true,
  "transaction": {
    "order_id": "JABAR-1708678800-ABC12",
    "status": "completed",
    "total_amount": 306000,
    "payment_type": "gopay",
    "event": { "id": 1, "title": "Konser Musik" },
    "quantity": 2,
    "created_at": "...",
    "paid_at": "..."
  }
}
```

---

### Get Transaction with Tickets

**GET** `/checkout/:orderId/full`

**Response:**
```json
{
  "success": true,
  "transaction": {
    "order_id": "JABAR-1708678800-ABC12",
    "status": "completed",
    "...": "..."
  },
  "tickets": [
    {
      "code": "TKT-ABC123",
      "status": "active",
      "qr_url": "/api/partner/tickets/TKT-ABC123/qr"
    }
  ]
}
```

---

### List My Transactions

**GET** `/checkout`

**Query Parameters:** page, limit, status

---

### Cancel Transaction

**POST** `/checkout/:orderId/cancel`

Only for pending transactions.

---

## Tickets API

### List My Tickets

**GET** `/tickets`

**Headers:** User JWT required

**Response:**
```json
{
  "success": true,
  "tickets": [
    {
      "code": "TKT-ABC123",
      "event": { "id": 1, "title": "Konser Musik", "date": "..." },
      "status": "active",
      "purchased_at": "..."
    }
  ],
  "pagination": { "..." }
}
```

---

### List Event Tickets (Panitia Only)

**GET** `/tickets/event/:eventId`

Untuk panitia melihat semua tiket yang terjual untuk event mereka.

---

### Get Ticket Detail

**GET** `/tickets/:code`

**Response:**
```json
{
  "success": true,
  "ticket": {
    "code": "TKT-ABC123",
    "event": {
      "id": 1,
      "title": "Konser Musik",
      "date": "2026-03-15",
      "location": "GOR Padjajaran"
    },
    "holder": {
      "name": "Nama Pembeli",
      "email": "user@email.com"
    },
    "status": "active",
    "scanned_at": null,
    "qr_data": "TKT-ABC123",
    "qr_image": "data:image/png;base64,..."
  }
}
```

---

### Scan Ticket (Panitia Only)

**POST** `/tickets/:code/scan`

**Response:**
```json
{
  "success": true,
  "message": "Ticket scanned successfully",
  "ticket": {
    "code": "TKT-ABC123",
    "holder_name": "Nama Pembeli",
    "event_title": "Konser Musik",
    "status": "used",
    "scanned_at": "2026-03-15T19:15:00.000Z"
  }
}
```

**Error jika tiket sudah digunakan:**
```json
{
  "error": "Ticket already used",
  "scanned_at": "2026-03-15T19:15:00.000Z"
}
```

---

### Get Ticket QR Code

**GET** `/tickets/:code/qr`

**Response:**
```json
{
  "success": true,
  "qr": {
    "code": "TKT-ABC123",
    "data_url": "data:image/png;base64,iVBORw0KGgo..."
  }
}
```

---

## Users API

### Get Current User

**GET** `/users/me`

**Response:**
```json
{
  "success": true,
  "user": {
    "external_id": "user123",
    "internal_id": 45,
    "email": "user@email.com",
    "name": "Nama User",
    "phone": "08123456789",
    "role": "user",
    "partner": "Forbasi Jabar"
  }
}
```

---

### Get User by External ID (Admin)

**GET** `/users/:externalId`

---

### Get User Stats

**GET** `/users/:externalId/stats`

**Response:**
```json
{
  "success": true,
  "stats": {
    "tickets_purchased": 15,
    "events_attended": 8,
    "total_spent": 1500000,
    "events_created": 0
  }
}
```

---

## Admin API

### Dashboard

**GET** `/admin/dashboard`

**Headers:** User JWT dengan role `admin`

**Response:**
```json
{
  "success": true,
  "dashboard": {
    "events": { "total_events": 50, "active_events": 35, "pending_events": 5 },
    "transactions": { "total_transactions": 1200, "completed": 1150, "total_revenue": 175000000 },
    "users": { "total_users": 3000, "users": 2800, "organizers": 180, "admins": 20 },
    "tickets": { "total_tickets": 8500, "active": 3200, "used": 5300 },
    "today": { "today_transactions": 45, "today_revenue": 6750000 },
    "recent_transactions": [...]
  }
}
```

---

### List All Events (Admin)

**GET** `/admin/events`

**Query Parameters:** page, limit, status, search

---

### Approve Event

**PUT** `/admin/events/:id/approve`

---

### Reject Event

**PUT** `/admin/events/:id/reject`

**Body:**
```json
{
  "reason": "Alasan penolakan"
}
```

---

### List All Transactions (Admin)

**GET** `/admin/transactions`

**Query Parameters:** page, limit, status, event_id, date_from, date_to

---

### Revenue Report

**GET** `/admin/reports/revenue`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| period | string | "daily", "weekly", "monthly" |
| date_from | string | YYYY-MM-DD |
| date_to | string | YYYY-MM-DD |

---

### List All Users (Admin)

**GET** `/admin/users`

**Query Parameters:** page, limit, role, search

---

## Webhooks

Tiket Baris akan mengirim webhook ke URL yang dikonfigurasi saat terjadi event penting.

### Webhook Format

```http
POST your_webhook_url
Content-Type: application/json
X-Webhook-Timestamp: 1708678800
X-Webhook-Signature: sha256_hmac_signature
```

```json
{
  "event": "payment.success",
  "timestamp": 1708678800,
  "data": { ... }
}
```

### Webhook Events

| Event | Description |
|-------|-------------|
| `payment.success` | Pembayaran berhasil |
| `payment.failed` | Pembayaran gagal |
| `payment.expired` | Pembayaran kadaluarsa |
| `ticket.created` | Tiket berhasil dibuat |
| `ticket.scanned` | Tiket berhasil di-scan |
| `event.approved` | Event disetujui admin |
| `event.rejected` | Event ditolak admin |

### Verify Webhook Signature

```javascript
const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  return signature === expected;
}
```

---

## Error Responses

### 401 Unauthorized

```json
{
  "error": "Invalid API key"
}
```

### 403 Forbidden

```json
{
  "error": "Insufficient permissions",
  "required": ["admin"],
  "current": "user"
}
```

### 404 Not Found

```json
{
  "error": "Event not found"
}
```

### 422 Validation Error

```json
{
  "error": "Validation failed",
  "details": {
    "quantity": "Must be at least 1"
  }
}
```

### 500 Internal Error

```json
{
  "error": "Internal server error",
  "code": "INTERNAL_ERROR"
}
```

---

## Rate Limiting

- Default: 5000 requests per hour
- Exceeded limit returns `429 Too Many Requests`

---

## Support

Untuk bantuan teknis atau pertanyaan integrasi:
- Email: support@tiketbaris.com
- Documentation: https://docs.tiketbaris.com

---

## Changelog

### v1.0.0 (2026-02-23)
- Initial release
- Events, Checkout, Tickets, Users, Admin APIs
- Webhook notifications
