import { useNavigate } from 'react-router-dom';

export default function StartupGuidePage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', padding: '32px' }}>
      <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ fontSize: '48px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px' }}>🎫 Tiket Pembaris</h1>
          <p style={{ fontSize: '20px', color: '#4b5563' }}>Platform penjualan tiket event modern</p>
        </div>

        {/* Status Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '48px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)', padding: '24px', borderLeft: '4px solid #10b981' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>✅ Frontend</h3>
            <p style={{ color: '#4b5563', marginBottom: '8px' }}>React + Vite running on port 3000</p>
            <p style={{ fontSize: '12px', color: '#6b7280' }}>Status: Connected</p>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)', padding: '24px', borderLeft: '4px solid #3b82f6' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>⚙️ Backend</h3>
            <p style={{ color: '#4b5563', marginBottom: '8px' }}>Express.js API on port 5000</p>
            <button
              onClick={() => navigate('/diagnostics')}
              style={{ fontSize: '12px', color: '#3b82f6', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontWeight: '600', marginTop: '8px', textDecoration: 'underline' }}
            >
              Check Status →
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 20px 25px rgba(0, 0, 0, 0.1)', padding: '32px', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '24px' }}>🚀 Getting Started</h2>

          {/* Step 1 */}
          <div style={{ borderLeft: '4px solid #2563eb', paddingLeft: '24px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>1. Persiapan Awal</h3>
            <p style={{ color: '#4b5563', marginBottom: '12px' }}>Pastikan semua sudah siap:</p>
            <ul style={{ color: '#4b5563', marginLeft: '16px' }}>
              <li>✅ Backend running di http://localhost:5000</li>
              <li>✅ Frontend running di http://localhost:3000 (Anda di sini sekarang!)</li>
              <li>✅ MySQL database terhubung</li>
            </ul>
          </div>

          {/* Step 2 */}
          <div style={{ borderLeft: '4px solid #16a34a', paddingLeft: '24px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>2. Login atau Register</h3>
            <p style={{ color: '#4b5563', marginBottom: '12px' }}>Pilih akun untuk ditest:</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' }}>
              <button
                onClick={() => navigate('/login')}
                style={{ padding: '12px 16px', color: 'white', fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: 'pointer', transition: 'all 0.3s ease', fontSize: '14px', backgroundColor: '#dc2626' }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = '#b91c1c')}
                onMouseLeave={(e) => (e.target.style.backgroundColor = '#dc2626')}
              >
                👤 Admin Login
              </button>
              <button
                onClick={() => navigate('/login')}
                style={{ padding: '12px 16px', color: 'white', fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: 'pointer', transition: 'all 0.3s ease', fontSize: '14px', backgroundColor: '#2563eb' }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = '#1d4ed8')}
                onMouseLeave={(e) => (e.target.style.backgroundColor = '#2563eb')}
              >
                👥 Panitia Login
              </button>
              <button
                onClick={() => navigate('/register')}
                style={{ padding: '12px 16px', color: 'white', fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: 'pointer', transition: 'all 0.3s ease', fontSize: '14px', backgroundColor: '#16a34a' }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = '#15803d')}
                onMouseLeave={(e) => (e.target.style.backgroundColor = '#16a34a')}
              >
                ➕ Register Baru
              </button>
            </div>
          </div>

          {/* Step 3 */}
          <div style={{ borderLeft: '4px solid #a855f7', paddingLeft: '24px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>3. Jelajahi Fitur</h3>
            <p style={{ color: '#4b5563', marginBottom: '12px' }}>Setelah login, Anda bisa:</p>
            <ul style={{ color: '#4b5563', marginLeft: '16px' }}>
              <li><strong>Admin:</strong> Approve events, manage users, view transactions</li>
              <li><strong>Panitia:</strong> Create events, withdraw funds</li>
              <li><strong>User:</strong> Browse events, buy tickets</li>
            </ul>
          </div>
        </div>

        {/* Test Credentials */}
        <div style={{ backgroundColor: '#fef3c7', border: '2px solid #fbbf24', borderRadius: '8px', padding: '24px', marginBottom: '32px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#78350f', marginBottom: '16px' }}>🔐 Test Credentials</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '6px', border: '1px solid #fbbf24' }}>
              <p style={{ fontWeight: 'bold', color: '#1f2937' }}>Admin</p>
              <p style={{ fontSize: '12px', color: '#4b5563', marginTop: '4px' }}>Email: admin@gmail.com</p>
              <p style={{ fontSize: '12px', color: '#4b5563' }}>Password: admin123</p>
            </div>
            <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '6px', border: '1px solid #fbbf24' }}>
              <p style={{ fontWeight: 'bold', color: '#1f2937' }}>Panitia</p>
              <p style={{ fontSize: '12px', color: '#4b5563', marginTop: '4px' }}>Email: pantia@gm</p>
              <p style={{ fontSize: '12px', color: '#4b5563' }}>Password: pantia123</p>
            </div>
            <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '6px', border: '1px solid #fbbf24' }}>
              <p style={{ fontWeight: 'bold', color: '#1f2937' }}>User</p>
              <p style={{ fontSize: '12px', color: '#4b5563', marginTop: '4px' }}>Email: user@gm</p>
              <p style={{ fontSize: '12px', color: '#4b5563' }}>Password: user123</p>
            </div>
          </div>
          <p style={{ fontSize: '11px', color: '#92400e', marginTop: '16px' }}>
            💡 Password sudah di-reset. Jika belum bekerja, jalankan: <code>node reset-admin-password.js</code>
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <button
            onClick={() => navigate('/login')}
            style={{ padding: '16px 20px', color: 'white', fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: 'pointer', transition: 'all 0.3s ease', fontSize: '16px', backgroundColor: '#2563eb' }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = '#1d4ed8')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = '#2563eb')}
          >
            🔓 Go to Login
          </button>
          <button
            onClick={() => navigate('/register')}
            style={{ padding: '16px 20px', color: 'white', fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: 'pointer', transition: 'all 0.3s ease', fontSize: '16px', backgroundColor: '#16a34a' }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = '#15803d')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = '#16a34a')}
          >
            ➕ Register New User
          </button>
          <button
            onClick={() => navigate('/diagnostics')}
            style={{ padding: '16px 20px', color: 'white', fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: 'pointer', transition: 'all 0.3s ease', fontSize: '16px', backgroundColor: '#4f46e5' }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = '#4338ca')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = '#4f46e5')}
          >
            🔍 Check Status
          </button>
        </div>

        {/* Help Section */}
        <div style={{ marginTop: '48px', backgroundColor: '#eff6ff', borderRadius: '8px', padding: '24px', border: '1px solid #93c5fd' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0c2340', marginBottom: '16px' }}>❓ Bantuan</h3>
          <ul style={{ listStyle: 'none', color: '#1e40af', lineHeight: '1.8' }}>
            <li>• Baca <strong>QUICKSTART.md</strong> untuk setup lengkap</li>
            <li>• Lihat <strong>TROUBLESHOOTING.md</strong> jika ada error</li>
            <li>• Cek <strong>/diagnostics</strong> untuk status backend</li>
            <li>• Baca <strong>API_DOCUMENTATION.md</strong> untuk API reference</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

