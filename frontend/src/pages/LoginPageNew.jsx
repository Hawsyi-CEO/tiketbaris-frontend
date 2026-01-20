import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { authService } from '../services/apiServices';
import NotificationModal from '../components/NotificationModal';
import Toast from '../components/Toast';
import RoleSelectionModal from '../components/RoleSelectionModal';
import './RegisterPage.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ isOpen: false, type: 'info', title: '', message: '' });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [pendingCredential, setPendingCredential] = useState(null);
  const [roleModalLoading, setRoleModalLoading] = useState(false);
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
      console.log('[GOOGLE AUTH] Credential received:', {
        hasCredential: !!credentialResponse.credential,
        credentialLength: credentialResponse.credential?.length
      });
      // Step 1: Try login without role (check if user exists)
      const response = await authService.googleAuth(credentialResponse.credential, null);
      console.log('[GOOGLE AUTH] Backend response:', response.data);
      
      // If backend returns requiresRole, show modal
      if (response.data.requiresRole) {
        setPendingCredential(credentialResponse.credential);
        setRoleModalOpen(true);
        setLoading(false);
        return;
      }
      
      // User exists, proceed with login
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
        title: 'Login Google Gagal',
        message: err.response?.data?.message || 'Terjadi kesalahan saat login dengan Google'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelection = async (selectedRole) => {
    try {
      setRoleModalLoading(true);
      // Step 2: Create account with selected role
      const response = await authService.googleAuth(pendingCredential, selectedRole);
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      setRoleModalOpen(false);
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
      setRoleModalOpen(false);
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Registrasi Gagal',
        message: err.response?.data?.message || 'Terjadi kesalahan saat membuat akun'
      });
    } finally {
      setRoleModalLoading(false);
      setPendingCredential(null);
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

            {/* Powered by SimpaSkor */}
            <div className="mt-8 pt-6 border-t border-white border-opacity-20 text-center">
              <p className="text-white text-opacity-60 text-sm mb-3">Powered by</p>
              <a 
                href="https://simpaskor.id" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block hover:scale-105 transition-transform"
              >
                <img 
                  src="/logo-simpaskor.png" 
                  alt="SimpaSkor" 
                  className="h-10 mx-auto opacity-80 hover:opacity-100 transition-opacity"
                />
              </a>
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

            {/* Google Login */}
            <div className="register-google">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
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

      {/* Role Selection Modal */}
      <RoleSelectionModal
        isOpen={roleModalOpen}
        onSelectRole={handleRoleSelection}
        onClose={() => {
          setRoleModalOpen(false);
          setPendingCredential(null);
        }}
        loading={roleModalLoading}
      />
    </div>
  );
}
