import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { authService } from '../services/apiServices';
import NotificationModal from '../components/NotificationModal';
import Toast from '../components/Toast';
import './RegisterPage.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('user'); // Role for Google login
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
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email harus diisi');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Format email tidak valid');
      return;
    }
    if (!password) {
      setError('Password harus diisi');
      return;
    }

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
      const errorMessage = err.response?.data?.message || 'Email atau password salah';
      
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Login Gagal',
        message: errorMessage,
        details: 'Pastikan email dan password Anda benar'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      const response = await authService.googleAuth(credentialResponse.credential, selectedRole);
      
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
        message: err.response?.data?.message || 'Terjadi kesalahan saat login dengan Google'
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
      message: 'Tidak dapat terhubung ke Google. Silakan coba lagi.'
    });
  };

  return (
    <div className="register-page">
      {/* Background Pattern */}
      <div className="register-background">
        <div className="register-pattern"></div>
      </div>

      <div className="register-container">
        {/* Left Side - Branding */}
        <div className="register-branding">
          <div className="register-branding-content">
            <div className="register-logo">
              <div className="register-logo-icon">🎫</div>
              <h1 className="register-logo-text">tiketbaris.id</h1>
            </div>

            <h2 className="register-branding-title">
              Selamat Datang Kembali!
            </h2>

            <p className="register-branding-subtitle">
              Login untuk melanjutkan akses Anda ke event-event seru dan kelola pembelian tiket Anda dengan mudah.
            </p>

            <div className="register-features">
              <div className="register-feature">
                <div className="register-feature-icon">✅</div>
                <div className="register-feature-content">
                  <h3>Transaksi Aman</h3>
                  <p>Sistem pembayaran terenkripsi dan terpercaya</p>
                </div>
              </div>

              <div className="register-feature">
                <div className="register-feature-icon">⚡</div>
                <div className="register-feature-content">
                  <h3>Akses Cepat</h3>
                  <p>Login dan mulai belanja tiket hanya dalam hitungan detik</p>
                </div>
              </div>

              <div className="register-feature">
                <div className="register-feature-icon">📅</div>
                <div className="register-feature-content">
                  <h3>Event Lengkap</h3>
                  <p>Ribuan event dari berbagai kategori untuk Anda</p>
                </div>
              </div>
            </div>

            <div className="register-stats">
              <div className="register-stat">
                <div className="register-stat-number">10K+</div>
                <div className="register-stat-label">Pengguna Aktif</div>
              </div>
              <div className="register-stat">
                <div className="register-stat-number">500+</div>
                <div className="register-stat-label">Event Tersedia</div>
              </div>
              <div className="register-stat">
                <div className="register-stat-number">50K+</div>
                <div className="register-stat-label">Tiket Terjual</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="register-form-container">
          <div className="register-form-wrapper">
            {/* Header */}
            <div className="register-header">
              <div>
                <h2 className="register-title">🔐 Login ke Akun Anda</h2>
                <p className="register-description">Masukkan email dan password Anda untuk melanjutkan</p>
              </div>
              <button
                onClick={() => navigate('/')}
                className="register-home-button"
                type="button"
              >
                🏠 Beranda
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="register-error">
                <span className="register-error-icon">❌</span>
                <span className="register-error-text">{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="register-form">
              {/* Email */}
              <div className="form-group">
                <label className="form-label">
                  <span className="form-label-icon">📧</span>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="nama@email.com"
                  className="form-input"
                />
              </div>

              {/* Password */}
              <div className="form-group">
                <label className="form-label">
                  <span className="form-label-icon">🔒</span>
                  Password
                </label>
                <div className="form-password-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="••••••••"
                    className="form-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="form-password-toggle"
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="register-button"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="register-button-spinner"></span>
                    <span>Logging in...</span>
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    <span>Login Sekarang</span>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="register-divider">
              <span>atau login dengan</span>
            </div>

            {/* Role Selection for Google Login */}
            <div className="form-group">
              <label className="form-label">
                <span className="form-label-icon">🎭</span>
                Login sebagai
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <label style={{ 
                  flex: 1, 
                  padding: '12px', 
                  border: selectedRole === 'user' ? '2px solid #7C3AED' : '2px solid #E5E7EB',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  background: selectedRole === 'user' ? '#F5F3FF' : 'white'
                }}>
                  <input
                    type="radio"
                    name="role"
                    value="user"
                    checked={selectedRole === 'user'}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    style={{ marginRight: '8px' }}
                  />
                  <span style={{ fontWeight: selectedRole === 'user' ? '600' : '400' }}>
                    👤 User (Pembeli)
                  </span>
                </label>
                <label style={{ 
                  flex: 1, 
                  padding: '12px', 
                  border: selectedRole === 'panitia' ? '2px solid #7C3AED' : '2px solid #E5E7EB',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  background: selectedRole === 'panitia' ? '#F5F3FF' : 'white'
                }}>
                  <input
                    type="radio"
                    name="role"
                    value="panitia"
                    checked={selectedRole === 'panitia'}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    style={{ marginRight: '8px' }}
                  />
                  <span style={{ fontWeight: selectedRole === 'panitia' ? '600' : '400' }}>
                    🎭 Panitia
                  </span>
                </label>
              </div>
            </div>

            {/* Google Login */}
            <div className="register-google">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
                theme="outline"
                size="large"
                text="signin_with"
                shape="rectangular"
                logo_alignment="left"
                width="100%"
              />
            </div>

            {/* Footer */}
            <div className="register-footer">
              <p className="register-footer-text">
                Belum punya akun?{' '}
                <button
                  onClick={() => navigate('/register')}
                  className="register-login-link"
                  type="button"
                >
                  📝 Daftar Di Sini
                </button>
              </p>
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
