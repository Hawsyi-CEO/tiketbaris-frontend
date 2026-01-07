import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../services/apiServices';

export default function HistoryPembayaran() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await userService.getTransactions();
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { bg: '#fef3c7', color: '#92400e', icon: '⏳' },
      success: { bg: '#d1fae5', color: '#065f46', icon: '✅' },
      completed: { bg: '#d1fae5', color: '#065f46', icon: '✅' },
      cancelled: { bg: '#fee2e2', color: '#991b1b', icon: '❌' },
      failed: { bg: '#fee2e2', color: '#991b1b', icon: '❌' }
    };
    const style = statusMap[status] || statusMap.pending;
    return (
      <span style={{
        backgroundColor: style.bg,
        color: style.color,
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '700',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        <span>{style.icon}</span>
        <span>{status?.toUpperCase()}</span>
      </span>
    );
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.body}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContainer}>
          <h1 style={styles.logo}>tiketbaris.id</h1>
          <button onClick={handleLogout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </header>

      {/* Content */}
      <main style={styles.main}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.title}>Riwayat Pembayaran</h2>
            <button onClick={() => navigate('/user/dashboard')} style={styles.backButton}>
              ← Kembali
            </button>
          </div>

          {transactions.length === 0 ? (
            <div style={styles.noTransactions}>
              Belum ada riwayat pembayaran
            </div>
          ) : (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead style={styles.thead}>
                  <tr>
                    <th style={styles.th}>Order ID</th>
                    <th style={styles.th}>Event</th>
                    <th style={styles.th}>Jumlah</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Tanggal</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(trans => (
                    <tr key={trans.id} style={styles.tr}>
                      <td style={styles.td}>{trans.midtrans_order_id}</td>
                      <td style={styles.td}>{trans.event_name}</td>
                      <td style={styles.td}>Rp {trans.amount.toLocaleString('id-ID')}</td>
                      <td style={styles.td}>{getStatusBadge(trans.status)}</td>
                      <td style={styles.td}>
                        {new Date(trans.transaction_date).toLocaleDateString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <p>&copy; 2025 tiketbaris.id. All rights reserved.</p>
      </footer>
    </div>
  );
}

const styles = {
  body: {
    backgroundColor: '#f3f4f6',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    backgroundColor: 'white',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 50
  },
  headerContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '15px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%'
  },
  logo: {
    color: '#dc2626',
    fontSize: '24px',
    fontWeight: '700',
    margin: 0
  },
  logoutButton: {
    backgroundColor: '#dc2626',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: "'Poppins', sans-serif",
    border: 'none'
  },
  main: {
    flex: 1,
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
    padding: '30px 20px'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    padding: '25px'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    margin: 0,
    color: '#1f2937'
  },
  backButton: {
    backgroundColor: '#d1d5db',
    color: '#1f2937',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: "'Poppins', sans-serif",
    border: 'none'
  },
  noTransactions: {
    textAlign: 'center',
    padding: '40px',
    color: '#6b7280',
    fontSize: '16px'
  },
  tableContainer: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  thead: {
    backgroundColor: '#f3f4f6'
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    borderBottom: '2px solid #d1d5db'
  },
  tr: {
    borderBottom: '1px solid #e5e7eb',
    transition: 'background-color 0.2s'
  },
  td: {
    padding: '12px',
    fontSize: '14px',
    color: '#1f2937'
  },
  footer: {
    backgroundColor: '#1f2937',
    color: 'white',
    textAlign: 'center',
    padding: '20px',
    marginTop: 'auto'
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    fontSize: '18px',
    color: '#6b7280'
  }
};
