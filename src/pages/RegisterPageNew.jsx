import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { authService } from '../services/apiServices';
import NotificationModal from '../components/NotificationModal';
import Toast from '../components/Toast';
import './RegisterPage.css';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ isOpen: false, type: 'info', title: '', message: '' });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Clear error on input change
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      setError('Username harus diisi');
      return false;
    }
    if (formData.username.length < 3) {
      setError('Username minimal 3 karakter');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email harus diisi');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Format email tidak valid');
      return false;
    }
    if (!formData.password) {
      setError('Password harus diisi');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password minimal 8 karakter');
      return false;
    }
    // Enhanced password validation
    const hasUpper = /[A-Z]/.test(formData.password);
    const hasLower = /[a-z]/.test(formData.password);
    const hasNumber = /[0-9]/.test(formData.password);
    const hasSpecial = /[@$!%*?&]/.test(formData.password);
    
    if (!hasUpper) {
      setError('Password harus mengandung minimal 1 huruf besar (A-Z)');
      return false;
    }
    if (!hasLower) {
      setError('Password harus mengandung minimal 1 huruf kecil (a-z)');
      return false;
    }
    if (!hasNumber) {
      setError('Password harus mengandung minimal 1 angka (0-9)');
      return false;
    }
    if (!hasSpecial) {
      setError('Password harus mengandung minimal 1 karakter khusus (@$!%*?&)');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await authService.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role
      });
      
      setNotification({
        isOpen: true,
        type: 'success',
        title: 'Registrasi Berhasil! 🎉',
        message: 'Akun Anda telah berhasil dibuat. Silakan login untuk melanjutkan.',
        details: {
          'Username': formData.username,
          'Email': formData.email,
          'Role': formData.role === 'user' ? 'Pembeli Tiket' : 'Penyelenggara Event'
        },
        onConfirm: () => {
          setToast({ show: true, message: '✅ Akun berhasil dibuat! Menuju halaman login...', type: 'success' });
          setTimeout(() => navigate('/login', { state: { fromRegister: true } }), 1000);
        }
      });
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Terjadi kesalahan saat mendaftar. Silakan coba lagi.';
      const requirements = err.response?.data?.requirements;
      
      // Build detailed error message
      let detailsMessage = '';
      if (requirements && typeof requirements === 'object') {
        detailsMessage = Object.values(requirements).join('\n');
      } else if (typeof requirements === 'string') {
        detailsMessage = requirements;
      } else {
        detailsMessage = 'Pastikan semua data sudah benar dan email belum terdaftar';
      }

      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Registrasi Gagal',
        message: errorMessage,
        details: detailsMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      
      // Send credential to backend for verification
      const response = await authService.googleAuth(credentialResponse.credential);
      
      // Store token
      localStorage.setItem('token', response.data.token);
      
      setToast({ 
        show: true, 
        message: response.data.isNewUser ? '✅ Berhasil daftar dengan Google!' : '✅ Berhasil login dengan Google!', 
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
              Bergabunglah dengan Platform Tiket Terpercaya
            </h2>
            
            <p className="register-branding-subtitle">
              Mulai petualangan Anda dengan membeli tiket untuk event-event seru atau menjadi penyelenggara event profesional!
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
                <div className="register-feature-icon">🚀</div>
                <div className="register-feature-content">
                  <h3>Proses Cepat</h3>
                  <p>Pendaftaran dan pembelian tiket hanya dalam hitungan menit</p>
                </div>
              </div>
              
              <div className="register-feature">
                <div className="register-feature-icon">🎯</div>
                <div className="register-feature-content">
                  <h3>Event Lengkap</h3>
                  <p>Ribuan event dari berbagai kategori untuk Anda</p>
                </div>
              </div>

              <div className="register-feature">
                <div className="register-feature-icon">💼</div>
                <div className="register-feature-content">
                  <h3>Kelola Event</h3>
                  <p>Dashboard lengkap untuk penyelenggara event</p>
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
                <div className="register-stat-label">Event Sukses</div>
              </div>
              <div className="register-stat">
                <div className="register-stat-number">4.9★</div>
                <div className="register-stat-label">Rating</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Registration Form */}
        <div className="register-form-container">
          <div className="register-form-wrapper">
            {/* Header */}
            <div className="register-header">
              <div>
                <h2 className="register-title">📝 Buat Akun Baru</h2>
                <p className="register-description">Bergabung sekarang dan nikmati pengalaman terbaik</p>
              </div>
              <button 
                onClick={() => navigate('/')} 
                className="register-home-button"
                type="button"
              >
                <span>🏠</span> Beranda
              </button>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="register-error-alert">
                <span className="register-error-icon">⚠️</span>
                <span className="register-error-text">{error}</span>
              </div>
            )}

            {/* Google Sign Up */}
            <div className="register-google-section">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                text="signup_with"
                width="100%"
                theme="outline"
                size="large"
                logo_alignment="left"
              />
            </div>

            {/* Divider */}
            <div className="register-divider">
              <span className="register-divider-line"></span>
              <span className="register-divider-text">atau daftar dengan email</span>
              <span className="register-divider-line"></span>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="register-form">
              {/* Username */}
              <div className="register-form-group">
                <label className="register-label">
                  <span className="register-label-icon">👤</span>
                  <span className="register-label-text">Username</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Masukkan username Anda"
                  className="register-input"
                  disabled={loading}
                  required
                />
                <p className="register-input-hint">Minimal 3 karakter</p>
              </div>

              {/* Email */}
              <div className="register-form-group">
                <label className="register-label">
                  <span className="register-label-icon">📧</span>
                  <span className="register-label-text">Email</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="nama@email.com"
                  className="register-input"
                  disabled={loading}
                  required
                />
              </div>

              {/* Role Selection */}
              <div className="register-form-group">
                <label className="register-label">
                  <span className="register-label-icon">👥</span>
                  <span className="register-label-text">Daftar Sebagai</span>
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="register-select"
                  disabled={loading}
                >
                  <option value="user">🎫 Pembeli Tiket</option>
                  <option value="panitia">🎪 Penyelenggara Event</option>
                </select>
              </div>

              {/* Password */}
              <div className="register-form-group">
                <label className="register-label">
                  <span className="register-label-icon">🔒</span>
                  <span className="register-label-text">Password</span>
                </label>
                <div className="register-password-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="register-input"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="register-password-toggle"
                    tabIndex="-1"
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                <p className="register-input-hint">
                  Min 8 karakter, huruf besar, huruf kecil, angka, dan karakter khusus (@$!%*?&)
                </p>
              </div>

              {/* Confirm Password */}
              <div className="register-form-group">
                <label className="register-label">
                  <span className="register-label-icon">✓</span>
                  <span className="register-label-text">Konfirmasi Password</span>
                </label>
                <div className="register-password-wrapper">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="register-input"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="register-password-toggle"
                    tabIndex="-1"
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                className="register-submit-button"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="register-spinner"></span>
                    <span>Mendaftar...</span>
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    <span>Daftar Sekarang</span>
                  </>
                )}
              </button>

              {/* Terms */}
              <p className="register-terms">
                Dengan mendaftar, Anda menyetujui{' '}
                <a href="/terms" className="register-link">Syarat & Ketentuan</a>
                {' '}dan{' '}
                <a href="/privacy" className="register-link">Kebijakan Privasi</a>
              </p>
            </form>

            {/* Footer */}
            <div className="register-footer">
              <p className="register-footer-text">
                Sudah punya akun?{' '}
                <button 
                  onClick={() => navigate('/login')}
                  className="register-login-link"
                  type="button"
                >
                  🔐 Login Di Sini
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
        onConfirm={notification.onConfirm}
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