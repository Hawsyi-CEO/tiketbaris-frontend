const mysql = require('mysql2');
const bcrypt = require('bcryptjs');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    port: 3306,
    multipleStatements: true
});

async function completeSetup() {
    console.log('🔧 Complete database setup untuk @gmail.com...');
    
    try {
        const adminPass = await bcrypt.hash('admin123', 10);
        const panitiaPass = await bcrypt.hash('panitia123', 10);
        const userPass = await bcrypt.hash('user123', 10);
        
        const sql = `
        CREATE DATABASE IF NOT EXISTS tiket;
        USE tiket;
        
        SET FOREIGN_KEY_CHECKS = 0;
        DROP TABLE IF EXISTS events, tickets, transactions, partnerships, withdrawals, users, admins;
        SET FOREIGN_KEY_CHECKS = 1;
        
        -- Tabel Users dengan kolom lengkap
        CREATE TABLE users (
            id INT PRIMARY KEY AUTO_INCREMENT,
            username VARCHAR(50) NOT NULL,
            email VARCHAR(100) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            role ENUM('user', 'panitia') DEFAULT 'user',
            profile_picture VARCHAR(255) DEFAULT 'default.png',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB;
        
        -- Tabel Admins
        CREATE TABLE admins (
            id INT PRIMARY KEY AUTO_INCREMENT,
            username VARCHAR(50) NOT NULL,
            email VARCHAR(100) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            profile_picture VARCHAR(255) DEFAULT 'default.png',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB;
        
        -- Tabel Events
        CREATE TABLE events (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            date DATE NOT NULL,
            location VARCHAR(255) NOT NULL,
            price INT NOT NULL,
            stock INT NOT NULL,
            image_url VARCHAR(255),
            status ENUM('pending','active','cancelled') DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user_id (user_id),
            INDEX idx_status (status)
        ) ENGINE=InnoDB;
        
        -- Tabel Transactions dengan kolom lengkap
        CREATE TABLE transactions (
            id INT PRIMARY KEY AUTO_INCREMENT,
            midtrans_order_id VARCHAR(255),
            user_id INT NOT NULL,
            event_id INT NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            status ENUM('pending','completed','cancelled') DEFAULT 'pending',
            payment_type VARCHAR(50) DEFAULT 'manual',
            transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user_id (user_id),
            INDEX idx_event_id (event_id)
        ) ENGINE=InnoDB;
        
        -- Tabel Tickets dengan kolom lengkap untuk scanning
        CREATE TABLE tickets (
            id INT PRIMARY KEY AUTO_INCREMENT,
            transaction_id INT NOT NULL,
            user_id INT NOT NULL,
            event_id INT NOT NULL,
            ticket_code VARCHAR(50) NOT NULL UNIQUE,
            status ENUM('unused','used','cancelled','scanned') DEFAULT 'unused',
            scanned_at TIMESTAMP NULL,
            scanned_by INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_transaction_id (transaction_id),
            INDEX idx_user_id (user_id),
            INDEX idx_event_id (event_id)
        ) ENGINE=InnoDB;
        
        -- Insert admin dengan @gmail.com
        INSERT INTO admins (username, email, password) VALUES 
        ('admin', 'admin@gmail.com', '${adminPass}'),
        ('superadmin', 'superadmin@yahoo.com', '${adminPass}');
        
        -- Insert users dengan berbagai domain email
        INSERT INTO users (username, email, password, role) VALUES 
        ('panitia1', 'panitia@gmail.com', '${panitiaPass}', 'panitia'),
        ('panitia2', 'organizer@outlook.com', '${panitiaPass}', 'panitia'),
        ('user1', 'user@gmail.com', '${userPass}', 'user'),
        ('user2', 'test@yahoo.com', '${userPass}', 'user'),
        ('user3', 'demo@hotmail.com', '${userPass}', 'user');
        
        -- Insert sample events
        INSERT INTO events (user_id, title, description, date, location, price, stock, status) VALUES 
        (1, 'Konser Music Festival 2025', 'Festival musik dengan berbagai artis ternama', '2025-12-25', 'Jakarta Convention Center', 150000, 1000, 'active'),
        (1, 'Workshop Web Development', 'Belajar pemrograman web dari dasar', '2025-12-30', 'Universitas Indonesia', 50000, 100, 'active');
        `;
        
        connection.query(sql, (error, results) => {
            if (error) {
                console.error('❌ Error:', error.message);
                process.exit(1);
            }
            
            console.log('✅ Database setup complete dengan @gmail.com!');
            console.log('');
            console.log('👑 ADMIN ACCOUNTS:');
            console.log('   admin@gmail.com / admin123');
            console.log('   superadmin@yahoo.com / admin123');
            console.log('');
            console.log('🎫 PANITIA ACCOUNTS:');
            console.log('   panitia@gmail.com / panitia123');
            console.log('   organizer@outlook.com / panitia123');
            console.log('');
            console.log('👤 USER ACCOUNTS:');
            console.log('   user@gmail.com / user123');
            console.log('   test@yahoo.com / user123');
            console.log('   demo@hotmail.com / user123');
            console.log('');
            console.log('💡 Sistem mendukung SEMUA domain email:');
            console.log('   @gmail.com, @yahoo.com, @outlook.com, @hotmail.com,');
            console.log('   @company.com, @university.edu, dll');
            console.log('');
            console.log('📝 Anda bisa register dengan email apapun!');
            
            connection.end();
        });
        
    } catch (error) {
        console.error('❌ Error hashing passwords:', error);
        connection.end();
    }
}

completeSetup();