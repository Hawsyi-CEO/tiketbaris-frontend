const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Database configuration
const config = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'tiket',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

async function setupCompleteDatabase() {
    let connection;
    
    try {
        // Connect without database first
        connection = await mysql.createConnection({
            host: config.host,
            user: config.user,
            password: config.password,
            port: config.port,
            multipleStatements: true
        });

        console.log('🔗 Connected to MySQL server');

        // Create database if not exists
        await connection.execute(`CREATE DATABASE IF NOT EXISTS ${config.database}`);
        await connection.execute(`USE ${config.database}`);
        console.log(`✅ Database '${config.database}' created and selected`);

        // Drop existing tables to recreate with proper structure
        console.log('🔄 Dropping existing tables...');
        await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
        
        const tablesToDrop = [
            'tickets',
            'user_sessions', 
            'event_agreements',
            'withdrawals',
            'transactions',
            'partnerships', 
            'events',
            'admins',
            'users'
        ];
        
        for (const table of tablesToDrop) {
            try {
                await connection.execute(`DROP TABLE IF EXISTS ${table}`);
                console.log(`   Dropped ${table}`);
            } catch (error) {
                console.log(`   ${table} not found (OK)`);
            }
        }
        
        await connection.execute('SET FOREIGN_KEY_CHECKS = 1');

        // Create users table (base table for both regular users and panitia)
        console.log('📋 Creating users table...');
        await connection.execute(`
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
                INDEX idx_is_active (is_active),
                INDEX idx_verification_token (verification_token),
                INDEX idx_reset_token (reset_token)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        `);

        // Create admins table (separate from users for admin management)
        console.log('👨‍💼 Creating admins table...');
        await connection.execute(`
            CREATE TABLE admins (
                id INT PRIMARY KEY AUTO_INCREMENT,
                username VARCHAR(50) NOT NULL,
                email VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                profile_picture VARCHAR(255) DEFAULT 'default.png',
                permissions TEXT DEFAULT NULL COMMENT 'JSON array of admin permissions',
                is_super_admin BOOLEAN DEFAULT FALSE,
                is_active BOOLEAN DEFAULT TRUE,
                last_login TIMESTAMP NULL DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                INDEX idx_email (email),
                INDEX idx_is_active (is_active),
                INDEX idx_is_super_admin (is_super_admin)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        `);

        // Create events table
        console.log('🎫 Creating events table...');
        await connection.execute(`
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
                price INT NOT NULL DEFAULT 0 COMMENT 'Price in rupiah',
                original_stock INT NOT NULL,
                current_stock INT NOT NULL,
                sold_tickets INT DEFAULT 0,
                image_url VARCHAR(255) DEFAULT NULL,
                gallery JSON DEFAULT NULL COMMENT 'Array of additional images',
                category VARCHAR(100) DEFAULT NULL,
                tags JSON DEFAULT NULL COMMENT 'Array of event tags',
                status ENUM('pending','active','cancelled','completed','draft') DEFAULT 'pending',
                is_featured BOOLEAN DEFAULT FALSE,
                is_public BOOLEAN DEFAULT TRUE,
                allow_refund BOOLEAN DEFAULT FALSE,
                refund_deadline TIMESTAMP NULL DEFAULT NULL,
                terms_and_conditions TEXT DEFAULT NULL,
                documents LONGTEXT DEFAULT NULL COMMENT 'JSON array of required documents',
                contact_info JSON DEFAULT NULL COMMENT 'Contact information for event organizer',
                social_media JSON DEFAULT NULL COMMENT 'Social media links',
                cancellation_reason TEXT DEFAULT NULL,
                admin_notes TEXT DEFAULT NULL,
                approved_by INT DEFAULT NULL,
                approved_at TIMESTAMP NULL DEFAULT NULL,
                cancelled_at TIMESTAMP NULL DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (approved_by) REFERENCES admins(id) ON DELETE SET NULL,
                
                INDEX idx_user_id (user_id),
                INDEX idx_status (status),
                INDEX idx_date (date),
                INDEX idx_category (category),
                INDEX idx_is_featured (is_featured),
                INDEX idx_is_public (is_public),
                INDEX idx_price (price)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        `);

        // Create transactions table
        console.log('💰 Creating transactions table...');
        await connection.execute(`
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
                payment_type VARCHAR(50) DEFAULT 'midtrans' COMMENT 'midtrans, manual, bank_transfer, etc',
                payment_details JSON DEFAULT NULL COMMENT 'Payment gateway response details',
                status ENUM('pending','success','completed','cancelled','failed','refunded') DEFAULT 'pending',
                notes TEXT DEFAULT NULL,
                refund_amount DECIMAL(15,2) DEFAULT 0,
                refund_reason TEXT DEFAULT NULL,
                refunded_at TIMESTAMP NULL DEFAULT NULL,
                expires_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Payment expiration time',
                transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP NULL DEFAULT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
                
                UNIQUE KEY unique_midtrans_order (midtrans_order_id),
                INDEX idx_user_id (user_id),
                INDEX idx_event_id (event_id),
                INDEX idx_status (status),
                INDEX idx_payment_method (payment_method),
                INDEX idx_transaction_date (transaction_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        `);

        // Create tickets table
        console.log('🎟️ Creating tickets table...');
        await connection.execute(`
            CREATE TABLE tickets (
                id INT PRIMARY KEY AUTO_INCREMENT,
                transaction_id INT NOT NULL,
                user_id INT NOT NULL,
                event_id INT NOT NULL,
                ticket_code VARCHAR(100) NOT NULL UNIQUE,
                qr_code VARCHAR(255) DEFAULT NULL COMMENT 'Path to QR code image',
                status ENUM('active','used','cancelled','refunded') DEFAULT 'active',
                holder_name VARCHAR(255) DEFAULT NULL,
                holder_email VARCHAR(255) DEFAULT NULL,
                holder_phone VARCHAR(20) DEFAULT NULL,
                seat_number VARCHAR(50) DEFAULT NULL,
                entrance_gate VARCHAR(50) DEFAULT NULL,
                special_access JSON DEFAULT NULL COMMENT 'VIP access, backstage, etc',
                checked_in_by INT DEFAULT NULL COMMENT 'Admin/staff who checked in this ticket',
                used_at TIMESTAMP NULL DEFAULT NULL,
                cancelled_at TIMESTAMP NULL DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
                FOREIGN KEY (checked_in_by) REFERENCES users(id) ON DELETE SET NULL,
                
                UNIQUE KEY unique_ticket_code (ticket_code),
                INDEX idx_transaction_id (transaction_id),
                INDEX idx_user_id (user_id),
                INDEX idx_event_id (event_id),
                INDEX idx_status (status),
                INDEX idx_ticket_code (ticket_code)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        `);

        // Create user_sessions table (for session management)
        console.log('🔐 Creating user_sessions table...');
        await connection.execute(`
            CREATE TABLE user_sessions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                session_token VARCHAR(255) NOT NULL UNIQUE,
                device_name VARCHAR(255) DEFAULT NULL,
                device_type VARCHAR(50) DEFAULT NULL COMMENT 'desktop, mobile, tablet',
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
                INDEX idx_last_active (last_active),
                INDEX idx_expires_at (expires_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        `);

        // Create partnerships table
        console.log('🤝 Creating partnerships table...');
        await connection.execute(`
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
                FOREIGN KEY (reviewed_by) REFERENCES admins(id) ON DELETE SET NULL,
                
                INDEX idx_user_id (user_id),
                INDEX idx_status (status),
                INDEX idx_partnership_type (partnership_type)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        `);

        // Create withdrawals table
        console.log('💳 Creating withdrawals table...');
        await connection.execute(`
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
                FOREIGN KEY (processed_by) REFERENCES admins(id) ON DELETE SET NULL,
                
                INDEX idx_user_id (user_id),
                INDEX idx_status (status),
                INDEX idx_requested_at (requested_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        `);

        // Create event_agreements table (for event terms and conditions)
        console.log('📄 Creating event_agreements table...');
        await connection.execute(`
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
                
                UNIQUE KEY unique_user_event_agreement (event_id, user_id, agreement_type),
                INDEX idx_event_id (event_id),
                INDEX idx_user_id (user_id),
                INDEX idx_agreement_type (agreement_type)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        `);

        // Insert default admin
        console.log('👨‍💻 Creating default admin...');
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        await connection.execute(`
            INSERT INTO admins (username, email, password, is_super_admin, permissions) 
            VALUES (?, ?, ?, ?, ?)
        `, [
            'Super Admin', 
            'admin@simtix.com', 
            hashedPassword, 
            true,
            JSON.stringify(['all'])
        ]);

        // Insert sample users for testing
        console.log('👥 Creating sample users...');
        const sampleUsers = [
            {
                username: 'John Doe',
                email: 'user@test.com',
                password: await bcrypt.hash('user123', 10),
                role: 'user'
            },
            {
                username: 'Event Organizer',
                email: 'organizer@test.com',
                password: await bcrypt.hash('organizer123', 10),
                role: 'panitia'
            }
        ];

        for (const user of sampleUsers) {
            await connection.execute(`
                INSERT INTO users (username, email, password, role, email_verified) 
                VALUES (?, ?, ?, ?, ?)
            `, [user.username, user.email, user.password, user.role, true]);
        }

        // Verify database structure
        console.log('🔍 Verifying database structure...');
        const [tables] = await connection.execute('SHOW TABLES');
        console.log('✅ Tables created:', tables.map(t => Object.values(t)[0]).join(', '));

        // Show table details
        for (const table of tables) {
            const tableName = Object.values(table)[0];
            const [count] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
            console.log(`📊 ${tableName}: ${count[0].count} records`);
        }

        console.log('🎉 Database setup completed successfully!');
        console.log('');
        console.log('📝 Default credentials:');
        console.log('   Admin: admin@simtix.com / admin123');
        console.log('   User: user@test.com / user123');
        console.log('   Organizer: organizer@test.com / organizer123');

    } catch (error) {
        console.error('❌ Database setup error:', error.message);
        if (error.message.includes('Access denied')) {
            console.log('💡 Make sure Laragon MySQL is running');
            console.log('💡 Check your MySQL credentials in the config');
        }
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔐 Database connection closed');
        }
    }
}

// Run the setup
if (require.main === module) {
    setupCompleteDatabase()
        .then(() => {
            console.log('✨ Setup completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Setup failed:', error.message);
            process.exit(1);
        });
}

module.exports = { setupCompleteDatabase };