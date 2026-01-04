import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ResponsiveLayout, ResponsiveCard, InteractiveButton, NotificationToast } from '../../components/ResponsiveComponents';
import { API_URL } from '../../config/api';
import jsQR from 'jsqr';

const TicketScanner = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [scannedTicket, setScannedTicket] = useState(null);
  const [notification, setNotification] = useState({ show: false, type: 'info', message: '' });
  const [manualCode, setManualCode] = useState('');
  const [scanHistory, setScanHistory] = useState([]);
  const [cameraError, setCameraError] = useState('');
  const streamRef = useRef(null);

  useEffect(() => {
    // Check if user is admin
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'admin') {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
  };

  const startCamera = async () => {
    try {
      setCameraError('');
      setVideoReady(false);
      console.log('🎥 [1] Starting camera...');
      
      // Request camera with better constraints
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('🎥 [2] Camera stream obtained:', stream.getVideoTracks()[0].label);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
        console.log('🎥 [3] Camera active set to true, video element updated');
        
        // Add event listeners
        videoRef.current.onloadedmetadata = () => {
          console.log('🎥 [4] Video metadata loaded - dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
        };
        
        videoRef.current.onplaying = () => {
          console.log('🎥 [5] Video is now playing!');
          setVideoReady(true);
        };
        
        // Try to play
        try {
          await videoRef.current.play();
          console.log('🎥 [6] Play command executed');
          
          // Wait a bit then start scanning
          setTimeout(() => {
            setScanning(true);
            console.log('🎥 [7] Starting QR scan loop');
            requestAnimationFrame(scanQRCode);
          }, 500);
          
        } catch (playError) {
          console.error('🎥 [ERROR] Play failed:', playError);
          setCameraError('Gagal memutar video: ' + playError.message);
        }
      }
    } catch (error) {
      console.error('🎥 [ERROR] Camera error:', error);
      setCameraActive(false);
      
      let errorMessage = 'Tidak dapat mengakses kamera. ';
      
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Izin kamera ditolak. Silakan izinkan akses kamera di browser.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'Kamera tidak ditemukan.';
      } else if (error.message === 'Video load timeout') {
        errorMessage += 'Timeout saat memuat video kamera.';
      } else {
        errorMessage += 'Gunakan input manual.';
      }
      
      setCameraError(errorMessage);
      showNotification('error', 'Gagal mengakses kamera');
    }
  };

  const stopCamera = () => {
    console.log('🎥 [STOP] Stopping camera...');
    setScanning(false);
    setCameraActive(false);
    setVideoReady(false);
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('🎥 [STOP] Camera track stopped');
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.onloadedmetadata = null;
      videoRef.current.onplaying = null;
    }
  };

  const scanQRCode = () => {
    if (!scanning || !videoRef.current || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    // Check if video is ready and playing
    if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth > 0 && video.videoHeight > 0) {
      // Set canvas size to match video
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      
      // Draw current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get image data from canvas
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Scan for QR code
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code) {
        console.log('QR Code detected:', code.data);
        try {
          const ticketData = JSON.parse(code.data);
          if (ticketData.ticket_code) {
            handleScanTicket(ticketData.ticket_code);
            stopCamera();
            return;
          }
        } catch (error) {
          // Try to use the raw data as ticket code
          console.log('Using raw QR data as ticket code');
          handleScanTicket(code.data);
          stopCamera();
          return;
        }
      }
    }

    // Continue scanning
    if (scanning) {
      requestAnimationFrame(scanQRCode);
    }
  };

  const handleScanTicket = async (ticketCode) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/tickets/scan`,
        { ticket_code: ticketCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setScannedTicket(response.data);
      setScanHistory(prev => [response.data, ...prev]);
      showNotification('success', '✅ Tiket berhasil di-scan!');
      playSuccessSound();
    } catch (error) {
      console.error('Scan error:', error);
      const errorMsg = error.response?.data?.error || 'Gagal scan tiket';
      showNotification('error', errorMsg);
      playErrorSound();
    }
  };

  const handleManualScan = () => {
    if (!manualCode.trim()) {
      showNotification('error', 'Masukkan kode tiket!');
      return;
    }
    handleScanTicket(manualCode.trim());
    setManualCode('');
  };

  const playSuccessSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZUQ8OVa3q7KVXEQpDntL3yoE3CTuP2vPShj8KGnC+7+OYUg8NUqbn7qpbFApAl9X02oU5Cj2V2fPSiD8MH2++7+OYUw8MUanj7qxdFApAl9T02oQ3CDqO1/PTiEEMH2++7+OYUw8MUqnj7qpbFApAl9T02oU5Cj2V2fPSiEAMH2++7+OYUw8MUanj7qpbEwtBl9T02oU5Cj2U2fPSiEAMH2++7+OYUw8LUqnj7qpbEwtBl9T02oU5Cj2V2fPSiEAMH2++7+OYUw8LUqnj7qpbEwtBl9T02oU5Cj2V2fPSiEAMH2++7+OYUw8LUqnj7qpbEwtBl9T02oU5');
    audio.play().catch(() => {});
  };

  const playErrorSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZUQ8OVa3q7KVXEQpDntL3yoE3CTuP2vPShj8KGnC+7+OYUg8NUqbn7qpbFApAl9X02oU5Cj2V2fPSiD8MH2++7+OYUw8MUqnj7qxdFApAl9T02oQ3CDqO1/PTiEEMH2++7+OYUw8MUanj7qxdFApAl9T02oU5Cj2V2fPSiEAMH2++7+OYUw8MUqnj7qpbFApAl9T02oU5Cj2U2fPSiEAMH2++7+OYUw8LUqnj7qpbEwtBl9T02oU5Cj2V2fPSiEAMH2++7+OYUw8LUqnj7qpbEwtBl9T02oU5Cj2V2fPSiEAMH2++7+OYUw8LUqnj7qpbEwtBl9T02oU5Cj2V2fPSiEAMH2++7+OYUw8LUqnj7qpbEwtBl9T02oU5');
    audio.play().catch(() => {});
  };

  return (
    <ResponsiveLayout>
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-pink-50 p-4 sm:p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <ResponsiveCard className="bg-gradient-to-r from-red-600 to-orange-600 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold mb-2">📱 Scanner Tiket</h1>
                <p className="text-red-100">Scan QR code tiket pengunjung</p>
              </div>
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-all"
              >
                🔙 Kembali
              </button>
            </div>
          </ResponsiveCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Scanner Section */}
            <ResponsiveCard>
              <h2 className="text-xl font-bold text-gray-900 mb-4">📸 Scan QR Code</h2>
              
              {/* Camera View */}
              <div className="relative mb-4">
                <div className="bg-gray-900 rounded-xl overflow-hidden relative" style={{ aspectRatio: '16/9', minHeight: '300px' }}>
                  {cameraActive ? (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="absolute top-0 left-0 w-full h-full object-cover bg-black"
                      />
                      <canvas ref={canvasRef} className="hidden" />
                      
                      {/* Loading indicator while video loads */}
                      {!videoReady && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 z-10">
                          <div className="text-center text-white">
                            <div className="animate-spin text-4xl mb-2">⚙️</div>
                            <p className="font-semibold">Memuat kamera...</p>
                            <p className="text-sm text-gray-400 mt-1">Mohon izinkan akses kamera</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Video ready indicator */}
                      {videoReady && (
                        <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                          <span>LIVE</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <div className="text-6xl mb-4">📷</div>
                        <p className="font-semibold">Kamera tidak aktif</p>
                        <p className="text-sm mt-2">Klik "Mulai Scan" untuk mengaktifkan</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {scanning && videoReady && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-64 h-64 border-4 border-green-400 rounded-xl animate-pulse"></div>
                  </div>
                )}
                
                {/* Debug Info */}
                {cameraActive && videoReady && (
                  <div className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-70 text-white text-xs p-2 rounded z-20">
                    {scanning ? '🔍 Scanning... Arahkan ke QR Code tiket' : '📹 Kamera Siap - Tekan tombol untuk scan'}
                  </div>
                )}
              </div>

              {cameraError && (
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg mb-4">
                  <p className="text-sm text-yellow-800">⚠️ {cameraError}</p>
                </div>
              )}

              {/* Camera Controls */}
              <div className="flex gap-3 mb-6">
                {!cameraActive ? (
                  <button
                    onClick={startCamera}
                    className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                  >
                    📸 Mulai Scan
                  </button>
                ) : (
                  <button
                    onClick={stopCamera}
                    className="flex-1 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-all"
                  >
                    ⏹ Stop
                  </button>
                )}
              </div>

              {/* Manual Input */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">✍️ Input Manual</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleManualScan()}
                    placeholder="Masukkan kode tiket..."
                    className="flex-1 input-field"
                  />
                  <button
                    onClick={handleManualScan}
                    className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-all"
                  >
                    Scan
                  </button>
                </div>
              </div>
            </ResponsiveCard>

            {/* Scan Result */}
            <ResponsiveCard>
              <h2 className="text-xl font-bold text-gray-900 mb-4">🎫 Hasil Scan</h2>
              
              {scannedTicket ? (
                <div className="space-y-4">
                  {/* Status Banner */}
                  <div className={`p-6 rounded-xl text-center ${
                    scannedTicket.status === 'success' 
                      ? 'bg-green-50 border-2 border-green-300'
                      : 'bg-red-50 border-2 border-red-300'
                  }`}>
                    <div className="text-6xl mb-3">
                      {scannedTicket.status === 'success' ? '✅' : '❌'}
                    </div>
                    <h3 className={`text-2xl font-bold mb-2 ${
                      scannedTicket.status === 'success' ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {scannedTicket.status === 'success' ? 'TIKET VALID' : 'TIKET DITOLAK'}
                    </h3>
                    <p className={scannedTicket.status === 'success' ? 'text-green-600' : 'text-red-600'}>
                      {scannedTicket.message}
                    </p>
                  </div>

                  {/* Ticket Details */}
                  {scannedTicket.ticket && (
                    <div className="space-y-3">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Event</p>
                        <p className="font-bold text-gray-900">{scannedTicket.ticket.event_title}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Kode Tiket</p>
                          <p className="font-mono text-sm font-bold text-gray-900">{scannedTicket.ticket.ticket_code}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Pemilik</p>
                          <p className="font-semibold text-sm text-gray-900">{scannedTicket.ticket.user_name}</p>
                        </div>
                      </div>

                      {scannedTicket.ticket.scanned_at && (
                        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                          <p className="text-xs text-blue-600 mb-1">Waktu Scan</p>
                          <p className="font-semibold text-blue-900">
                            {new Date(scannedTicket.ticket.scanned_at).toLocaleString('id-ID')}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setScannedTicket(null);
                      if (!scanning) startCamera();
                    }}
                    className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                  >
                    📱 Scan Tiket Berikutnya
                  </button>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <div className="text-6xl mb-4">🎫</div>
                  <p>Belum ada tiket yang di-scan</p>
                </div>
              )}
            </ResponsiveCard>
          </div>

          {/* Scan History */}
          <ResponsiveCard>
            <h2 className="text-xl font-bold text-gray-900 mb-4">📋 Riwayat Scan</h2>
            
            {scanHistory.length > 0 ? (
              <div className="space-y-2">
                {scanHistory.slice(0, 10).map((scan, index) => (
                  <div key={index} className={`p-4 rounded-lg flex justify-between items-center ${
                    scan.status === 'success' ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    <div>
                      <p className="font-semibold text-gray-900">{scan.ticket?.ticket_code}</p>
                      <p className="text-sm text-gray-600">{scan.ticket?.event_title}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      scan.status === 'success' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                    }`}>
                      {scan.status === 'success' ? '✅ Valid' : '❌ Invalid'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>Belum ada riwayat scan</p>
              </div>
            )}
          </ResponsiveCard>
        </div>

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

export default TicketScanner;



