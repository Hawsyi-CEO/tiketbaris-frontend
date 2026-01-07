import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventService, checkoutService } from '../services/apiServices';
import NotificationModal from '../components/NotificationModal';
import Toast from '../components/Toast';
import MidtransPayment from '../components/MidtransPayment';

export default function CheckoutPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [notification, setNotification] = useState({ isOpen: false, type: 'info', title: '', message: '', details: null });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const response = await eventService.getEventById(eventId);
      setEvent(response.data);
    } catch (err) {
      setError('Event tidak ditemukan');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = () => {
    if (quantity < 1 || quantity > event.stock) {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Jumlah Tidak Valid',
        message: 'Jumlah tiket yang Anda masukkan tidak valid. Mohon periksa kembali.',
        details: `Stok tersedia: ${event.stock} tiket`
      });
      return;
    }

    // Show confirmation modal
    setNotification({
      isOpen: true,
      type: 'confirm',
      title: 'Konfirmasi Pembelian',
      message: 'Apakah Anda yakin ingin melanjutkan pembelian tiket ini?',
      details: {
        'Event': event.title,
        'Jumlah Tiket': `${quantity} tiket`,
        'Harga Satuan': `Rp ${event.price.toLocaleString('id-ID')}`,
        'Total Pembayaran': `Rp ${totalPrice.toLocaleString('id-ID')}`
      },
      onConfirm: processCheckout
    });
  };

  const processCheckout = async () => {
    // Tutup modal konfirmasi terlebih dahulu
    setNotification({ ...notification, isOpen: false });
    setProcessing(true);
    setError('');
    
    // Tambahkan delay kecil untuk transisi yang smooth
    await new Promise(resolve => setTimeout(resolve, 400));
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/checkout/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          eventId: parseInt(eventId),
          quantity: parseInt(quantity),
          totalAmount: totalPrice
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Checkout gagal');
      }

      // Tampilkan notifikasi sukses setelah response diterima
      setNotification({
        isOpen: true,
        type: 'success',
        title: 'Pembayaran Berhasil! 🎉',
        message: 'Selamat! Tiket Anda telah berhasil dibeli dan tersimpan di dashboard.',
        details: {
          'ID Transaksi': data.orderId || data.transactionId,
          'Jumlah Tiket': `${quantity} tiket`,
          'Total Bayar': `Rp ${totalPrice.toLocaleString('id-ID')}`,
          'Status': 'Sukses ✅'
        },
        onConfirm: () => {
          setToast({ show: true, message: '🎉 Tiket berhasil dibeli! Menuju dashboard...', type: 'success' });
          setTimeout(() => navigate('/user/dashboard', { state: { fromCheckout: true } }), 1000);
        }
      });
    } catch (err) {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Pembayaran Gagal',
        message: err.message || 'Terjadi kesalahan saat memproses pembayaran. Silakan coba lagi.',
        details: 'Jika masalah berlanjut, hubungi customer service kami.'
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div style={styles.loadingContainer}>
      <div style={styles.spinner}></div>
      <p>Loading event details...</p>
    </div>;
  }

  if (!event) {
    return <div style={styles.errorPage}>{error}</div>;
  }

  const totalPrice = event.price * quantity;

  return (
    <div style={styles.body}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContainer}>
          <button onClick={() => navigate('/')} style={styles.backButton}>
            ← Kembali
          </button>
          <h1 style={styles.headerTitle}>🛒 Checkout Tiket</h1>
          <div style={{width: '80px'}}></div>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        <div style={styles.container}>
          {/* Left Side - Event Details */}
          <div style={styles.leftSide}>
            <div style={styles.eventCard}>
              <div style={styles.imageContainer}>
                <img
                  src={event.image_url || 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+CiAgPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMjAwLDE1MCkiPgogICAgPHRleHQgeD0iMCIgeT0iMCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjIwIiBmb250LXdlaWdodD0iYm9sZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzZiNzI4MCI+CiAgICAgIPCfkZ/vuI8gRXZlbnQgSW1hZ2UKICAgIDwvdGV4dD4KICA8L2c+Cjwvc3ZnPgo='}
                  alt={event.title}
                  style={styles.eventImage}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/400x300?text=Event+Image';
                  }}
                />
              </div>

              <div style={styles.eventInfo}>
                <h2 style={styles.eventTitle}>{event.title}</h2>
                <p style={styles.eventDescription}>{event.description}</p>

                <div style={styles.detailsSection}>
                  <div style={styles.detailItem}>
                    <span style={styles.detailIcon}>📅</span>
                    <div>
                      <p style={styles.detailLabel}>Tanggal</p>
                      <p style={styles.detailValue}>
                        {new Date(event.date).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  <div style={styles.detailItem}>
                    <span style={styles.detailIcon}>📍</span>
                    <div>
                      <p style={styles.detailLabel}>Lokasi</p>
                      <p style={styles.detailValue}>{event.location}</p>
                    </div>
                  </div>

                  <div style={styles.detailItem}>
                    <span style={styles.detailIcon}>🎟️</span>
                    <div>
                      <p style={styles.detailLabel}>Stok Tersedia</p>
                      <p style={styles.detailValue}>{event.stock} tiket</p>
                    </div>
                  </div>

                  <div style={styles.detailItem}>
                    <span style={styles.detailIcon}>👤</span>
                    <div>
                      <p style={styles.detailLabel}>Penyelenggara</p>
                      <p style={styles.detailValue}>{event.username || 'Panitia Event'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Order Summary */}
          <div style={styles.rightSide}>
            <div style={styles.summaryCard}>
              <h3 style={styles.summaryTitle}>📋 Ringkasan Pesanan</h3>

              {error && (
                <div style={styles.errorBox}>
                  <span>❌</span> {error}
                </div>
              )}

              <div style={styles.orderSection}>
                <div style={styles.orderItem}>
                  <span style={styles.orderLabel}>Harga Tiket</span>
                  <span style={styles.orderValue}>Rp {event.price.toLocaleString('id-ID')}</span>
                </div>

                <div style={styles.quantitySection}>
                  <label style={styles.label}>🎫 Jumlah Tiket</label>
                  <div style={styles.quantityControl}>
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      style={styles.quantityBtn}
                      disabled={quantity <= 1}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={event.stock}
                      value={quantity}
                      onChange={(e) => {
                        const val = e.target.value;
                        // Allow empty string for editing
                        if (val === '') {
                          setQuantity('');
                          return;
                        }
                        const numVal = parseInt(val);
                        if (!isNaN(numVal) && numVal >= 1 && numVal <= event.stock) {
                          setQuantity(numVal);
                        }
                      }}
                      onBlur={(e) => {
                        // Reset to 1 if empty or invalid on blur
                        if (e.target.value === '' || parseInt(e.target.value) < 1) {
                          setQuantity(1);
                        }
                      }}
                      style={styles.quantityInput}
                    />
                    <button
                      onClick={() => setQuantity(Math.min(event.stock, quantity + 1))}
                      style={styles.quantityBtn}
                      disabled={quantity >= event.stock}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div style={styles.divider}></div>

                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>Subtotal</span>
                  <span style={styles.summaryValue}>
                    Rp {(event.price * quantity).toLocaleString('id-ID')}
                  </span>
                </div>

                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>Biaya Admin</span>
                  <span style={styles.summaryValue}>Rp 0</span>
                </div>

                <div style={{...styles.divider, marginBottom: '15px'}}></div>

                <div style={styles.totalRow}>
                  <span style={styles.totalLabel}>Total Pembayaran</span>
                  <span style={styles.totalValue}>
                    Rp {totalPrice.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <MidtransPayment
                eventId={eventId}
                eventTitle={event.title}
                price={event.price}
                initialQuantity={quantity}
                onPaymentSuccess={(paymentData) => {
                  setNotification({
                    isOpen: true,
                    type: 'success',
                    title: 'Pembayaran Berhasil! 🎉',
                    message: 'Tiket Anda telah berhasil dibeli dan QR code telah digenerate.',
                    details: {
                      'Order ID': paymentData.order_id,
                      'Jumlah Tiket': `${quantity} tiket`,
                      'Total Bayar': `Rp ${paymentData.gross_amount?.toLocaleString('id-ID')}`,
                      'Status': 'Sukses ✅'
                    },
                    onConfirm: () => {
                      // Update local event stock
                      if (paymentData.remaining_stock !== undefined) {
                        setEvent(prev => ({...prev, stock: paymentData.remaining_stock}));
                      }
                      setToast({ show: true, message: '🎉 Tiket berhasil dibeli! Menuju halaman tiket...', type: 'success' });
                      setTimeout(() => navigate('/user/my-tickets'), 1000);
                    }
                  });
                }}
                onPaymentError={(error) => {
                  setNotification({
                    isOpen: true,
                    type: 'error',
                    title: 'Pembayaran Gagal',
                    message: error.message || 'Terjadi kesalahan saat memproses pembayaran. Silakan coba lagi.',
                    details: 'Jika masalah berlanjut, hubungi customer service kami.'
                  });
                }}
              />

              <div style={styles.paymentInfo}>
                <p style={styles.paymentTitle}>💳 Metode Pembayaran</p>
                <p style={styles.paymentDesc}>
                  Mode Manual: Pembayaran akan diproses secara otomatis untuk testing
                </p>
              </div>

              <div style={styles.securityBadge}>
                <span>🔒</span> Transaksi Aman & Terenkripsi
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        details={notification.details}
        onConfirm={notification.onConfirm}
        confirmText={notification.type === 'confirm' ? 'Ya, Lanjutkan' : 'OK'}
        cancelText="Batal"
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

const styles = {
  body: {
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'Poppins', sans-serif"
  },
  header: {
    background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.15)',
    position: 'sticky',
    top: 0,
    zIndex: 1000
  },
  headerContainer: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '12px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    width: '100%'
  },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: 'none',
    padding: '8px 14px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: "'Poppins', sans-serif",
    fontWeight: '600',
    fontSize: '13px',
    transition: 'all 0.3s ease',
    whiteSpace: 'nowrap',
    flexShrink: 0
  },
  headerTitle: {
    color: 'white',
    fontSize: '18px',
    fontWeight: '700',
    margin: 0,
    textAlign: 'center',
    flex: 1
  },
  main: {
    flex: 1,
    maxWidth: '1400px',
    margin: '0 auto',
    width: '100%',
    padding: '40px 20px'
  },
  container: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '40px',
    alignItems: 'start'
  },
  leftSide: {
    display: 'flex'
  },
  eventCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    width: '100%',
    border: '1px solid #e5e7eb'
  },
  imageContainer: {
    overflow: 'hidden',
    height: '300px',
    backgroundColor: '#f3f4f6'
  },
  eventImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  eventInfo: {
    padding: '30px'
  },
  eventTitle: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#1f2937',
    margin: '0 0 10px 0'
  },
  eventDescription: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 25px 0',
    lineHeight: '1.6'
  },
  detailsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  detailItem: {
    display: 'flex',
    gap: '15px',
    padding: '15px',
    backgroundColor: '#f9fafb',
    borderRadius: '10px'
  },
  detailIcon: {
    fontSize: '20px',
    minWidth: '30px'
  },
  detailLabel: {
    fontSize: '12px',
    color: '#9ca3af',
    margin: 0,
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  detailValue: {
    fontSize: '14px',
    color: '#1f2937',
    margin: '5px 0 0 0',
    fontWeight: '600'
  },
  rightSide: {
    display: 'flex'
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    padding: '30px',
    width: '100%',
    border: '1px solid #e5e7eb',
    position: 'sticky',
    top: '100px'
  },
  summaryTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1f2937',
    margin: '0 0 20px 0'
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    padding: '12px 16px',
    borderRadius: '10px',
    marginBottom: '20px',
    fontSize: '13px',
    border: '1px solid #fecaca',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  orderSection: {
    marginBottom: '20px'
  },
  orderItem: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '15px'
  },
  orderLabel: {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: '600'
  },
  orderValue: {
    fontSize: '14px',
    color: '#1f2937',
    fontWeight: '700'
  },
  quantitySection: {
    marginBottom: '15px'
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
    display: 'block',
    marginBottom: '8px'
  },
  quantityControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '0',
    border: '1px solid #d1d5db',
    borderRadius: '10px',
    overflow: 'hidden'
  },
  quantityBtn: {
    backgroundColor: 'white',
    border: 'none',
    width: '40px',
    height: '40px',
    cursor: 'pointer',
    fontFamily: "'Poppins', sans-serif",
    fontSize: '16px',
    fontWeight: '700',
    transition: 'all 0.2s ease'
  },
  quantityInput: {
    flex: 1,
    border: 'none',
    height: '40px',
    textAlign: 'center',
    fontSize: '14px',
    fontFamily: "'Poppins', sans-serif",
    fontWeight: '600',
    backgroundColor: '#f9fafb'
  },
  divider: {
    height: '1px',
    backgroundColor: '#e5e7eb',
    margin: '15px 0'
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px'
  },
  summaryLabel: {
    fontSize: '13px',
    color: '#6b7280'
  },
  summaryValue: {
    fontSize: '13px',
    color: '#1f2937',
    fontWeight: '600'
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '15px',
    backgroundColor: '#f9fafb',
    borderRadius: '10px'
  },
  totalLabel: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#1f2937'
  },
  totalValue: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#dc2626'
  },
  checkoutButton: {
    width: '100%',
    padding: '14px',
    backgroundColor: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
    backgroundImage: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    fontFamily: "'Poppins', sans-serif",
    marginTop: '20px',
    transition: 'all 0.3s ease'
  },
  paymentInfo: {
    backgroundColor: '#f9fafb',
    padding: '15px',
    borderRadius: '10px',
    marginTop: '20px'
  },
  paymentTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#1f2937',
    margin: '0 0 5px 0'
  },
  paymentDesc: {
    fontSize: '12px',
    color: '#6b7280',
    margin: 0
  },
  securityBadge: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
    padding: '12px',
    borderRadius: '10px',
    textAlign: 'center',
    fontSize: '12px',
    fontWeight: '600',
    marginTop: '15px'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f8fafc'
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid #e5e7eb',
    borderTop: '4px solid #dc2626',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px'
  },
  errorPage: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    fontSize: '18px',
    color: '#dc2626',
    fontWeight: '600'
  }
};
