# 🚀 QUICK REFERENCE CARD

## Terminal Commands

### Backend Setup & Run
```bash
cd file\ js/backend
npm install
npm start           # Production
npm run dev         # Development with auto-reload
```

### Frontend Setup & Run
```bash
cd file\ js/frontend
npm install
npm run dev         # Development server
npm run build       # Production build
npm run preview     # Preview production build
```

## URLs

| Service | URL | Port |
|---------|-----|------|
| Frontend | http://localhost:3000 | 3000 |
| Backend | http://localhost:5000 | 5000 |
| API Base | http://localhost:5000/api | 5000 |
| Database | localhost:3306 | 3306 |

## Test Accounts

| Role | Email | Password | Dashboard |
|------|-------|----------|-----------|
| User | user@gm | * | /user/dashboard |
| Panitia | pantia@gm | * | /panitia/dashboard |
| Admin | admin@gmail.com | * | /admin/dashboard |

*Check database for actual passwords*

## Key Endpoints

### Auth
```
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/verify
```

### Events
```
GET    /api/events
GET    /api/events/:id
POST   /api/events                    (Panitia only)
GET    /api/events/user/my-events     (Panitia only)
```

### Checkout
```
POST /api/checkout/process
GET  /api/checkout/transaction/:orderId
```

### Admin
```
GET    /api/admin/pending-events
PUT    /api/admin/approve-event/:id
PUT    /api/admin/decline-event/:id
DELETE /api/admin/event/:id
GET    /api/admin/users
GET    /api/admin/partnerships
```

## Frontend Routes

```
/                          Home page (public)
/login                     Login (public)
/register                  Register (public)
/user/dashboard            User dashboard (auth: user)
/user/checkout/:eventId    Checkout page (auth: user)
/user/history              Payment history (auth: user)
/panitia/dashboard         Panitia dashboard (auth: panitia)
/admin/dashboard           Admin dashboard (auth: admin)
```

## Important Files

| File | Purpose |
|------|---------|
| backend/.env | Database & Midtrans config |
| backend/server.js | Main Express server |
| frontend/src/App.jsx | React routing & auth |
| frontend/src/services/api.js | Axios instance |

## Database

### Connection
```
Host: localhost
User: u390486773_simtix
Password: Tiketbaris123#
Database: u390486773_simtix
Port: 3306
```

### Restore Database
```bash
mysql -u u390486773_simtix -p u390486773_simtix < u390486773_simtix.sql
```

## Environment Variables

### Backend .env
```
DB_HOST=localhost
DB_USER=u390486773_simtix
DB_PASSWORD=Tiketbaris123#
DB_NAME=u390486773_simtix
PORT=5000
JWT_SECRET=your_secret_key
MIDTRANS_SERVER_KEY=your_key
MIDTRANS_CLIENT_KEY=your_key
```

## Troubleshooting

### Port Already in Use (Linux/Mac)
```bash
lsof -i :5000
lsof -i :3000
kill -9 <PID>
```

### Port Already in Use (Windows)
```powershell
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### MySQL Connection Error
```bash
mysql -u root -p -e "SELECT 1;"
```

### Clear Frontend Cache
```
DevTools → Application → localStorage → Clear All
```

## Key Dependencies

### Backend
- express (web framework)
- mysql2 (database)
- jsonwebtoken (JWT auth)
- bcryptjs (password hashing)
- multer (file upload)
- midtrans-client (payment)

### Frontend
- react (UI)
- react-router-dom (routing)
- axios (HTTP client)
- vite (bundler)

## Folder Structure

### Backend
```
backend/
├── config/       - Database configuration
├── middleware/   - Auth middleware
├── routes/       - API routes
├── uploads/      - Event images
└── server.js     - Main server
```

### Frontend
```
frontend/
└── src/
    ├── pages/    - Page components
    ├── services/ - API services
    ├── App.jsx   - Main app
    └── main.jsx  - Entry point
```

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Server Error |

## Documentation Files

- `README.md` - Project overview
- `CARA_MENJALANKAN.md` - Step-by-step guide
- `API_DOCUMENTATION.md` - API reference
- `PROJECT_SUMMARY.md` - Project summary
- `CHECKLIST.md` - Feature checklist
- `FILE_MANIFEST.md` - File list
- `QUICK_REFERENCE.md` - This file

## Git Commands

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <url>
git push -u origin main
```

## Useful Links

- React: https://react.dev
- Express: https://expressjs.com
- Vite: https://vitejs.dev
- MySQL: https://dev.mysql.com
- Midtrans: https://docs.midtrans.com
- JWT: https://jwt.io

## Testing with Midtrans

### Test Credit Card
```
Number: 4811 1111 1111 1114
CVV: 123
Exp: 12/25
OTP: 123456
```

## API Request Headers

```json
{
  "Authorization": "Bearer {jwt_token}",
  "Content-Type": "application/json"
}
```

## Status Values

### Events
- pending (waiting approval)
- active (approved)
- cancelled (declined)

### Transactions
- pending (unpaid)
- completed (paid)
- cancelled (failed)

### Withdrawals
- pending (awaiting approval)
- completed (paid)
- rejected (denied)

## Required Tools

- ✅ Node.js v14+
- ✅ npm or yarn
- ✅ MySQL Server
- ✅ Code Editor (VS Code, etc)
- ✅ Git (optional)
- ✅ Postman (optional for API testing)

## Quick Debug Tips

1. **Backend issues:** Check console output
2. **Frontend issues:** Open DevTools (F12)
3. **API issues:** Check Network tab in DevTools
4. **Database issues:** Use MySQL Workbench
5. **Auth issues:** Check localStorage token
6. **File upload:** Check uploads folder permissions

## Performance Tips

- Use npm ci instead of npm install for production
- Run npm dedupe to optimize dependencies
- Use .env for sensitive data
- Enable gzip compression in production
- Use CDN for static files
- Setup database indexes for large datasets

## Security Checklist

- [x] Use strong JWT_SECRET
- [x] Hash passwords with bcryptjs
- [x] Validate all inputs
- [x] Use HTTPS in production
- [x] Protect sensitive routes
- [x] Set appropriate CORS origins
- [x] Sanitize database inputs
- [x] Keep dependencies updated

## Command Reference

| Task | Command |
|------|---------|
| Start Backend | `cd backend && npm start` |
| Start Frontend | `cd frontend && npm run dev` |
| Build Frontend | `cd frontend && npm run build` |
| Install Backend | `cd backend && npm install` |
| Install Frontend | `cd frontend && npm install` |
| Quick Help | `node quickstart.js` |

---

**Last Updated:** December 11, 2025

**Print this page for quick reference! 📋**
