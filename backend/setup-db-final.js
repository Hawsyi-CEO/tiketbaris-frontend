const mysql = require('mysql2');
const bcrypt = require('bcrypt');

// Use callback version to avoid prepared statement issues
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    port: 3306,
    multipleStatements: true
});

const sqlSetup = `
-- Create and use database
CREATE DATABASE IF NOT EXISTS tiket;
USE tiket;

-- Disable foreign key checks
SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing tables
DROP TABLE IF EXISTS event_agreements;
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS withdrawals;
DROP TABLE IF EXISTS partnerships;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS users;

-- Enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Create users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'panitia') DEFAULT 'user',
    profile_picture VARCHAR(255) DEFAULT 'default.png',
    phone VARCHAR(20) DEFAULT NULL,
    address TEXT DEFAULT NULL,
    date_of_birth DATE DEFAULT NULL,
    gender ENUM('male', 'female', 'other') DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255) DEFAULT NULL,
    reset_token VARCHAR(255) DEFAULT NULL,
    reset_token_expires TIMESTAMP NULL DEFAULT NULL,
    last_login TIMESTAMP NULL DEFAULT NULL,
    login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create admins table
CREATE TABLE admins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    profile_picture VARCHAR(255) DEFAULT 'default.png',
    permissions TEXT DEFAULT NULL,
    is_super_admin BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create events table
CREATE TABLE events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    short_description VARCHAR(500) DEFAULT NULL,
    date DATE NOT NULL,
    start_time TIME DEFAULT NULL,
    end_time TIME DEFAULT NULL,
    location VARCHAR(255) NOT NULL,
    venue_details TEXT DEFAULT NULL,
    price INT NOT NULL DEFAULT 0,
    original_stock INT NOT NULL,
    current_stock INT NOT NULL,
    sold_tickets INT DEFAULT 0,
    image_url VARCHAR(255) DEFAULT NULL,
    category VARCHAR(100) DEFAULT NULL,
    status ENUM('pending','active','cancelled','completed','draft') DEFAULT 'pending',
    is_featured BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT TRUE,
    allow_refund BOOLEAN DEFAULT FALSE,
    refund_deadline TIMESTAMP NULL DEFAULT NULL,
    terms_and_conditions TEXT DEFAULT NULL,
    documents LONGTEXT DEFAULT NULL,
    admin_notes TEXT DEFAULT NULL,
    approved_by INT DEFAULT NULL,
    approved_at TIMESTAMP NULL DEFAULT NULL,
    cancelled_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_date (date),
    INDEX idx_category (category),
    INDEX idx_price (price)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create transactions table
CREATE TABLE transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    midtrans_order_id VARCHAR(255) DEFAULT NULL,
    user_id INT NOT NULL,
    event_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price INT NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    admin_fee DECIMAL(10,2) DEFAULT 0,
    platform_fee DECIMAL(10,2) DEFAULT 0,
    final_amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'midtrans',
    payment_type VARCHAR(50) DEFAULT 'midtrans',
    status ENUM('pending','success','completed','cancelled','failed','refunded') DEFAULT 'pending',
    notes TEXT DEFAULT NULL,
    refund_amount DECIMAL(15,2) DEFAULT 0,
    refund_reason TEXT DEFAULT NULL,
    refunded_at TIMESTAMP NULL DEFAULT NULL,
    expires_at TIMESTAMP NULL DEFAULT NULL,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    
    INDEX idx_user_id (user_id),
    INDEX idx_event_id (event_id),
    INDEX idx_status (status),
    INDEX idx_transaction_date (transaction_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create tickets table
CREATE TABLE tickets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    transaction_id INT NOT NULL,
    user_id INT NOT NULL,
    event_id INT NOT NULL,
    ticket_code VARCHAR(100) NOT NULL UNIQUE,
    qr_code VARCHAR(255) DEFAULT NULL,
    status ENUM('active','used','cancelled','refunded') DEFAULT 'active',
    holder_name VARCHAR(255) DEFAULT NULL,
    holder_email VARCHAR(255) DEFAULT NULL,
    holder_phone VARCHAR(20) DEFAULT NULL,
    seat_number VARCHAR(50) DEFAULT NULL,
    entrance_gate VARCHAR(50) DEFAULT NULL,
    checked_in_by INT DEFAULT NULL,
    used_at TIMESTAMP NULL DEFAULT NULL,
    cancelled_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_user_id (user_id),
    INDEX idx_event_id (event_id),
    INDEX idx_status (status),
    INDEX idx_ticket_code (ticket_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create user_sessions table
CREATE TABLE user_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    device_name VARCHAR(255) DEFAULT NULL,
    device_type VARCHAR(50) DEFAULT NULL,
    browser VARCHAR(100) DEFAULT NULL,
    os VARCHAR(100) DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    location VARCHAR(255) DEFAULT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_user_id (user_id),
    INDEX idx_session_token (session_token),
    INDEX idx_last_active (last_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create partnerships table
CREATE TABLE partnerships (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    company_description TEXT DEFAULT NULL,
    contact_person VARCHAR(255) DEFAULT NULL,
    contact_email VARCHAR(255) DEFAULT NULL,
    contact_phone VARCHAR(20) DEFAULT NULL,
    proposal_text TEXT NOT NULL,
    proposal_file VARCHAR(255) DEFAULT NULL,
    partnership_type ENUM('sponsor', 'vendor', 'media_partner', 'collaboration') DEFAULT 'sponsor',
    budget_range VARCHAR(100) DEFAULT NULL,
    status ENUM('pending','approved','rejected','under_review') DEFAULT 'pending',
    admin_notes TEXT DEFAULT NULL,
    reviewed_by INT DEFAULT NULL,
    reviewed_at TIMESTAMP NULL DEFAULT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_partnership_type (partnership_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create withdrawals table
CREATE TABLE withdrawals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    admin_fee DECIMAL(10,2) DEFAULT 0,
    final_amount DECIMAL(15,2) NOT NULL,
    status ENUM('pending','approved','completed','rejected','cancelled') DEFAULT 'pending',
    notes TEXT DEFAULT NULL,
    admin_notes TEXT DEFAULT NULL,
    processed_by INT DEFAULT NULL,
    reference_number VARCHAR(100) DEFAULT NULL,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL DEFAULT NULL,
    completed_at TIMESTAMP NULL DEFAULT NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create event_agreements table
CREATE TABLE event_agreements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    user_id INT NOT NULL,
    agreement_type VARCHAR(50) NOT NULL DEFAULT 'terms_and_conditions',
    agreement_text TEXT NOT NULL,
    agreed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_event_id (event_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Show created tables
SHOW TABLES;
`;

async function insertDefaultData() {
    try {
        console.log('👥 Creating default data...');
        
        // Hash passwords
        const adminPassword = await bcrypt.hash('admin123', 10);
        const userPassword = await bcrypt.hash('user123', 10);
        const organizerPassword = await bcrypt.hash('organizer123', 10);
        
        // Insert admin
        connection.query(
            'INSERT INTO admins (username, email, password, is_super_admin, permissions) VALUES (?, ?, ?, ?, ?)',
            ['Super Admin', 'admin@simtix.com', adminPassword, true, JSON.stringify(['all'])],
            (error) => {
                if (error) console.log('Admin insert error:', error.message);
                else console.log('✅ Admin created: admin@simtix.com');
            }
        );
        
        // Insert sample users
        connection.query(
            'INSERT INTO users (username, email, password, role, email_verified) VALUES (?, ?, ?, ?, ?)',
            ['John Doe', 'user@test.com', userPassword, 'user', true],
            (error) => {
                if (error) console.log('User insert error:', error.message);
                else console.log('✅ User created: user@test.com');
            }
        );
        
        connection.query(
            'INSERT INTO users (username, email, password, role, email_verified) VALUES (?, ?, ?, ?, ?)',
            ['Event Organizer', 'organizer@test.com', organizerPassword, 'panitia', true],
            (error) => {
                if (error) console.log('Organizer insert error:', error.message);
                else console.log('✅ Organizer created: organizer@test.com');
                
                // Show final status after all inserts
                setTimeout(() => {
                    connection.query('SHOW TABLES', (error, results) => {
                        if (error) {
                            console.error('❌ Error showing tables:', error.message);
                        } else {
                            console.log('\n📋 Tables created:', results.map(r => Object.values(r)[0]).join(', '));
                            
                            // Show record counts
                            const tables = results.map(r => Object.values(r)[0]);
                            let completed = 0;
                            
                            tables.forEach(table => {
                                connection.query(`SELECT COUNT(*) as count FROM ${table}`, (err, countResult) => {
                                    if (!err) {
                                        console.log(`📊 ${table}: ${countResult[0].count} records`);
                                    }
                                    completed++;
                                    
                                    if (completed === tables.length) {
                                        console.log('\n🎉 Database setup completed successfully!');
                                        console.log('📝 Default credentials:');
                                        console.log('   Admin: admin@simtix.com / admin123');
                                        console.log('   User: user@test.com / user123');
                                        console.log('   Organizer: organizer@test.com / organizer123');
                                        connection.end();
                                        process.exit(0);
                                    }
                                });
                            });
                        }
                    });
                }, 1000);
            }
        );
        
    } catch (error) {
        console.error('❌ Error creating default data:', error.message);
        connection.end();
        process.exit(1);
    }
}

// Execute setup
console.log('🔗 Connecting to MySQL server...');
connection.connect((error) => {
    if (error) {
        console.error('❌ Connection error:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.log('💡 Make sure Laragon MySQL is running');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('💡 Check MySQL credentials');
        }
        process.exit(1);
        return;
    }
    
    console.log('✅ Connected to MySQL server');
    console.log('🛠️ Setting up database and tables...');
    
    connection.query(sqlSetup, (error, results) => {
        if (error) {
            console.error('❌ Setup error:', error.message);
            connection.end();
            process.exit(1);
        } else {
            console.log('✅ Database and tables created successfully');
            insertDefaultData();
        }
    });
});