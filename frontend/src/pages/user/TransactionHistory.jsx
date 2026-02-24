import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  CreditCard,
  Copy,
  Eye,
  Filter,
  ArrowLeft,
  Ticket
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import api from '../../services/api';
import { formatRupiah } from '../../utils/formatRupiah';

export default function TransactionHistory() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, completed, cancelled
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [countdowns, setCountdowns] = useState({});

  useEffect(() => {
    fetchTransactions();
    
    // Setup Socket.io for real-time ticket status updates
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.id) {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5020/api';
      const socketUrl = API_URL.replace('/api', '');
      const socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true
      });
      
      socket.on('connect', () => {
        console.log('🔌 Connected to socket server');
        socket.emit('joinUser', user.id);
      });
      
      // Listen for ticket scan events
      socket.on('ticketScanned', (data) => {
        console.log('🎫 Ticket scanned, updating history:', data);
        // Update transaction ticket counts
        setTransactions(prevTransactions => 
          prevTransactions.map(tx => {
            // Find if this ticket belongs to this transaction
            const hasTicket = tx.tickets_count > 0;
            if (hasTicket) {
              // Decrement active, increment scanned
              return {
                ...tx,
                active_tickets: Math.max(0, (tx.active_tickets || 0) - 1),
                scanned_tickets: (tx.scanned_tickets || 0) + 1
              };
            }
            return tx;
          })
        );
      });
      
      return () => {
        socket.disconnect();
      };
    }
  }, []);

  // Countdown timer for pending transactions
  useEffect(() => {
    const interval = setInterval(() => {
      setTransactions(prev => {
        const updated = prev.map(tx => {
          if (tx.status === 'pending' && tx.seconds_remaining > 0) {
            return { ...tx, seconds_remaining: tx.seconds_remaining - 1 };
          }
          return tx;
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/user/transactions/history');
      
      // Fix image paths - prepend production URL if needed
      const transactions = (response.data.transactions || []).map(tx => {
        if (tx.event_image && !tx.event_image.startsWith('http')) {
          // If image path is relative, prepend production backend URL
          tx.event_image = `https://tiketbaris.id/backend${tx.event_image}`;
        }
        return tx;
      });
      
      setTransactions(transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      alert('Gagal memuat riwayat transaksi');
    } finally {
      setLoading(false);
    }
  };

  const handleContinuePayment = async (transaction) => {
    try {
      const response = await api.get(`/user/transactions/${transaction.id}/snap-token`);
      
      if (window.snap) {
        window.snap.pay(response.data.snap_token, {
          onSuccess: () => {
            alert('Pembayaran berhasil!');
            fetchTransactions();
          },
          onPending: () => {
            alert('Menunggu pembayaran...');
            fetchTransactions();
          },
          onError: () => {
            alert('Pembayaran gagal');
            fetchTransactions();
          },
          onClose: () => {
            setTimeout(() => fetchTransactions(), 500);
          }
        });
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Gagal membuka pembayaran');
    }
  };

  const handleCancelTransaction = async (id) => {
    if (!confirm('Yakin ingin membatalkan transaksi?')) return;
    
    try {
      await api.post(`/user/transactions/${id}/cancel`);
      alert('Transaksi dibatalkan');
      fetchTransactions();
    } catch (error) {
      alert('Gagal membatalkan transaksi');
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    alert(`✅ ${label} berhasil disalin!`);
  };

  const formatCountdown = (seconds) => {
    if (seconds <= 0) return 'Expired';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock, label: 'Menunggu' },
      completed: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Berhasil' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle, label: 'Dibatalkan' },
      expired: { bg: 'bg-gray-100', text: 'text-gray-800', icon: AlertCircle, label: 'Kadaluarsa' }
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="w-4 h-4" />
        {badge.label}
      </span>
    );
  };

  const filteredTransactions = filter === 'all' 
    ? transactions 
    : transactions.filter(tx => tx.status === filter);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat riwayat transaksi...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/user/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Kembali ke Dashboard</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Riwayat Transaksi</h1>
          <p className="text-gray-600">Semua transaksi pembelian tiket Anda</p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-5 h-5 text-gray-600" />
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Semua ({transactions.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'pending' 
                  ? 'bg-yellow-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending ({transactions.filter(t => t.status === 'pending').length})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'completed' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Berhasil ({transactions.filter(t => t.status === 'completed').length})
            </button>
            <button
              onClick={() => setFilter('cancelled')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'cancelled' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Dibatalkan ({transactions.filter(t => t.status === 'cancelled').length})
            </button>
          </div>
        </div>

        {/* Transactions List */}
        {filteredTransactions.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Tidak ada transaksi</h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? 'Anda belum memiliki transaksi' 
                : `Tidak ada transaksi dengan status "${filter}"`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTransactions.map(tx => {
              const isPending = tx.status === 'pending';
              const timeRemaining = tx.seconds_remaining || 0;
              const isExpired = isPending && timeRemaining <= 0;
              const isUrgent = isPending && timeRemaining > 0 && timeRemaining < 3600;

              return (
                <div 
                  key={tx.id}
                  className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-6"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    {/* Event Image */}
                    {tx.event_image && (
                      <img 
                        src={tx.event_image}
                        alt={tx.event_name}
                        className="w-full lg:w-32 h-32 object-cover rounded-lg"
                      />
                    )}

                    {/* Transaction Info */}
                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{tx.event_name}</h3>
                          <p className="text-sm text-gray-500">
                            {new Date(tx.transaction_date).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        {getStatusBadge(tx.status)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div>
                          <p className="text-sm text-gray-600">Order ID</p>
                          <p className="font-mono text-sm font-medium">{tx.midtrans_order_id}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total</p>
                          <p className="text-lg font-bold text-gray-900">
                            Rp {formatRupiah(tx.total_amount)}
                          </p>
                          <p className="text-xs text-gray-500">{tx.quantity} tiket</p>
                        </div>
                      </div>

                      {/* Ticket Status Info - Only show for completed transactions */}
                      {tx.status === 'completed' && tx.quantity > 0 && (
                        <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Ticket className="w-4 h-4 text-blue-600" />
                            <p className="text-sm font-semibold text-gray-700">Status Tiket:</p>
                          </div>
                          <div className="flex items-center gap-4 flex-wrap">
                            {tx.active_tickets > 0 && (
                              <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                                <span className="text-sm font-medium text-gray-700">
                                  {tx.active_tickets} Tiket Aktif
                                </span>
                              </div>
                            )}
                            {tx.scanned_tickets > 0 && (
                              <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                                <span className="text-sm font-medium text-gray-700">
                                  {tx.scanned_tickets} Tiket Terpakai
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Ticket Status Info - Only show for completed transactions */}
                      {tx.status === 'completed' && tx.quantity > 0 && (
                        <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Ticket className="w-4 h-4 text-blue-600" />
                            <p className="text-sm font-semibold text-gray-700">Status Tiket:</p>
                          </div>
                          <div className="flex items-center gap-4 flex-wrap">
                            {tx.active_tickets > 0 && (
                              <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                                <span className="text-sm font-medium text-gray-700">
                                  {tx.active_tickets} Tiket Aktif
                                </span>
                              </div>
                            )}
                            {tx.scanned_tickets > 0 && (
                              <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                                <span className="text-sm font-medium text-gray-700">
                                  {tx.scanned_tickets} Tiket Terpakai
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Countdown for pending */}
                      {isPending && !isExpired && (
                        <div className={`p-3 rounded-lg mb-3 ${
                          isUrgent ? 'bg-orange-50 border border-orange-200' : 'bg-blue-50 border border-blue-200'
                        }`}>
                          <p className="text-sm font-medium text-gray-700 mb-1">Waktu Pembayaran:</p>
                          <p className={`font-mono text-2xl font-bold ${
                            isUrgent ? 'text-orange-600' : 'text-blue-600'
                          }`}>
                            ⏰ {formatCountdown(timeRemaining)}
                          </p>
                          {isUrgent && (
                            <p className="text-xs text-orange-700 mt-1">⚠️ Segera selesaikan pembayaran!</p>
                          )}
                        </div>
                      )}

                      {/* Payment Info - VA Number */}
                      {tx.va_number && tx.bank_name && (
                        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-300 mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-semibold text-gray-700">
                              💳 Virtual Account {tx.bank_name}
                            </p>
                            <button
                              onClick={() => copyToClipboard(tx.va_number, 'Nomor VA')}
                              className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition"
                            >
                              <Copy className="w-3 h-3" />
                              Copy
                            </button>
                          </div>
                          <code className="block text-2xl font-bold text-green-800 tracking-wider mb-2">
                            {tx.va_number}
                          </code>
                          <p className="text-xs text-gray-600">
                            📱 Bayar via <strong>{tx.bank_name} Mobile Banking</strong> → Menu <strong>Virtual Account</strong> → Masukkan nomor di atas
                          </p>
                        </div>
                      )}

                      {/* Mandiri Bill Payment */}
                      {tx.bill_key && tx.biller_code && (
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-300 mb-3">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-semibold text-gray-900">
                              🏦 Mandiri Bill Payment
                            </p>
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs text-gray-600">Biller Code:</p>
                                <button
                                  onClick={() => copyToClipboard(tx.biller_code, 'Biller Code')}
                                  className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition"
                                >
                                  <Copy className="w-3 h-3" />
                                  Copy
                                </button>
                              </div>
                              <code className="block text-lg font-bold text-blue-800 tracking-wider">
                                {tx.biller_code}
                              </code>
                            </div>
                            
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs text-gray-600">Bill Key:</p>
                                <button
                                  onClick={() => copyToClipboard(tx.bill_key, 'Bill Key')}
                                  className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition"
                                >
                                  <Copy className="w-3 h-3" />
                                  Copy
                                </button>
                              </div>
                              <code className="block text-2xl font-bold text-blue-800 tracking-wider">
                                {tx.bill_key}
                              </code>
                            </div>
                          </div>
                          
                          <div className="mt-3 p-3 bg-white rounded-lg">
                            <p className="text-xs font-semibold text-gray-900 mb-2">Cara Bayar:</p>
                            <ol className="text-xs text-gray-700 space-y-1 list-decimal list-inside">
                              <li>Buka Mandiri Mobile / Internet Banking</li>
                              <li>Pilih <strong>Bayar → Multipayment</strong></li>
                              <li>Masukkan <strong>Biller Code</strong> di atas</li>
                              <li>Masukkan <strong>Bill Key</strong> di atas</li>
                              <li>Konfirmasi pembayaran</li>
                            </ol>
                          </div>
                        </div>
                      )}

                      {/* Waiting for payment method selection */}
                      {isPending && !tx.va_number && !tx.payment_code && !tx.bill_key && (
                        <div className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border-2 border-yellow-300 mb-3">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-semibold text-gray-900 mb-1">
                                ⏳ Nomor Pembayaran Belum Tersedia
                              </p>
                              <p className="text-xs text-gray-700 mb-2">
                                Klik tombol <strong>"Bayar Sekarang"</strong> di bawah, lalu pilih metode pembayaran (Bank Transfer). 
                                Nomor Virtual Account akan muncul otomatis setelah Anda memilih bank.
                              </p>
                              <p className="text-xs text-yellow-700 font-medium">
                                💡 Jangan tutup popup sebelum memilih bank untuk mendapatkan nomor VA
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Payment Code */}
                      {tx.payment_code && !tx.va_number && !tx.bill_key && (
                        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-300 mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-semibold text-gray-700">
                              🏪 Kode Bayar {tx.bank_name || 'Convenience Store'}
                            </p>
                            <button
                              onClick={() => copyToClipboard(tx.payment_code, 'Kode Bayar')}
                              className="flex items-center gap-1 px-3 py-1 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition"
                            >
                              <Copy className="w-3 h-3" />
                              Copy
                            </button>
                          </div>
                          <code className="block text-2xl font-bold text-purple-800 tracking-wider mb-2">
                            {tx.payment_code}
                          </code>
                          <p className="text-xs text-gray-600">
                            Tunjukkan kode ini ke kasir Indomaret atau Alfamart untuk melakukan pembayaran
                          </p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        {isPending && !isExpired && (
                          <button
                            onClick={() => handleContinuePayment(tx)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                          >
                            <CreditCard className="w-4 h-4" />
                            Bayar Sekarang
                          </button>
                        )}
                        {isPending && (
                          <button
                            onClick={() => handleCancelTransaction(tx.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-medium"
                          >
                            <XCircle className="w-4 h-4" />
                            Batalkan
                          </button>
                        )}
                        {tx.status === 'completed' && (
                          <button
                            onClick={() => navigate(`/transaksi/${tx.id}/tiket`)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition font-medium shadow-md"
                          >
                            <Ticket className="w-4 h-4" />
                            🎟️ Lihat Tiket
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
