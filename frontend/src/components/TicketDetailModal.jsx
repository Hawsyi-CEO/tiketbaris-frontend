import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

export default function TicketDetailModal({ ticket, isOpen, onClose }) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    console.log('🎫 TicketDetailModal BOTTOM SHEET v2.0 - Jan 24 2026');
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

  // Touch handlers for swipe down to close on mobile
  const handleTouchStart = (e) => {
    setStartY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const diff = e.touches[0].clientY - startY;
    if (diff > 0) {
      setCurrentY(diff);
    }
  };

  const handleTouchEnd = () => {
    if (currentY > 100) {
      onClose();
    }
    setCurrentY(0);
    setIsDragging(false);
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

  const isMobile = window.innerWidth <= 768;

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
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.3s ease-out'
      }}
      onClick={onClose}
    >
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
          @keyframes modalBounce {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        `}
      </style>

      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: isMobile ? '24px 24px 0 0' : '24px',
          maxWidth: isMobile ? '100%' : '500px',
          width: '100%',
          maxHeight: isMobile ? '95vh' : '90vh',
          overflow: 'auto',
          position: 'relative',
          boxShadow: '0 -4px 60px rgba(0, 0, 0, 0.4)',
          transform: isDragging ? `translateY(${currentY}px)` : 'translateY(0)',
          transition: isDragging ? 'none' : 'transform 0.3s ease-out',
          animation: isMobile ? 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'modalBounce 0.3s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={isMobile ? handleTouchStart : undefined}
        onTouchMove={isMobile ? handleTouchMove : undefined}
        onTouchEnd={isMobile ? handleTouchEnd : undefined}
      >
        {/* Drag indicator for mobile - swipe down handle */}
        {isMobile && (
          <div style={{
            padding: '12px 0 8px 0',
            display: 'flex',
            justifyContent: 'center',
            cursor: 'grab',
            touchAction: 'pan-y'
          }}>
            <div style={{
              width: '40px',
              height: '5px',
              backgroundColor: '#d1d5db',
              borderRadius: '3px'
            }}></div>
          </div>
        )}

        {/* Header with gradient */}
        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          padding: isMobile ? '20px' : '24px',
          borderTopLeftRadius: isMobile ? '24px' : '24px',
          borderTopRightRadius: isMobile ? '24px' : '24px',
          position: 'relative'
        }}>
          {/* Close button - larger for mobile */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: isMobile ? '16px' : '20px',
              right: isMobile ? '16px' : '20px',
              background: 'rgba(255, 255, 255, 0.3)',
              border: 'none',
              borderRadius: '50%',
              width: isMobile ? '48px' : '44px',
              height: isMobile ? '48px' : '44px',
              minWidth: isMobile ? '48px' : '44px',
              minHeight: isMobile ? '48px' : '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white',
              fontSize: isMobile ? '32px' : '28px',
              fontWeight: 'bold',
              transition: 'all 0.2s',
              zIndex: 10,
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.3)',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation'
            }}
            aria-label="Tutup"
          >
            ×
          </button>
          
          <div style={{ textAlign: 'center', color: 'white', paddingRight: '48px' }}>
            <div style={{ fontSize: isMobile ? '56px' : '48px', marginBottom: '8px' }}>🎫</div>
            <h2 style={{ fontSize: isMobile ? '26px' : '24px', fontWeight: 'bold', margin: 0 }}>E-Ticket</h2>
            <p style={{ margin: '8px 0 0 0', opacity: 0.95, fontSize: isMobile ? '15px' : '14px' }}>
              Tunjukkan QR code ini saat masuk event
            </p>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: isMobile ? '20px' : '24px' }}>
          {/* QR Code */}
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '24px',
            padding: isMobile ? '16px' : '20px',
            background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
            borderRadius: '16px'
          }}>
            {qrCodeUrl ? (
              <img 
                src={qrCodeUrl} 
                alt="QR Code" 
                style={{ 
                  width: '100%', 
                  maxWidth: isMobile ? '240px' : '250px',
                  height: 'auto',
                  aspectRatio: '1 / 1',
                  margin: '0 auto',
                  display: 'block',
                  border: '8px solid white',
                  borderRadius: '12px',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)'
                }} 
              />
            ) : (
              <div style={{ 
                width: '100%', 
                maxWidth: isMobile ? '240px' : '250px',
                aspectRatio: '1 / 1',
                margin: '0 auto', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <div className="spinner"></div>
              </div>
            )}
            <p style={{ 
              marginTop: '16px', 
              fontSize: isMobile ? '13px' : '12px', 
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
            padding: isMobile ? '16px' : '20px',
            marginBottom: '16px'
          }}>
            <h3 style={{ 
              fontSize: isMobile ? '17px' : '18px', 
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
            border: '1px solid #93c5fd',
            marginBottom: '16px'
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

          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            marginTop: '20px',
            flexDirection: 'column',
            paddingBottom: isMobile ? '8px' : '0'
          }}>
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
                padding: isMobile ? '16px' : '14px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: isMobile ? '17px' : '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
              }}
            >
              💾 Download QR Code
            </button>

            {/* Large close button - very prominent for mobile */}
            <button
              onClick={onClose}
              style={{
                width: '100%',
                padding: isMobile ? '16px' : '14px',
                background: '#374151',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: isMobile ? '17px' : '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
              }}
            >
              {isMobile ? '✕ Tutup' : '← Tutup'}
            </button>
          </div>

          {/* Swipe hint for mobile */}
          {isMobile && (
            <p style={{
              textAlign: 'center',
              fontSize: '13px',
              color: '#9ca3af',
              marginTop: '16px',
              marginBottom: '4px',
              fontWeight: '500'
            }}>
              💡 Geser ke bawah atau tap di luar untuk menutup
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
