import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { IS_PRODUCTION, API_URL } from '../config/api';
import { formatRupiah } from '../utils/formatRupiah';

const MidtransPayment = ({ eventId, eventTitle, price, initialQuantity = 1, onPaymentSuccess, onPaymentError }) => {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [snapLoaded, setSnapLoaded] = useState(false);
  
  // Update quantity jika initialQuantity berubah
  useEffect(() => {
    setQuantity(initialQuantity);
  }, [initialQuantity]);

  // Load Midtrans Snap script - PRODUCTION MODE
  useEffect(() => {
    const script = document.createElement('script');
    // PRODUCTION Snap URL
    script.src = 'https://app.midtrans.com/snap/snap.js';
    
    // PRODUCTION Client Key (Merchant ID: G424199188)
    script.setAttribute('data-client-key', 'Mid-client-Ms71No4NYCdv7Ri-');
    
    script.onload = () => {
      setSnapLoaded(true);
      console.log('🚀 Midtrans Snap loaded - PRODUCTION MODE');
      console.log('💳 Real payment enabled - Client Key: Mid-client-Ms71No4NYCdv7Ri-');
    };
    script.onerror = () => {
      console.error('Failed to load Midtrans Snap');
      alert('Gagal memuat sistem pembayaran. Silakan refresh halaman.');
    };
    document.head.appendChild(script);

    return () => {
      // Clean up script when component unmounts
      const existingScript = document.querySelector('script[src="https://app.midtrans.com/snap/snap.js"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  const handlePayment = async () => {
    if (!snapLoaded) {
      alert('Midtrans Snap belum dimuat. Silakan coba lagi.');
      return;
    }

    // Check if snap object is available
    if (!window.snap) {
      console.error('Snap object not available');
      alert('Sistem pembayaran belum siap. Silakan refresh halaman.');
      return;
    }

    setLoading(true);

    try {
      // Create Snap Token
      const response = await axios.post(`${API_URL}/midtrans/create-snap-token`, {
        eventId,
        quantity
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      const { snap_token, order_id, total_amount } = response.data;

      console.log('🚀 Payment created (PRODUCTION):', {
        order_id,
        total_amount,
        snap_token: snap_token.substring(0, 20) + '...'
      });

      // Add delay to ensure snap is ready
      setTimeout(() => {
        // Open Midtrans Snap popup
        window.snap.pay(snap_token, {
          onSuccess: async (result) => {
            console.log('Payment success:', result);
            
            // Check payment status
            try {
              const statusResponse = await axios.get(`${API_URL}/midtrans/status/${order_id}`, {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem('token')}`
                }
              });
              
              console.log('Payment status:', statusResponse.data);
              
              if (onPaymentSuccess) {
                onPaymentSuccess(statusResponse.data);
              }
            } catch (statusError) {
              console.error('Error checking payment status:', statusError);
            }
            
            setLoading(false);
          },
          onPending: (result) => {
            console.log('Payment pending:', result);
            alert('Pembayaran Anda sedang diproses. Silakan selesaikan pembayaran.');
            setLoading(false);
          },
          onError: (result) => {
            console.error('Payment error:', result);
            if (onPaymentError) {
              onPaymentError(result);
            }
            alert('Pembayaran gagal. Silakan coba lagi.');
            setLoading(false);
          },
          onClose: () => {
            console.log('Payment popup closed');
            alert('Anda menutup popup pembayaran sebelum menyelesaikan transaksi.');
            setLoading(false);
          }
        });
      }, 500); // 500ms delay

    } catch (error) {
      console.error('Error creating payment:', error);
      alert('Gagal membuat pembayaran: ' + (error.response?.data?.error || error.message));
      setLoading(false);
    }
  };

  const totalAmount = price * quantity;

  return (
    <div className="midtrans-payment bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-bold mb-4">Pembayaran Tiket</h3>
      
      <div className="event-info mb-4 p-4 bg-gray-50 rounded">
        <h4 className="font-semibold">{eventTitle}</h4>
        <p className="text-gray-600">Harga per tiket: Rp {formatRupiah(price)}</p>
      </div>

      <div className="quantity-selector mb-4">
        <label className="block text-sm font-medium mb-2">Jumlah Tiket:</label>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
            disabled={loading}
          >
            -
          </button>
          <span className="w-8 text-center font-medium">{quantity}</span>
          <button 
            onClick={() => setQuantity(quantity + 1)}
            className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
            disabled={loading}
          >
            +
          </button>
        </div>
      </div>

      <div className="payment-summary mb-4 p-4 bg-blue-50 rounded">
        <div className="flex justify-between items-center">
          <span className="font-medium">Total Pembayaran:</span>
          <span className="text-xl font-bold text-blue-600">
            Rp {formatRupiah(totalAmount)}
          </span>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {quantity} tiket × Rp {formatRupiah(price)}
        </p>
      </div>

      <button
        onClick={handlePayment}
        disabled={loading || !snapLoaded}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors mb-3 ${
          loading || !snapLoaded
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
            Memproses...
          </div>
        ) : !snapLoaded ? (
          'Memuat sistem pembayaran...'
        ) : (
          '💳 Bayar dengan Popup (Bermasalah)'
        )}
      </button>

      {/* Production Mode Info */}
      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
        <p className="text-xs text-green-700">
          🔒 <strong>PRODUCTION MODE</strong> - Real payment dengan Midtrans
        </p>
      </div>
    </div>
  );
};

export default MidtransPayment;
