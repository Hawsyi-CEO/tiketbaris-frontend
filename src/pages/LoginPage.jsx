import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { authService } from '../services/apiServices';
import NotificationModal from '../components/NotificationModal';
import Toast from '../components/Toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ isOpen: false, type: 'info', title: '', message: '' });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.fromRegister) {
      setToast({ show: true, message: '✅ Registrasi berhasil! Silakan login dengan akun Anda.', type: 'success' });
    }
  }, []);

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      
      // Send credential to backend for verification
      const response = await authService.googleAuth(credentialResponse.credential);
      
      // Store token
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      setToast({ 
        show: true, 
        message: `🎉 Selamat datang, ${response.data.user.username}!`, 
        type: 'success' 
      });
      
      // Redirect based on role
      setTimeout(() => {
        const role = response.data.user?.role;
        if (role === 'admin') navigate('/admin/dashboard');
        else if (role === 'panitia') navigate('/panitia/dashboard');
        else navigate('/user/dashboard');
      }, 1500);
    } catch (err) {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Autentikasi Google Gagal',
        message: err.response?.data?.error || 'Terjadi kesalahan saat autentikasi dengan Google',
        details: 'Pastikan akun Google Anda valid dan coba lagi'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setToast({ show: true, message: '❌ Login Google dibatalkan', type: 'error' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login(email, password);
      const { token, user, sessionToken } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      if (sessionToken) {
        localStorage.setItem('sessionToken', sessionToken);
      }

      setToast({ show: true, message: `🎉 Selamat datang, ${user.username}!`, type: 'success' });
      
      setTimeout(() => {
        if (user.role === 'admin') {
          navigate('/admin/dashboard', { state: { fromLogin: true } });
        } else if (user.role === 'panitia') {
          navigate('/panitia/dashboard', { state: { fromLogin: true } });
        } else {
          navigate('/user/dashboard', { state: { fromLogin: true } });
        }
      }, 1000);
    } catch (err) {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Login Gagal',
        message: err.response?.data?.error || 'Email atau password yang Anda masukkan salah.',
        details: 'Pastikan email dan password Anda benar'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <div style={{ display: 'flex', flex: 1, width: '100%' }}>
        {/* Left Side - Brand Info (hidden on mobile) */}
        <div className="login-brand-section" style={{ 
          flex: 1, 
          background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
          color: 'white',
          padding: '60px 40px',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '42px', fontWeight: '800', margin: '0 0 15px 0' }}>🎫 tiketbaris.id</h1>
            <p style={{ fontSize: '18px', margin: '0 0 10px 0', opacity: 0.9 }}>Platform Tiket Terpercaya</p>
            <p style={{ fontSize: '14px', margin: '0 0 40px 0', opacity: 0.8, maxWidth: '300px', lineHeight: '1.6' }}>
              Beli tiket event favorit Anda dengan mudah dan aman. Ribuan event menanti Anda!
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', fontSize: '16px' }}>
                <span style={{ fontSize: '24px' }}>✅</span>
                <p style={{ margin: 0 }}>Transaksi Aman</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', fontSize: '16px' }}>
                <span style={{ fontSize: '24px' }}>🚀</span>
                <p style={{ margin: 0 }}>Pembelian Cepat</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', fontSize: '16px' }}>
                <span style={{ fontSize: '24px' }}>🎯</span>
                <p style={{ margin: 0 }}>Event Lengkap</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div style={{ 
          display: 'flex', 
          flex: 1, 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: 'clamp(20px, 5vw, 40px)'
        }}>
          <div className="card" style={{ maxWidth: '450px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
              <div>
                <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: '700', color: '#1f2937', margin: '0 0 10px 0' }}>🔐 Masuk Ke Akun</h2>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '0' }}>Akses akun Anda untuk membeli tiket</p>
              </div>
              <button 
                onClick={() => navigate('/')} 
                type="button"
                style={{ 
                  padding: '8px 16px',
                  backgroundColor: '#f3f4f6',
                  color: '#4b5563',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#e5e7eb'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#f3f4f6'}
              >
                🏠 Beranda
              </button>
            </div>
            <div style={{ marginBottom: '20px' }}></div>

            {error && (
              <div style={{ 
                backgroundColor: '#fee2e2', 
                color: '#991b1b',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '14px',
                border: '1px solid #fecaca'
              }}>
                <span>❌ </span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>📧 Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="masukkan@email.com"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>🔒 Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="form-input"
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? '⏳ Loading...' : '🚀 Login Sekarang'}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '25px 0', color: '#6b7280', fontSize: '13px' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }}></div>
              <span>atau login dengan</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }}></div>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                text="signin_with"
                width="100%"
              />
            </div>

            <div style={{ textAlign: 'center', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 10px 0' }}>Belum punya akun?</p>
              <button 
                onClick={() => navigate('/register')}
                style={{ fontSize: '14px', fontWeight: '600', color: '#dc2626', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                📝 Daftar Sekarang
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: '15px' }}>
              <a href="#" style={{ fontSize: '13px', color: '#dc2626', textDecoration: 'none' }}>Lupa password?</a>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        details={notification.details}
      />

      {/* Toast Notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  );
}
