import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { authService } from '../services/apiServices';
import NotificationModal from '../components/NotificationModal';
import Toast from '../components/Toast';

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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setNotification({
        isOpen: true,
        type: 'warning',
        title: 'Password Tidak Cocok',
        message: 'Password dan konfirmasi password harus sama.',
        details: 'Silakan periksa kembali password Anda'
      });
      return;
    }

    if (formData.password.length < 6) {
      setNotification({
        isOpen: true,
        type: 'warning',
        title: 'Password Terlalu Pendek',
        message: 'Password harus minimal 6 karakter.',
        details: 'Gunakan kombinasi huruf dan angka untuk keamanan lebih baik'
      });
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
          'Role': formData.role === 'user' ? 'Pengguna' : 'Panitia'
        },
        onConfirm: () => {
          setToast({ show: true, message: '✅ Akun berhasil dibuat! Menuju halaman login...', type: 'success' });
          setTimeout(() => navigate('/login', { state: { fromRegister: true } }), 1000);
        }
      });
    } catch (err) {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Registrasi Gagal',
        message: err.response?.data?.error || 'Terjadi kesalahan saat mendaftar. Silakan coba lagi.',
        details: 'Pastikan semua data sudah benar dan email belum terdaftar'
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
            <p className="register-brand-subtitle">Bergabunglah Dengan Kami</p>
            <p className="register-brand-description">
              Mulai petualangan Anda dengan membeli tiket untuk event-event seru! Daftar sekarang dan dapatkan akses ke ribuan event eksklusif.
            </p>
            <div className="register-benefits">
              <div className="register-benefit">
                <span>🎯</span>
                <p>Pilih Event Favorit</p>
              </div>
              <div className="register-benefit">
                <span>💳</span>
                <p>Pembayaran Mudah</p>
              </div>
              <div className="register-benefit">
                <span>🎊</span>
                <p>Nikmati Event</p>
              </div>
            </div>
          </div>
        </div>

        <div className="register-right">
          <div className="register-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
              <div>
                <h2 className="register-title">📝 Buat Akun Baru</h2>
                <p className="register-subtitle">Isi data Anda di bawah ini</p>
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
                <label className="form-label">👤 Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="username123"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">📧 Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="nama@email.com"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">🔒 Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">✓ Konfirmasi Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">👥 Daftar Sebagai</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="user">🎫 Pembeli Tiket</option>
                  <option value="panitia">🎪 Penyelenggara Event</option>
                </select>
              </div>

              <button type="submit" className="register-button" disabled={loading}>
                {loading ? '⏳ Loading...' : '✨ Daftar Sekarang'}
              </button>
            </form>

            <div className="register-footer">
              <p>Sudah punya akun?</p>
              <button 
                onClick={() => navigate('/login')}
                className="register-login-link"
              >
                🔐 Login Di Sini
              </button>
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
