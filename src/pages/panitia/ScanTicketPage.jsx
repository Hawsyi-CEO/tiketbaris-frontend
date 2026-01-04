import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Toast from '../../components/Toast';

export default function ScanTicketPage() {
  const [ticketCode, setTicketCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [scannedTickets, setScannedTickets] = useState([]);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Focus input on mount
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleScanTicket = async (e) => {
    e.preventDefault();
    
    if (!ticketCode.trim()) {
      setError('Masukkan kode tiket');
      return;
    }

    setScanning(true);
    setError('');
    setResult(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/tickets/scan-ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ticketCode: ticketCode.trim() })
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          ticket: data.ticket,
          message: data.message
        });
        setToast({ show: true, message: '✅ Tiket berhasil di-scan!', type: 'success' });
        setScannedTickets(prev => [data.ticket, ...prev]);
        setTicketCode('');
      } else {
        setResult({
          success: false,
          message: data.error
        });
        setError(data.error);
        setToast({ show: true, message: `❌ ${data.error}`, type: 'error' });
      }
    } catch (err) {
      setError('Gagal scan tiket: ' + err.message);
      setToast({ show: true, message: '❌ Gagal scan tiket', type: 'error' });
    } finally {
      setScanning(false);
      // Refocus input for next scan
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#1f2937',
              margin: '0 0 8px 0'
            }}>
              🎫 Scan Tiket Masuk
            </h1>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: 0
            }}>
              Scan kode tiket pengunjung untuk check-in event
            </p>
          </div>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '10px 20px',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            ← Kembali
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px'
        }}>
          {/* Scanner Section */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <form onSubmit={handleScanTicket}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{
                  width: '120px',
                  height: '120px',
                  margin: '0 auto 16px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '48px'
                }}>
                  📸
                </div>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: '#1f2937',
                  margin: '0 0 8px 0'
                }}>
                  Masukkan Kode Tiket
                </h2>
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  margin: 0
                }}>
                  Ketik atau scan kode tiket dengan barcode scanner
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={ticketCode}
                  onChange={(e) => setTicketCode(e.target.value)}
                  placeholder="Masukkan kode tiket..."
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '16px',
                    fontSize: '18px',
                    fontWeight: '600',
                    fontFamily: 'monospace',
                    textAlign: 'center',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    outline: 'none',
                    transition: 'all 0.3s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              {error && (
                <div style={{
                  background: '#fee2e2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '20px'
                }}>
                  <p style={{
                    fontSize: '14px',
                    color: '#991b1b',
                    margin: 0,
                    textAlign: 'center'
                  }}>
                    ❌ {error}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={scanning || !ticketCode.trim()}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: scanning ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: scanning ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s'
                }}
              >
                {scanning ? '⏳ Memproses...' : '✓ Scan Tiket'}
              </button>
            </form>

            {/* Result Display */}
            {result && (
              <div style={{
                marginTop: '24px',
                padding: '20px',
                background: result.success ? '#d1fae5' : '#fee2e2',
                borderRadius: '12px',
                border: `2px solid ${result.success ? '#10b981' : '#ef4444'}`
              }}>
                {result.success ? (
                  <>
                    <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                      <div style={{ fontSize: '48px', marginBottom: '8px' }}>✅</div>
                      <h3 style={{
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: '#065f46',
                        margin: 0
                      }}>
                        Check-In Berhasil!
                      </h3>
                    </div>
                    <div style={{
                      background: 'white',
                      borderRadius: '8px',
                      padding: '16px'
                    }}>
                      <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6b7280' }}>
                        <strong style={{ color: '#1f2937' }}>Event:</strong> {result.ticket.event_title}
                      </p>
                      <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6b7280' }}>
                        <strong style={{ color: '#1f2937' }}>Pembeli:</strong> {result.ticket.buyer_name}
                      </p>
                      <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                        <strong style={{ color: '#1f2937' }}>Kode:</strong> {result.ticket.ticket_code}
                      </p>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '8px' }}>❌</div>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: '#991b1b',
                      margin: '0 0 8px 0'
                    }}>
                      Scan Gagal
                    </h3>
                    <p style={{
                      fontSize: '14px',
                      color: '#991b1b',
                      margin: 0
                    }}>
                      {result.message}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Scanned Tickets Log */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            maxHeight: '600px',
            overflow: 'auto'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#1f2937',
              margin: '0 0 16px 0'
            }}>
              📋 Riwayat Scan ({scannedTickets.length})
            </h3>

            {scannedTickets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎫</div>
                <p style={{ margin: 0 }}>Belum ada tiket yang di-scan</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {scannedTickets.map((ticket, index) => (
                  <div
                    key={index}
                    style={{
                      background: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{
                        fontSize: '20px'
                      }}>
                        ✅
                      </span>
                      <span style={{
                        fontSize: '11px',
                        color: '#6b7280',
                        fontWeight: '600'
                      }}>
                        {formatDate(new Date())}
                      </span>
                    </div>
                    <p style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#1f2937',
                      margin: '0 0 4px 0'
                    }}>
                      {ticket.buyer_name || ticket.buyer_email}
                    </p>
                    <p style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      margin: '0 0 4px 0'
                    }}>
                      {ticket.event_title}
                    </p>
                    <p style={{
                      fontSize: '11px',
                      color: '#9ca3af',
                      fontFamily: 'monospace',
                      margin: 0
                    }}>
                      {ticket.ticket_code}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  );
}
