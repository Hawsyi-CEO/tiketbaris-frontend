import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PaymentNotification = ({ notification, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
      setIsExiting(false);

      // Auto close after 10 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  const handleViewTickets = () => {
    handleClose();
    navigate('/user/my-tickets');
  };

  if (!isVisible || !notification) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 pointer-events-none">
      <div 
        className={`
          bg-white rounded-2xl shadow-2xl border-2 border-green-500 
          max-w-md w-full pointer-events-auto
          transform transition-all duration-300 ease-out
          ${isExiting ? 'translate-y-[-100%] opacity-0' : 'translate-y-0 opacity-100'}
        `}
      >
        {/* Header with animation */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 rounded-t-2xl relative overflow-hidden">
          {/* Animated background */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-white animate-pulse"></div>
          </div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white rounded-full p-3 animate-bounce">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Pembayaran Berhasil!</h3>
                <p className="text-green-100 text-sm">Tiket siap digunakan</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:text-green-100 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Order ID:</span>
              <span className="font-mono font-semibold text-gray-900">{notification.orderId}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Jumlah Tiket:</span>
              <span className="font-semibold text-gray-900">{notification.quantity}x</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total Pembayaran:</span>
              <span className="font-semibold text-green-600">
                Rp {notification.amount?.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-green-800">
                <p className="font-medium">Tiket Anda sudah aktif!</p>
                <p className="text-green-700">Cek halaman tiket saya untuk melihat detail dan QR code</p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleViewTickets}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
            >
              Lihat Tiket Saya
            </button>
            <button
              onClick={handleClose}
              className="px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-200 rounded-b-2xl overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-emerald-600 animate-progress"
            style={{ animationDuration: '10s' }}
          ></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        .animate-progress {
          animation: progress linear forwards;
        }
      `}</style>
    </div>
  );
};

export default PaymentNotification;
