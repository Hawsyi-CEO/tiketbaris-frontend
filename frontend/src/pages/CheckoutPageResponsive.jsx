import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ResponsiveLayout, ResponsiveCard, InteractiveButton, ResponsiveInput, ResponsiveGrid, NotificationToast } from '../components/ResponsiveComponents';
import axios from 'axios';
import { API_URL, DOMAIN } from '../config/api';
import './CheckoutPage.css';

const CheckoutPageResponsive = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const event = location.state?.event;
  
  const [checkoutData, setCheckoutData] = useState({
    quantity: 1,
    name: '',
    email: '',
    phone: '',
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: 'info', message: '' });
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  
  useEffect(() => {
    if (!event) {
      navigate('/');
      return;
    }

    // Check if event has expired
    const eventDate = new Date(event.date);
    const now = new Date();
    if (eventDate < now) {
      showNotification('error', '⏰ Event ini sudah lewat dan tidak dapat dibeli');
      setTimeout(() => navigate('/'), 2000);
      return;
    }

    // Check if event is out of stock
    if (event.stock <= 0) {
      showNotification('error', '🚫 Tiket untuk event ini sudah habis');
      setTimeout(() => navigate('/'), 2000);
      return;
    }
    
    // Pre-fill user data if available
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.username) {
      setCheckoutData(prev => ({
        ...prev,
        name: user.username,
        email: user.email || ''
      }));
    }
  }, [event, navigate]);

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
  };

  const handleInputChange = (field, value) => {
    setCheckoutData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateTotal = () => {
    return event.price * checkoutData.quantity;
  };

  // Load Midtrans Snap script
  useEffect(() => {
    // Check if script already exists
    const existingScript = document.querySelector('script[src*="snap.js"]');
    if (existingScript) {
      console.log('✅ Midtrans Snap script already loaded');
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://app.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', 'Mid-client-Ms71No4NYCdv7Ri-');
    
    script.onload = () => {
      console.log('🚀 Midtrans Snap loaded - PRODUCTION MODE');
    };
    
    script.onerror = () => {
      console.error('❌ Failed to load Midtrans Snap script');
      showNotification('error', 'Gagal memuat sistem pembayaran. Silakan refresh halaman.');
    };
    
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.querySelector('script[src*="snap.js"]');
      if (scriptToRemove) {
        document.head.removeChild(scriptToRemove);
      }
    };
  }, []);

  // Check if Midtrans Snap is loaded
  useEffect(() => {
    // Wait for Snap to be available
    const checkSnap = setInterval(() => {
      if (window.snap) {
        console.log('✅ Midtrans Snap loaded successfully');
        clearInterval(checkSnap);
      }
    }, 100);

    // Timeout after 10 seconds
    const timeout = setTimeout(() => {
      clearInterval(checkSnap);
      if (!window.snap) {
        console.error('❌ Midtrans Snap failed to load after 10 seconds');
        showNotification('error', 'Sistem pembayaran gagal dimuat. Silakan refresh halaman.');
      }
    }, 10000);

    return () => {
      clearInterval(checkSnap);
      clearTimeout(timeout);
    };
  }, []);

  const handleSubmit = async (e) => {
    e?.preventDefault();

    if (!window.snap) {
      showNotification('error', 'Sistem pembayaran belum siap. Silakan refresh halaman.');
      return;
    }
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      // Create Snap Token from backend
      const response = await axios.post(`${API_URL}/midtrans/create-snap-token`, {
        eventId: event.id,
        quantity: checkoutData.quantity
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const { snap_token, order_id, total_amount } = response.data;

      console.log('Payment created:', { order_id, total_amount });

      // Open Midtrans Snap popup
      window.snap.pay(snap_token, {
        onSuccess: async (result) => {
          console.log('🎉 Payment success (PRODUCTION):', result);
          showNotification('success', '✅ Pembayaran berhasil! Memproses tiket...');
          
          // PRODUCTION MODE: Webhook akan otomatis create tickets
          // Tidak perlu manual finish transaction
          console.log('🚀 Webhook will handle ticket creation automatically');
          
          setTimeout(() => {
            navigate('/user/dashboard', { 
              state: { 
                message: 'Pembayaran berhasil! Tiket Anda sedang diproses.',
                orderId: order_id
              }
            });
          }, 1500);
        },
        onPending: (result) => {
          console.log('Payment pending:', result);
          showNotification('info', '⏳ Pembayaran sedang diproses');
          setLoading(false);
        },
        onError: (result) => {
          console.error('Payment error:', result);
          showNotification('error', '❌ Pembayaran gagal. Silakan coba lagi.');
          setLoading(false);
        },
        onClose: () => {
          console.log('Payment popup closed');
          showNotification('info', 'Pembayaran dibatalkan');
          setLoading(false);
        }
      });
      
    } catch (error) {
      console.error('Checkout error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      showNotification('error', 'Gagal membuat pembayaran: ' + (error.response?.data?.error || error.response?.data?.details || error.message));
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods = [
    { id: 'bca', name: 'BCA Virtual Account', icon: '🏦', type: 'bank' },
    { id: 'mandiri', name: 'Mandiri Virtual Account', icon: '🏧', type: 'bank' },
    { id: 'bni', name: 'BNI Virtual Account', icon: '🏪', type: 'bank' },
    { id: 'gopay', name: 'GoPay', icon: '💚', type: 'ewallet' },
    { id: 'ovo', name: 'OVO', icon: '🟣', type: 'ewallet' },
    { id: 'dana', name: 'DANA', icon: '🔵', type: 'ewallet' },
    { id: 'shopeepay', name: 'ShopeePay', icon: '🧡', type: 'ewallet' }
  ];

  if (!event) {
    return (
      <ResponsiveLayout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-xl font-semibold text-gray-600">Event tidak ditemukan</h2>
            <InteractiveButton 
              variant="primary" 
              onClick={() => navigate('/')}
              className="mt-4"
            >
              🏠 Kembali ke Beranda
            </InteractiveButton>
          </div>
        </div>
      </ResponsiveLayout>
    );
  }

  return (
    <ResponsiveLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        {/* Header */}
        <nav className="glass-effect sticky top-0 z-50 border-b border-white border-opacity-20">
          <div className="container-responsive py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <InteractiveButton
                  variant="secondary"
                  size="small"
                  onClick={() => navigate(-1)}
                >
                  ← Kembali
                </InteractiveButton>
                <h1 className="text-xl font-bold text-gray-900">🛒 Checkout</h1>
              </div>
            </div>
          </div>
        </nav>

        <div className="section-padding">
          <div className="container-responsive max-w-4xl">
            {/* Single Column Layout */}
            <div className="space-y-6">
                {/* Event Summary Card */}
                <ResponsiveCard className="checkout-card-enter">
                  <h2 className="heading-card mb-6 checkout-title">📋 Detail Event</h2>
                  
                  <div className="space-y-4">
                    {/* Event Image - Full Width */}
                    <div className="w-full h-48 sm:h-64 rounded-xl overflow-hidden bg-gradient-to-br from-blue-200 to-purple-200 checkout-event-image">
                      <img
                        src={event.image_url 
                          ? (event.image_url.startsWith('http') ? event.image_url : `${DOMAIN}${event.image_url}`)
                          : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTVlN2ViIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzljYTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPvCfj5/vuI8gRXZlbnQgSW1hZ2U8L3RleHQ+PC9zdmc+'
                        }
                        alt={event.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTVlN2ViIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzljYTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPvCfj5/vuI8gRXZlbnQgSW1hZ2U8L3RleHQ+PC9zdmc+';
                        }}
                      />
                    </div>
                    
                    {/* Event Details */}
                    <div className="space-y-4">
                      <h3 className="text-2xl font-bold text-gray-900">{event.title}</h3>
                      
                      {/* Event Info Grid */}
                      <div className="checkout-info-grid">
                        <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                          <span className="text-2xl">📅</span>
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Tanggal</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {new Date(event.date).toLocaleDateString('id-ID', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                          <span className="text-2xl">📍</span>
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Lokasi</p>
                            <p className="text-sm font-semibold text-gray-900">{event.location}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                          <span className="text-2xl">🎫</span>
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Tiket Tersisa</p>
                            <p className="text-sm font-semibold text-green-600">
                              {event.stock || 0} tiket
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                          <span className="text-2xl">💰</span>
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Harga/Tiket</p>
                            <p className="text-lg font-bold text-green-600">
                              Rp {event.price?.toLocaleString('id-ID') || '0'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Event Description */}
                      {event.description && (
                        <div className="pt-4 border-t border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">📝 Deskripsi Event</h4>
                          <div className="checkout-description text-sm text-gray-600 leading-relaxed">
                            {event.description.split('\n').map((line, i) => (
                              <p key={i}>{line || '\u00A0'}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </ResponsiveCard>

                {/* Pilih Jumlah Tiket */}
                <ResponsiveCard>
                  <h2 className="heading-card mb-6">🎫 Pilih Jumlah Tiket</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-6">
                      <button
                        type="button"
                        onClick={() => handleInputChange('quantity', Math.max(1, checkoutData.quantity - 1))}
                        className="w-16 h-16 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-2xl transition-all shadow-md hover:shadow-lg"
                      >
                        −
                      </button>
                      <div className="text-center">
                        <input
                          type="number"
                          min="1"
                          max={event.stock || 1}
                          value={checkoutData.quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            const maxVal = Math.min(val, event.stock || 1);
                            handleInputChange('quantity', Math.max(1, maxVal));
                          }}
                          className="w-32 text-center text-4xl font-bold p-4 border-2 border-blue-500 rounded-xl focus:ring-4 focus:ring-blue-300 focus:border-blue-600 transition-all"
                        />
                        <p className="text-sm text-gray-500 mt-2">Jumlah Tiket</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleInputChange('quantity', Math.min(event.stock || 1, checkoutData.quantity + 1))}
                        disabled={checkoutData.quantity >= (event.stock || 1)}
                        className="w-16 h-16 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold text-2xl transition-all shadow-md hover:shadow-lg"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">
                        💡 Stok tersedia: <span className="font-semibold text-green-600">{event.stock || 0} tiket</span>
                      </p>
                    </div>
                  </div>
                </ResponsiveCard>

                {/* Ringkasan Pesanan - Dipindah ke bawah */}
                <ResponsiveCard className="checkout-summary-card">
                  <h2 className="heading-card mb-6">💰 Ringkasan Pesanan</h2>
                  
                  {/* Info Pembeli Otomatis */}
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <h3 className="text-sm font-semibold text-blue-900 mb-3">👤 Informasi Pembeli</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Nama:</span>
                        <span className="font-semibold text-blue-900">{checkoutData.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Email:</span>
                        <span className="font-semibold text-blue-900">{checkoutData.email}</span>
                      </div>
                    </div>
                    <p className="text-xs text-blue-600 mt-2">💡 Data diambil dari profil Anda</p>
                  </div>

                  {/* Rincian Harga */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b">
                      <span className="text-gray-600">Event</span>
                      <span className="font-semibold text-gray-900 text-right">{event.title}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-3 border-b">
                      <span className="text-gray-600">Harga Tiket</span>
                      <span className="font-semibold">
                        Rp {event.price.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-3 border-b">
                      <span className="text-gray-600">Jumlah</span>
                      <span className="font-semibold text-blue-600">{checkoutData.quantity} tiket</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-3 border-b">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-semibold">
                        Rp {(event.price * checkoutData.quantity).toLocaleString('id-ID')}
                      </span>
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-900">Total Pembayaran</span>
                        <span className="text-2xl font-bold text-green-600">
                          Rp {calculateTotal().toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Tombol Konfirmasi Pembayaran */}
                  <div className="mt-8 space-y-3">
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? '⏳ Memproses Pembayaran...' : '💳 Konfirmasi & Bayar Sekarang'}
                    </button>
                    
                    <button
                      onClick={() => navigate(-1)}
                      className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all"
                    >
                      🔙 Kembali
                    </button>

                    {/* Info Keamanan */}
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-800 text-sm">
                        <span className="text-xl">🔒</span>
                        <span className="font-semibold">Transaksi 100% Aman & Terpercaya - PRODUCTION MODE</span>
                      </div>
                    </div>
                  </div>
                </ResponsiveCard>
              </div>
            </div>
          </div>

        {/* Notifications */}
        <NotificationToast
          type={notification.type}
          message={notification.message}
          isVisible={notification.show}
          onClose={() => setNotification({ ...notification, show: false })}
        />
      </div>
    </ResponsiveLayout>
  );
};

export default CheckoutPageResponsive;