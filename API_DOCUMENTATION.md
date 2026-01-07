# Tiket Pembaris API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
Semua endpoint yang memerlukan authentication menggunakan JWT token di header:
```
Authorization: Bearer {token}
```

Token diperoleh dari endpoint `/auth/login` dan harus disimpan di frontend.

---

## 🔐 Auth Endpoints

### 1. Register User
**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user"
}
```

**Response (201):**
```json
{
  "message": "Registrasi berhasil! Silakan login."
}
```

**Validation Rules:**
- Username: required, string
- Email: required, valid email
- Password: required, minimum 6 characters
- Role: "user" atau "panitia"

---

### 2. Login
**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "Login berhasil",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "role": "user",
    "profile_picture": "default.png"
  }
}
```

**Response (401):**
```json
{
  "error": "Email atau password salah"
}
```

---

### 3. Verify Token
**Endpoint:** `GET /auth/verify`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "valid": true,
  "user": {
    "id": 1,
    "username": "john_doe",
    "role": "user",
    "email": "john@example.com",
    "iat": 1702296000,
    "exp": 1702382400
  }
}
```

---

## 📅 Event Endpoints

### 1. Get All Active Events
**Endpoint:** `GET /events`

**Response (200):**
```json
[
  {
    "id": 1,
    "title": "Konser musik 2025",
    "description": "Konser musik terbesar tahun ini",
    "date": "2025-12-25",
    "location": "Jakarta Convention Center",
    "price": 150000,
    "stock": 500,
    "image_url": "/uploads/event1.jpg"
  }
]
```

---

### 2. Get Event Details
**Endpoint:** `GET /events/:id`

**Response (200):**
```json
{
  "id": 1,
  "title": "Konser musik 2025",
  "description": "Konser musik terbesar tahun ini",
  "date": "2025-12-25",
  "location": "Jakarta Convention Center",
  "price": 150000,
  "stock": 500,
  "image_url": "/uploads/event1.jpg",
  "user_id": 2,
  "status": "active",
  "created_at": "2025-12-01T10:00:00Z"
}
```

---

### 3. Create Event (Panitia Only)
**Endpoint:** `POST /events`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Form Data:**
```
title: string (required)
description: string (required)
date: date (required, format: YYYY-MM-DD)
location: string (required)
price: number (required)
stock: number (required)
image_file: file (required, image)
```

**Response (201):**
```json
{
  "message": "Event berhasil dibuat! Menunggu persetujuan admin.",
  "eventId": 5
}
```

**Response (400):**
```json
{
  "error": "Gambar harus diunggah"
}
```

---

### 4. Get User's Events (Panitia Only)
**Endpoint:** `GET /events/user/my-events`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
[
  {
    "id": 1,
    "title": "Event 1",
    "date": "2025-12-25",
    "status": "active"
  },
  {
    "id": 2,
    "title": "Event 2",
    "date": "2025-12-30",
    "status": "pending"
  }
]
```

---

## 💳 Checkout Endpoints

### 1. Process Payment
**Endpoint:** `POST /checkout/process`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "eventId": 1,
  "quantity": 2
}
```

**Response (200):**
```json
{
  "token": "eyJub3QiOiAidGhpcyBpcyBhIHZhbGlkIHRva2VuIn0=",
  "orderId": "simtix-1702296000-abc123",
  "transactionId": 15
}
```

**Response (400):**
```json
{
  "error": "Stok tiket tidak mencukupi"
}
```

---

### 2. Get Transaction Details
**Endpoint:** `GET /checkout/transaction/:orderId`

**Response (200):**
```json
{
  "id": 15,
  "midtrans_order_id": "simtix-1702296000-abc123",
  "user_id": 1,
  "event_id": 1,
  "amount": 300000,
  "status": "pending",
  "transaction_date": "2025-12-11T10:00:00Z"
}
```

---

## 👤 User Endpoints

### 1. Get User Profile
**Endpoint:** `GET /user/profile`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "role": "user",
  "profile_picture": "default.png"
}
```

---

### 2. Get Transaction History
**Endpoint:** `GET /user/transactions`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
[
  {
    "id": 1,
    "midtrans_order_id": "simtix-1702296000-abc123",
    "amount": 300000,
    "status": "completed",
    "transaction_date": "2025-12-10T10:00:00Z",
    "event_name": "Konser musik 2025"
  }
]
```

---

## 💰 Withdrawal Endpoints

### 1. Get User Withdrawals
**Endpoint:** `GET /withdrawals`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
[
  {
    "id": 1,
    "amount": 1000000,
    "status": "pending",
    "requested_at": "2025-12-11T10:00:00Z"
  }
]
```

---

### 2. Request Withdrawal
**Endpoint:** `POST /withdrawals/request`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "amount": 1000000
}
```

**Response (201):**
```json
{
  "message": "Permintaan penarikan berhasil dibuat",
  "withdrawalId": 5
}
```

---

## 🔨 Admin Endpoints

### 1. Get All Events (with Status)
**Endpoint:** `GET /admin/pending-events`

**Headers:**
```
Authorization: Bearer {token}
Role: admin
```

**Response (200):**
```json
[
  {
    "id": 1,
    "title": "Event 1",
    "date": "2025-12-25",
    "location": "Jakarta",
    "price": 150000,
    "stock": 500,
    "status": "pending",
    "created_at": "2025-12-01T10:00:00Z",
    "username": "panitia_name"
  }
]
```

---

### 2. Approve Event
**Endpoint:** `PUT /admin/approve-event/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Event berhasil disetujui"
}
```

---

### 3. Decline Event
**Endpoint:** `PUT /admin/decline-event/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Event ditolak"
}
```

---

### 4. Delete Event
**Endpoint:** `DELETE /admin/event/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Event berhasil dihapus"
}
```

---

### 5. Get All Users
**Endpoint:** `GET /admin/users`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
[
  {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user",
    "created_at": "2025-12-01T10:00:00Z"
  }
]
```

---

### 6. Get All Partnerships
**Endpoint:** `GET /admin/partnerships`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
[
  {
    "id": 1,
    "company_name": "Tech Company",
    "proposal_text": "Kami ingin bermitra dengan...",
    "status": "pending",
    "submitted_at": "2025-12-01T10:00:00Z",
    "username": "user_name"
  }
]
```

---

### 7. Approve Partnership
**Endpoint:** `PUT /admin/partnership/:id/approve`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Partnership disetujui"
}
```

---

## ❌ Error Responses

### 401 Unauthorized
```json
{
  "error": "Token tidak ditemukan"
}
```

### 403 Forbidden
```json
{
  "error": "Anda tidak memiliki akses ke resource ini"
}
```

### 404 Not Found
```json
{
  "error": "Event tidak ditemukan"
}
```

### 400 Bad Request
```json
{
  "error": "Email sudah terdaftar"
}
```

### 500 Server Error
```json
{
  "error": "Server error message"
}
```

---

## 🧪 Testing dengan Postman

### Setup di Postman:

1. **Create Environment:**
   - BASE_URL: `http://localhost:5000/api`
   - TOKEN: (dapatkan setelah login)

2. **Collection Example:**
   ```json
   {
     "info": {
       "name": "Tiket Pembaris API"
     },
     "auth": {
       "type": "bearer",
       "bearer": [
         {
           "key": "token",
           "value": "{{TOKEN}}",
           "type": "string"
         }
       ]
     }
   }
   ```

3. **Test Workflow:**
   - POST /auth/register
   - POST /auth/login (simpan token)
   - GET /events
   - GET /events/:id
   - POST /checkout/process (jika user)
   - PUT /admin/approve-event/:id (jika admin)

---

## 📚 Data Types

### Status Types
- Events: `pending`, `active`, `cancelled`
- Transactions: `pending`, `completed`, `cancelled`
- Withdrawals: `pending`, `completed`, `rejected`
- Partnerships: `pending`, `approved`, `rejected`

### Role Types
- `user` - Pembeli tiket
- `panitia` - Penyelenggara event
- `admin` - Administrator sistem

---

**Last Updated:** December 11, 2025
