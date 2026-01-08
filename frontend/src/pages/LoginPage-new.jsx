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
      const response = await authService.googleAuth(credentialResponse.credential);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      setToast({ 
        show: true, 
        message: `🎉 Selamat datang, ${response.data.user.username}!`, 
        type: 'success' 
      });
      
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
        title: 'Login Google Gagal',
        message: err.response?.data?.message || 'Terjadi kesalahan saat login dengan Google',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setNotification({
      isOpen: true,
      type: 'error',
      title: 'Login Google Gagal',
      message: 'Tidak dapat terhubung ke Google. Silakan coba lagi.',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login({ email, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      setToast({ 
        show: true, 
        message: `🎉 Selamat datang kembali, ${response.data.user.username}!`, 
        type: 'success' 
      });

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
        title: 'Login Gagal',
        message: err.response?.data?.message || 'Email atau password salah',
        details: 'Pastikan email dan password Anda benar'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-content">
        <div className="register-left">
          <div className="register-brand">
            <h1 className="register-brand-title">🎫 tiketbaris.id</h1>
            <p className="register-brand-subtitle">Selamat Datang Kembali</p>
            <p className="register-brand-description">
              Login untuk melanjutkan akses Anda ke event-event seru dan kelola pembelian tiket Anda dengan mudah.
            </p>
            <div className="register-benefits">
              <div className="register-benefit">
                <span>✓</span>
                <p>Transaksi Aman</p>
              </div>
              <div className="register-benefit">
                <span>⚡</span>
                <p>Pembelian Cepat</p>
              </div>
              <div className="register-benefit">
                <span>📅</span>
                <p>Event Lengkap</p>
              </div>
            </div>
          </div>
        </div>

        <div className="register-right">
          <div className="register-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
              <div>
                <h2 className="register-title">🔐 Login</h2>
                <p className="register-subtitle">Akses akun Anda</p>
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
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#e5e7eb';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#f3f4f6';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                🏠 Beranda
              </button>
            </div>

            {error && (
              <div className="alert alert-error">
                <span>❌</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="register-form">
              <div className="form-group">
                <label className="form-label">📧 Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">🔒 Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="form-input"
                  required
                />
              </div>

              <button type="submit" className="register-button" disabled={loading}>
                {loading ? '⏳ Loading...' : '🚀 Login Sekarang'}
              </button>
            </form>

            <div style={{ margin: '20px 0', textAlign: 'center', position: 'relative' }}>
              <div style={{ 
                position: 'absolute', 
                top: '50%', 
                left: 0, 
                right: 0, 
                height: '1px', 
                backgroundColor: '#e5e7eb' 
              }}></div>
              <span style={{ 
                position: 'relative', 
                backgroundColor: 'white', 
                padding: '0 15px', 
                color: '#6b7280',
                fontSize: '14px'
              }}>atau login dengan</span>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
                theme="outline"
                size="large"
                text="continue_with"
                shape="rectangular"
                logo_alignment="left"
              />
            </div>

            <div className="register-footer">
              <p>Belum punya akun?</p>
              <button 
                onClick={() => navigate('/register')}
                className="register-login-link"
              >
                📝 Daftar Di Sini
              </button>
            </div>
          </div>
        </div>
      </div>

      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        details={notification.details}
      />

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
