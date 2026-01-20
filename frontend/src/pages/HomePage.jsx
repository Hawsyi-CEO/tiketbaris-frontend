import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventService } from '../services/apiServices';
import { ResponsiveLayout, ResponsiveCard, InteractiveButton, ResponsiveInput, ResponsiveGrid, NotificationToast } from '../components/ResponsiveComponents';
import EventDetailModal from '../components/EventDetailModal';
import { DOMAIN } from '../config/api';

export default function HomePage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [notification, setNotification] = useState({ show: false, type: 'info', message: '' });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Check auth status
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        setCurrentUser(user);
        setIsLoggedIn(true);
      } catch (e) {
        console.error('Error parsing user data:', e);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        setCurrentUser(null);
      }
    } else {
      setIsLoggedIn(false);
      setCurrentUser(null);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, searchTerm, selectedCategory]);

  const fetchEvents = async () => {
    try {
      const response = await eventService.getAllEvents();
      setEvents(response.data || []);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('⚠️ Gagal memuat events');
      showNotification('error', 'Gagal memuat event');
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = events;
    
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredEvents(filtered);
  };

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
  };

  const handleCloseModal = () => {
    setSelectedEvent(null);
  };

  const handleCheckout = (eventId) => {
    console.log('🎫 handleCheckout called with eventId:', eventId);
    console.log('🔐 isLoggedIn:', isLoggedIn);
    console.log('👤 currentUser:', currentUser);
    
    if (!isLoggedIn) {
      showNotification('info', 'Silakan login terlebih dahulu untuk membeli tiket');
      setTimeout(() => {
        navigate('/login');
      }, 1000);
      return;
    }
    
    // Find event by ID from events array
    const eventToCheckout = events.find(e => e.id === eventId);
    console.log('✅ Navigating to checkout with event:', eventToCheckout);
    
    if (eventToCheckout) {
      navigate('/checkout', { state: { event: eventToCheckout } });
    } else {
      showNotification('error', 'Event tidak ditemukan');
    }
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleRegisterClick = () => {
    navigate('/register');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setCurrentUser(null);
    showNotification('success', 'Logout berhasil');
  };

  const getDashboardPath = () => {
    if (!currentUser || !currentUser.role) return '/login';
    
    switch(currentUser.role) {
      case 'admin':
        return '/admin/dashboard';
      case 'panitia':
        return '/panitia/dashboard';
      case 'user':
        return '/user/dashboard';
      default:
        return '/login';
    }
  };

  const categories = [
    { key: 'all', label: 'Semua', icon: '🎭' },
    { key: 'music', label: 'Musik', icon: '🎵' },
    { key: 'theater', label: 'Teater', icon: '🎪' },
    { key: 'sports', label: 'Olahraga', icon: '⚽' },
    { key: 'tech', label: 'Teknologi', icon: '💻' }
  ];

  if (loading) {
    return (
      <ResponsiveLayout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-pink-50">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat event...</p>
          </div>
        </div>
      </ResponsiveLayout>
    );
  }

  return (
    <ResponsiveLayout>
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-pink-50">
        {/* Header/Navigation */}
        <nav className="glass-effect sticky top-0 z-50 border-b border-white border-opacity-20">
          <div className="container-responsive py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold gradient-text cursor-pointer" 
                    onClick={() => navigate('/')}>
                  🎫 Tiket Baris
                </h1>
                <span className="hidden sm:block text-gray-600">Platform Tiket Digital</span>
              </div>
              
              <div className="flex items-center space-x-2 sm:space-x-4">
                {isLoggedIn ? (
                  <>
                    <div className="hidden sm:block">
                      <InteractiveButton
                        variant="primary"
                        size="small"
                        onClick={() => navigate(getDashboardPath())}
                      >
                        📊 Dashboard
                      </InteractiveButton>
                    </div>
                    <div className="sm:hidden">
                      <InteractiveButton
                        variant="primary"
                        size="small"
                        onClick={() => navigate(getDashboardPath())}
                      >
                        📊
                      </InteractiveButton>
                    </div>
                    {currentUser?.role === 'user' && (
                      <InteractiveButton
                        variant="success"
                        size="small"
                        onClick={() => navigate('/user/dashboard', { state: { activeTab: 'tickets' } })}
                      >
                        <span className="hidden sm:inline">🎟️ My Ticket</span>
                        <span className="sm:hidden">🎟️</span>
                      </InteractiveButton>
                    )}
                    <InteractiveButton
                      variant="secondary"
                      size="small"
                      onClick={() => navigate(getDashboardPath())}
                      className="hidden md:flex"
                    >
                      👤 {currentUser?.username || currentUser?.name || 'User'}
                    </InteractiveButton>
                    <InteractiveButton
                      variant="danger"
                      size="small"
                      onClick={handleLogout}
                    >
                      <span className="hidden sm:inline">🚪 Logout</span>
                      <span className="sm:hidden">🚪</span>
                    </InteractiveButton>
                  </>
                ) : (
                  <>
                    <InteractiveButton
                      variant="secondary"
                      size="small"
                      onClick={handleLoginClick}
                    >
                      🔐 Login
                    </InteractiveButton>
                    <InteractiveButton
                      variant="primary"
                      size="small"
                      onClick={handleRegisterClick}
                    >
                      📝 Register
                    </InteractiveButton>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="section-padding">
          <div className="container-responsive text-center">
            <div className="fade-in-up space-y-6 max-w-4xl mx-auto">
              <h2 className="heading-responsive gradient-text">
                Temukan Event Terbaik di Indonesia 🇮🇩
              </h2>
              <p className="text-body-responsive text-gray-600 max-w-2xl mx-auto">
                Jelajahi berbagai event menarik mulai dari konser, seminar, workshop, 
                hingga festival. Beli tiket dengan mudah dan aman!
              </p>
              
              {/* Search Bar */}
              <div className="max-w-2xl mx-auto">
                <ResponsiveInput
                  placeholder="🔍 Cari event, lokasi, atau kategori..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon="🔍"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="pb-8">
          <div className="container-responsive">
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
              {categories.map((category) => (
                <button
                  key={category.key}
                  onClick={() => setSelectedCategory(category.key)}
                  className={`
                    px-4 py-2 sm:px-6 sm:py-3 rounded-full font-medium transition-all duration-300
                    ${selectedCategory === category.key
                      ? 'bg-red-600 text-white shadow-lg scale-105'
                      : 'bg-white text-gray-600 hover:bg-red-50 hover:text-red-600'
                    }
                  `}
                >
                  <span className="mr-2">{category.icon}</span>
                  <span className="hidden sm:inline">{category.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Events Grid */}
        <section className="section-padding">
          <div className="container-responsive">
            <div className="text-center mb-12">
              <h3 className="subheading-responsive font-bold text-gray-900 mb-4">
                🎭 Event Pilihan Terbaik
              </h3>
              <p className="text-body-responsive text-gray-600">
                Jangan sampai terlewat! Event-event spektakuler menanti Anda
              </p>
            </div>

            {error && (
              <div className="text-center mb-8">
                <div className="bg-red-100 border border-red-300 text-red-700 px-6 py-4 rounded-lg">
                  {error}
                </div>
              </div>
            )}

            {filteredEvents.length > 0 ? (
              <ResponsiveGrid cols={{ xs: 1, sm: 2, lg: 3, xl: 4 }}>
                {filteredEvents.map((event) => {
                  const imageUrl = event.image_url 
                    ? (event.image_url.startsWith('http') ? event.image_url : `${DOMAIN}${event.image_url}`)
                    : 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+CiAgPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMjAwLDEwMCkiPgogICAgPHRleHQgeD0iMCIgeT0iMCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjIwIiBmb250LXdlaWdodD0iYm9sZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzZiNzI4MCI+CiAgICAgIPCfkZ/vuI8gRXZlbnQgSW1hZ2UKICAgIDwvdGV4dD4KICA8L2c+Cjwvc3ZnPgo=';
                  
                  // Check if event has passed
                  const eventDate = new Date(event.date);
                  const now = new Date();
                  const isPastEvent = eventDate < now;
                  const isSoldOut = event.status === 'sold_out' || event.stock <= 0;

                  return (
                    <div
                      key={event.id}
                      className={`interactive-card bg-white rounded-2xl overflow-hidden shadow-soft hover-lift cursor-pointer ${isPastEvent ? 'opacity-75' : ''}`}
                      onClick={() => handleEventClick(event)}
                    >
                      {/* Event Image */}
                      <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-red-200 to-orange-200">
                        <img
                          src={imageUrl}
                          alt={event.title}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                          onError={(e) => {
                            if (!e.target.src.includes('data:image/svg')) {
                              e.target.src = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+CiAgPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMjAwLDEwMCkiPgogICAgPHRleHQgeD0iMCIgeT0iMCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjIwIiBmb250LXdlaWdodD0iYm9sZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzZiNzI4MCI+CiAgICAgIPCfkZ/vuI8gRXZlbnQgSW1hZ2UKICAgIDwvdGV4dD4KICA8L2c+Cjwvc3ZnPgo=';
                            }
                          }}
                        />
                        
                        {/* Status Badge */}
                        <div className="absolute top-4 left-4">
                          {isPastEvent ? (
                            <span className="bg-gray-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                              ⏰ Event Telah Lewat
                            </span>
                          ) : isSoldOut ? (
                            <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                              🚫 SOLD OUT
                            </span>
                          ) : (
                            <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                              ✅ Tersedia
                            </span>
                          )}
                        </div>

                        {/* Stock Badge */}
                        {!isPastEvent && (
                          <div className="absolute top-4 right-4">
                            <span className="bg-white bg-opacity-90 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold">
                              🎫 {event.stock || 'N/A'} tersisa
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Event Content */}
                      <div className="padding-responsive">
                        <div className="space-y-3">
                          <h3 className="font-bold text-lg text-gray-900 line-clamp-2">
                            {event.title}
                          </h3>
                          
                          <p className="text-gray-600 text-sm line-clamp-3">
                            {event.description}
                          </p>

                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <span className="text-red-500">📅</span>
                              <span>
                                {new Date(event.date).toLocaleDateString('id-ID', {
                                  weekday: 'short',
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span>📍</span>
                              <span className="line-clamp-1">{event.location}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <div>
                              <div className="text-xs text-gray-500">Mulai dari</div>
                              <div className="text-xl font-bold text-green-600">
                                Rp {event.price?.toLocaleString('id-ID') || '0'}
                              </div>
                            </div>
                            
                            {isPastEvent ? (
                              <InteractiveButton
                                variant="secondary"
                                size="small"
                                disabled
                                className="opacity-50 cursor-not-allowed"
                              >
                                ⏰ Telah Lewat
                              </InteractiveButton>
                            ) : isSoldOut ? (
                              <InteractiveButton
                                variant="secondary"
                                size="small"
                                disabled
                                className="opacity-50 cursor-not-allowed"
                              >
                                🚫 SOLD OUT
                              </InteractiveButton>
                            ) : (
                              <InteractiveButton
                                variant="primary"
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isLoggedIn) {
                                    handleCheckout(event.id);
                                  } else {
                                    handleEventClick(event);
                                  }
                                }}
                              >
                                {isLoggedIn ? '🎟️ Beli' : '👀 Lihat'}
                              </InteractiveButton>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </ResponsiveGrid>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-6">🔍</div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  {searchTerm ? 'Event tidak ditemukan' : 'Belum ada event'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm 
                    ? 'Coba gunakan kata kunci yang berbeda atau lihat semua kategori'
                    : 'Event akan segera hadir. Pantau terus untuk update terbaru!'
                  }
                </p>
                {searchTerm && (
                  <InteractiveButton
                    variant="primary"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('all');
                    }}
                  >
                    🔄 Reset Filter
                  </InteractiveButton>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Call to Action - Only show if not logged in */}
        {!isLoggedIn && (
          <section className="section-padding bg-gradient-to-r from-red-600 to-orange-600">
            <div className="container-responsive text-center text-white">
              <div className="space-y-6 max-w-3xl mx-auto">
                <h3 className="subheading-responsive font-bold">
                  🚀 Siap untuk pengalaman tak terlupakan?
                </h3>
                <p className="text-body-responsive text-red-100">
                  Bergabung dengan ribuan orang yang sudah merasakan kemudahan 
                  membeli tiket di Tiket Baris. Daftar sekarang dan dapatkan akses eksklusif!
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <InteractiveButton
                    variant="secondary"
                    size="large"
                    onClick={handleRegisterClick}
                  >
                    📝 Daftar Gratis
                  </InteractiveButton>
                  <InteractiveButton
                    variant="primary"
                    size="large"
                    onClick={handleLoginClick}
                    className="bg-white text-red-600 hover:bg-gray-100"
                  >
                    🔐 Masuk Sekarang
                  </InteractiveButton>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="bg-gray-900 text-white">
          <div className="container-responsive padding-responsive">
            <div className="text-center space-y-4">
              <div className="text-2xl font-bold gradient-text">🎫 Tiket Baris</div>
              <p className="text-gray-400">
                Platform tiket digital terpercaya di Indonesia
              </p>
              <div className="flex justify-center space-x-6 text-sm">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Tentang Kami
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Bantuan
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Syarat & Ketentuan
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Kebijakan Privasi
                </a>
              </div>
              <div className="pt-6 border-t border-gray-700 text-gray-500 text-sm">
                © 2025 Tiket Baris. All rights reserved.
              </div>
            </div>
          </div>
        </footer>

        {/* Event Detail Modal */}
        {selectedEvent && (
          <EventDetailModal
            event={selectedEvent}
            onClose={handleCloseModal}
            onCheckout={handleCheckout}
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
}
