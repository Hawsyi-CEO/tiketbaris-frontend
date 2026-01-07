# Tiket Pembaris Frontend - Setup Guide

## 📦 Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.17.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0"
  }
}
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure API Base URL
Edit `src/services/api.js` and ensure API endpoint points to backend:
```javascript
const API_BASE_URL = '/api'; // This will proxy to http://localhost:5000/api
```

### 3. Start Development Server
```bash
npm run dev
```

Server runs at `http://localhost:3000`

### 4. Build for Production
```bash
npm run build
```

Output goes to `dist/` directory

## 📁 Project Structure

```
frontend/
├── src/
│   ├── pages/
│   │   ├── user/
│   │   │   ├── DashboardUser.jsx       # User dashboard
│   │   │   └── HistoryPembayaran.jsx   # Payment history
│   │   ├── panitia/
│   │   │   └── DashboardPanitia.jsx    # Organizer dashboard
│   │   ├── admin/
│   │   │   └── DashboardAdmin.jsx      # Admin panel
│   │   ├── LoginPage.jsx               # Login form
│   │   ├── RegisterPage.jsx            # Registration form
│   │   ├── HomePage.jsx                # Home page
│   │   └── CheckoutPage.jsx            # Checkout form
│   ├── services/
│   │   ├── api.js                      # Axios instance
│   │   └── apiServices.js              # API service functions
│   ├── App.jsx                         # Main app component with routing
│   ├── index.css                       # Global styles
│   └── main.jsx                        # React entry point
├── index.html                          # HTML template
├── vite.config.js                      # Vite configuration
├── package.json                        # Dependencies
├── .gitignore                          # Git ignore rules
└── README.md                           # Project documentation
```

## 🎯 Pages & Features

### Public Pages
- **HomePage** (`/`) - Display active events, login/register buttons
- **LoginPage** (`/login`) - User login form
- **RegisterPage** (`/register`) - User registration form

### User Pages (requires `user` role)
- **DashboardUser** (`/user/dashboard`) - View events, buy tickets
- **HistoryPembayaran** (`/user/history`) - View payment history
- **CheckoutPage** (`/user/checkout/:eventId`) - Process payment with Midtrans

### Panitia Pages (requires `panitia` role)
- **DashboardPanitia** (`/panitia/dashboard`) - Create events, view withdrawals

### Admin Pages (requires `admin` role)
- **DashboardAdmin** (`/admin/dashboard`) - Manage events, users, partnerships

## 🔐 Authentication Flow

1. User registers → account created in database
2. User logs in → JWT token received and stored in localStorage
3. Token included in API requests via axios interceptor
4. Token verified on protected routes
5. Invalid/expired tokens → redirect to login

## 🎨 Styling

All components use inline CSS for simplicity. Color scheme:
- Primary Red: `#dc2626`
- Gray: `#6b7280`, `#9ca3af`
- Success Green: `#059669`
- Background: `#f3f4f6`
- Text Dark: `#1f2937`

## 📡 API Integration

### Service Layer
All API calls go through `src/services/apiServices.js`:

```javascript
// Example usage in component:
import { eventService } from '../services/apiServices';

// Fetch events
const response = await eventService.getAllEvents();
```

### Error Handling
- Try-catch blocks in component handlers
- Error messages displayed to user
- Network errors handled gracefully

## 🛒 Checkout Process

1. User selects event and quantity
2. Click "Checkout" → `/user/checkout/:eventId`
3. Verify stock availability
4. Create transaction record in backend
5. Get Midtrans token
6. Load Midtrans Snap UI
7. User completes payment
8. Transaction status updated

## 💳 Midtrans Integration

Midtrans Snap is loaded dynamically:
```javascript
// In CheckoutPage.jsx
const s = document.createElement('script');
s.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
s.setAttribute('data-client-key', 'Mid-client-elnf14D8Ip6f1Yba');
document.body.appendChild(s);
```

## 📱 Responsive Design

- Grid layouts use CSS Grid
- Flexbox for components
- Mobile-first approach
- Responsive font sizes

## 🧪 Testing Pages

### Test Account 1 (User)
- Email: `user@gm`
- Role: User (Pembeli)

### Test Account 2 (Panitia)
- Email: `pantia@gm`
- Role: Panitia (Organizer)

### Test Account 3 (Admin)
- Email: `admin@gmail.com`
- Role: Admin

## 🐛 Debugging Tips

1. **DevTools Console** - Check for JavaScript errors
2. **Network Tab** - Monitor API calls and responses
3. **Application Tab** - Check localStorage for token
4. **React DevTools** - Debug component state and props

## 🚀 Deployment

### Build
```bash
npm run build
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

### Environment Variables for Production
Update API endpoint to point to production backend:
```javascript
// src/services/api.js
const API_BASE_URL = 'https://api.example.com/api';
```

## 📚 Component Patterns

### Protected Routes
```jsx
<ProtectedRoute requiredRole="user">
  <DashboardUser />
</ProtectedRoute>
```

### API Calls
```jsx
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');

useEffect(() => {
  fetchData();
}, []);

const fetchData = async () => {
  try {
    const response = await eventService.getAllEvents();
    setData(response.data);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

## 🔗 Useful Links

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [React Router](https://reactrouter.com/)
- [Axios](https://axios-http.com/)
- [Midtrans Documentation](https://docs.midtrans.com/)

---

**Last Updated:** December 11, 2025
