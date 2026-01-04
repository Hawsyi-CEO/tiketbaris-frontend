import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

export default function TicketDetailModal({ ticket, isOpen, onClose }) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    if (isOpen && ticket) {
      generateQRCode();
    }
  }, [isOpen, ticket]);

  const generateQRCode = async () => {
    try {
      const url = await QRCode.toDataURL(ticket.ticket_code, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(url);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  if (!isOpen || !ticket) return null;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { bg: 'bg-green-100', text: 'text-green-800', label: '✅ Aktif', icon: '✓' },
      scanned: { bg: 'bg-blue-100', text: 'text-blue-800', label: '✓ Sudah di-scan', icon: '✓' },
      used: { bg: 'bg-gray-100', text: 'text-gray-800', label: '📅 Digunakan', icon: '✓' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: '❌ Dibatalkan', icon: '×' }
    };
    const badge = badges[status] || badges.active;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '24px',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient */}
        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          padding: '24px',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          position: 'relative'
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white',
              fontSize: '24px',
              fontWeight: 'bold',
              transition: 'background 0.3s'
            }}
            onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
            onMouseOut={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
          >
            ×
          </button>
          <div style={{ textAlign: 'center', color: 'white' }}>
            <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎫</div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>E-Ticket</h2>
            <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: '14px' }}>Tunjukkan QR code ini saat masuk event</p>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* QR Code */}
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '24px',
            padding: '20px',
            background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
            borderRadius: '16px'
          }}>
            {qrCodeUrl ? (
              <img 
                src={qrCodeUrl} 
                alt="QR Code" 
                style={{ 
                  width: '250px', 
                  height: '250px',
                  margin: '0 auto',
                  border: '8px solid white',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }} 
              />
            ) : (
              <div style={{ width: '250px', height: '250px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="spinner"></div>
              </div>
            )}
            <p style={{ 
              marginTop: '16px', 
              fontSize: '12px', 
              color: '#6b7280',
              fontWeight: '600',
              letterSpacing: '1px'
            }}>
              {ticket.ticket_code}
            </p>
          </div>

          {/* Status */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            {getStatusBadge(ticket.ticket_status)}
            {ticket.scanned_at && (
              <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                Di-scan pada: {formatDate(ticket.scanned_at)} {formatTime(ticket.scanned_at)}
              </p>
            )}
          </div>

          {/* Event Details */}
          <div style={{ 
            background: '#f9fafb',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '16px'
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: 'bold', 
              color: '#1f2937',
              marginBottom: '16px'
            }}>
              {ticket.event_title}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                <span style={{ fontSize: '20px' }}>📅</span>
                <div>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Tanggal Event</p>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                    {formatDate(ticket.event_date)}
                  </p>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                <span style={{ fontSize: '20px' }}>📍</span>
                <div>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Lokasi</p>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                    {ticket.event_location}
                  </p>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                <span style={{ fontSize: '20px' }}>💰</span>
                <div>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Harga Tiket</p>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                    Rp {ticket.ticket_price?.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                <span style={{ fontSize: '20px' }}>🛒</span>
                <div>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Dibeli Pada</p>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                    {formatDate(ticket.purchased_at)} {formatTime(ticket.purchased_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div style={{
            background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid #93c5fd'
          }}>
            <p style={{ fontSize: '14px', fontWeight: '600', color: '#1e40af', margin: '0 0 8px 0' }}>
              ℹ️ Petunjuk Penggunaan:
            </p>
            <ul style={{ fontSize: '13px', color: '#1e40af', margin: 0, paddingLeft: '20px' }}>
              <li>Tunjukkan QR code ini kepada petugas saat masuk event</li>
              <li>Screenshot atau simpan tiket ini sebagai backup</li>
              <li>Tiket hanya bisa di-scan sekali</li>
              <li>Datang 15-30 menit lebih awal untuk proses check-in</li>
            </ul>
          </div>

          {/* Download Button */}
          <button
            onClick={() => {
              const link = document.createElement('a');
              link.download = `ticket-${ticket.ticket_code}.png`;
              link.href = qrCodeUrl;
              link.click();
            }}
            style={{
              width: '100%',
              marginTop: '20px',
              padding: '14px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.3)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            💾 Download QR Code
          </button>
        </div>
      </div>
    </div>
  );
}
