import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

export default function FloatingWhatsApp() {
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);

  // Nomor WhatsApp Admin
  const whatsappNumber = '6285161414022';
  const defaultMessage = 'Halo Admin Tiket Baris, saya butuh bantuan...';

  const handleWhatsAppClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('WhatsApp button clicked!');
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(defaultMessage)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setShowTooltip(false);
  };

  const handleCloseTooltip = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowTooltip(false);
  };

  return (
    <>
      {/* Floating Button */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
        }}
        className="floating-whatsapp-container"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Tooltip */}
        {showTooltip && (
          <div 
            style={{
              position: 'absolute',
              bottom: '100%',
              right: '0',
              marginBottom: '8px',
              animation: 'bounce 1s infinite',
            }}
          >
            <div 
              style={{
                background: 'white',
                padding: '8px 16px',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                border: '2px solid #25D366',
                whiteSpace: 'nowrap',
                position: 'relative',
              }}
            >
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                💬 Butuh Bantuan?
              </p>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>
                Chat Admin WhatsApp
              </p>
              <button
                onClick={handleCloseTooltip}
                style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                <X size={12} />
              </button>
            </div>
          </div>
        )}

        {/* WhatsApp Button */}
        <button
          onClick={handleWhatsAppClick}
          style={{
            background: 'linear-gradient(to right, #25D366, #128C7E)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '64px',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isHovered 
              ? '0 20px 50px rgba(37, 211, 102, 0.5)' 
              : '0 10px 30px rgba(0, 0, 0, 0.3)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            transform: isHovered ? 'scale(1.1)' : 'scale(1)',
            animation: 'pulse 2s infinite',
            position: 'relative',
            zIndex: 10000,
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          aria-label="Chat WhatsApp"
        >
          <MessageCircle size={32} />
        </button>

        {/* Ripple Effect Background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: '#25D366',
            animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
            opacity: 0.2,
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }

        @keyframes ping {
          0% {
            transform: scale(1);
            opacity: 0.2;
          }
          100% {
            transform: scale(1.8);
            opacity: 0;
          }
        }

        @media (max-width: 640px) {
          /* Responsive for mobile - pindah ke kiri bawah agar tidak halangi navbar */
          .floating-whatsapp-container {
            bottom: 90px !important; /* Di atas navbar bottom (biasanya 60-70px) */
            right: 16px !important;
          }
          
          /* Ukuran lebih kecil di mobile */
          .floating-whatsapp-container button {
            width: 56px !important;
            height: 56px !important;
          }
          
          .floating-whatsapp-container button svg {
            width: 28px !important;
            height: 28px !important;
          }
        }
        
        /* Extra safety untuk layar sangat kecil */
        @media (max-width: 480px) {
          .floating-whatsapp-container {
            bottom: 100px !important;
            right: 12px !important;
          }
        }
      `}</style>
    </>
  );
}
