import React, { useState, useEffect } from 'react';
import { Clock, CreditCard, X, AlertCircle, History, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Toast from './Toast';
import { formatRupiah } from '../utils/formatRupiah';

export default function PendingTransactions({ onUpdate }) {
  const navigate = useNavigate();
  const [pendingTx, setPendingTx] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countdowns, setCountdowns] = useState({});
  const [toast, setToast] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(null);

  useEffect(() => {
    console.log('[PENDING TX] Component mounted, pendingTx:', pendingTx);
  }, []); // Only log once on mount

  useEffect(() => {
    console.log('[PENDING TX] useEffect running, fetching transactions...');
    fetchPendingTransactions();
    
    // Update countdowns every second
    const interval = setInterval(() => {
      updateCountdowns();
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchPendingTransactions = async () => {
    try {
      console.log('[PENDING TX] Fetching pending transactions...');
      setLoading(true);
      const response = await api.get('/user/transactions/pending');
      console.log('[PENDING TX] Response:', response.data);
      
      // Filter out cancelled and completed transactions (double safety)
      const activePending = (response.data.transactions || []).filter(
        tx => tx.status === 'pending' && tx.status !== 'cancelled' && tx.status !== 'completed'
      );
      setPendingTx(activePending);
      
      // Initialize countdowns
      const initialCountdowns = {};
      activePending.forEach(tx => {
        initialCountdowns[tx.id] = tx.seconds_remaining;
      });
      setCountdowns(initialCountdowns);
      console.log('[PENDING TX] Found', activePending.length, 'pending transactions');
    } catch (error) {
      console.error('[PENDING TX] Error fetching pending transactions:', error);
      console.error('[PENDING TX] Error response:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const updateCountdowns = () => {
    setCountdowns(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(id => {
        if (updated[id] > 0) {
          updated[id]--;
        }
      });
      return updated;
    });
  };

  const formatCountdown = (seconds) => {
    if (seconds <= 0) return '⏰ Expired';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `⏰ ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleContinuePayment = async (transaction) => {
    try {
      // Get snap token
      const response = await api.get(`/user/transactions/${transaction.id}/snap-token`);
      
      // Re-open Midtrans Snap
      if (window.snap) {
        window.snap.pay(response.data.snap_token, {
          onSuccess: () => {
            alert('Pembayaran berhasil!');
            fetchPendingTransactions();
            if (onUpdate) onUpdate();
          },
          onPending: () => {
            alert('Menunggu pembayaran...');
            fetchPendingTransactions(); // Refresh to update countdown
          },
          onError: () => {
            alert('Pembayaran gagal, silakan coba lagi');
            fetchPendingTransactions(); // Refresh list
          },
          onClose: () => {
            console.log('Snap popup closed');
            // Refresh list when popup closed (user might have paid or not)
            setTimeout(() => {
              fetchPendingTransactions();
            }, 500);
          }
        });
      } else {
        alert('Midtrans Snap belum ready, silakan refresh halaman');
      }
    } catch (error) {
      console.error('Error continuing payment:', error);
      alert(error.response?.data?.error || 'Gagal membuka pembayaran');
      if (error.response?.data?.error?.includes('expired')) {
        fetchPendingTransactions(); // Refresh list
      }
    }
  };

  const handleCancelTransaction = async (id) => {
    try {
      await api.post(`/user/transactions/${id}/cancel`);
      setToast({ message: '✅ Transaksi berhasil dibatalkan', type: 'success' });
      setShowCancelModal(null);
      fetchPendingTransactions();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error cancelling transaction:', error);
      setToast({ 
        message: error.response?.data?.error || 'Gagal membatalkan transaksi', 
        type: 'error' 
      });
      setShowCancelModal(null);
    }
  };

  if (loading) {
    console.log('[PENDING TX] Still loading...');
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading pending transactions...</span>
        </div>
      </div>
    );
  }

  if (pendingTx.length === 0) {
    console.log('[PENDING TX] No pending transactions found, hiding component');
    return null; // Don't show anything if no pending transactions
  }

  console.log('[PENDING TX] Rendering', pendingTx.length, 'pending transactions');

  return (
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl shadow-lg p-6 mb-6 border-2 border-yellow-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-yellow-600" />
          <h2 className="text-xl font-bold text-gray-900">
            🟡 Menunggu Pembayaran ({pendingTx.length})
          </h2>
        </div>
      </div>

      <p className="text-sm text-gray-700 mb-4">
        Kamu punya transaksi yang belum dibayar. Selesaikan pembayaran sebelum waktu habis!
      </p>

      <div className="space-y-3">
        {pendingTx.map(tx => {
          const countdown = countdowns[tx.id] || 0;
          const isExpired = countdown <= 0;
          const isUrgent = countdown > 0 && countdown < 3600; // Less than 1 hour

          return (
            <div 
              key={tx.id} 
              className={`bg-white rounded-xl p-4 border-2 ${
                isExpired ? 'border-red-300' : isUrgent ? 'border-orange-300' : 'border-yellow-300'
              } transition-all hover:shadow-md`}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                {/* Transaction Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {tx.event_image && (
                      <img 
                        src={tx.event_image} 
                        alt={tx.event_name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <h3 className="font-bold text-gray-900">{tx.event_name}</h3>
                      <p className="text-sm text-gray-500">
                        {tx.quantity} tiket • Rp {formatRupiah(tx.total_amount)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-sm font-bold ${
                      isExpired ? 'text-red-600' : isUrgent ? 'text-orange-600' : 'text-blue-600'
                    }`}>
                      {formatCountdown(countdown)}
                    </span>
                    {isUrgent && !isExpired && (
                      <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full font-medium">
                        Segera bayar!
                      </span>
                    )}
                  </div>

                  {/* Virtual Account Number */}
                  {tx.va_number && tx.bank_name && (
                    <div className="mt-2 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                      <p className="text-xs text-gray-600 mb-1">💳 Virtual Account {tx.bank_name}:</p>
                      <div className="flex items-center gap-2">
                        <code className="text-lg font-bold text-green-800 tracking-wider">
                          {tx.va_number}
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(tx.va_number);
                            setToast({ message: '✅ Nomor VA berhasil disalin!', type: 'success' });
                          }}
                          className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition"
                        >
                          Copy
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        📱 Bayar via {tx.bank_name} Mobile Banking → Menu Virtual Account → Masukkan nomor di atas
                      </p>
                    </div>
                  )}

                  {/* Payment Code (for convenience store) */}
                  {tx.payment_code && !tx.va_number && !tx.bill_key && (
                    <div className="mt-2 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                      <p className="text-xs text-gray-600 mb-1">Kode Bayar:</p>
                      <div className="flex items-center gap-2">
                        <code className="text-lg font-bold text-purple-800 tracking-wider">
                          {tx.payment_code}
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(tx.payment_code);
                            setToast({ message: '✅ Kode bayar berhasil disalin!', type: 'success' });
                          }}
                          className="text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700 transition"
                        >
                          Copy
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        🏪 Tunjukkan kode ini ke kasir {tx.bank_name || 'Indomaret/Alfamart'}
                      </p>
                    </div>
                  )}

                  {/* Mandiri Bill Payment */}
                  {tx.bill_key && tx.biller_code && (
                    <div className="mt-2 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                      <p className="text-xs text-gray-700 font-semibold mb-2">🏦 Mandiri Bill Payment</p>
                      
                      <div className="mb-2">
                        <p className="text-xs text-gray-600 mb-1">Biller Code:</p>
                        <div className="flex items-center gap-2">
                          <code className="text-base font-bold text-blue-800 tracking-wider">
                            {tx.biller_code}
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(tx.biller_code);
                              setToast({ message: '✅ Biller Code disalin!', type: 'success' });
                            }}
                            className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Bill Key:</p>
                        <div className="flex items-center gap-2">
                          <code className="text-lg font-bold text-blue-800 tracking-wider">
                            {tx.bill_key}
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(tx.bill_key);
                              setToast({ message: '✅ Bill Key disalin!', type: 'success' });
                            }}
                            className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-2">
                        💳 Bayar via Mandiri Mobile/Internet Banking → Bayar → Multipayment → masukkan kode di atas
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-gray-500 mt-2">
                    Order: {tx.midtrans_order_id?.substring(0, 25)}...
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2">
                  {/* Show Bayar Sekarang only if no payment info yet */}
                  {!isExpired && !tx.va_number && !tx.payment_code && !tx.bill_key && (
                    <button
                      onClick={() => handleContinuePayment(tx)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg"
                    >
                      <CreditCard className="w-4 h-4" />
                      Pilih Metode Bayar
                    </button>
                  )}
                  <button
                    onClick={() => setShowCancelModal(tx.id)}
                    className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                    Batalkan Transaksi
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-xs text-blue-800">
          💡 <strong>Tips:</strong> Transaksi akan otomatis dibatalkan setelah 24 jam. Jika sudah dibatalkan, silakan buat pesanan baru.
        </p>
      </div>

      {/* Button to Transaction History */}
      <div className="mt-4">
        <button
          onClick={() => navigate('/user/transactions')}
          className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg"
        >
          <History className="w-5 h-5" />
          Lihat Riwayat Transaksi Lengkap
        </button>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Batalkan Transaksi?</h3>
                <p className="text-sm text-gray-600">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-6">
              Apakah Anda yakin ingin membatalkan transaksi ini? Anda perlu membuat pesanan baru jika ingin membeli lagi.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(null)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                Tidak, Kembali
              </button>
              <button
                onClick={() => handleCancelTransaction(showCancelModal)}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition font-medium shadow-md hover:shadow-lg"
              >
                Ya, Batalkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={3000}
        />
      )}
    </div>
  );
}
