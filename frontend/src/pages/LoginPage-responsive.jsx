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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '1rem'
    }}>
      {/* Mobile Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        maxWidth: '500px',
        width: '100%',
        margin: '0 auto 1.5rem auto'
      }}>
        <div style={{ color: 'white' }}>
          <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: '800', margin: 0 }}>🎫 tiketbaris.id</h1>
        </div>
        <button 
          onClick={() => navigate('/')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'rgba(255,255,255,0.2)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)'
          }}
        >
          🏠 Beranda
        </button>
      </div>

      {/* Login Card */}
      <div style={{
        maxWidth: '450px',
        width: '100%',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: 'clamp(1.5rem, 4vw, 2.5rem)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: '700', margin: '0 0 0.5rem 0', color: '#1f2937' }}>
            🔐 Login
          </h2>
          <p style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)', color: '#6b7280', margin: 0 }}>
            Akses akun Anda
          </p>
        </div>

        {error && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            borderRadius: '8px',
            marginBottom: '1rem',
            fontSize: '0.875rem'
          }}>
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ marginBottom: '1.5rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', fontSize: 'clamp(0.875rem, 2vw, 1rem)', color: '#374151' }}>
              📧 Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              style={{
                width: '100%',
                padding: 'clamp(0.75rem, 2vw, 1rem)',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                outline: 'none',
                transition: 'all 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              required
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', fontSize: 'clamp(0.875rem, 2vw, 1rem)', color: '#374151' }}>
              🔒 Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: 'clamp(0.75rem, 2vw, 1rem)',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                outline: 'none',
                transition: 'all 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              width: '100%',
              padding: 'clamp(0.875rem, 2.5vw, 1rem)',
              background: loading ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: 'clamp(1rem, 2.5vw, 1.125rem)',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(102,126,234,0.3)'
            }}
            onMouseEnter={(e) => !loading && (e.target.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
          >
            {loading ? '⏳ Loading...' : '🚀 Login Sekarang'}
          </button>
        </form>

        <div style={{ margin: '1.5rem 0', textAlign: 'center', position: 'relative' }}>
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
            padding: '0 1rem', 
            color: '#6b7280',
            fontSize: 'clamp(0.75rem, 2vw, 0.875rem)'
          }}>atau login dengan</span>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap
            theme="outline"
            size="large"
            text="continue_with"
            shape="rectangular"
            logo_alignment="left"
            width="100%"
          />
        </div>

        <div style={{ textAlign: 'center', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>
          <p style={{ color: '#6b7280', margin: '0 0 0.5rem 0' }}>Belum punya akun?</p>
          <button 
            onClick={() => navigate('/register')}
            style={{
              background: 'none',
              border: 'none',
              color: '#667eea',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: 'clamp(0.875rem, 2vw, 1rem)',
              textDecoration: 'underline'
            }}
          >
            📝 Daftar Di Sini
          </button>
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
