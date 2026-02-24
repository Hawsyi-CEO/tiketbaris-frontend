import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/api';

const TicketDetail = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchTicketDetail();
  }, [ticketId]);

  const fetchTicketDetail = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/qr-tickets/my-tickets`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const tickets = response.data.data || [];
      const foundTicket = tickets.find(t => t.id === parseInt(ticketId));
      
      if (!foundTicket) {
        setError('Tiket tidak ditemukan');
      } else {
        setTicket(foundTicket);
      }
    } catch (err) {
      console.error('Error fetching ticket:', err);
      setError('Gagal memuat detail tiket');
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (ticket?.qr_code) {
      const link = document.createElement('a');
      link.href = ticket.qr_code;
      link.download = `ticket-${ticket.ticket_code}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const copyTicketCode = () => {
    navigator.clipboard.writeText(ticket.ticket_code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Error copying code:', err);
      alert('Gagal menyalin kode');
    });
  };

  const shareTicket = () => {
    const text = `🎫 Tiket Event: ${ticket.event_title}\n📅 ${formatDate(ticket.event_date)}\n🎟️ Kode: ${ticket.ticket_code}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Tiket Event',
        text: text,
        url: window.location.href
      }).catch(err => console.log('Share cancelled'));
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(text + '\n\n' + window.location.href);
      alert('Link tiket disalin ke clipboard!');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusConfig = (status) => {
    const configs = {
      active: { 
        bg: 'bg-green-100', 
        text: 'text-green-800', 
        border: 'border-green-300',
        icon: '✅',
        label: 'Aktif' 
      },
      used: { 
        bg: 'bg-gray-100', 
        text: 'text-gray-800', 
        border: 'border-gray-300',
        icon: '✓',
        label: 'Sudah Digunakan' 
      },
      expired: { 
        bg: 'bg-red-100', 
        text: 'text-red-800', 
        border: 'border-red-300',
        icon: '⏰',
        label: 'Expired' 
      }
    };
    return configs[status] || configs.active;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Memuat detail tiket...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Tiket Tidak Ditemukan</h2>
          <p className="text-gray-600 mb-6">{error || 'Tiket yang Anda cari tidak tersedia'}</p>
          <button
            onClick={() => navigate('/my-tickets')}
            className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all shadow-lg"
          >
            ← Kembali ke Daftar Tiket
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(ticket.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header dengan Back Button */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/my-tickets')}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Detail E-Ticket</h1>
            <p className="text-sm opacity-90">Tunjukkan QR code saat masuk event</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
        {/* QR Code Card - Main Focus */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-6">
          {/* Decorative Header */}
          <div className="bg-gradient-to-r from-red-600 to-pink-600 p-6 text-center text-white">
            <div className="text-6xl mb-3 animate-bounce">🎫</div>
            <h2 className="text-2xl font-bold mb-1">E-Ticket Valid</h2>
            <p className="text-sm opacity-90">Simpan atau screenshot tiket ini</p>
          </div>

          {/* QR Code Section */}
          <div className="p-6 md:p-8">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 mb-6">
              {ticket.qr_code ? (
                <div className="text-center">
                  <img 
                    src={ticket.qr_code}
                    alt="QR Code Tiket"
                    className="w-full max-w-[280px] md:max-w-[320px] h-auto mx-auto border-8 border-white rounded-2xl shadow-2xl mb-4"
                  />
                  <div className="bg-white px-4 py-3 rounded-xl shadow-md inline-block">
                    <p className="text-xs text-gray-500 mb-1 font-medium">Kode Tiket</p>
                    <p className="font-mono text-lg md:text-xl font-bold text-gray-900 tracking-wider">
                      {ticket.ticket_code}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">QR Code tidak tersedia</p>
                </div>
              )}
            </div>

            {/* Status Badge */}
            <div className="text-center mb-6">
              <span className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold border-2 ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} shadow-md`}>
                <span className="text-lg">{statusConfig.icon}</span>
                {statusConfig.label}
              </span>
              {ticket.scanned_at && (
                <p className="text-xs text-gray-600 mt-3 font-medium">
                  Di-scan pada: {new Date(ticket.scanned_at).toLocaleString('id-ID')}
                </p>
              )}
            </div>

            {/* Action Buttons - Primary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <button
                onClick={downloadQRCode}
                className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-bold text-base hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download QR
              </button>

              <button
                onClick={shareTicket}
                className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold text-base hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share Tiket
              </button>
            </div>

            {/* Copy Code Button */}
            <button
              onClick={copyTicketCode}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-semibold transition-all border-2 border-gray-300"
            >
              {copied ? (
                <>
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-600 font-bold">Kode Disalin!</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Salin Kode Tiket
                </>
              )}
            </button>
          </div>
        </div>

        {/* Event Information Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">📋</span>
              Informasi Event
            </h3>
          </div>
          
          <div className="p-6 space-y-4">
            {/* Event Title */}
            <div>
              <h4 className="text-2xl font-bold text-gray-900 mb-2">{ticket.event_title}</h4>
            </div>

            {/* Event Details Grid */}
            <div className="grid gap-4">
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="text-3xl">📅</div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-medium mb-1">Tanggal Event</p>
                  <p className="text-base font-bold text-gray-900">{formatDate(ticket.event_date)}</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="text-3xl">🕐</div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-medium mb-1">Waktu</p>
                  <p className="text-base font-bold text-gray-900">
                    {formatTime(ticket.event_start_time)} - {formatTime(ticket.event_end_time)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="text-3xl">📍</div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-medium mb-1">Lokasi Event</p>
                  <p className="text-base font-bold text-gray-900">{ticket.event_location}</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="text-3xl">🛒</div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-medium mb-1">Dibeli Pada</p>
                  <p className="text-base font-bold text-gray-900">
                    {new Date(ticket.created_at).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions Card */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl shadow-lg overflow-hidden border-2 border-blue-200">
          <div className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="text-3xl">💡</div>
              <div>
                <h3 className="text-lg font-bold text-blue-900 mb-1">Petunjuk Penggunaan</h3>
                <p className="text-sm text-blue-800">Baca dengan teliti sebelum menggunakan tiket</p>
              </div>
            </div>
            
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-blue-900">
                <span className="text-xl flex-shrink-0">✓</span>
                <span className="text-sm leading-relaxed">Tunjukkan QR code ini kepada petugas saat masuk event</span>
              </li>
              <li className="flex items-start gap-3 text-blue-900">
                <span className="text-xl flex-shrink-0">✓</span>
                <span className="text-sm leading-relaxed">Screenshot atau download tiket ini sebagai backup</span>
              </li>
              <li className="flex items-start gap-3 text-blue-900">
                <span className="text-xl flex-shrink-0">✓</span>
                <span className="text-sm leading-relaxed">Tiket hanya bisa di-scan sekali dan tidak dapat dipindahtangankan</span>
              </li>
              <li className="flex items-start gap-3 text-blue-900">
                <span className="text-xl flex-shrink-0">✓</span>
                <span className="text-sm leading-relaxed">Datang 15-30 menit lebih awal untuk proses check-in yang lancar</span>
              </li>
              <li className="flex items-start gap-3 text-blue-900">
                <span className="text-xl flex-shrink-0">✓</span>
                <span className="text-sm leading-relaxed">Pastikan QR code terlihat jelas dan tidak rusak</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="mt-6">
          <button
            onClick={() => navigate('/my-tickets')}
            className="w-full px-6 py-4 bg-gray-800 hover:bg-gray-900 text-white rounded-xl font-bold text-base transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke Daftar Tiket
          </button>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;
