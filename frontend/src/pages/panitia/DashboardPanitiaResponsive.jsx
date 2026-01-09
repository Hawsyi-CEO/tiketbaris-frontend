import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsQR from 'jsqr';
import { ResponsiveLayout, ResponsiveCard, InteractiveButton, ResponsiveInput, ResponsiveGrid, MobileNavigation, StatsCard, NotificationToast } from '../../components/ResponsiveComponents';
import socketService from '../../services/socket';
import { API_URL, DOMAIN } from '../../config/api';

const DashboardPanitiaResponsive = () => {
  const navigate = useNavigate();
  const [panitia, setPanitia] = useState(null);
  const [events, setEvents] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, type: 'info', message: '' });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [scanMode, setScanMode] = useState(false);
  const [scanResult, setScanResult] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [scannedTickets, setScannedTickets] = useState([]);
  const [scanAttempts, setScanAttempts] = useState(0);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Mobile navigation items
  const mobileNavItems = [
    { key: 'dashboard', label: 'Dashboard', icon: '📊' },
    { key: 'events', label: 'My Events', icon: '🎭' },
    { key: 'scan', label: 'Scan Ticket', icon: '📱' },
    { key: 'reports', label: 'Reports', icon: '📋' },
    { key: 'profile', label: 'Profile', icon: '👤' }
  ];

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchPanitiaData();
    fetchMyEvents();
    fetchTickets();
    
    // Cleanup camera on unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, []);

  const fetchPanitiaData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/panitia/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPanitia(response.data.user);
    } catch (error) {
      console.error('Error fetching panitia:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  const fetchMyEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/panitia/my-events`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvents(response.data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      showNotification('error', 'Gagal memuat event');
    }
  };

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/panitia/event-tickets`, {
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

  // WebSocket Setup - Real-time ticket scanning updates
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Connect to WebSocket
    socketService.connect(token);

    // Join rooms for all managed events
    if (events.length > 0) {
      const eventIds = events.map(e => e.id);
      socketService.joinManagedEvents(eventIds);
    }

    // Listen for any ticket scanned in my events
    socketService.onTicketScanned((data) => {
      console.log('Real-time: Ticket scanned', data);
      
      // Update tickets list
      fetchTickets();
      
      // Add to recent scans
      setScannedTickets(prev => [{
        ticket_code: data.ticket_code,
        scanned_at: data.scanned_at,
        event_title: data.event_title,
        user_name: data.user_name,
        scanned_by: data.scanned_by
      }, ...prev.slice(0, 9)]);
    });

    // Listen for duplicate scan alerts
    socketService.onDuplicateAlert((data) => {
      console.log('Real-time: Duplicate alert', data);
      
      // Show warning notification
      showNotification('warning', `⚠️ DUPLIKAT! Tiket ${data.ticket_code} sudah di-scan sebelumnya`);
      
      // Speak alert
      speakMessage(`Peringatan! Tiket duplikat. Sudah di scan oleh ${data.scanned_by}`);
    });

    // Cleanup on unmount
    return () => {
      socketService.off('ticketScanned');
      socketService.off('duplicateAlert');
      socketService.disconnect();
    };
  }, [events.length]); // Re-run when events change

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
    showNotification('success', 'Logout berhasil');
  };

  const handleScanTicket = async (ticketCode) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/tickets/scan`, {
        ticket_code: ticketCode
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      showNotification('success', response.data.message || `✅ Tiket ${ticketCode} berhasil discan`);
      setScanResult('');
      
      // Add to scanned tickets list
      setScannedTickets(prev => [{
        ticket_code: ticketCode,
        scanned_at: new Date(),
        event_title: response.data.ticket?.event_title || 'Event'
      }, ...prev.slice(0, 9)]);
      
      // Play AI voice success message
      speakMessage('Scan berhasil, silahkan masuk');
      
      fetchTickets();
    } catch (error) {
      console.error('Error scanning ticket:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Gagal scan tiket';
      showNotification('error', errorMsg);
      
      // Play AI voice error message
      speakMessage('Scan gagal, tiket tidak valid');
    }
  };

  // Text-to-Speech function
  const speakMessage = (message) => {
    try {
      // Check if browser supports speech synthesis
      if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(message);
        
        // Configure voice settings for Indonesian
        utterance.lang = 'id-ID'; // Indonesian language
        utterance.rate = 0.9; // Slightly slower for clarity
        utterance.pitch = 1.0; // Normal pitch
        utterance.volume = 1.0; // Full volume
        
        // Try to find Indonesian voice, fallback to default
        const voices = window.speechSynthesis.getVoices();
        const indonesianVoice = voices.find(voice => 
          voice.lang.startsWith('id') || voice.lang.startsWith('ID')
        );
        
        if (indonesianVoice) {
          utterance.voice = indonesianVoice;
        }
        
        // Speak the message
        window.speechSynthesis.speak(utterance);
      } else {
        console.log('Speech synthesis not supported');
        // Fallback to beep sound
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA==');
        audio.play().catch(e => console.log('Audio play failed:', e));
      }
    } catch (error) {
      console.error('Error speaking message:', error);
    }
  };

  // Camera Scanner Functions
  const startCamera = async () => {
    try {
      setVideoReady(false);
      console.log('🎥 [PANITIA-1] Starting camera...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: { ideal: 'environment' }, 
          width: { ideal: 1920, min: 640 }, 
          height: { ideal: 1080, min: 480 },
          aspectRatio: { ideal: 16/9 },
          frameRate: { ideal: 30 }
        }
      });
      
      console.log('🎥 [PANITIA-2] Stream obtained:', stream.getVideoTracks()[0].label);
      
      // Set cameraActive FIRST to render video element
      console.log('🎥 [PANITIA-3] Setting cameraActive to true to render video element');
      setCameraActive(true);
      streamRef.current = stream;
      
      // Wait for React to render the video element
      console.log('🎥 [PANITIA-4] Waiting for video element to render...');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('🎥 [PANITIA-5] videoRef.current exists?', !!videoRef.current);
      
      if (!videoRef.current) {
        console.error('🎥 [PANITIA-ERROR] videoRef.current is still null after waiting!');
        showNotification('error', '❌ Video element tidak ditemukan');
        stream.getTracks().forEach(track => track.stop());
        setCameraActive(false);
        return;
      }
      
      console.log('🎥 [PANITIA-6] Setting srcObject to video element');
      videoRef.current.srcObject = stream;
      
      console.log('🎥 [PANITIA-7] Adding event listeners');
      
      videoRef.current.onloadedmetadata = () => {
        console.log('🎥 [PANITIA-8] Metadata loaded:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
      };
      
      videoRef.current.onplaying = () => {
        console.log('🎥 [PANITIA-9] Video playing!');
        setVideoReady(true);
      };
      
      videoRef.current.onerror = (e) => {
        console.error('🎥 [PANITIA-ERROR] Video error:', e);
      };
      
      // Try to play
      console.log('🎥 [PANITIA-10] Attempting to play video...');
      try {
        await videoRef.current.play();
        console.log('🎥 [PANITIA-11] Play command executed successfully');
        
        setTimeout(() => {
          console.log('🎥 [PANITIA-12] Starting scan loop');
          startScanning();
          showNotification('success', '📷 Kamera aktif! Arahkan ke QR code tiket');
        }, 500);
        
      } catch (playError) {
        console.error('🎥 [PANITIA-ERROR] Play failed:', playError);
        showNotification('error', '❌ Gagal memutar video: ' + playError.message);
      }
      
    } catch (error) {
      console.error('🎥 [PANITIA-ERROR] Camera error:', error);
      showNotification('error', '❌ Tidak dapat mengakses kamera. Gunakan manual input.');
      setCameraActive(false);
      setVideoReady(false);
    }
  };

  const stopCamera = () => {
    console.log('🎥 [PANITIA-STOP] Stopping camera...');
    
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      videoRef.current.onloadedmetadata = null;
      videoRef.current.onplaying = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    setCameraActive(false);
    setVideoReady(false);
    setScanAttempts(0);
    showNotification('info', '📷 Kamera dimatikan');
  };

  const startScanning = () => {
    console.log('🔍 [SCAN-1] Starting QR scan loop with requestAnimationFrame...');
    setScanAttempts(0);
    scanQRCode(); // Start the loop
  };

  const scanQRCode = () => {
    // Stop if video elements not available
    if (!videoRef.current || !canvasRef.current) {
      console.log('🔍 [SCAN] Stopping - video/canvas ref not available');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Check if video is ready
    if (video.readyState !== video.HAVE_ENOUGH_DATA || video.videoWidth === 0) {
      // Keep trying
      animationFrameRef.current = requestAnimationFrame(scanQRCode);
      return;
    }

    try {
      const context = canvas.getContext('2d');
      
      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw current frame
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get image data
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Update scan attempts counter
      setScanAttempts(prev => prev + 1);
      
      // Scan for QR code
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code && code.data) {
        console.log('🔍 [SCAN-SUCCESS] ✅ QR Code detected!');
        console.log('🔍 [SCAN-SUCCESS] Data:', code.data);
        console.log('🔍 [SCAN-SUCCESS] Location:', code.location);
        
        try {
          // Try to parse as JSON first (our QR format)
          const qrData = JSON.parse(code.data);
          
          if (qrData.ticket_code) {
            console.log('🔍 [SCAN-SUCCESS] 🎫 Ticket code from JSON:', qrData.ticket_code);
            stopCamera();
            handleScanTicket(qrData.ticket_code);
            return;
          }
        } catch (e) {
          // If not JSON, treat as plain ticket code
          const ticketCode = code.data.trim();
          console.log('🔍 [SCAN-SUCCESS] 📝 Plain ticket code:', ticketCode);
          
          if (ticketCode.length > 5) {
            stopCamera();
            handleScanTicket(ticketCode);
            return;
          }
        }
      }
      
      // Continue scanning with requestAnimationFrame (smoother than setInterval)
      animationFrameRef.current = requestAnimationFrame(scanQRCode);
      
    } catch (error) {
      console.error('🔍 [SCAN-ERROR] Scanning error:', error);
      // Continue scanning even on error
      animationFrameRef.current = requestAnimationFrame(scanQRCode);
    }
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Calculate stats
  const totalEvents = events.length;
  const activeEvents = events.filter(e => e.status === 'active').length;
  const totalTickets = tickets.length;
  const scannedTicketsCount = tickets.filter(t => t.status === 'scanned').length;

  // Render Dashboard Tab
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <ResponsiveCard className="text-center bg-gradient-to-r from-green-500 to-emerald-600 text-white">
        <div className="space-y-4">
          <div className="w-20 h-20 rounded-full bg-white bg-opacity-20 mx-auto flex items-center justify-center text-3xl">
            🎪
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Panitia Dashboard
            </h1>
            <p className="text-green-100 mt-2">
              Kelola event dan tiket dengan mudah
            </p>
          </div>
        </div>
      </ResponsiveCard>

      {/* Stats Grid */}
      <ResponsiveGrid cols={{ xs: 2, sm: 2, lg: 4, xl: 4 }}>
        <StatsCard
          title="My Events"
          value={totalEvents}
          icon="🎭"
          color="blue"
        />
        <StatsCard
          title="Active Events"
          value={activeEvents}
          icon="✅"
          color="green"
        />
        <StatsCard
          title="Total Tickets"
          value={totalTickets}
          icon="🎫"
          color="purple"
        />
        <StatsCard
          title="Scanned"
          value={scannedTicketsCount}
          icon="📱"
          color="yellow"
        />
      </ResponsiveGrid>

      {/* Quick Actions */}
      <ResponsiveCard>
        <h3 className="text-xl font-bold text-gray-900 mb-4">🚀 Aksi Cepat</h3>
        <ResponsiveGrid cols={{ xs: 2, sm: 3, lg: 5 }}>
          <InteractiveButton
            variant="primary"
            fullWidth
            onClick={() => navigate('/panitia/create-event')}
          >
            ➕ Buat Event
          </InteractiveButton>
          <InteractiveButton
            variant="secondary"
            fullWidth
            onClick={() => setActiveTab('events')}
          >
            🎭 Kelola Event
          </InteractiveButton>
          <InteractiveButton
            variant="success"
            fullWidth
            onClick={() => setActiveTab('scan')}
          >
            📱 Scan Tiket
          </InteractiveButton>
          <InteractiveButton
            variant="warning"
            fullWidth
            onClick={() => setActiveTab('reports')}
          >
            📊 Lihat Laporan
          </InteractiveButton>
        </ResponsiveGrid>
      </ResponsiveCard>

      {/* Recent Events */}
      <ResponsiveCard>
        <h3 className="text-xl font-bold text-gray-900 mb-4">📅 Event Terbaru Saya</h3>
        <ResponsiveGrid cols={{ xs: 1, sm: 2, lg: 3 }}>
          {events.slice(0, 6).map((event) => (
            <div
              key={event.id}
              className="interactive-card bg-white rounded-xl p-4 border border-gray-100"
            >
              <div className="aspect-video bg-gradient-to-r from-green-200 to-blue-200 rounded-lg mb-3 flex items-center justify-center">
                {event.image_url ? (
                  <img
                    src={`${DOMAIN}${event.image_url}`}
                    alt={event.title}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <span className="text-4xl">🎭</span>
                )}
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">{event.title}</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span>📅</span>
                  <span>{new Date(event.date).toLocaleDateString('id-ID')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📍</span>
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🎫</span>
                  <span>{event.stock} tiket</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>💰</span>
                  <span className="font-semibold text-green-600">
                    Rp {event.price.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  event.status === 'active' 
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {event.status === 'active' ? '✅ Aktif' : '⏳ Pending'}
                </span>
              </div>
            </div>
          ))}
        </ResponsiveGrid>
        
        {events.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎭</div>
            <h3 className="text-xl font-semibold text-gray-600">Belum ada event</h3>
            <p className="text-gray-500 mt-2 mb-4">Mulai buat event pertama Anda!</p>
            <InteractiveButton
              variant="primary"
              onClick={() => navigate('/panitia/create-event')}
            >
              ➕ Buat Event
            </InteractiveButton>
          </div>
        )}
      </ResponsiveCard>
    </div>
  );

  // Render Events Tab
  const renderEvents = () => (
    <div className="space-y-6">
      <ResponsiveCard>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">🎭 My Events</h2>
          <InteractiveButton
            variant="primary"
            onClick={() => navigate('/panitia/create-event')}
          >
            ➕ Buat Event Baru
          </InteractiveButton>
        </div>

        <ResponsiveGrid cols={{ xs: 1, sm: 2, lg: 3 }}>
          {events.map((event) => (
            <div key={event.id} className="interactive-card bg-white rounded-xl border border-gray-100 overflow-hidden hover-lift">
              <div className="aspect-video bg-gradient-to-r from-green-200 to-blue-200 relative">
                {event.image_url ? (
                  <img
                    src={`${DOMAIN}${event.image_url}`}
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
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{event.description}</p>
                
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
                    <span>Rp {event.price.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🎫</span>
                    <span>{event.stock} tiket tersisa</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <InteractiveButton
                    variant="secondary"
                    size="small"
                    fullWidth
                    onClick={() => navigate(`/panitia/edit-event/${event.id}`)}
                  >
                    ✏️ Edit
                  </InteractiveButton>
                  <InteractiveButton
                    variant="success"
                    size="small"
                    fullWidth
                    onClick={() => {
                      setActiveTab('scan');
                      // Focus on this event's tickets
                    }}
                  >
                    📱 Scan
                  </InteractiveButton>
                </div>
              </div>
            </div>
          ))}
        </ResponsiveGrid>

        {events.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎭</div>
            <h3 className="text-xl font-semibold text-gray-600">Belum ada event</h3>
            <p className="text-gray-500 mt-2 mb-4">Buat event pertama Anda sekarang!</p>
            <InteractiveButton
              variant="primary"
              onClick={() => navigate('/panitia/create-event')}
            >
              ➕ Buat Event Pertama
            </InteractiveButton>
          </div>
        )}
      </ResponsiveCard>
    </div>
  );

  // Render Scan Tab
  const renderScan = () => (
    <div className="space-y-6">
      <ResponsiveCard>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 text-center">📱 Scan Tiket</h2>
        
        <div className="max-w-2xl mx-auto px-2 sm:px-0">
          {/* Camera Scanner */}
          <div className="bg-gradient-to-br from-red-50 to-orange-50 p-4 sm:p-6 rounded-xl mb-6 border-2 border-red-200">
            <h3 className="font-semibold mb-4 text-center text-base sm:text-lg">📷 QR Code Scanner</h3>
            
            <div className="relative bg-gray-900 rounded-lg overflow-hidden mb-4 w-full" style={{ aspectRatio: '16/9', maxHeight: '400px' }}>
              {!cameraActive ? (
                <div className="absolute inset-0 flex items-center justify-center text-white px-4">
                  <div className="text-center">
                    <div className="text-4xl sm:text-6xl mb-4">📷</div>
                    <p className="text-base sm:text-lg mb-2 font-semibold">Scan QR Code Tiket</p>
                    <p className="text-xs sm:text-sm text-gray-300">Klik tombol di bawah untuk mengaktifkan kamera</p>
                  </div>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    className="absolute top-0 left-0 w-full h-full object-cover bg-black"
                    playsInline
                    muted
                    autoPlay
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {/* Loading indicator */}
                  {!videoReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800 z-10">
                      <div className="text-center text-white">
                        <div className="animate-spin text-4xl mb-2">⚙️</div>
                        <p className="font-semibold">Memuat kamera...</p>
                        <p className="text-sm text-gray-400 mt-1">Mohon izinkan akses kamera</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Scanning overlay */}
                  {videoReady && (
                    <>
                      <div className="absolute inset-0 border-4 border-green-400 pointer-events-none">
                        <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-white"></div>
                        <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-white"></div>
                        <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-white"></div>
                        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-white"></div>
                      </div>
                      
                      {/* Live indicator */}
                      <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 z-20">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                        <span>LIVE</span>
                      </div>
                      
                      {/* Scan counter */}
                      <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full z-20">
                        📊 {scanAttempts} scans
                      </div>
                      
                      <div className="absolute bottom-4 left-0 right-0 text-center z-20">
                        <span className="bg-black bg-opacity-70 text-white px-4 py-2 rounded-full text-sm font-semibold">
                          🔍 Scanning... Arahkan ke QR Code
                        </span>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            <InteractiveButton
              variant={cameraActive ? "danger" : "primary"}
              fullWidth
              onClick={cameraActive ? stopCamera : startCamera}
            >
              {cameraActive ? '🔴 Matikan Kamera' : '📷 Aktifkan Scanner'}
            </InteractiveButton>
            
            {/* Scanning Tips */}
            {cameraActive && videoReady && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-blue-900 mb-2">💡 Tips Scanning:</p>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Pastikan pencahayaan cukup terang</li>
                  <li>• Jaga jarak 10-30 cm dari QR code</li>
                  <li>• QR code harus dalam area scan (border hijau)</li>
                  <li>• Tunggu beberapa detik untuk deteksi otomatis</li>
                </ul>
              </div>
            )}
          </div>

          {/* Manual Input Mode */}
          <div className="bg-gray-50 p-6 rounded-xl border-2 border-gray-200">
            <h3 className="font-semibold mb-4 text-center">🔍 Input Manual</h3>
            <p className="text-sm text-gray-600 mb-4 text-center">
              Atau masukkan kode tiket secara manual
            </p>
            <ResponsiveInput
              label="Kode Tiket"
              placeholder="Masukkan kode tiket..."
              value={scanResult}
              onChange={(e) => setScanResult(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && scanResult.trim()) {
                  handleScanTicket(scanResult);
                }
              }}
              className="mb-4"
            />
            <InteractiveButton
              variant="success"
              fullWidth
              onClick={() => handleScanTicket(scanResult)}
              disabled={!scanResult.trim()}
            >
              ✅ Verifikasi Tiket
            </InteractiveButton>
          </div>
        </div>
      </ResponsiveCard>

      {/* Recent Scanned Tickets */}
      <ResponsiveCard>
        <h3 className="text-xl font-bold text-gray-900 mb-4">📋 Tiket Terscan Terbaru</h3>
        
        <div className="space-y-3">
          {scannedTickets.length > 0 ? (
            scannedTickets.map((ticket, index) => (
              <div key={index} className="bg-green-50 p-4 rounded-lg flex items-center justify-between border-l-4 border-green-500">
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{ticket.ticket_code}</div>
                  <div className="text-sm text-gray-600">{ticket.event_title}</div>
                  <div className="text-xs text-gray-500">
                    Discan: {new Date(ticket.scanned_at).toLocaleString('id-ID')}
                  </div>
                </div>
                <div className="text-green-600 text-2xl">✅</div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400">
              <div className="text-5xl mb-3">📱</div>
              <p>Belum ada tiket yang discan</p>
              <p className="text-sm mt-1">Mulai scan tiket untuk check-in pengunjung</p>
            </div>
          )}
        </div>
      </ResponsiveCard>
    </div>
  );

  // Render Reports Tab
  const renderReports = () => (
    <div className="space-y-6">
      <ResponsiveCard>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 Laporan Event</h2>
        
        {/* Summary Cards */}
        <ResponsiveGrid cols={{ xs: 2, sm: 2, lg: 4 }} className="mb-6">
          <div className="bg-blue-50 p-4 rounded-xl text-center">
            <div className="text-2xl mb-2">🎭</div>
            <div className="text-xl font-bold text-blue-600">{totalEvents}</div>
            <div className="text-sm text-gray-600">Total Events</div>
          </div>
          <div className="bg-green-50 p-4 rounded-xl text-center">
            <div className="text-2xl mb-2">🎫</div>
            <div className="text-xl font-bold text-green-600">{totalTickets}</div>
            <div className="text-sm text-gray-600">Tiket Terjual</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-xl text-center">
            <div className="text-2xl mb-2">📱</div>
            <div className="text-xl font-bold text-purple-600">{scannedTicketsCount}</div>
            <div className="text-sm text-gray-600">Sudah Discan</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-xl text-center">
            <div className="text-2xl mb-2">💰</div>
            <div className="text-xl font-bold text-yellow-600">
              {Math.round((scannedTicketsCount / Math.max(totalTickets, 1)) * 100)}%
            </div>
            <div className="text-sm text-gray-600">Tingkat Kehadiran</div>
          </div>
        </ResponsiveGrid>

        {/* Events Report */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 font-semibold">Event</th>
                <th className="text-left py-3 font-semibold">Status</th>
                <th className="text-left py-3 font-semibold">Tiket Terjual</th>
                <th className="text-left py-3 font-semibold">Discan</th>
                <th className="text-left py-3 font-semibold">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => {
                const eventTickets = tickets.filter(t => t.event_id === event.id);
                const scannedCount = eventTickets.filter(t => t.status === 'scanned').length;
                const revenue = eventTickets.length * event.price;
                
                return (
                  <tr key={event.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3">
                      <div>
                        <div className="font-semibold">{event.title}</div>
                        <div className="text-sm text-gray-600">
                          {new Date(event.date).toLocaleDateString('id-ID')}
                        </div>
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
                    <td className="py-3 font-semibold">{eventTickets.length}</td>
                    <td className="py-3 font-semibold text-green-600">{scannedCount}</td>
                    <td className="py-3 font-semibold text-blue-600">
                      Rp {revenue.toLocaleString('id-ID')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {events.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-600">Belum ada data</h3>
            <p className="text-gray-500 mt-2">Buat event untuk melihat laporan</p>
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
          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 mx-auto flex items-center justify-center text-white text-4xl mb-4">
            🎪
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{panitia?.name}</h2>
          <p className="text-gray-600">{panitia?.email}</p>
          <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold mt-2">
            Panitia
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Nama Lengkap</p>
            <p className="font-semibold text-gray-900">{panitia?.name || '-'}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Email</p>
            <p className="font-semibold text-gray-900">{panitia?.email || '-'}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Role</p>
            <p className="font-semibold text-gray-900 capitalize">{panitia?.role || '-'}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Bergabung Sejak</p>
            <p className="font-semibold text-gray-900">
              {panitia?.created_at ? new Date(panitia.created_at).toLocaleDateString('id-ID') : '-'}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <InteractiveButton variant="secondary" fullWidth>
            ✏️ Edit Profile
          </InteractiveButton>
          <InteractiveButton variant="warning" fullWidth>
            🔒 Ubah Password
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
    </div>
  );

  if (loading) {
    return (
      <ResponsiveLayout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat panitia dashboard...</p>
          </div>
        </div>
      </ResponsiveLayout>
    );
  }

  return (
    <ResponsiveLayout>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 pb-20 md:pb-6">
        <div className="container-responsive px-4 max-w-7xl mx-auto">
          {/* Header */}
          <div className="py-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-green-600">Panitia Dashboard</h1>
                <p className="text-gray-600 mt-1 text-sm md:text-base">Kelola Event & Scan Tiket</p>
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
                  { key: 'events', label: '🎭 My Events' },
                  { key: 'scan', label: '📱 Scan Ticket' },
                  { key: 'reports', label: '📋 Reports' },
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
            {activeTab === 'scan' && renderScan()}
            {activeTab === 'reports' && renderReports()}
            {activeTab === 'profile' && renderProfile()}
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

export default DashboardPanitiaResponsive;