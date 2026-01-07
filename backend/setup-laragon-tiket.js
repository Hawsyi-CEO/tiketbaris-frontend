const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

// Database configuration untuk Laragon
const config = {
    host: 'localhost',
    user: 'root',
    password: '',
    port: 3306
};

// Configuration with database name
const configWithDB = {
    ...config,
    database: 'tiket'
};

async function setupDatabase() {
    let connection;
    
    try {
        console.log('🔧 Menghubungkan ke MySQL Laragon...');
        connection = await mysql.createConnection(config);
        
        // Create database if not exists
        console.log('📝 Membuat database "tiket"...');
        await connection.execute('CREATE DATABASE IF NOT EXISTS tiket CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci');
        console.log('✅ Database "tiket" berhasil dibuat/sudah ada');
        
        // Switch to the tiket database
        await connection.execute('USE tiket');
        
        // Read and execute the SQL file
        console.log('📤 Mengimpor struktur database...');
        const sqlContent = await fs.readFile(path.join(__dirname, '..', 'u390486773_simtix.sql'), 'utf8');
        
        // Clean up the SQL content - remove database creation and use statements
        let cleanSQL = sqlContent
            .replace(/CREATE DATABASE.*?;/gi, '')
            .replace(/USE\s+`.*?`;/gi, '')
            .replace(/DROP DATABASE.*?;/gi, '')
            .replace(/--.*$/gm, '') // Remove comments
            .replace(/\/\*.*?\*\//gs, '') // Remove block comments
            .split(';')
            .filter(query => query.trim().length > 0);
        
        // Execute each SQL statement
        for (const query of cleanSQL) {
            const trimmedQuery = query.trim();
            if (trimmedQuery) {
                try {
                    await connection.execute(trimmedQuery);
                } catch (err) {
                    // Skip errors for statements that already exist
                    if (!err.message.includes('already exists') && 
                        !err.message.includes('Duplicate') &&
                        !err.message.includes('duplicate')) {
                        console.log(`Warning: ${err.message}`);
                    }
                }
            }
        }
        
        console.log('✅ Struktur database berhasil diimpor');
        
        // Verify tables
        const [tables] = await connection.execute('SHOW TABLES');
        console.log('📋 Tabel yang berhasil dibuat:');
        tables.forEach(table => {
            console.log(`  - ${Object.values(table)[0]}`);
        });
        
        console.log('\n🎉 Setup database selesai!');
        console.log('📊 Database "tiket" siap digunakan dengan Laragon');
        console.log('\n💡 Untuk menjalankan aplikasi:');
        console.log('  1. Pastikan Laragon sudah running');
        console.log('  2. Jalankan: npm install (jika belum)');
        console.log('  3. Jalankan: npm start atau node server.js');
        
    } catch (error) {
        console.error('❌ Error saat setup database:', error.message);
        console.log('\n🔍 Troubleshooting:');
        console.log('  - Pastikan Laragon sudah running');
        console.log('  - Pastikan MySQL service aktif di Laragon');
        console.log('  - Cek koneksi database di Laragon panel');
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run setup
if (require.main === module) {
    setupDatabase();
}

module.exports = { setupDatabase };