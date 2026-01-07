import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../config/api';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: formData.email,
        password: formData.password
      });

      if (response.data.token && response.data.user?.role === 'admin') {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userRole', 'admin');
        navigate('/admin/dashboard');
      } else {
        setError('Akun ini bukan admin. Gunakan halaman login user.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Login gagal. Periksa email dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-500 via-pink-500 to-purple-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Card */}
        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-6 sm:p-8 mb-6 text-center">
          <div className="text-5xl sm:text-6xl mb-4">🎭</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-red-100 text-sm sm:text-base">
            Tiket Baris Management System
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              🔐 Login Admin
            </h2>
            <p className="text-sm text-gray-600">
              Masuk untuk mengelola platform
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              ❌ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                📧 Email Admin
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm sm:text-base"
                placeholder="admin@gmail.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                🔑 Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm sm:text-base"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              {loading ? '⏳ Memproses...' : '🚀 Login Sekarang'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              ← Kembali ke Halaman Utama
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-white text-opacity-80">
            🔒 Akses terbatas untuk admin saja
          </p>
        </div>
      </div>
    </div>
  );
}
