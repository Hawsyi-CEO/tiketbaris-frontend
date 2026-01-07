const mysql = require('mysql2/promise');

// Konfigurasi database yang dioptimalkan untuk Laragon
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tiket',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // Pengaturan untuk stabilitas koneksi
  connectTimeout: 10000,
  // Pengaturan tambahan
  charset: 'utf8mb4',
  timezone: '+00:00'
});

// Test koneksi database saat aplikasi dimulai
pool.getConnection()
  .then(connection => {
    console.log('✅ Database terhubung dengan sukses!');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Error koneksi database:', err.message);
    console.error('💡 Pastikan Laragon MySQL sudah berjalan!');
    console.error('💡 Periksa kredensial database di file .env');
  });

// Handle error pool
pool.on('error', (err) => {
  console.error('❌ Database pool error:', err.message);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('🔄 Koneksi database hilang, akan reconnect otomatis...');
  }
});

module.exports = pool;
