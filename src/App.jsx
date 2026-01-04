import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { GoogleOAuthProvider } from '@react-oauth/google';
import socketService from './services/socket';
import PaymentNotification from './components/PaymentNotification';

console.log('App.jsx loading...')

// Google OAuth Client ID
const GOOGLE_CLIENT_ID = "430088254458-1t6ush1pb5ujoa157p4atkfthmv2olc5.apps.googleusercontent.com";

// Pages
import StartupGuidePage from './pages/StartupGuidePage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPageNew from './pages/RegisterPageNew';

// Responsive Dashboard Pages
import DashboardUserResponsive from './pages/user/DashboardUserResponsive';
import DashboardPanitiaResponsive from './pages/panitia/DashboardPanitiaResponsive';
import DashboardAdminResponsive from './pages/admin/DashboardAdminResponsive';
import AdminLogin from './pages/admin/AdminLogin';
import TicketScanner from './pages/admin/TicketScanner';

// Original Pages (fallback)
import CreateEventWizard from './pages/panitia/CreateEventWizard';
import EditEventPanitia from './pages/panitia/EditEventPanitia';
import ScanTicketPage from './pages/panitia/ScanTicketPage';
import EventDetailAdmin from './pages/admin/EventDetailAdmin';

// Checkout and Other Pages
import CheckoutPage from './pages/CheckoutPage';
import CheckoutPageResponsive from './pages/CheckoutPageResponsive';
import HistoryPembayaran from './pages/user/HistoryPembayaran';
import MyTickets from './pages/MyTickets';
import DiagnosticsPage from './pages/DiagnosticsPage';

console.log('All imports loaded successfully')

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await axios.get('/api/auth/verify', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setIsAuthenticated(true);
          setUserRole(response.data.user.role);
        } catch (error) {
          localStorage.removeItem('token');
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, []);

  if (loading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  const [paymentNotification, setPaymentNotification] = useState(null);
  
  // Setup socket connection and payment notification listener
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Connect to socket
      socketService.connect(token);
      
      // Listen for payment success notifications
      socketService.onPaymentSuccess((data) => {
        console.log('💰 Payment success received:', data);
        setPaymentNotification(data);
        
        // Play success sound
        const audio = new Audio('/notification-success.mp3');
        audio.play().catch(() => {
          // Fallback: use default beep
          const beep = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZUQ8OVa3q7KVXEQpDntL3yoE3CTuP2vPShj8KGnC+7+OYUg8NUqbn7qpbFApAl9X02oU5Cj2V2fPSiD8MH2++7+OYUw8MUqnj7qxdFApAl9T02oQ3CDqO1/PTiEEMH2++7+OYUw8MUanj7qpbFApBl9T02oU5Cj2V2fPSiEAMH2++7+OYUw8LUqnj7qpbEwtBl9T02oU5Cj2V2fPSiEAMH2++7+OYUw8LUqnj7qpbEwtBl9T02oU5Cj2V2fPSiEAMH2++7+OYUw8LUqnj7qpbEwtBl9T02oU5');
          beep.play().catch(() => {});
        });
      });
      
      // Cleanup on unmount
      return () => {
        socketService.off('paymentSuccess');
      };
    }
  }, []);

  const handleCloseNotification = () => {
    setPaymentNotification(null);
  };

  console.log('App component rendering...')
  try {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          {/* Payment Notification Toast */}
          <PaymentNotification 
            notification={paymentNotification} 
            onClose={handleCloseNotification}
          />
          
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/startup" element={<StartupGuidePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPageNew />} />
            <Route path="/diagnostics" element={<DiagnosticsPage />} />
          
          
          {/* User Routes - Responsive */}
          <Route 
            path="/user/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardUserResponsive />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/user/checkout/:eventId" 
            element={
              <ProtectedRoute>
                <CheckoutPageResponsive />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/checkout" 
            element={<CheckoutPageResponsive />} 
          />
          <Route 
            path="/user/history" 
            element={
              <ProtectedRoute>
                <HistoryPembayaran />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/user/my-tickets" 
            element={
              <ProtectedRoute>
                <MyTickets />
              </ProtectedRoute>
            } 
          />

          {/* Panitia Routes - Responsive */}
          <Route 
            path="/panitia/dashboard" 
            element={
              <ProtectedRoute requiredRole="panitia">
                <DashboardPanitiaResponsive />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/panitia/create-event" 
            element={
              <ProtectedRoute requiredRole="panitia">
                <CreateEventWizard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/panitia/edit-event/:eventId" 
            element={
              <ProtectedRoute requiredRole="panitia">
                <EditEventPanitia />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/panitia/scan-ticket" 
            element={
              <ProtectedRoute requiredRole="panitia">
                <ScanTicketPage />
              </ProtectedRoute>
            } 
          />

          
          {/* Admin Routes - Responsive */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute requiredRole="admin">
                <DashboardAdminResponsive />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/event/:eventId" 
            element={
              <ProtectedRoute requiredRole="admin">
                <EventDetailAdmin />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/scanner" 
            element={
              <ProtectedRoute requiredRole="admin">
                <TicketScanner />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/panitia/scanner" 
            element={
              <ProtectedRoute requiredRole="panitia">
                <TicketScanner />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
      </GoogleOAuthProvider>
    );
  } catch (error) {
    console.error('Error in App component:', error)
    return (
      <div style={{ padding: '20px', backgroundColor: '#ffebee', color: '#c62828' }}>
        <h1>❌ Error Rendering App</h1>
        <pre>{error.message}</pre>
      </div>
    )
  }
}

console.log('App function defined:', typeof App)

export default App;
