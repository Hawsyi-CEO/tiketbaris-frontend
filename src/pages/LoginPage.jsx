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
    <div className="min-h-screen bg-slate-50 grid grid-cols-1 md:grid-cols-2 gap-0">
      {/* Brand Section - Responsive */}
      <div className="hidden md:flex bg-gradient-to-br from-red-600 to-red-900 text-white p-12 lg:p-16 items-center justify-center">
        <div className="text-center space-y-6 md:space-y-8">
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-2 md:mb-4">tiketbaris.id</h1>
            <p className="text-lg md:text-xl font-semibold opacity-95">Platform Tiket Terpercaya</p>
          </div>

          <p className="text-sm md:text-base opacity-90 max-w-sm mx-auto leading-relaxed">
            Beli tiket event favorit Anda dengan mudah dan aman. Ribuan event menanti Anda!
          </p>

          <div className="space-y-3 md:space-y-4 pt-6 md:pt-8">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="text-2xl md:text-3xl">✓</div>
              <p className="text-base md:text-lg">Transaksi Aman</p>
            </div>
            <div className="flex items-center gap-3 md:gap-4">
              <div className="text-2xl md:text-3xl">⚡</div>
              <p className="text-base md:text-lg">Pembelian Cepat</p>
            </div>
            <div className="flex items-center gap-3 md:gap-4">
              <div className="text-2xl md:text-3xl">📅</div>
              <p className="text-base md:text-lg">Event Lengkap</p>
            </div>
          </div>
        </div>
      </div>

      {/* Login Form Section */}
      <div className="flex flex-col items-center justify-center px-4 py-12 md:py-0">
        <div className="w-full max-w-sm">
          {/* Header with Home Button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 md:mb-2">Login</h2>
              <p className="text-sm sm:text-base text-gray-600">Akses akun Anda untuk membeli tiket</p>
            </div>
            <button 
              onClick={() => navigate('/')} 
              type="button"
              className="px-3 py-2 sm:px-4 sm:py-2 md:px-4 md:py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"
            >
              ← Beranda
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg mb-4 sm:mb-6 text-sm border border-red-200">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition text-sm sm:text-base"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition text-sm sm:text-base"
                required
              />
            </div>

            <button 
              type="submit" 
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 sm:py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              disabled={loading}
            >
              {loading ? 'Sedang Memproses...' : 'Login'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">atau</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* Google Login */}
          <div className="mb-4 sm:mb-6">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              text="signin_with"
              width="100%"
            />
          </div>

          {/* Sign Up & Forgot Password */}
          <div className="space-y-3 sm:space-y-4 text-center border-t border-gray-200 pt-4 sm:pt-6">
            <div>
              <p className="text-gray-600 text-xs sm:text-sm mb-2">Belum punya akun?</p>
              <button 
                onClick={() => navigate('/register')}
                className="text-red-600 hover:text-red-700 font-semibold text-sm transition-colors"
              >
                Daftar Sekarang
              </button>
            </div>
            <a href="#" className="block text-red-600 hover:text-red-700 text-xs sm:text-xs transition-colors">
              Lupa password?
            </a>
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
