const mysql = require('mysql2');

// Using callback version to avoid prepared statement issues
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    port: 3306,
    multipleStatements: true
});

const sql = `
CREATE DATABASE IF NOT EXISTS tiket;
USE tiket;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS admins;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'panitia') DEFAULT 'user',
    profile_picture VARCHAR(255) DEFAULT 'default.png',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE admins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    profile_picture VARCHAR(255) DEFAULT 'default.png',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

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

SHOW TABLES;
DESC users;
`;

connection.query(sql, (error, results) => {
    if (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
    
    console.log('✅ Database and tables created successfully!');
    
    // Show results
    if (results && Array.isArray(results)) {
        const tablesResult = results.find(r => Array.isArray(r) && r[0] && r[0]['Tables_in_tiket']);
        if (tablesResult) {
            console.log('📋 Tables:', tablesResult.map(t => t['Tables_in_tiket']).join(', '));
        }
        
        const descResult = results.find(r => Array.isArray(r) && r[0] && r[0]['Field']);
        if (descResult) {
            console.log('✅ Users columns:', descResult.map(c => c.Field).join(', '));
        }
    }
    
    console.log('🎉 Ready to start server!');
    connection.end();
});