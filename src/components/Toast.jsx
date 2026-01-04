import { useEffect, useState } from 'react';

export default function Toast({ message, type = 'success', duration = null, onClose, showButton = true }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    
    // Only auto-close if duration is provided and showButton is false
    if (duration && !showButton) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, showButton]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 300);
  };

  if (!isVisible && !isExiting) return null;

  const config = {
    success: {
      icon: '✅',
      bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      shadow: 'rgba(16, 185, 129, 0.4)'
    },
    error: {
      icon: '❌',
      bg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      shadow: 'rgba(239, 68, 68, 0.4)'
    },
    warning: {
      icon: '⚠️',
      bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      shadow: 'rgba(245, 158, 11, 0.4)'
    },
    info: {
      icon: 'ℹ️',
      bg: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      shadow: 'rgba(59, 130, 246, 0.4)'
    }
  };

  const style = config[type] || config.success;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        background: style.bg,
        color: 'white',
        padding: '16px 24px',
        borderRadius: '12px',
        boxShadow: `0 10px 40px ${style.shadow}, 0 4px 12px rgba(0,0,0,0.1)`,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        minWidth: '300px',
        maxWidth: '500px',
        animation: isExiting 
          ? 'slideOut 0.3s ease-out forwards' 
          : 'slideIn 0.3s ease-out',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      <span style={{ fontSize: '24px', lineHeight: 1 }}>{style.icon}</span>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontWeight: '600', fontSize: '15px' }}>{message}</p>
      </div>
      {showButton && (
        <button
          onClick={handleClose}
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            border: 'none',
            color: style.bg.includes('green') ? '#059669' : 
                   style.bg.includes('red') ? '#dc2626' : 
                   style.bg.includes('yellow') ? '#d97706' : '#2563eb',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            transition: 'all 0.2s',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.05)';
            e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          }}
        >
          OK
        </button>
      )}

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(400px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
