import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ResponsiveLayout, ResponsiveCard, InteractiveButton, ResponsiveInput, ResponsiveGrid, MobileNavigation, StatsCard, NotificationToast, ResponsiveTable } from '../../components/ResponsiveComponents';
import { API_URL } from '../../config/api';
import { formatRupiah } from '../../utils/formatRupiah';

const DashboardAdminResponsive = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, type: 'info', message: '' });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Mobile navigation items
  const mobileNavItems = [
    { key: 'dashboard', label: 'Dashboard', icon: '📊' },
    { key: 'events', label: 'Events', icon: '🎭' },
    { key: 'users', label: 'Users', icon: '👥' },
    { key: 'transactions', label: 'Transaksi', icon: '💳' },
    { key: 'analytics', label: 'Analytics', icon: '📈' },
    { key: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchAdminData();
    fetchEvents();
    fetchUsers();
    fetchTickets();
    fetchAnalytics();
  }, []);

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdmin(response.data.admin);
    } catch (error) {
      console.error('Error fetching admin:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/admin/login');
      }
    }
  };

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/events`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvents(response.data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      showNotification('error', 'Gagal memuat event');
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      showNotification('error', 'Gagal memuat data user');
    }
  };

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/tickets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTickets(response.data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      showNotification('error', 'Gagal memuat data tiket');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Analytics data received:', response.data);
      console.log('Daily transactions:', response.data.dailyTransactions);
      setAnalytics(response.data || {});
      
      // Fetch payment method statistics
      const paymentResponse = await axios.get(`${API_URL}/admin/analytics/payment-methods`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Payment methods data:', paymentResponse.data);
      setAnalytics(prev => ({
        ...prev,
        paymentMethods: paymentResponse.data.paymentMethods || [],
        paymentTypeSummary: paymentResponse.data.paymentTypeSummary || []
      }));
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
    showNotification('success', 'Logout berhasil');
  };

  const handleEventAction = async (eventId, action) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/admin/events/${eventId}/${action}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      showNotification('success', `Event berhasil di${action}`);
      fetchEvents();
    } catch (error) {
      console.error(`Error ${action} event:`, error);
      showNotification('error', `Gagal ${action} event`);
    }
  };

  const handleDeleteEvent = async (eventId, eventTitle) => {
    if (!confirm(`Yakin ingin menghapus event "${eventTitle}"? Data transaksi terkait akan terhapus!`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/admin/event/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      showNotification('success', 'Event berhasil dihapus');
      fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      showNotification('error', error.response?.data?.error || 'Gagal menghapus event');
    }
  };

  const handleUpdateEventStatus = async (eventId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/admin/update-event-status/${eventId}`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      showNotification('success', `Status event diubah ke ${newStatus}`);
      fetchEvents();
    } catch (error) {
      console.error('Error updating status:', error);
      showNotification('error', 'Gagal mengubah status event');
    }
  };

  const handleToggleHide = async (eventId, currentHidden) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/admin/toggle-hide/${eventId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const newState = response.data.isHidden;
      showNotification('success', newState ? 'Event disembunyikan dari public' : 'Event ditampilkan ke public');
      fetchEvents();
    } catch (error) {
      console.error('Error toggling hide:', error);
      showNotification('error', 'Gagal mengubah visibility event');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!confirm(`Yakin ingin menghapus user "${userName}"? Semua data terkait akan terhapus!`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/admin/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      showNotification('success', 'User berhasil dihapus');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      showNotification('error', error.response?.data?.error || 'Gagal menghapus user');
    }
  };

  const handleDevPayment = async (eventId, userId, quantity) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/admin/payment/dev-mode`, 
        { event_id: eventId, user_id: userId, quantity, notes: 'Admin Dev Payment' },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      showNotification('success', `Dev payment sukses! Order ID: ${response.data.orderId}`);
      fetchTickets();
      fetchAnalytics();
    } catch (error) {
      console.error('Error dev payment:', error);
      showNotification('error', error.response?.data?.error || 'Gagal membuat dev payment');
    }
  };

  // Calculate stats
  const totalEvents = events.length;
  const activeEvents = events.filter(e => e.status === 'active').length;
  const totalUsers = users.length;
  // Get revenue from analytics API, not from tickets
  const totalRevenue = analytics.totalRevenue || 0;

  // Render Dashboard Tab
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <ResponsiveCard className="text-center bg-gradient-to-r from-red-500 to-pink-600 text-white">
        <div className="space-y-4">
          <div className="w-20 h-20 rounded-full bg-white bg-opacity-20 mx-auto flex items-center justify-center text-3xl">
            👨‍💼
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Admin Dashboard
            </h1>
            <p className="text-red-100 mt-2">
              Kelola platform Tiket Baris dengan mudah dan efisien
            </p>
          </div>
        </div>
      </ResponsiveCard>

      {/* Stats Grid */}
      <ResponsiveGrid cols={{ xs: 2, sm: 2, lg: 4, xl: 4 }}>
        <StatsCard
          title="Total Events"
          value={totalEvents}
          icon="🎭"
          color="blue"
          trend="up"
          trendValue="+8%"
        />
        <StatsCard
          title="Active Events"
          value={activeEvents}
          icon="✅"
          color="green"
        />
        <StatsCard
          title="Total Users"
          value={totalUsers}
          icon="👥"
          color="purple"
          trend="up"
          trendValue="+12%"
        />
        <StatsCard
          title="Total Revenue"
          value={`Rp ${formatRupiah(totalRevenue)}`}
          icon="💰"
          color="yellow"
          trend="up"
          trendValue="+15%"
        />
      </ResponsiveGrid>

      {/* Quick Actions */}
      <ResponsiveCard>
        <h3 className="text-xl font-bold text-gray-900 mb-4">🚀 Aksi Cepat</h3>
        <ResponsiveGrid cols={{ xs: 2, sm: 3, lg: 5 }}>
          <InteractiveButton
            variant="primary"
            fullWidth
            onClick={() => navigate('/admin/scanner')}
          >
            📱 Scanner Tiket
          </InteractiveButton>
          <InteractiveButton
            variant="secondary"
            fullWidth
            onClick={() => navigate('/admin/transactions')}
          >
            💳 Kelola Transaksi
          </InteractiveButton>
          <InteractiveButton
            variant="secondary"
            fullWidth
            onClick={() => navigate('/admin/create-event')}
          >
            ➕ Buat Event
          </InteractiveButton>
          <InteractiveButton
            variant="info"
            fullWidth
            onClick={() => setActiveTab('events')}
          >
            🎭 Kelola Event
          </InteractiveButton>
          <InteractiveButton
            variant="success"
            fullWidth
            onClick={() => setActiveTab('users')}
          >
            👥 Kelola User
          </InteractiveButton>
          <InteractiveButton
            variant="warning"
            fullWidth
            onClick={() => setActiveTab('analytics')}
          >
            📊 Lihat Analytics
          </InteractiveButton>
        </ResponsiveGrid>
      </ResponsiveCard>

      {/* Revenue & Analytics Charts */}
      <ResponsiveGrid cols={{ xs: 1, sm: 1, lg: 2 }}>
        {/* Daily Transactions Chart (30 days) */}
        <ResponsiveCard>
          <h3 className="text-xl font-bold text-gray-900 mb-4">📈 Transaksi Harian (30 Hari Terakhir)</h3>
          <div className="space-y-2">
            {analytics.dailyTransactions && analytics.dailyTransactions.length > 0 ? (
              <>
                {analytics.dailyTransactions.slice(0, 10).reverse().map((item, index) => {
                  const maxTransactions = Math.max(...analytics.dailyTransactions.map(d => d.total_transactions || 0));
                  const percentage = maxTransactions > 0 ? ((item.total_transactions || 0) / maxTransactions) * 100 : 0;
                  const dateLabel = new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                  
                  return (
                    <div key={index} className="mb-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">{dateLabel}</span>
                        <div className="flex gap-2 text-xs">
                          <span className="text-green-600">✓ {item.completed || 0}</span>
                          <span className="text-yellow-600">⏳ {item.pending || 0}</span>
                          <span className="text-red-600">✕ {item.cancelled || 0}</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-emerald-600 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1 flex justify-between">
                        <span>{item.total_transactions || 0} transaksi</span>
                        <span className="font-semibold text-green-600">Rp {formatRupiah(item.daily_revenue || 0)}</span>
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📈</div>
                <p>Belum ada data transaksi</p>
              </div>
            )}
          </div>
        </ResponsiveCard>

        {/* Monthly Revenue Chart */}
        <ResponsiveCard>
          <h3 className="text-xl font-bold text-gray-900 mb-4">📊 Revenue 6 Bulan Terakhir</h3>
          <div className="space-y-3">
            {analytics.monthlyRevenue && analytics.monthlyRevenue.length > 0 ? (
              <>
                {analytics.monthlyRevenue.slice(0, 6).reverse().map((item, index) => {
                  const maxRevenue = Math.max(...analytics.monthlyRevenue.map(m => m.revenue || 0));
                  const percentage = maxRevenue > 0 ? ((item.revenue || 0) / maxRevenue) * 100 : 0;
                  const monthName = new Date(item.month + '-01').toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
                  
                  return (
                    <div key={index}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">{monthName}</span>
                        <span className="text-sm font-bold text-blue-600">
                          Rp {formatRupiah(item.revenue || 0)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {item.transactions || 0} transaksi
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📊</div>
                <p>Belum ada data revenue</p>
              </div>
            )}
          </div>
        </ResponsiveCard>
      </ResponsiveGrid>

      <ResponsiveGrid cols={{ xs: 1, sm: 1, lg: 2 }}>
        {/* Top Events */}
        <ResponsiveCard>
          <h3 className="text-xl font-bold text-gray-900 mb-4">🏆 Top Event (Revenue)</h3>
          <div className="space-y-3">
            {analytics.topEvents && analytics.topEvents.length > 0 ? (
              analytics.topEvents.map((event, index) => (
                <div key={event.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{event.title}</div>
                    <div className="text-sm text-gray-600">
                      {event.tickets_sold || 0} tiket terjual
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">
                      Rp {formatRupiah(event.revenue || 0)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🎭</div>
                <p>Belum ada event</p>
              </div>
            )}
          </div>
        </ResponsiveCard>

        {/* User Growth Chart */}
        <ResponsiveCard>
          <h3 className="text-xl font-bold text-gray-900 mb-4">👥 Pertumbuhan User (6 Bulan)</h3>
          <div className="space-y-3">
            {analytics.userGrowth && analytics.userGrowth.length > 0 ? (
              <>
                {analytics.userGrowth.slice(0, 6).reverse().map((item, index) => {
                  const maxUsers = Math.max(...analytics.userGrowth.map(u => u.new_users || 0));
                  const percentage = maxUsers > 0 ? ((item.new_users || 0) / maxUsers) * 100 : 0;
                  const monthName = new Date(item.month + '-01').toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
                  
                  return (
                    <div key={index}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">{monthName}</span>
                        <span className="text-sm font-bold text-purple-600">
                          +{item.new_users || 0} user
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">👥</div>
                <p>Belum ada data user</p>
              </div>
            )}
          </div>
        </ResponsiveCard>
      </ResponsiveGrid>

      {/* Recent Events */}
      <ResponsiveCard>
        <h3 className="text-xl font-bold text-gray-900 mb-4">📅 Event Terbaru</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 font-semibold">Event</th>
                <th className="text-left py-3 font-semibold">Status</th>
                <th className="text-left py-3 font-semibold">Tanggal</th>
                <th className="text-left py-3 font-semibold">Tiket</th>
                <th className="text-left py-3 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {events.slice(0, 5).map((event) => (
                <tr key={event.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3">
                    <div>
                      <div className="font-semibold">{event.title}</div>
                      <div className="text-sm text-gray-600">{event.location}</div>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      event.status === 'active' 
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {event.status === 'active' ? '✅ Aktif' : '⏳ Pending'}
                    </span>
                  </td>
                  <td className="py-3 text-sm">
                    {new Date(event.date).toLocaleDateString('id-ID')}
                  </td>
                  <td className="py-3 text-sm">
                    {event.stock} tersisa
                  </td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      {event.status === 'pending' && (
                        <button
                          onClick={() => handleEventAction(event.id, 'approve')}
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          ✅ Approve
                        </button>
                      )}
                      <button className="text-blue-600 hover:text-blue-800 text-sm">
                        ✏️ Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ResponsiveCard>
    </div>
  );

  // Render Events Tab
  const renderEvents = () => (
    <div className="space-y-6">
      <ResponsiveCard>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">🎭 Kelola Events</h2>
          <InteractiveButton
            variant="primary"
            onClick={() => navigate('/admin/create-event')}
          >
            ➕ Buat Event Baru
          </InteractiveButton>
        </div>

        <ResponsiveGrid cols={{ xs: 1, sm: 2, lg: 3 }}>
          {events.map((event) => (
            <div key={event.id} className="interactive-card bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="aspect-video bg-gradient-to-r from-blue-200 to-purple-200 relative">
                {event.image_url ? (
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">🎭</div>
                )}
                <div className="absolute top-4 right-4 bg-white bg-opacity-90 px-3 py-1 rounded-full">
                  <span className={`text-xs font-semibold ${
                    event.status === 'active' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {event.status === 'active' ? '✅ Aktif' : '⏳ Pending'}
                  </span>
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="font-bold text-lg mb-2">{event.title}</h3>
                <div className="space-y-1 text-sm text-gray-600 mb-4">
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
                    <span>Rp {formatRupiah(event.price)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🎫</span>
                    <span>{event.current_stock || event.stock} tiket tersisa</span>
                  </div>
                </div>

                {/* Status Selector */}
                <div className="mb-3">
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Status:</label>
                  <select
                    value={event.status}
                    onChange={(e) => handleUpdateEventStatus(event.id, e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pending">⏳ Pending</option>
                    <option value="active">✅ Active</option>
                    <option value="completed">✔️ Completed</option>
                    <option value="cancelled">❌ Cancelled</option>
                    <option value="sold_out">🔥 Sold Out</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <InteractiveButton
                    variant="secondary"
                    size="small"
                    fullWidth
                    onClick={() => navigate(`/admin/event/${event.id}`)}
                  >
                    👁️ Detail
                  </InteractiveButton>
                  <InteractiveButton
                    variant={event.is_hidden ? 'warning' : 'primary'}
                    size="small"
                    fullWidth
                    onClick={() => handleToggleHide(event.id, event.is_hidden)}
                  >
                    {event.is_hidden ? '👁️‍🗨️ Show' : '🙈 Hide'}
                  </InteractiveButton>
                  <InteractiveButton
                    variant="danger"
                    size="small"
                    fullWidth
                    onClick={() => handleDeleteEvent(event.id, event.title)}
                  >
                    🗑️ Delete
                  </InteractiveButton>
                </div>
              </div>
            </div>
          ))}
        </ResponsiveGrid>
      </ResponsiveCard>
    </div>
  );

  // Render Users Tab
  const renderUsers = () => (
    <div className="space-y-6">
      <ResponsiveCard>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">👥 Kelola Users</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 font-semibold">User</th>
                <th className="text-left py-3 font-semibold">Email</th>
                <th className="text-left py-3 font-semibold">Role</th>
                <th className="text-left py-3 font-semibold">Bergabung</th>
                <th className="text-left py-3 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                        {user.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <span className="font-semibold">{user.name}</span>
                    </div>
                  </td>
                  <td className="py-3 text-sm">{user.email}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${
                      user.role === 'admin' 
                        ? 'bg-red-100 text-red-700'
                        : user.role === 'panitia'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 text-sm">
                    {new Date(user.created_at).toLocaleDateString('id-ID')}
                  </td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <button 
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        onClick={() => {
                          alert(`User Detail:\nID: ${user.id}\nName: ${user.name}\nEmail: ${user.email}\nRole: ${user.role}\nBergabung: ${new Date(user.created_at).toLocaleDateString('id-ID')}`);
                        }}
                      >
                        👁️ Detail
                      </button>
                      <button 
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                        onClick={() => handleDeleteUser(user.id, user.name)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ResponsiveCard>
    </div>
  );

  // Render Analytics Tab
  const renderAnalytics = () => (
    <div className="space-y-6">
      <ResponsiveCard>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">📈 Analytics</h2>
        
        {/* Quick Stats */}
        <ResponsiveGrid cols={{ xs: 2, sm: 2, lg: 4 }}>
          <div className="bg-white p-4 rounded-xl border border-gray-100 text-center">
            <div className="text-2xl mb-2">🎫</div>
            <div className="text-2xl font-bold text-blue-600">{tickets.length}</div>
            <div className="text-sm text-gray-600">Total Tiket Terjual</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 text-center">
            <div className="text-2xl mb-2">💰</div>
            <div className="text-2xl font-bold text-green-600">
              Rp {formatRupiah(totalRevenue)}
            </div>
            <div className="text-sm text-gray-600">Total Revenue</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 text-center">
            <div className="text-2xl mb-2">📈</div>
            <div className="text-2xl font-bold text-purple-600">85%</div>
            <div className="text-sm text-gray-600">Conversion Rate</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 text-center">
            <div className="text-2xl mb-2">⭐</div>
            <div className="text-2xl font-bold text-yellow-600">4.8</div>
            <div className="text-sm text-gray-600">Rating Rata-rata</div>
          </div>
        </ResponsiveGrid>
      </ResponsiveCard>

      {/* Charts Section */}
      <ResponsiveGrid cols={{ xs: 1, sm: 1, lg: 2 }}>
        {/* Daily Transactions Chart */}
        <ResponsiveCard>
          <h3 className="text-xl font-bold text-gray-900 mb-4">📈 Transaksi Harian (30 Hari Terakhir)</h3>
          <div className="space-y-2">
            {analytics.dailyTransactions && analytics.dailyTransactions.length > 0 ? (
              <>
                {analytics.dailyTransactions.slice(0, 10).reverse().map((item, index) => {
                  const maxTransactions = Math.max(...analytics.dailyTransactions.map(d => d.total_transactions || 0));
                  const percentage = maxTransactions > 0 ? ((item.total_transactions || 0) / maxTransactions) * 100 : 0;
                  const dateLabel = new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                  
                  return (
                    <div key={index} className="mb-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">{dateLabel}</span>
                        <div className="flex gap-2 text-xs">
                          <span className="text-green-600">✓ {item.completed || 0}</span>
                          <span className="text-yellow-600">⏳ {item.pending || 0}</span>
                          <span className="text-red-600">✕ {item.cancelled || 0}</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-emerald-600 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1 flex justify-between">
                        <span>{item.total_transactions || 0} transaksi</span>
                        <span className="font-semibold text-green-600">Rp {formatRupiah(item.daily_revenue || 0)}</span>
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📈</div>
                <p>Belum ada data transaksi</p>
              </div>
            )}
          </div>
        </ResponsiveCard>

        {/* Monthly Revenue Chart */}
        <ResponsiveCard>
          <h3 className="text-xl font-bold text-gray-900 mb-4">📊 Revenue 6 Bulan Terakhir</h3>
          <div className="space-y-3">
            {analytics.monthlyRevenue && analytics.monthlyRevenue.length > 0 ? (
              <>
                {analytics.monthlyRevenue.slice(0, 6).reverse().map((item, index) => {
                  const maxRevenue = Math.max(...analytics.monthlyRevenue.map(m => m.revenue || 0));
                  const percentage = maxRevenue > 0 ? ((item.revenue || 0) / maxRevenue) * 100 : 0;
                  const monthName = new Date(item.month + '-01').toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
                  
                  return (
                    <div key={index}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">{monthName}</span>
                        <span className="text-sm font-bold text-blue-600">
                          Rp {formatRupiah(item.revenue || 0)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {item.transactions || 0} transaksi
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📊</div>
                <p>Belum ada data revenue</p>
              </div>
            )}
          </div>
        </ResponsiveCard>
      </ResponsiveGrid>

      <ResponsiveGrid cols={{ xs: 1, sm: 1, lg: 2 }}>
        {/* Top Events */}
        <ResponsiveCard>
          <h3 className="text-xl font-bold text-gray-900 mb-4">🏆 Top Event (Revenue)</h3>
          <div className="space-y-3">
            {analytics.topEvents && analytics.topEvents.length > 0 ? (
              analytics.topEvents.map((event, index) => (
                <div key={event.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{event.title}</div>
                    <div className="text-sm text-gray-600">
                      {event.tickets_sold || 0} tiket terjual
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">
                      Rp {formatRupiah(event.revenue || 0)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🎭</div>
                <p>Belum ada event</p>
              </div>
            )}
          </div>
        </ResponsiveCard>

        {/* User Growth Chart */}
        <ResponsiveCard>
          <h3 className="text-xl font-bold text-gray-900 mb-4">👥 Pertumbuhan User (6 Bulan)</h3>
          <div className="space-y-3">
            {analytics.userGrowth && analytics.userGrowth.length > 0 ? (
              <>
                {analytics.userGrowth.slice(0, 6).reverse().map((item, index) => {
                  const maxUsers = Math.max(...analytics.userGrowth.map(u => u.new_users || 0));
                  const percentage = maxUsers > 0 ? ((item.new_users || 0) / maxUsers) * 100 : 0;
                  const monthName = new Date(item.month + '-01').toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
                  
                  return (
                    <div key={index}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">{monthName}</span>
                        <span className="text-sm font-bold text-purple-600">
                          +{item.new_users || 0} user
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">👥</div>
                <p>Belum ada data user</p>
              </div>
            )}
          </div>
        </ResponsiveCard>
      </ResponsiveGrid>

      {/* Payment Method Statistics - Full Width */}
      <ResponsiveCard>
        <h3 className="text-xl font-bold text-gray-900 mb-4">💳 Metode Pembayaran Terpopuler</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {analytics.paymentMethods && analytics.paymentMethods.length > 0 ? (
            analytics.paymentMethods.slice(0, 6).map((method, index) => {
              // Map payment types to icons and colors
              const getPaymentIcon = (type) => {
                const typeUpper = (type || '').toUpperCase();
                if (typeUpper === 'BANK_TRANSFER') return '🏦';
                if (typeUpper === 'ECHANNEL') return '🏦';
                if (typeUpper === 'GOPAY') return '💚';
                if (typeUpper === 'SHOPEEPAY') return '🧡';
                if (typeUpper === 'QRIS') return '📱';
                if (typeUpper === 'CSTORE') return '🏪';
                if (typeUpper === 'CREDIT_CARD') return '💳';
                return '💳';
              };

              const getPaymentColor = (type) => {
                const typeUpper = (type || '').toUpperCase();
                if (typeUpper === 'BANK_TRANSFER') return 'from-blue-500 to-blue-600';
                if (typeUpper === 'ECHANNEL') return 'from-blue-500 to-blue-600';
                if (typeUpper === 'GOPAY') return 'from-green-500 to-green-600';
                if (typeUpper === 'SHOPEEPAY') return 'from-orange-500 to-orange-600';
                if (typeUpper === 'QRIS') return 'from-purple-500 to-purple-600';
                if (typeUpper === 'CSTORE') return 'from-yellow-500 to-yellow-600';
                if (typeUpper === 'CREDIT_CARD') return 'from-indigo-500 to-indigo-600';
                return 'from-gray-500 to-gray-600';
              };

              const getPaymentName = (type, bank) => {
                const typeUpper = (type || '').toUpperCase();
                if (typeUpper === 'BANK_TRANSFER') {
                  return bank ? `${bank} VA` : 'Bank Transfer';
                }
                if (typeUpper === 'ECHANNEL') return 'Mandiri Bill';
                if (typeUpper === 'GOPAY') return 'GoPay';
                if (typeUpper === 'SHOPEEPAY') return 'ShopeePay';
                if (typeUpper === 'QRIS') return 'QRIS';
                if (typeUpper === 'CSTORE') return bank || 'Convenience Store';
                if (typeUpper === 'CREDIT_CARD') return 'Credit Card';
                return type;
              };

              const icon = getPaymentIcon(method.payment_type);
              const color = getPaymentColor(method.payment_type);
              const name = getPaymentName(method.payment_type, method.bank_name);
              const totalTransactions = analytics.paymentMethods.reduce((sum, m) => sum + (m.transaction_count || 0), 0);
              const percentage = totalTransactions > 0 ? ((method.transaction_count || 0) / totalTransactions * 100).toFixed(1) : 0;

              return (
                <div key={index} className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white text-xl shadow-md`}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-900 truncate">{name}</div>
                      <div className="text-xs text-gray-500">{percentage}% dari total</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Transaksi:</span>
                      <span className="font-semibold text-gray-900">{method.transaction_count || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Selesai:</span>
                      <span className="font-semibold text-green-600">{method.completed_count || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Revenue:</span>
                      <span className="font-semibold text-blue-600">Rp {formatRupiah(method.total_revenue || 0)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className={`bg-gradient-to-r ${color} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">💳</div>
              <p>Belum ada data metode pembayaran</p>
            </div>
          )}
        </div>
      </ResponsiveCard>
    </div>
  );

  // Render Settings Tab
  const renderSettings = () => (
    <div className="space-y-6">
      <ResponsiveCard>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">⚙️ Pengaturan</h2>
        
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">🔐 Keamanan</h3>
            <div className="space-y-2">
              <InteractiveButton variant="secondary" fullWidth>
                🔑 Ubah Password Admin
              </InteractiveButton>
              <InteractiveButton variant="secondary" fullWidth>
                📧 Pengaturan Email
              </InteractiveButton>
              <InteractiveButton variant="secondary" fullWidth>
                🛡️ Log Keamanan
              </InteractiveButton>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">💳 Payment Gateway</h3>
            <div className="space-y-2">
              <InteractiveButton variant="secondary" fullWidth>
                ⚙️ Konfigurasi Midtrans
              </InteractiveButton>
              <InteractiveButton variant="secondary" fullWidth>
                💰 Fee & Commission
              </InteractiveButton>
            </div>
          </div>

          {/* Development Mode */}
          <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200">
            <h3 className="font-semibold mb-2 text-yellow-800">🛠️ Development Mode (Testing Only)</h3>
            <p className="text-xs text-yellow-700 mb-3">
              💡 Buat transaksi pembelian tiket untuk testing tanpa perlu bayar melalui Midtrans
            </p>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Pilih Event:</label>
                <select 
                  id="devEventId"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                >
                  <option value="">-- Pilih Event --</option>
                  {events.map(event => (
                    <option key={event.id} value={event.id}>
                      {event.title} - Rp {event.price?.toLocaleString()} (Stock: {event.current_stock})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Pilih User/Pembeli:</label>
                <select 
                  id="devUserId"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                >
                  <option value="">-- Pilih User --</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.username} ({user.email}) - {user.role}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Jumlah Tiket:</label>
                <input 
                  type="number" 
                  id="devQuantity"
                  placeholder="Masukkan jumlah tiket"
                  defaultValue="1"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
            <InteractiveButton 
              variant="warning" 
              fullWidth
              onClick={() => {
                const eventId = document.getElementById('devEventId').value;
                const userId = document.getElementById('devUserId').value;
                const quantity = document.getElementById('devQuantity').value;
                if (!eventId || !userId || !quantity) {
                  alert('Harap pilih event, user, dan masukkan jumlah tiket!');
                  return;
                }
                const selectedEvent = events.find(e => e.id == eventId);
                const selectedUser = users.find(u => u.id == userId);
                if (confirm(`Buat transaksi pembelian ${quantity} tiket "${selectedEvent?.title}" untuk user "${selectedUser?.username}"?`)) {
                  handleDevPayment(parseInt(eventId), parseInt(userId), parseInt(quantity));
                }
              }}
            >
              💳 Beli Tiket (Dev Mode)
            </InteractiveButton>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">🌐 Platform</h3>
            <div className="space-y-2">
              <InteractiveButton variant="secondary" fullWidth>
                📱 Pengaturan Aplikasi
              </InteractiveButton>
              <InteractiveButton variant="secondary" fullWidth>
                🎨 Kustomisasi Tema
              </InteractiveButton>
              <InteractiveButton variant="secondary" fullWidth>
                📊 Backup Data
              </InteractiveButton>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <InteractiveButton
              variant="danger"
              fullWidth
              onClick={handleLogout}
            >
              🚪 Logout Admin
            </InteractiveButton>
          </div>
        </div>
      </ResponsiveCard>
    </div>
  );

  if (loading) {
    return (
      <ResponsiveLayout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat admin dashboard...</p>
          </div>
        </div>
      </ResponsiveLayout>
    );
  }

  return (
    <ResponsiveLayout>
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 pb-20 md:pb-6">
        <div className="container-responsive">
          {/* Header */}
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-red-600">Admin Dashboard</h1>
                <p className="text-gray-600 mt-1">Kelola Platform Tiket Baris</p>
              </div>
              {!isMobile && (
                <InteractiveButton variant="danger" onClick={handleLogout}>
                  🚪 Logout
                </InteractiveButton>
              )}
            </div>
          </div>

          {/* Desktop Navigation */}
          {!isMobile && (
            <div className="mb-6">
              <div className="flex space-x-1 bg-white p-2 rounded-2xl shadow-lg">
                {[
                  { key: 'dashboard', label: '📊 Dashboard' },
                  { key: 'events', label: '🎭 Events' },
                  { key: 'users', label: '👥 Users' },
                  { key: 'transactions', label: '💳 Transaksi' },
                  { key: 'analytics', label: '📈 Analytics' },
                  { key: 'settings', label: '⚙️ Settings' }
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
            {activeTab === 'users' && renderUsers()}
            {activeTab === 'transactions' && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">💳 Transaction Management</h2>
                  <InteractiveButton 
                    variant="primary" 
                    onClick={() => navigate('/admin/transactions')}
                  >
                    Buka Halaman Lengkap →
                  </InteractiveButton>
                </div>
                <p className="text-gray-600">
                  Kelola dan monitor semua transaksi pembelian tiket di halaman khusus dengan fitur lengkap:
                  filter, search, update status manual, dan view QR codes.
                </p>
              </div>
            )}
            {activeTab === 'analytics' && renderAnalytics()}
            {activeTab === 'settings' && renderSettings()}
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobile && (
          <MobileNavigation
            items={mobileNavItems}
            activeItem={activeTab}
            onItemClick={(item) => setActiveTab(item.key)}
          />
        )}

        {/* Notifications */}
        <NotificationToast
          type={notification.type}
          message={notification.message}
          isVisible={notification.show}
          onClose={() => setNotification({ ...notification, show: false })}
        />
      </div>
    </ResponsiveLayout>
  );
};

export default DashboardAdminResponsive;


