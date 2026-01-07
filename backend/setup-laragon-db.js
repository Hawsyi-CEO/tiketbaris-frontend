const mysql = require('mysql2/promise');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function setupDatabaseForLaragon() {
  console.log('🚀 Setup Database untuk Laragon\n');
  
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 3306
  };
  
  const dbName = process.env.DB_NAME || 'u390486773_simtix';
  
  try {
    // Koneksi ke MySQL server
    console.log('1️⃣ Menghubungkan ke MySQL server...');
    const connection = await mysql.createConnection(config);
    console.log('✅ Terhubung ke MySQL!\n');
    
    // Buat database jika belum ada
    console.log(`2️⃣ Membuat database '${dbName}'...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log('✅ Database berhasil dibuat/sudah ada!\n');
    
    // Gunakan database
    await connection.query(`USE \`${dbName}\``);
    
    // Cek apakah ada file SQL untuk import
    const sqlFile = path.join(__dirname, '..', 'u390486773_simtix.sql');
    
    if (fs.existsSync(sqlFile)) {
      console.log('3️⃣ Menemukan file SQL, mengimport...');
      console.log('⏳ Mohon tunggu, proses import mungkin memakan waktu...\n');
      
      const sqlContent = fs.readFileSync(sqlFile, 'utf8');
      
      // Remove comments and split by delimiter
      const cleanSQL = sqlContent
        .split('\n')
        .filter(line => !line.trim().startsWith('--') && !line.trim().startsWith('/*'))
        .join('\n')
        .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments
      
      // Split by semicolon but handle it better
      const statements = cleanSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 10 && 
                     !s.startsWith('SET ') && 
                     !s.startsWith('START ') &&
                     !s.includes('/*!40'));
      
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        try {
          if (stmt.length > 0) {
            await connection.query(stmt);
            successCount++;
            
            // Show progress for CREATE TABLE statements
            if (stmt.toUpperCase().includes('CREATE TABLE')) {
              const match = stmt.match(/CREATE TABLE [`']?(\w+)[`']?/i);
              if (match) {
                console.log(`   ✓ Membuat tabel: ${match[1]}`);
              }
            }
          }
        } catch (err) {
          // Only log significant errors
          if (!err.message.includes('already exists') && 
              !err.message.includes('Duplicate') &&
              err.code !== 'ER_TABLE_EXISTS_ERROR') {
            console.log(`   ⚠️  Warning: ${err.message.substring(0, 80)}`);
            errorCount++;
          }
        }
      }
      
      console.log(`\n✅ Import selesai! (${successCount} statement berhasil)\n`);
    } else {
      console.log('3️⃣ File SQL tidak ditemukan, membuat tabel dasar...\n');
      
      // Buat tabel-tabel dasar jika file SQL tidak ada
      await createBasicTables(connection);
    }
    
    // Verifikasi tabel
    console.log('4️⃣ Memverifikasi tabel...');
    const [tables] = await connection.query('SHOW TABLES');
    
    if (tables.length > 0) {
      console.log(`✅ Ditemukan ${tables.length} tabel:`);
      tables.forEach(table => {
        const tableName = Object.values(table)[0];
        console.log(`   ✓ ${tableName}`);
      });
    } else {
      console.log('⚠️  Tidak ada tabel yang dibuat');
    }
    
    await connection.end();
    
    console.log('\n🎉 Setup database selesai!');
    console.log('\n📝 Langkah selanjutnya:');
    console.log('   1. Jalankan: npm start');
    console.log('   2. Server akan berjalan di http://localhost:5000');
    console.log('   3. Database sudah siap digunakan!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Pastikan Laragon sudah berjalan');
    console.log('   2. Pastikan MySQL di Laragon sudah start');
    console.log('   3. Coba restart Laragon');
    process.exit(1);
  }
}

async function createBasicTables(connection) {
  // Buat tabel users
  await connection.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nama VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('user', 'panitia', 'admin') DEFAULT 'user',
      nomor_telepon VARCHAR(20),
      tanggal_lahir DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('   ✓ Tabel users dibuat');
  
  // Buat tabel events
  await connection.query(`
    CREATE TABLE IF NOT EXISTS events (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nama_event VARCHAR(255) NOT NULL,
      deskripsi TEXT,
      tanggal_event DATE NOT NULL,
      waktu_mulai TIME,
      waktu_selesai TIME,
      lokasi VARCHAR(255),
      harga DECIMAL(10,2) NOT NULL,
      kuota INT NOT NULL,
      sisa_kuota INT NOT NULL,
      status ENUM('draft', 'active', 'sold_out', 'cancelled') DEFAULT 'draft',
      panitia_id INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (panitia_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('   ✓ Tabel events dibuat');
  
  // Insert admin default
  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  try {
    await connection.query(`
      INSERT INTO users (nama, email, password, role)
      VALUES ('Admin', 'admin@simtix.com', ?, 'admin')
      ON DUPLICATE KEY UPDATE role = 'admin'
    `, [hashedPassword]);
    console.log('   ✓ User admin default dibuat (email: admin@simtix.com, password: admin123)');
  } catch (err) {
    // Ignore if admin already exists
  }
}

setupDatabaseForLaragon();
