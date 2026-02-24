import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Calendar,
  Ticket as TicketIcon
} from 'lucide-react';
import QRCode from 'qrcode';
import io from 'socket.io-client';
import api from '../../services/api';
import { formatRupiah } from '../../utils/formatRupiah';

export default function TransactionTickets() {
  const { transactionId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [transaction, setTransaction] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState({});
  const [qrCodes, setQrCodes] = useState({});

  useEffect(() => {
    fetchTickets();
    
    // Setup Socket.io connection for real-time updates
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
        console.log('🎫 Ticket scanned:', data);
        // Update ticket status in real-time
        setTickets(prevTickets => 
          prevTickets.map(ticket => 
            ticket.ticket_id === data.ticket_id
              ? { ...ticket, ticket_status: 'scanned', scanned_at: data.scanned_at }
              : ticket
          )
        );
      });
      
      return () => {
        socket.disconnect();
      };
    }
  }, [transactionId]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      
      // Fetch all user tickets
      const response = await api.get('/qr-tickets/my-tickets');
      const allTickets = response.data.tickets || [];
      
      // Filter tickets by transaction_id
      const txTickets = allTickets.filter(ticket => 
        ticket.transaction_id === parseInt(transactionId)
      );
      
      if (txTickets.length === 0) {
        alert('Tiket tidak ditemukan untuk transaksi ini');
        navigate('/transaction-history');
        return;
      }
      
      setTickets(txTickets);
      
      // Generate QR codes untuk semua tiket (SAMA seperti Dashboard)
      await generateQRCodesForTickets(txTickets);
      
      // Get transaction info from first ticket
      if (txTickets.length > 0) {
        const firstTicket = txTickets[0];
        
        // Calculate total - use ticket_price or paid_amount
        const pricePerTicket = firstTicket.paid_amount || firstTicket.ticket_price || 0;
        const totalAmount = pricePerTicket * txTickets.length;
        
        console.log('Transaction calculation:', {
          pricePerTicket,
          quantity: txTickets.length,
          totalAmount,
          firstTicket
        });
        
        setTransaction({
          id: transactionId,
          event_title: firstTicket.event_title,
          event_date: firstTicket.event_date,
          event_location: firstTicket.event_location,
          event_image: firstTicket.event_image,
          total_amount: totalAmount,
          quantity: txTickets.length,
          transaction_date: firstTicket.transaction_date,
          payment_status: firstTicket.payment_status
        });
      }
      
    } catch (error) {
      console.error('Error fetching tickets:', error);
      alert('Gagal memuat tiket');
      navigate('/transaction-history');
    } finally {
      setLoading(false);
    }
  };

  // Generate QR codes dengan format SAMA seperti Dashboard
  const generateQRCodesForTickets = async (ticketList) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const qrCodesMap = {};
      
      for (const ticket of ticketList) {
        // Format QR SAMA PERSIS seperti Dashboard
        const qrData = JSON.stringify({
          ticket_code: ticket.ticket_code,
          ticket_id: ticket.ticket_id,
          event_id: ticket.event_id,
          event_title: ticket.event_title,
          user_id: user.id,
          timestamp: new Date().toISOString()
        });
        
        const qrCodeDataURL = await QRCode.toDataURL(qrData, {
          width: 400,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        
        qrCodesMap[ticket.ticket_id] = qrCodeDataURL;
      }
      
      setQrCodes(qrCodesMap);
    } catch (error) {
      console.error('Error generating QR codes:', error);
    }
  };

  const downloadQR = (ticket) => {
    const qrCodeDataURL = qrCodes[ticket.ticket_id];
    if (!qrCodeDataURL) {
      alert('QR code belum siap');
      return;
    }
    
    const link = document.createElement('a');
    link.href = qrCodeDataURL;
    link.download = `tiket-${ticket.ticket_code}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const shareTicket = async (ticket) => {
    const shareData = {
      title: `Tiket ${ticket.event_title}`,
      text: `Kode Tiket: ${ticket.ticket_code}\nEvent: ${ticket.event_title}\nLokasi: ${ticket.event_location}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.text);
        alert('✅ Info tiket berhasil disalin!');
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const copyCode = (ticket) => {
    navigator.clipboard.writeText(ticket.ticket_code);
    setCopyFeedback({ [ticket.ticket_id]: true });
    setTimeout(() => {
      setCopyFeedback({ [ticket.ticket_id]: false });
    }, 2000);
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Aktif' },
      scanned: { bg: 'bg-blue-100', text: 'text-blue-800', icon: CheckCircle, label: 'Terpakai' },
      used: { bg: 'bg-gray-100', text: 'text-gray-800', icon: CheckCircle, label: 'Sudah Digunakan' },
      expired: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle, label: 'Kadaluarsa' }
    };
    const badge = badges[status] || badges.active;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${badge.bg} ${badge.text}`}>
        <Icon className="w-4 h-4" />
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-700">Memuat Tiket...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/transaction-history')}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition mb-3"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">Kembali ke Riwayat</span>
          </button>
          
          {transaction && (
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-full p-3">
                <TicketIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">{transaction.event_title}</h1>
                <p className="text-sm text-gray-600">{tickets.length} Tiket</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 pb-20">
        
        {/* Transaction Summary */}
        {transaction && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">📋 Ringkasan Transaksi</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Tanggal Event</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(transaction.event_date).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-red-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Lokasi</p>
                  <p className="font-semibold text-gray-900">{transaction.event_location}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <TicketIcon className="w-5 h-5 text-green-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Jumlah Tiket</p>
                  <p className="font-semibold text-gray-900">{transaction.quantity} Tiket</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-purple-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Tanggal Pembelian</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(transaction.transaction_date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">Total Pembayaran:</span>
                <span className="text-2xl font-bold text-blue-600">
                  Rp {formatRupiah(transaction.total_amount || 0)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tickets List */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900 mb-4">🎟️ Daftar Tiket Anda</h2>
          
          {tickets.map((ticket, index) => (
            <div 
              key={ticket.ticket_id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-white font-bold text-lg">Tiket #{index + 1}</h3>
                  {getStatusBadge(ticket.ticket_status)}
                </div>
              </div>
              
              <div className="p-6">
                {/* QR Code */}
                <div className="flex justify-center mb-6">
                  <div className="bg-white p-4 rounded-2xl shadow-lg border-4 border-gray-100">
                    {qrCodes[ticket.ticket_id] ? (
                      <img 
                        src={qrCodes[ticket.ticket_id]} 
                        alt="QR Code"
                        className="w-64 h-64 md:w-80 md:h-80"
                      />
                    ) : (
                      <div className="w-64 h-64 md:w-80 md:h-80 flex items-center justify-center bg-gray-100 rounded-lg">
                        <p className="text-gray-500">Loading QR...</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ticket Code */}
                <div className="mb-6">
                  <label className="text-sm text-gray-600 mb-2 block">Kode Tiket:</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-gray-100 px-4 py-3 rounded-lg text-xl font-bold text-gray-900 tracking-wider border-2 border-gray-300">
                      {ticket.ticket_code}
                    </code>
                    <button
                      onClick={() => copyCode(ticket)}
                      className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 font-semibold"
                    >
                      <Copy className="w-5 h-5" />
                      {copyFeedback[ticket.ticket_id] ? '✓ Copied!' : 'Copy'}
                    </button>
                  </div>
                  {copyFeedback[ticket.ticket_id] && (
                    <p className="text-green-600 text-sm mt-2 font-semibold">✅ Kode berhasil disalin!</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => downloadQR(ticket)}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition font-semibold shadow-md"
                  >
                    <Download className="w-5 h-5" />
                    Download QR
                  </button>
                  
                  <button
                    onClick={() => shareTicket(ticket)}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition font-semibold shadow-md"
                  >
                    <Share2 className="w-5 h-5" />
                    Share Tiket
                  </button>
                </div>

                {/* Usage Instructions */}
                {ticket.ticket_status === 'active' && (
                  <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                      Cara Menggunakan Tiket:
                    </h4>
                    <ol className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-blue-600 mt-0.5">1.</span>
                        <span>Tunjukkan <strong>QR Code</strong> ini ke petugas saat masuk event</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-blue-600 mt-0.5">2.</span>
                        <span>Atau berikan <strong>Kode Tiket</strong> di atas untuk verifikasi manual</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-blue-600 mt-0.5">3.</span>
                        <span>Datang 30 menit sebelum event dimulai</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-blue-600 mt-0.5">4.</span>
                        <span>Simpan screenshot tiket sebagai backup</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-blue-600 mt-0.5">5.</span>
                        <span>Tiket hanya bisa digunakan <strong>SATU KALI</strong></span>
                      </li>
                    </ol>
                  </div>
                )}

                {ticket.ticket_status === 'used' && (
                  <div className="mt-6 bg-gray-50 border-2 border-gray-200 rounded-xl p-4 text-center">
                    <p className="text-gray-600">
                      ✅ Tiket ini sudah digunakan untuk masuk event
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Info Footer */}
        <div className="mt-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
          <h3 className="font-bold text-lg mb-3">💡 Tips Penting:</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-xl">📱</span>
              <span>Pastikan layar HP Anda cukup terang saat menunjukkan QR Code</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-xl">📸</span>
              <span>Screenshot atau download QR Code untuk akses offline</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-xl">⏰</span>
              <span>Datang lebih awal untuk menghindari antrean panjang</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-xl">🎫</span>
              <span>Jangan share tiket ini ke orang lain (tiket hanya untuk sekali pakai)</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
