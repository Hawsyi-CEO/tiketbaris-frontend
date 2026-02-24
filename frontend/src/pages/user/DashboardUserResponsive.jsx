import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import QRCode from 'qrcode';
import { ResponsiveLayout, ResponsiveCard, InteractiveButton, ResponsiveInput, ResponsiveGrid, MobileNavigation, StatsCard, NotificationToast } from '../../components/ResponsiveComponents';
import InfoModal from '../../components/InfoModal';
import PendingTransactions from '../../components/PendingTransactions';
import socketService from '../../services/socket';
import { API_URL, DOMAIN } from '../../config/api';

const DashboardUserResponsive = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'dashboard');
  const [loading, setLoading] = useState(true);
  const [searchEvent, setSearchEvent] = useState('');
  const [searchTicket, setSearchTicket] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeDataURL, setQrCodeDataURL] = useState('');
  const [notification, setNotification] = useState({ show: false, type: 'info', message: '' });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const qrCanvasRef = useRef(null);
  const [infoModal, setInfoModal] = useState({ isOpen: false, type: 'about' });
  
  // Edit Profile & Password States
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [profileData, setProfileData] = useState({ name: '', email: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  // Mobile navigation items
  const mobileNavItems = [
    { key: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { key: 'events', label: 'Events', icon: '🎫' },
    { key: 'tickets', label: 'Tiket Saya', icon: '🎟️' },
    { key: 'profile', label: 'Profile', icon: '👤' }
  ];

  // Handle responsive
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch data
  useEffect(() => {
    fetchUserData();
    fetchEvents();
    fetchTickets();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data.user);
    } catch (error) {
      console.error('Error fetching user:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${API_URL}/events`);
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
      showNotification('error', 'Gagal memuat event');
    }
  };

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/tickets/my-tickets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTickets(response.data.tickets || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      showNotification('error', 'Gagal memuat tiket');
    } finally {
      setLoading(false);
    }
  };

  // WebSocket Setup - Real-time ticket updates
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Connect to WebSocket
    socketService.connect(token);

    // Join rooms for all user's events
    if (tickets.length > 0) {
      const eventIds = [...new Set(tickets.map(t => t.event_id))];
      socketService.joinUserEvents(eventIds);
    }

    // Listen for my ticket being scanned
    socketService.onMyTicketScanned((data) => {
      console.log('Real-time: My ticket scanned', data);
      
      // Update ticket status in state
      setTickets(prevTickets => 
        prevTickets.map(ticket => 
          ticket.ticket_code === data.ticket_code 
            ? { ...ticket, status: 'scanned', used_at: data.scanned_at }
            : ticket
        )
      );

      // Show notification
      showNotification('info', `Tiket untuk "${data.event_title}" telah di-scan!`);
    });

    // Cleanup on unmount
    return () => {
      socketService.off('myTicketScanned');
      socketService.disconnect();
    };
  }, [tickets.length]); // Re-run when tickets change

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
    showNotification('success', 'Logout berhasil');
  };
  
  const handleBackToHome = () => {
    navigate('/');
  };

  const handleEditProfile = () => {
    setProfileData({ name: user?.name || '', email: user?.email || '' });
    setShowEditProfile(true);
  };

  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/user/profile`, profileData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUser(response.data.user);
      setShowEditProfile(false);
      showNotification('success', '✅ Profile berhasil diupdate!');
      fetchUserData();
    } catch (error) {
      console.error('Error updating profile:', error);
      showNotification('error', error.response?.data?.error || 'Gagal update profile');
    }
  };

  const handleEditPassword = () => {
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowEditPassword(true);
  };

  const handleSavePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showNotification('error', 'Password baru tidak cocok!');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showNotification('error', 'Password minimal 6 karakter!');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/user/change-password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setShowEditPassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showNotification('success', '🔒 Password berhasil diubah!');
    } catch (error) {
      console.error('Error changing password:', error);
      showNotification('error', error.response?.data?.error || 'Gagal ubah password');
    }
  };

  const handleEventClick = (event) => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { state: { from: '/checkout', event } });
      return;
    }
    navigate('/checkout', { state: { event } });
  };

  const handleShowEventDetail = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleCloseEventModal = () => {
    setShowEventModal(false);
    setSelectedEvent(null);
  };

  // Handle Show QR Code
  const handleShowQRCode = async (ticket) => {
    setSelectedTicket(ticket);
    setShowQRModal(true);
    
    try {
      // Generate QR Code with ticket information
      const qrData = JSON.stringify({
        ticket_code: ticket.ticket_code,
        ticket_id: ticket.ticket_id,
        event_id: ticket.event_id,
        event_title: ticket.event_title,
        user_id: user?.id,
        timestamp: new Date().toISOString()
      });
      
      const qrDataURL = await QRCode.toDataURL(qrData, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      setQrCodeDataURL(qrDataURL);
    } catch (error) {
      console.error('Error generating QR code:', error);
      showNotification('error', 'Gagal generate QR code');
    }
  };

  const handleCloseQRModal = () => {
    setShowQRModal(false);
    setSelectedTicket(null);
    setQrCodeDataURL('');
  };

  const handleDownloadQR = () => {
    if (!qrCodeDataURL) return;
    
    const link = document.createElement('a');
    link.download = `ticket-${selectedTicket?.ticket_code}.png`;
    link.href = qrCodeDataURL;
    link.click();
    showNotification('success', '✅ QR Code berhasil diunduh!');
  };

  // Filter and sort events
  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchEvent.toLowerCase()) ||
    event.location.toLowerCase().includes(searchEvent.toLowerCase())
  );

  // Filter and sort tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchSearch = !searchTicket || 
      ticket.event_title?.toLowerCase().includes(searchTicket.toLowerCase()) ||
      ticket.ticket_code?.toLowerCase().includes(searchTicket.toLowerCase());
    
    const matchStatus = filterStatus === 'all' || 
      (filterStatus === 'unused' && (ticket.ticket_status === 'unused' || ticket.ticket_status === 'active')) ||
      ticket.ticket_status === filterStatus;
    
    return matchSearch && matchStatus;
  }).sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.purchased_at) - new Date(a.purchased_at);
    if (sortBy === 'oldest') return new Date(a.purchased_at) - new Date(b.purchased_at);
    if (sortBy === 'event_date') return new Date(a.event_date) - new Date(b.event_date);
    return 0;
  });

  // Stats calculations
  const totalTickets = tickets.length;
  const activeTickets = tickets.filter(t => t.ticket_status === 'unused' || t.ticket_status === 'active').length;
  const scannedTickets = tickets.filter(t => t.ticket_status === 'scanned').length;
  const usedTickets = tickets.filter(t => t.ticket_status === 'used').length;
  const totalEvents = events.length;
  const activeEvents = events.filter(e => e.status === 'active').length;
  const upcomingEvents = events.filter(e => new Date(e.date) > new Date()).length;

  // Render Event Detail Modal
  const renderEventDetailModal = () => {
    if (!selectedEvent) return null;

    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black transition-opacity duration-300 ${
          showEventModal ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none'
        }`}
        onClick={handleCloseEventModal}
      >
        <div
          className={`bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto transform transition-all duration-300 ${
            showEventModal ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header with Image */}
          <div className="relative">
            <div className="aspect-video bg-gradient-to-r from-red-200 to-orange-200 relative overflow-hidden">
              {selectedEvent.image_url ? (
                <img
                  src={`${DOMAIN}${selectedEvent.image_url}`}
                  alt={selectedEvent.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-6xl">🎭</div>';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl">🎭</div>
              )}
            </div>
            <button
              onClick={handleCloseEventModal}
              className="absolute top-4 right-4 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full w-10 h-10 flex items-center justify-center transition-all shadow-lg"
            >
              <span className="text-xl">✕</span>
            </button>
            <div className="absolute top-4 left-4 bg-white bg-opacity-90 px-3 py-1 rounded-full">
              <span className="text-sm font-semibold text-green-600">
                {selectedEvent.status === 'active' ? '✅ Aktif' : '⏳ Pending'}
              </span>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">{selectedEvent.title}</h2>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                <span>👤</span>
                <span>Diselenggarakan oleh: {selectedEvent.organizer || 'Panitia'}</span>
              </div>
            </div>

            {/* Event Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-blue-50 rounded-xl">
                <span className="text-xl sm:text-2xl">📅</span>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Tanggal</p>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900">
                    {new Date(selectedEvent.date).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-purple-50 rounded-xl">
                <span className="text-xl sm:text-2xl">📍</span>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Lokasi</p>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 line-clamp-2">{selectedEvent.location}</p>
                </div>
              </div>

              <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-green-50 rounded-xl">
                <span className="text-xl sm:text-2xl">💰</span>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Harga Tiket</p>
                  <p className="text-lg sm:text-xl font-bold text-green-600">
                    Rp {selectedEvent.price.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-yellow-50 rounded-xl">
                <span className="text-xl sm:text-2xl">🎫</span>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Tiket Tersedia</p>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900">
                    {selectedEvent.stock > 0 ? `${selectedEvent.stock} tiket` : 'Habis'}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3">📝 Deskripsi Event</h3>
              <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {selectedEvent.description || 'Tidak ada deskripsi.'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t">
              <button
                onClick={handleCloseEventModal}
                className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm sm:text-base hover:bg-gray-200 transition-all"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  handleCloseEventModal();
                  handleEventClick(selectedEvent);
                }}
                disabled={new Date(selectedEvent.date) < new Date() || selectedEvent.status === 'sold_out' || selectedEvent.stock <= 0}
                className={`flex-1 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base transition-all ${
                  new Date(selectedEvent.date) >= new Date() && selectedEvent.status !== 'sold_out' && selectedEvent.stock > 0
                    ? 'bg-gradient-to-r from-red-500 to-orange-600 text-white hover:shadow-lg hover:scale-105'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {new Date(selectedEvent.date) < new Date() ? '⏰ Event Telah Lewat' : (selectedEvent.status === 'sold_out' || selectedEvent.stock <= 0) ? '🚫 SOLD OUT' : '🎫 Beli Tiket'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render QR Code Modal
  const renderQRCodeModal = () => {
    if (!selectedTicket) return null;

    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black transition-opacity duration-300 ${
          showQRModal ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none'
        }`}
        onClick={handleCloseQRModal}
      >
        <div
          className={`bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 transform transition-all duration-300 ${
            showQRModal ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-red-600 to-orange-600 p-6 rounded-t-2xl">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-1">🎫 QR Code Tiket</h2>
                <p className="text-blue-100 text-sm">{selectedTicket.event_title}</p>
              </div>
              <button
                onClick={handleCloseQRModal}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full w-10 h-10 flex items-center justify-center transition-all"
              >
                <span className="text-white text-xl">✕</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                selectedTicket.ticket_status === 'unused' || selectedTicket.ticket_status === 'active'
                  ? 'bg-green-400 text-green-900'
                  : selectedTicket.ticket_status === 'scanned'
                  ? 'bg-blue-400 text-blue-900'
                  : 'bg-gray-400 text-gray-900'
              }`}>
                {selectedTicket.ticket_status === 'unused' || selectedTicket.ticket_status === 'active' ? '✅ Aktif' :
                 selectedTicket.ticket_status === 'scanned' ? '✓ Sudah di-scan' : '✓ Terpakai'}
              </span>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-6">
            {/* QR Code Display */}
            <div className="bg-white border-4 border-gray-200 rounded-xl p-6 flex justify-center">
              {qrCodeDataURL ? (
                <img 
                  src={qrCodeDataURL} 
                  alt="QR Code" 
                  className="w-64 h-64"
                />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center bg-gray-100 rounded-lg">
                  <span className="text-gray-400">Loading QR Code...</span>
                </div>
              )}
            </div>

            {/* Ticket Info */}
            <div className="space-y-3">
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Kode Tiket</p>
                <p className="font-mono font-bold text-lg text-gray-900">{selectedTicket.ticket_code}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Tanggal Event</p>
                  <p className="font-semibold text-sm text-gray-900">
                    {new Date(selectedTicket.event_date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Lokasi</p>
                  <p className="font-semibold text-sm text-gray-900 truncate">
                    {selectedTicket.event_location}
                  </p>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
              <div className="flex items-start gap-3">
                <span className="text-2xl">ℹ️</span>
                <div className="flex-1">
                  <p className="font-semibold text-blue-900 mb-1">Cara Penggunaan:</p>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Tunjukkan QR code ini kepada petugas</li>
                    <li>• QR code akan di-scan saat masuk event</li>
                    <li>• Simpan screenshot untuk backup</li>
                    <li>• Tiket hanya bisa di-scan 1 kali</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleDownloadQR}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                💾 Download QR
              </button>
              <button
                onClick={handleCloseQRModal}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Dashboard Tab
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Pending Transactions Alert */}
      <PendingTransactions onUpdate={() => {
        fetchUser();
        fetchTickets();
      }} />

      {/* Welcome Section */}
      <ResponsiveCard className="text-center bg-gradient-to-r from-red-500 to-orange-600 text-white">
        <div className="space-y-3">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white bg-opacity-20 mx-auto flex items-center justify-center text-2xl sm:text-3xl">
            👤
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
              Selamat Datang, {user?.name || 'User'}! 👋
            </h1>
            <p className="text-blue-100 mt-1 text-sm sm:text-base">
              Kelola tiket dan event favorit Anda dengan mudah
            </p>
          </div>
          
          {/* My Ticket Button */}
          <div className="pt-2 flex gap-3 justify-center flex-wrap">
            <InteractiveButton
              variant="light"
              onClick={() => setActiveTab('tickets')}
              className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-6 sm:px-8 py-2.5 sm:py-3 text-base sm:text-lg shadow-lg"
            >
              🎟️ My Ticket
            </InteractiveButton>
            <InteractiveButton
              variant="light"
              onClick={() => navigate('/user/transactions')}
              className="bg-white text-orange-600 hover:bg-orange-50 font-semibold px-6 sm:px-8 py-2.5 sm:py-3 text-base sm:text-lg shadow-lg"
            >
              📋 Riwayat Transaksi
            </InteractiveButton>
          </div>
        </div>
      </ResponsiveCard>

      {/* Stats Grid - Interactive */}
      <ResponsiveGrid cols={{ xs: 2, sm: 2, lg: 4, xl: 4 }}>
        <div 
          onClick={() => {
            setActiveTab('tickets');
            setFilterStatus('all');
            showNotification('info', '📊 Menampilkan semua tiket');
          }}
          className="cursor-pointer transform transition-all hover:scale-105"
        >
          <StatsCard
            title="Total Tiket"
            value={totalTickets}
            icon="🎫"
            color="blue"
            trend="up"
            trendValue="+12%"
            clickable={true}
          />
        </div>
        <div 
          onClick={() => {
            setActiveTab('tickets');
            setFilterStatus('unused');
            showNotification('info', '✅ Menampilkan tiket aktif');
          }}
          className="cursor-pointer transform transition-all hover:scale-105"
        >
          <StatsCard
            title="Tiket Aktif"
            value={activeTickets}
            icon="✅"
            color="green"
            clickable={true}
          />
        </div>
        <div 
          onClick={() => {
            setActiveTab('tickets');
            setFilterStatus('scanned');
            showNotification('info', '📱 Menampilkan tiket yang sudah discan');
          }}
          className="cursor-pointer transform transition-all hover:scale-105"
        >
          <StatsCard
            title="Sudah Discan"
            value={scannedTickets}
            icon="📱"
            color="purple"
            clickable={true}
          />
        </div>
        <div 
          onClick={() => {
            setActiveTab('tickets');
            setFilterStatus('used');
            showNotification('info', '🎭 Menampilkan tiket terpakai');
          }}
          className="cursor-pointer transform transition-all hover:scale-105"
        >
          <StatsCard
            title="Terpakai"
            value={usedTickets}
            icon="🎭"
            color="yellow"
            clickable={true}
          />
        </div>
      </ResponsiveGrid>

      {/* Event Statistics - Tambahan */}
      <ResponsiveCard>
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">🎪 Statistik Event</h3>
        <ResponsiveGrid cols={{ xs: 1, sm: 3, lg: 3 }}>
          <div 
            onClick={() => {
              setActiveTab('events');
              showNotification('info', '🎪 Menampilkan semua event');
            }}
            className="cursor-pointer transform transition-all hover:scale-105"
          >
            <StatsCard
              title="Total Event"
              value={totalEvents}
              icon="🎪"
              color="purple"
              clickable={true}
            />
          </div>
          <div 
            onClick={() => {
              setActiveTab('events');
              showNotification('info', '🔥 Menampilkan event aktif');
            }}
            className="cursor-pointer transform transition-all hover:scale-105"
          >
            <StatsCard
              title="Event Aktif"
              value={activeEvents}
              icon="🔥"
              color="red"
              clickable={true}
            />
          </div>
          <div 
            onClick={() => {
              setActiveTab('events');
              showNotification('info', '📅 Menampilkan event mendatang');
            }}
            className="cursor-pointer transform transition-all hover:scale-105"
          >
            <StatsCard
              title="Mendatang"
              value={upcomingEvents}
              icon="📅"
              color="blue"
              clickable={true}
            />
          </div>
        </ResponsiveGrid>
      </ResponsiveCard>

      {/* Quick Actions */}
      <ResponsiveCard>
        <h3 className="text-xl font-bold text-gray-900 mb-4">🚀 Aksi Cepat</h3>
        <ResponsiveGrid cols={{ xs: 1, sm: 2, lg: 3 }}>
          <InteractiveButton
            variant="primary"
            fullWidth
            onClick={() => setActiveTab('events')}
          >
            🎫 Cari Event
          </InteractiveButton>
          <InteractiveButton
            variant="secondary"
            fullWidth
            onClick={() => setActiveTab('tickets')}
          >
            🎟️ Lihat Tiket
          </InteractiveButton>
          <InteractiveButton
            variant="success"
            fullWidth
            onClick={() => navigate('/checkout')}
          >
            🛒 Beli Tiket
          </InteractiveButton>
        </ResponsiveGrid>
      </ResponsiveCard>

      {/* Recent Events */}
      <ResponsiveCard>
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">🔥 Event Terbaru</h3>
        <ResponsiveGrid cols={{ xs: 1, sm: 2, lg: 3 }}>
          {events.slice(0, 6).map((event) => {
            const eventDate = new Date(event.date);
            const now = new Date();
            const isPastEvent = eventDate < now;
            const isSoldOut = event.status === 'sold_out' || event.stock <= 0;
            
            return (
              <div
                key={event.id}
                className={`interactive-card bg-white rounded-xl p-3 sm:p-4 border border-gray-100 ${isPastEvent ? 'opacity-75' : ''}`}
              >
                <div className="aspect-video bg-gradient-to-r from-red-200 to-orange-200 rounded-lg mb-2 sm:mb-3 flex items-center justify-center overflow-hidden relative">
                  {event.image_url ? (
                    <img
                      src={`${DOMAIN}${event.image_url}`}
                      alt={event.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = '<span class="text-3xl sm:text-4xl">🎭</span>';
                      }}
                    />
                  ) : (
                    <span className="text-3xl sm:text-4xl">🎭</span>
                  )}
                  {isPastEvent && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <span className="bg-gray-600 text-white px-2 sm:px-3 py-1 rounded-full text-xs font-semibold">
                        ⏰ Event Telah Lewat
                      </span>
                    </div>
                  )}
                </div>
                <h4 className="font-semibold text-sm sm:text-base text-gray-900 mb-2 line-clamp-2">{event.title}</h4>
                <div className="space-y-1 text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
                  <div className="flex items-center gap-2">
                    <span>📅</span>
                    <span>{new Date(event.date).toLocaleDateString('id-ID')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📍</span>
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>💰</span>
                    <span className="font-semibold text-green-600">
                      Rp {event.price.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleShowEventDetail(event)}
                    className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-100 text-gray-700 rounded-lg text-xs sm:text-sm font-semibold hover:bg-gray-200 transition-all"
                  >
                    📄 Detail
                  </button>
                  {isPastEvent ? (
                    <button
                      disabled
                      className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-300 text-gray-500 rounded-lg text-xs sm:text-sm font-semibold cursor-not-allowed"
                    >
                      ⏰ Lewat
                    </button>
                  ) : isSoldOut ? (
                    <button
                      disabled
                      className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-300 text-gray-500 rounded-lg text-xs sm:text-sm font-semibold cursor-not-allowed"
                    >
                      🚫 SOLD OUT
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEventClick(event)}
                      className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-lg text-xs sm:text-sm font-semibold hover:shadow-lg transition-all"
                    >
                      🎫 Beli
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </ResponsiveGrid>
      </ResponsiveCard>
    </div>
  );

  // Render Events Tab
  const renderEvents = () => (
    <div className="space-y-6">
      <ResponsiveCard>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">🎭 Semua Event</h2>
          <ResponsiveInput
            placeholder="🔍 Cari event..."
            value={searchEvent}
            onChange={(e) => setSearchEvent(e.target.value)}
            className="w-full sm:w-80"
          />
        </div>

        <ResponsiveGrid cols={{ xs: 1, sm: 2, lg: 3 }}>
          {filteredEvents.map((event) => {
            const eventDate = new Date(event.date);
            const now = new Date();
            const isPastEvent = eventDate < now;
            const isSoldOut = event.status === 'sold_out' || event.stock <= 0;
            
            return (
              <div
                key={event.id}
                className={`interactive-card bg-white rounded-xl overflow-hidden border border-gray-100 hover-lift ${isPastEvent ? 'opacity-75' : ''}`}
              >
                <div className="aspect-video bg-gradient-to-r from-red-200 to-orange-200 relative overflow-hidden">
                  {event.image_url ? (
                    <img
                      src={`${DOMAIN}${event.image_url}`}
                      alt={event.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-6xl">🎭</div>';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">🎭</div>
                  )}
                  <div className="absolute top-4 right-4 bg-white bg-opacity-90 px-3 py-1 rounded-full">
                    <span className="text-sm font-semibold text-green-600">
                      {isPastEvent ? '⏰ Lewat' : event.status === 'active' ? '✅ Aktif' : '⏳ Pending'}
                    </span>
                  </div>
                  {isPastEvent && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <span className="bg-gray-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                        ⏰ Event Telah Lewat
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="p-4 sm:p-6">
                  <h3 className="font-bold text-base sm:text-lg text-gray-900 mb-2 line-clamp-2">{event.title}</h3>
                  <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">{event.description}</p>
                  
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <span>📅</span>
                      <span>{new Date(event.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>📍</span>
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>🎫</span>
                      <span>{event.stock > 0 ? `${event.stock} tiket tersisa` : 'Habis'}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-xl sm:text-2xl font-bold text-green-600 mb-2">
                      Rp {event.price.toLocaleString('id-ID')}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleShowEventDetail(event)}
                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all"
                      >
                        📄 Lihat Detail
                      </button>
                      {isPastEvent ? (
                        <button
                          disabled
                          className="flex-1 px-4 py-2 bg-gray-300 text-gray-500 rounded-lg font-semibold cursor-not-allowed"
                        >
                          ⏰ Telah Lewat
                        </button>
                      ) : isSoldOut ? (
                        <button
                          disabled
                          className="flex-1 px-4 py-2 bg-gray-300 text-gray-500 rounded-lg font-semibold cursor-not-allowed"
                        >
                          🚫 SOLD OUT
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEventClick(event)}
                          className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                        >
                          🎫 Beli Tiket
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </ResponsiveGrid>

        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-600">Event tidak ditemukan</h3>
            <p className="text-gray-500 mt-2">Coba gunakan kata kunci yang berbeda</p>
          </div>
        )}
      </ResponsiveCard>
    </div>
  );

  // Render Tickets Tab
  const renderTickets = () => (
    <div className="space-y-6">
      <ResponsiveCard>
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">🎟️ Tiket Saya</h2>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <ResponsiveInput
              placeholder="🔍 Cari tiket..."
              value={searchTicket}
              onChange={(e) => setSearchTicket(e.target.value)}
              className="w-full sm:w-64"
            />
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field w-full sm:w-48"
            >
              <option value="all">📋 Semua Status</option>
              <option value="unused">✅ Aktif</option>
              <option value="scanned">✓ Sudah di-scan</option>
              <option value="used">✓ Terpakai</option>
              <option value="cancelled">❌ Dibatalkan</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-field w-full sm:w-48"
            >
              <option value="newest">🕐 Terbaru</option>
              <option value="oldest">🕐 Terlama</option>
              <option value="event_date">📅 Tanggal Event</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {filteredTickets.map((ticket, index) => (
            <div key={ticket.ticket_id} className="interactive-card bg-white rounded-2xl border border-gray-100 overflow-hidden hover-lift">
              <div className="flex flex-col lg:flex-row">
                {/* Ticket Image */}
                <div className="lg:w-48 h-48 lg:h-auto bg-gradient-to-br from-green-500 to-emerald-600 relative overflow-hidden">
                  {ticket.event_image ? (
                    <img
                      src={ticket.event_image}
                      alt={ticket.event_title}
                      className="w-full h-full object-cover opacity-80"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-6xl">
                      🎫
                    </div>
                  )}
                  <div className="absolute top-4 left-4 bg-white bg-opacity-90 backdrop-blur-sm px-3 py-1 rounded-full">
                    <span className="text-xs font-bold text-green-600">#{index + 1}</span>
                  </div>
                </div>

                {/* Ticket Details */}
                <div className="flex-1 p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4">
                    <div className="mb-4 sm:mb-0">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{ticket.event_title}</h3>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <span>📍</span>
                        <span>{ticket.event_location}</span>
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                        <span>📅</span>
                        <span>{new Date(ticket.event_date).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}</span>
                      </p>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-xs font-bold ${
                      ticket.ticket_status === 'unused' || ticket.ticket_status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : ticket.ticket_status === 'scanned'
                        ? 'bg-blue-100 text-blue-700'
                        : ticket.ticket_status === 'used'
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {ticket.ticket_status === 'unused' || ticket.ticket_status === 'active' ? '✅ Aktif' :
                       ticket.ticket_status === 'scanned' ? '✓ Sudah di-scan' :
                       ticket.ticket_status === 'used' ? '✓ Terpakai' : '❌ Dibatalkan'}
                    </span>
                  </div>

                  <ResponsiveGrid cols={{ xs: 1, sm: 2, lg: 3 }} className="mb-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Kode Tiket</p>
                      <p className="font-mono font-bold text-sm text-gray-900">{ticket.ticket_code}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Dibeli Pada</p>
                      <p className="font-semibold text-sm text-gray-900">
                        {new Date(ticket.purchased_at).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Harga</p>
                      <p className="font-bold text-sm text-green-600">
                        Rp {(ticket.ticket_price || 0).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </ResponsiveGrid>

                  <InteractiveButton
                    variant="primary"
                    fullWidth
                    onClick={() => handleShowQRCode(ticket)}
                  >
                    🎫 Lihat QR Code
                  </InteractiveButton>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTickets.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎟️</div>
            <h3 className="text-xl font-semibold text-gray-600">
              {searchTicket || filterStatus !== 'all' ? 'Tidak ada tiket yang sesuai' : 'Belum ada tiket'}
            </h3>
            <p className="text-gray-500 mt-2">
              {searchTicket || filterStatus !== 'all' 
                ? 'Coba ubah filter atau kata kunci pencarian'
                : 'Mulai beli tiket untuk event favorit Anda!'
              }
            </p>
            {!searchTicket && filterStatus === 'all' && (
              <InteractiveButton
                variant="primary"
                onClick={() => setActiveTab('events')}
                className="mt-4"
              >
                🎫 Cari Event
              </InteractiveButton>
            )}
          </div>
        )}
      </ResponsiveCard>
    </div>
  );

  // Render Profile Tab
  const renderProfile = () => (
    <div className="space-y-6">
      <ResponsiveCard>
        <div className="text-center mb-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-red-500 to-orange-600 mx-auto flex items-center justify-center text-white text-4xl mb-4">
            👤
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{user?.name}</h2>
          <p className="text-gray-600">{user?.email}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Nama Lengkap</p>
            <p className="font-semibold text-gray-900">{user?.name || '-'}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Email</p>
            <p className="font-semibold text-gray-900">{user?.email || '-'}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Role</p>
            <p className="font-semibold text-gray-900 capitalize">{user?.role || '-'}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Bergabung Sejak</p>
            <p className="font-semibold text-gray-900">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString('id-ID') : '-'}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <InteractiveButton 
            variant="secondary" 
            fullWidth
            onClick={handleEditProfile}
          >
            ✏️ Edit Profile
          </InteractiveButton>
          <InteractiveButton 
            variant="warning" 
            fullWidth
            onClick={handleEditPassword}
          >
            🔒 Ubah Password
          </InteractiveButton>
          <InteractiveButton 
            variant="info" 
            fullWidth
            onClick={() => navigate('/user/active-devices')}
          >
            🛡️ Device & Sesi Aktif
          </InteractiveButton>
          <InteractiveButton 
            variant="info" 
            fullWidth
            onClick={() => setActiveTab('dashboard')}
          >
            🏠 Kembali ke Dashboard
          </InteractiveButton>
          <InteractiveButton
            variant="secondary"
            fullWidth
            onClick={() => navigate('/')}
          >
            🏠 Kembali ke Home
          </InteractiveButton>
          <InteractiveButton
            variant="danger"
            fullWidth
            onClick={handleLogout}
          >
            🚪 Logout
          </InteractiveButton>
        </div>
      </ResponsiveCard>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <ResponsiveCard className="max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">✏️ Edit Profile</h3>
            
            <div className="space-y-4">
              <ResponsiveInput
                label="Nama Lengkap"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                placeholder="Masukkan nama lengkap"
              />
              
              <ResponsiveInput
                label="Email"
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                placeholder="Masukkan email"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <InteractiveButton
                variant="secondary"
                fullWidth
                onClick={() => setShowEditProfile(false)}
              >
                Batal
              </InteractiveButton>
              <InteractiveButton
                variant="primary"
                fullWidth
                onClick={handleSaveProfile}
              >
                💾 Simpan
              </InteractiveButton>
            </div>
          </ResponsiveCard>
        </div>
      )}

      {/* Change Password Modal */}
      {showEditPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <ResponsiveCard className="max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">🔒 Ubah Password</h3>
            
            <div className="space-y-4">
              <ResponsiveInput
                label="Password Lama"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                placeholder="Masukkan password lama"
              />
              
              <ResponsiveInput
                label="Password Baru"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="Masukkan password baru (min. 6 karakter)"
              />
              
              <ResponsiveInput
                label="Konfirmasi Password Baru"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="Ketik ulang password baru"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <InteractiveButton
                variant="secondary"
                fullWidth
                onClick={() => setShowEditPassword(false)}
              >
                Batal
              </InteractiveButton>
              <InteractiveButton
                variant="primary"
                fullWidth
                onClick={handleSavePassword}
              >
                🔒 Ubah Password
              </InteractiveButton>
            </div>
          </ResponsiveCard>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <ResponsiveLayout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat dashboard...</p>
          </div>
        </div>
      </ResponsiveLayout>
    );
  }

  return (
    <ResponsiveLayout>
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 pb-20 md:pb-6">
        <div className="container-responsive">
          {/* Header */}
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <h1 className="text-2xl sm:text-3xl font-bold gradient-text">Tiket Baris Dashboard</h1>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="hidden sm:block text-gray-400 text-xs">|</span>
                    <span className="text-gray-600 text-[10px] sm:text-sm">Powered by</span>
                    <a href="https://simpaskor.id" target="_blank" rel="noopener noreferrer">
                      <img src="/logo-simpaskor.png" alt="SimpaSkor" className="h-4 sm:h-6 opacity-70 hover:opacity-100 transition-opacity" />
                    </a>
                  </div>
                </div>
                <p className="text-gray-600 text-sm sm:text-base">Platform Tiket Digital Terpercaya</p>
              </div>
              {!isMobile && (
                <div className="flex gap-3">
                  <InteractiveButton variant="secondary" onClick={() => navigate('/')}>
                    🏠 Home
                  </InteractiveButton>
                  <InteractiveButton variant="danger" onClick={handleLogout}>
                    🚪 Logout
                  </InteractiveButton>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Navigation */}
          {!isMobile && (
            <div className="mb-6">
              <div className="flex space-x-1 bg-white p-2 rounded-2xl shadow-lg">
                {[
                  { key: 'dashboard', label: '🏠 Dashboard' },
                  { key: 'events', label: '🎭 Events' },
                  { key: 'tickets', label: '🎟️ Tiket Saya' },
                  { key: 'profile', label: '👤 Profile' }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`nav-item flex-1 text-center ${activeTab === tab.key ? 'active' : ''}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="fade-in-up">
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'events' && renderEvents()}
            {activeTab === 'tickets' && renderTickets()}
            {activeTab === 'profile' && renderProfile()}
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobile && (
          <MobileNavigation
            items={mobileNavItems}
            activeItem={activeTab}
            onItemClick={(item) => setActiveTab(item.key)}
            badges={{
              tickets: tickets.length, // Show ticket count
              events: events.filter(e => new Date(e.date) >= new Date()).length // Upcoming events
            }}
          />
        )}

        {/* Event Detail Modal */}
        {renderEventDetailModal()}

        {/* QR Code Modal */}
        {renderQRCodeModal()}

        {/* Notifications */}
        <NotificationToast
          type={notification.type}
          message={notification.message}
          isVisible={notification.show}
          onClose={() => setNotification({ ...notification, show: false })}
        />

        {/* Footer - Only show on desktop, hide on mobile to avoid overlap with bottom nav */}
        {!isMobile && (
          <footer className="mt-12 py-8 bg-gray-50 border-t border-gray-200">
            <div className="container mx-auto px-4">
              <div className="text-center space-y-4">
                <div className="flex flex-wrap justify-center gap-4 text-sm">
                  <button
                    onClick={() => setInfoModal({ isOpen: true, type: 'about' })}
                    className="text-gray-600 hover:text-red-600 transition-colors"
                  >
                    Tentang Kami
                  </button>
                  <button
                    onClick={() => setInfoModal({ isOpen: true, type: 'help' })}
                    className="text-gray-600 hover:text-red-600 transition-colors"
                  >
                    Bantuan
                  </button>
                  <button
                    onClick={() => setInfoModal({ isOpen: true, type: 'terms' })}
                    className="text-gray-600 hover:text-red-600 transition-colors"
                  >
                    Syarat & Ketentuan
                  </button>
                  <button
                    onClick={() => setInfoModal({ isOpen: true, type: 'privacy' })}
                    className="text-gray-600 hover:text-red-600 transition-colors"
                  >
                    Kebijakan Privasi
                  </button>
                </div>

                {/* Powered by SimpaSkor */}
                <div className="pt-2">
                  <p className="text-gray-500 text-xs mb-2">Powered by</p>
                  <a 
                    href="https://simpaskor.id" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block hover:scale-105 transition-transform"
                  >
                    <img 
                      src="/logo-simpaskor.png" 
                      alt="SimpaSkor" 
                      className="h-8 mx-auto opacity-70 hover:opacity-100 transition-opacity"
                    />
                  </a>
                </div>

                <div className="text-gray-500 text-xs">
                  © 2026 Tiket Baris. All rights reserved.
                </div>
              </div>
            </div>
          </footer>
        )}

        {/* Info Modal */}
        <InfoModal
          isOpen={infoModal.isOpen}
          type={infoModal.type}
          onClose={() => setInfoModal({ ...infoModal, isOpen: false })}
        />
      </div>
    </ResponsiveLayout>
  );
};

export default DashboardUserResponsive;