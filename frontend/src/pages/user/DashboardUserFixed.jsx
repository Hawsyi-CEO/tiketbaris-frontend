import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventService, userService } from '../../services/apiServices';
import DevicesSidebar from '../../components/DevicesSidebar';

export default function DashboardUser() {
  const [events, setEvents] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState('browse');
  const [showDevicesSidebar, setShowDevicesSidebar] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [eventsRes, userRes] = await Promise.all([
        eventService.getAllEvents(),
        userService.getProfile()
      ]);
      setEvents(eventsRes.data);
      setUser(userRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleCheckout = (eventId) => {
    navigate(`/user/checkout/${eventId}`);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-container">
          <div className="logo-section">
            <h1 className="app-logo">🎫 tiketbaris.id</h1>
            <p className="app-subtitle">User Dashboard</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button 
              onClick={() => setShowDevicesSidebar(true)}
              style={{
                padding: '8px 16px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
              onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
            >
              🔐 Devices
            </button>
            <span style={{ color: 'white', fontWeight: '600' }}>👤 {user?.username}</span>
            <button onClick={handleLogout} className="btn btn-primary">
              🚪 Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div style={{ display: 'flex', flex: 1, width: '100%', minHeight: 'calc(100vh - 80px)' }}>
        {/* Sidebar */}
        <aside className="sidebar">
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button onClick={() => setActiveMenu('browse')} className={`nav-item ${activeMenu === 'browse' ? 'active' : ''}`}>
              📖 Jelajahi Event
            </button>
            <button onClick={() => navigate('/user/history')} className="nav-item">
              💳 Riwayat Pembayaran
            </button>
            <button onClick={() => setActiveMenu('profile')} className={`nav-item ${activeMenu === 'profile' ? 'active' : ''}`}>
              👤 Profile
            </button>
            <button onClick={() => setActiveMenu('settings')} className={`nav-item ${activeMenu === 'settings' ? 'active' : ''}`}>
              ⚙️ Pengaturan
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="app-main" style={{ flex: 1 }}>
          {/* Browse Events */}
          {activeMenu === 'browse' && (
            <div className="content-wrapper">
              <div style={{ marginBottom: '30px' }}>
                <h2 className="section-title">🎪 Jelajahi Event Terbaru</h2>
                <p style={{ color: '#6b7280', marginTop: '5px' }}>Temukan event menarik dan beli tiket Anda sekarang</p>
              </div>
              {events.length === 0 ? (
                <div className="card">
                  <p className="no-data">
                    <span style={{ fontSize: '48px', display: 'block', marginBottom: '10px' }}>📭</span>
                    Belum ada event yang tersedia
                  </p>
                </div>
              ) : (
                <div className="card-grid">
                  {events.map(event => (
                    <div key={event.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ position: 'relative', marginBottom: '15px', overflow: 'hidden', borderRadius: '8px' }}>
                        <img src={event.image_url || 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+CiAgPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMjAwLDEwMCkiPgogICAgPHRleHQgeD0iMCIgeT0iMCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjIwIiBmb250LXdlaWdodD0iYm9sZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzZiNzI4MCI+CiAgICAgIPCfkZ/vuI8gRXZlbnQgSW1hZ2UKICAgIDwvdGV4dD4KICA8L2c+Cjwvc3ZnPgo='} alt={event.title} style={{ width: '100%', height: '200px', objectFit: 'cover' }} onError={(e) => { if (!e.target.src.includes('data:image/svg')) e.target.src = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+CiAgPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMjAwLDEwMCkiPgogICAgPHRleHQgeD0iMCIgeT0iMCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjIwIiBmb250LXdlaWdodD0iYm9sZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzZiNzI4MCI+CiAgICAgIPCfkZ/vuI8gRXZlbnQgSW1hZ2UKICAgIDwvdGV4dD4KICA8L2c+Cjwvc3ZnPgo='; }} />
                        <div style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: event.status === 'active' ? '#d1fae5' : '#fef3c7', color: event.status === 'active' ? '#065f46' : '#92400e', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                          {event.status === 'active' ? '✅ Aktif' : '⏳ Pending'}
                        </div>
                      </div>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1f2937', margin: '0 0 10px 0' }}>{event.title}</h3>
                      <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 15px 0' }}>{event.description?.substring(0, 100)}...</p>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '15px' }}>
                        <div>📅 {new Date(event.date).toLocaleDateString('id-ID')}</div>
                        <div>📍 {event.location}</div>
                      </div>
                      <div style={{ marginTop: 'auto', borderTop: '1px solid #e5e7eb', paddingTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0, textTransform: 'uppercase' }}>Harga Tiket</p>
                          <p style={{ fontSize: '18px', fontWeight: '700', color: '#dc2626', margin: '5px 0 0 0' }}>Rp {event.price.toLocaleString('id-ID')}</p>
                        </div>
                        <button onClick={() => handleCheckout(event.id)} className="btn btn-primary">
                          🛒 Beli
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Profile Section */}
          {activeMenu === 'profile' && (
            <div className="content-wrapper">
              <h2 className="section-title">👤 Profil Anda</h2>
              <div className="card">
                <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#dc2626', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: '700', flexShrink: 0 }}>
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', margin: '0 0 5px 0' }}>{user?.username}</h3>
                    <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 5px 0' }}>{user?.email}</p>
                    <p style={{ fontSize: '14px', color: '#4b5563', margin: 0 }}>
                      {user?.role === 'panitia' ? '🎪 Panitia' : user?.role === 'admin' ? '👑 Admin' : '👤 User'}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
                  <div>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 5px 0', textTransform: 'uppercase' }}>Bergabung Tanggal</p>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', margin: 0 }}>{new Date(user?.created_at).toLocaleDateString('id-ID')}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 5px 0', textTransform: 'uppercase' }}>Status</p>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: '#10b981', margin: 0 }}>✅ Active</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Section */}
          {activeMenu === 'settings' && (
            <div className="content-wrapper">
              <h2 className="section-title">⚙️ Pengaturan</h2>
              <div className="card">
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1f2937', margin: '0 0 20px 0' }}>🔔 Notifikasi</h3>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', cursor: 'pointer', fontSize: '14px', color: '#4b5563' }}>
                  <input type="checkbox" defaultChecked />
                  <span>Terima notifikasi email event baru</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px', cursor: 'pointer', fontSize: '14px', color: '#4b5563' }}>
                  <input type="checkbox" defaultChecked />
                  <span>Terima notifikasi pembaruan tiket</span>
                </label>
                <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '30px 0' }} />
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1f2937', margin: '0 0 20px 0' }}>🔒 Keamanan</h3>
                <button style={{ width: '100%', marginBottom: '10px', padding: '10px 20px', backgroundColor: '#f3f4f6', color: '#1f2937', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Ubah Password</button>
                <button style={{ width: '100%', marginBottom: '30px', padding: '10px 20px', backgroundColor: '#f3f4f6', color: '#1f2937', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Atur 2FA</button>
                <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '30px 0' }} />
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#991b1b', margin: '0 0 20px 0' }}>⚠️ Zona Berbahaya</h3>
                <button style={{ width: '100%', padding: '10px 20px', backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Hapus Akun</button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Devices Sidebar */}
      <DevicesSidebar 
        isOpen={showDevicesSidebar} 
        onClose={() => setShowDevicesSidebar(false)} 
      />
    </div>
  );
}
