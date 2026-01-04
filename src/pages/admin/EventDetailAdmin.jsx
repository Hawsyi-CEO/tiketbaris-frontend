import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

export default function EventDetailAdmin() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Form state untuk edit
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    price: '',
    stock: '',
    status: 'active'
  });

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      console.log('Fetching event details for ID:', eventId);
      console.log('Token:', token ? 'Present' : 'Missing');
      
      const response = await axios.get(`/api/admin/event/${eventId}/details`, { headers });
      const eventData = response.data;
      
      console.log('Event data received:', eventData);
      
      setEvent(eventData);
      
      // Format date untuk input type="datetime-local"
      const formattedDate = eventData.date ? new Date(eventData.date).toISOString().slice(0, 16) : '';
      
      setFormData({
        title: eventData.title || '',
        description: eventData.description || '',
        date: formattedDate,
        location: eventData.location || '',
        price: eventData.price || '',
        stock: eventData.stock || '',
        status: eventData.status || 'active'
      });
      
      setError('');
    } catch (err) {
      console.error('Fetch error details:', err);
      console.error('Error response:', err.response);
      
      let errorMessage = 'Gagal memuat detail event';
      
      if (err.response) {
        // Server responded with error status
        const status = err.response.status;
        const data = err.response.data;
        
        if (status === 401 || status === 403) {
          errorMessage = 'Tidak memiliki akses. Silakan login ulang.';
          setTimeout(() => navigate('/login'), 2000);
        } else if (status === 404) {
          errorMessage = 'Event tidak ditemukan';
        } else if (status === 500) {
          errorMessage = `Server error: ${data?.error || 'Internal server error'}`;
        } else {
          errorMessage = data?.error || `HTTP ${status} error`;
        }
      } else if (err.request) {
        // Request was made but no response received
        errorMessage = 'Server tidak dapat dijangkau. Periksa koneksi Anda.';
      } else {
        // Something else happened
        errorMessage = err.message || 'Terjadi kesalahan tidak dikenal';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    
    if (!window.confirm('Apakah Anda yakin ingin menyimpan perubahan?')) return;
    
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      await axios.put(`/api/admin/event/${eventId}`, formData, { headers });
      
      setSuccessMessage('✅ Event berhasil diperbarui!');
      setTimeout(() => {
        setSuccessMessage('');
        fetchEventDetails(); // Refresh data
      }, 2000);
    } catch (err) {
      setError('Gagal update event: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!window.confirm(`⚠️ Apakah Anda yakin ingin menghapus event "${event.title}"?\n\nTindakan ini tidak dapat dibatalkan!`)) return;
    
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      await axios.delete(`/api/admin/event/${eventId}`, { headers });
      
      alert('🗑️ Event berhasil dihapus!');
      navigate('/admin/dashboard');
    } catch (err) {
      alert('❌ Gagal hapus event: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => navigate('/admin/dashboard')}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  const ticketsSold = event?.tickets_sold || 0;
  const ticketsScanned = event?.tickets_scanned || 0;
  const scanPercentage = ticketsSold > 0 ? ((ticketsScanned / ticketsSold) * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-md border-b-4 border-red-600 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/admin/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Kembali"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">📝 Edit Event</h1>
                <p className="text-sm text-gray-600">Admin Management Panel</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/admin/dashboard')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold transition-all"
              >
                🏠 Dashboard
              </button>
              <button 
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-all"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Success Message */}
      {successMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-lg shadow-md">
            <p className="font-semibold">{successMessage}</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stats Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                📊 Statistik Event
              </h2>
              
              {/* Event Status */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Status Event:</p>
                <span className={`inline-block px-4 py-2 rounded-full font-bold text-sm ${
                  event.status === 'active' ? 'bg-green-100 text-green-700' :
                  event.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {event.status === 'active' ? '✅ Active' :
                   event.status === 'pending' ? '⏳ Pending' :
                   '❌ Cancelled'}
                </span>
              </div>

              {/* Panitia Info */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Panitia:</p>
                <p className="font-bold text-gray-800">{event.username || 'N/A'}</p>
                <p className="text-xs text-gray-500">{event.email || ''}</p>
              </div>

              {/* Tickets Stats */}
              <div className="space-y-4">
                {/* Stock */}
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">🎟️ Stok Tiket</span>
                    <span className="text-2xl font-black text-blue-600">{event.stock || 0}</span>
                  </div>
                </div>

                {/* Sold */}
                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">🎫 Tiket Terjual</span>
                    <span className="text-2xl font-black text-purple-600">{ticketsSold}</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    Sisa: <span className="font-bold">{(event.stock || 0) - ticketsSold}</span>
                  </div>
                </div>

                {/* Scanned */}
                <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">✓ Tiket Di-Scan</span>
                    <span className="text-2xl font-black text-emerald-600">{ticketsScanned}</span>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Progress Scan</span>
                      <span className="font-bold">{scanPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${scanPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Revenue */}
                <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">💰 Pendapatan</span>
                  </div>
                  <p className="text-xl font-black text-yellow-700">
                    Rp {((event.price || 0) * ticketsSold).toLocaleString('id-ID')}
                  </p>
                  <div className="mt-2 text-xs text-gray-600">
                    <div>Gross: Rp {((event.price || 0) * ticketsSold).toLocaleString('id-ID')}</div>
                    <div className="text-red-600">Fee (2%): -Rp {(((event.price || 0) * ticketsSold) * 0.02).toLocaleString('id-ID')}</div>
                    <div className="font-bold text-green-600">Net: Rp {(((event.price || 0) * ticketsSold) * 0.98).toLocaleString('id-ID')}</div>
                  </div>
                </div>
              </div>

              {/* Delete Button */}
              <button
                onClick={handleDeleteEvent}
                className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                🗑️ Hapus Event
              </button>
            </div>
          </div>

          {/* Edit Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleUpdateEvent} className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                ✏️ Edit Informasi Event
              </h2>

              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    📌 Judul Event
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none transition-colors"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    📝 Deskripsi
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none transition-colors resize-none"
                    required
                  />
                </div>

                {/* Date & Time */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    📅 Tanggal & Waktu
                  </label>
                  <input
                    type="datetime-local"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none transition-colors"
                    required
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    📍 Lokasi
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none transition-colors"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Price */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      💵 Harga (Rp)
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none transition-colors"
                      required
                    />
                  </div>

                  {/* Stock */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      🎟️ Stok Tiket
                    </label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none transition-colors"
                      required
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    🎚️ Status Event
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none transition-colors"
                  >
                    <option value="pending">⏳ Pending (Menunggu Approval)</option>
                    <option value="active">✅ Active (Event Aktif)</option>
                    <option value="cancelled">❌ Cancelled (Dibatalkan)</option>
                  </select>
                  <p className="mt-2 text-xs text-gray-500">
                    {formData.status === 'pending' && '⚠️ Event pending menunggu persetujuan admin'}
                    {formData.status === 'active' && '✅ Event aktif dan dapat dibeli user'}
                    {formData.status === 'cancelled' && '❌ Event dibatalkan, tidak dapat dibeli'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-8">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white px-6 py-3 rounded-lg font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? '⏳ Menyimpan...' : '💾 Simpan Perubahan'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/admin/dashboard')}
                  className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-semibold transition-all"
                >
                  ❌ Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
