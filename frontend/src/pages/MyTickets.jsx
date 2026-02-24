import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/api';

const MyTickets = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMyTickets();
  }, []);

  const fetchMyTickets = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/qr-tickets/my-tickets`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setTickets(response.data.data || []);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError('Gagal memuat tiket Anda');
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = (ticket) => {
    if (ticket.qr_code) {
      const link = document.createElement('a');
      link.href = ticket.qr_code;
      link.download = `ticket-${ticket.ticket_code}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const copyTicketCode = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      alert('Kode tiket disalin ke clipboard!');
    }).catch(err => {
      console.error('Error copying code:', err);
    });
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'used':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Aktif';
      case 'used':
        return 'Sudah Digunakan';
      case 'expired':
        return 'Expired';
      default:
        return 'Tidak Diketahui';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchMyTickets}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Tiket Saya</h1>
          <p className="text-gray-600 mt-2">
            Kelola dan lihat semua tiket yang telah Anda beli
          </p>
        </div>

        {tickets.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="text-gray-400 text-6xl mb-4">🎫</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Belum Ada Tiket
            </h3>
            <p className="text-gray-600">
              Anda belum membeli tiket apapun. Yuk, beli tiket event favoritmu!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {ticket.event_title}
                      </h3>
                      <p className="text-gray-600 mb-1">
                        📅 {formatDate(ticket.event_date)}
                      </p>
                      <p className="text-gray-600 mb-1">
                        🕐 {formatTime(ticket.event_start_time)} - {formatTime(ticket.event_end_time)}
                      </p>
                      <p className="text-gray-600 mb-3">
                        📍 {ticket.event_location}
                      </p>
                      
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(ticket.status)}`}>
                          {getStatusText(ticket.status)}
                        </span>
                        <span className="text-sm text-gray-500">
                          Kode: {ticket.ticket_code}
                        </span>
                      </div>
                    </div>

                    <div className="flex-shrink-0 ml-4">
                      {ticket.qr_code && (
                        <img 
                          src={ticket.qr_code}
                          alt="QR Code Tiket"
                          className="w-24 h-24 border rounded"
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => navigate(`/tiket/${ticket.id}`)}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-semibold"
                    >
                      📱 Lihat Detail
                    </button>
                    
                    {ticket.qr_code && (
                      <button
                        onClick={() => downloadQRCode(ticket)}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                      >
                        Download QR
                      </button>
                    )}
                    
                    <button
                      onClick={() => copyTicketCode(ticket.ticket_code)}
                      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                    >
                      Copy Kode
                    </button>
                  </div>
                </div>

                {ticket.status === 'used' && ticket.scanned_at && (
                  <div className="bg-gray-50 px-6 py-3 border-t">
                    <p className="text-sm text-gray-600">
                      ✅ Tiket digunakan pada: {new Date(ticket.scanned_at).toLocaleString('id-ID')}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTickets;


