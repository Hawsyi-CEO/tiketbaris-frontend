import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function DashboardAdminSimple() {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, active, cancelled
  const [searchQuery, setSearchQuery] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [eventDetails, setEventDetails] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [events, filter, searchQuery]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.get('/api/admin/pending-events', { headers });
      setEvents(response.data || []);
      setError('');
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Gagal memuat data events: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = events;

    // Filter by status
    if (filter !== 'all') {
      filtered = filtered.filter(e => e.status === filter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        e.title.toLowerCase().includes(query) ||
        e.location.toLowerCase().includes(query) ||
        e.username.toLowerCase().includes(query)
      );
    }

    setFilteredEvents(filtered);
  };

  const handleApproveEvent = async (eventId, eventTitle) => {
    if (!window.confirm(`Setujui event "${eventTitle}"?`)) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `/api/admin/approve-event/${eventId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccessMessage(`✅ Event "${eventTitle}" berhasil disetujui!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchEvents();
    } catch (err) {
      alert('❌ Error: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDeclineEvent = async (eventId, eventTitle) => {
    if (!window.confirm(`Tolak event "${eventTitle}"?`)) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `/api/admin/decline-event/${eventId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccessMessage(`⛔ Event "${eventTitle}" ditolak`);
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchEvents();
    } catch (err) {
      alert('❌ Error: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleViewDetails = (eventId) => {
    navigate(`/admin/event/${eventId}`);
  };

  const handleDeleteEvent = async (eventId, eventTitle) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus event "${eventTitle}"? Tindakan ini tidak dapat dibatalkan!`)) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/admin/event/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccessMessage(`🗑️ Event "${eventTitle}" berhasil dihapus`);
      setTimeout(() => setSuccessMessage(''), 3000);
      setShowDetailModal(false);
      fetchEvents();
    } catch (err) {
      alert('❌ Error: ' + (err.response?.data?.error || err.message));
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pending': { bg: '#fef3c7', color: '#92400e', label: '⏳ Pending' },
      'active': { bg: '#d1fae5', color: '#065f46', label: '✅ Active' },
      'cancelled': { bg: '#fee2e2', color: '#991b1b', label: '❌ Cancelled' }
    };
    return badges[status] || badges['pending'];
  };

  const stats = {
    total: events.length,
    pending: events.filter(e => e.status === 'pending').length,
    active: events.filter(e => e.status === 'active').length,
    cancelled: events.filter(e => e.status === 'cancelled').length
  };

  if (loading) {
    return (
      <div className="admin-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-content">
          <h1 className="admin-title">📊 Admin Dashboard</h1>
          <button className="btn btn-logout" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </header>

      {/* Success Message */}
      {successMessage && (
        <div className="alert alert-success" style={{ margin: '20px' }}>
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="alert alert-error" style={{ margin: '20px' }}>
          {error}
        </div>
      )}

      {/* Main Content */}
      <div className="admin-content">
        {/* Stats Cards */}
        <section className="stats-section">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">{stats.total}</div>
              <div className="stat-label">Total Events</div>
            </div>
            <div className="stat-card stat-pending">
              <div className="stat-number">{stats.pending}</div>
              <div className="stat-label">Pending</div>
            </div>
            <div className="stat-card stat-active">
              <div className="stat-number">{stats.active}</div>
              <div className="stat-label">Active</div>
            </div>
            <div className="stat-card stat-cancelled">
              <div className="stat-number">{stats.cancelled}</div>
              <div className="stat-label">Cancelled</div>
            </div>
          </div>
        </section>

        {/* Filters & Search */}
        <section className="filters-section">
          <div className="filters-container">
            <div className="search-box">
              <input
                type="text"
                placeholder="🔍 Cari event, lokasi, atau organizer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="filter-tabs">
              <button
                className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                📋 Semua ({stats.total})
              </button>
              <button
                className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
                onClick={() => setFilter('pending')}
              >
                ⏳ Pending ({stats.pending})
              </button>
              <button
                className={`filter-tab ${filter === 'active' ? 'active' : ''}`}
                onClick={() => setFilter('active')}
              >
                ✅ Active ({stats.active})
              </button>
              <button
                className={`filter-tab ${filter === 'cancelled' ? 'active' : ''}`}
                onClick={() => setFilter('cancelled')}
              >
                ❌ Cancelled ({stats.cancelled})
              </button>
            </div>
          </div>
        </section>

        {/* Events List */}
        <section className="events-list-section">
          {filteredEvents.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>No Events Found</h3>
              <p>Tidak ada event yang cocok dengan filter Anda</p>
            </div>
          ) : (
            <div className="events-table-container">
              {filteredEvents.map(event => {
                const badge = getStatusBadge(event.status);
                const eventDate = new Date(event.date).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                });

                return (
                  <div key={event.id} className="event-admin-card">
                    <div className="event-admin-header">
                      <div>
                        <h3 className="event-admin-title">{event.title}</h3>
                        <p className="event-admin-organizer">
                          👤 Organizer: <strong>{event.username}</strong>
                        </p>
                      </div>
                      <div
                        className="status-badge"
                        style={{ backgroundColor: badge.bg, color: badge.color }}
                      >
                        {badge.label}
                      </div>
                    </div>

                    <div className="event-admin-details">
                      <div className="detail-item">
                        <span className="detail-icon">📅</span>
                        <div className="detail-content">
                          <p className="detail-label">Tanggal</p>
                          <p className="detail-value">{eventDate}</p>
                        </div>
                      </div>

                      <div className="detail-item">
                        <span className="detail-icon">📍</span>
                        <div className="detail-content">
                          <p className="detail-label">Lokasi</p>
                          <p className="detail-value">{event.location}</p>
                        </div>
                      </div>

                      <div className="detail-item">
                        <span className="detail-icon">💰</span>
                        <div className="detail-content">
                          <p className="detail-label">Harga</p>
                          <p className="detail-value">
                            Rp {event.price?.toLocaleString('id-ID') || '0'}
                          </p>
                        </div>
                      </div>

                      <div className="detail-item">
                        <span className="detail-icon">🎫</span>
                        <div className="detail-content">
                          <p className="detail-label">Kapasitas</p>
                          <p className="detail-value">
                            {event.stock || event.capacity || '-'} tiket
                          </p>
                        </div>
                      </div>

                      <div className="detail-item">
                        <span className="detail-icon">⏰</span>
                        <div className="detail-content">
                          <p className="detail-label">Didaftarkan</p>
                          <p className="detail-value">
                            {new Date(event.created_at).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {event.status === 'pending' && (
                      <div className="event-admin-actions">
                        <button
                          className="btn btn-approve"
                          onClick={() => handleApproveEvent(event.id, event.title)}
                        >
                          ✅ Approve Event
                        </button>
                        <button
                          className="btn btn-info"
                          onClick={() => handleViewDetails(event.id)}
                        >
                          👁️ View Details
                        </button>
                        <button
                          className="btn btn-decline"
                          onClick={() => handleDeclineEvent(event.id, event.title)}
                        >
                          ❌ Decline Event
                        </button>
                      </div>
                    )}

                    {event.status === 'active' && (
                      <div className="event-admin-actions">
                        <button
                          className="btn btn-info"
                          onClick={() => handleViewDetails(event.id)}
                        >
                          👁️ View Details
                        </button>
                        <button
                          className="btn btn-decline"
                          onClick={() => handleDeclineEvent(event.id, event.title)}
                        >
                          ❌ Cancel Event
                        </button>
                      </div>
                    )}

                    {event.status === 'cancelled' && (
                      <div className="event-admin-actions">
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDeleteEvent(event.id, event.title)}
                        >
                          🗑️ Delete Event
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Detail Modal */}
      {showDetailModal && eventDetails && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📋 Detail Event & Pembayaran</h2>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Event Info */}
              <div className="modal-section">
                <h3>📌 Informasi Event</h3>
                <div className="detail-grid">
                  <div className="detail-row">
                    <span className="detail-key">Judul:</span>
                    <span className="detail-val">{eventDetails.event.title}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-key">Organizer:</span>
                    <span className="detail-val">{eventDetails.event.username} ({eventDetails.event.organizer_email})</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-key">Tanggal:</span>
                    <span className="detail-val">
                      {new Date(eventDetails.event.date).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-key">Lokasi:</span>
                    <span className="detail-val">{eventDetails.event.location}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-key">Harga:</span>
                    <span className="detail-val">Rp {eventDetails.event.price?.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-key">Kapasitas:</span>
                    <span className="detail-val">{eventDetails.event.stock || eventDetails.event.capacity} tiket</span>
                  </div>
                </div>
              </div>

              {/* Unpaid Users */}
              <div className="modal-section">
                <h3>💳 Pembayaran yang Belum Diterima ({eventDetails.totalUnpaid})</h3>
                {eventDetails.unpaidTransactions.length === 0 ? (
                  <p style={{ color: '#10b981', fontWeight: '600' }}>✅ Semua pembayaran sudah diterima!</p>
                ) : (
                  <div className="unpaid-table">
                    {eventDetails.unpaidTransactions.map(trans => (
                      <div key={trans.id} className="unpaid-row">
                        <div className="unpaid-info">
                          <p className="unpaid-user">👤 {trans.username}</p>
                          <p className="unpaid-email">{trans.email}</p>
                        </div>
                        <div className="unpaid-details">
                          <span className="unpaid-qty">🎫 {trans.quantity} tiket</span>
                          <span className="unpaid-amount">Rp {trans.total_amount?.toLocaleString('id-ID')}</span>
                          <span className={`unpaid-status ${trans.status}`}>{trans.status?.toUpperCase()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>
                Tutup
              </button>
              {eventDetails.event.status === 'cancelled' && (
                <button
                  className="btn btn-danger"
                  onClick={() => handleDeleteEvent(eventDetails.event.id, eventDetails.event.title)}
                >
                  🗑️ Hapus Event Permanen
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
