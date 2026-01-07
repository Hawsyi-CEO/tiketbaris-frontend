/**
 * Database Seeder untuk Tiketbaris
 * Menyediakan sample data untuk development
 * 
 * Usage: npm run seed
 * Environment: Development only
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Environment protection
if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'dev') {
  console.error('❌ Seeding hanya diperbolehkan di environment DEVELOPMENT');
  console.error('   Set NODE_ENV=development untuk jalankan seeder');
  process.exit(1);
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tiket',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
});

// Color output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  switch (type) {
    case 'success':
      console.log(`${colors.green}✅ [${timestamp}] ${message}${colors.reset}`);
      break;
    case 'error':
      console.log(`${colors.red}❌ [${timestamp}] ${message}${colors.reset}`);
      break;
    case 'warning':
      console.log(`${colors.yellow}⚠️  [${timestamp}] ${message}${colors.reset}`);
      break;
    case 'info':
      console.log(`${colors.blue}ℹ️  [${timestamp}] ${message}${colors.reset}`);
      break;
  }
}

// Sample data generators
const sampleData = {
  users: [
    {
      username: 'admin',
      email: 'admin@gmail.com',
      password: 'Admin@123456',
      role: 'admin',
      is_verified: 1,
    },
    {
      username: 'panitia_1',
      email: 'panitia1@gmail.com',
      password: 'Panitia@123456',
      role: 'panitia',
      is_verified: 1,
    },
    {
      username: 'panitia_2',
      email: 'panitia2@gmail.com',
      password: 'Panitia@123456',
      role: 'panitia',
      is_verified: 1,
    },
    {
      username: 'user_1',
      email: 'user1@gmail.com',
      password: 'User@123456',
      role: 'user',
      is_verified: 1,
    },
    {
      username: 'user_2',
      email: 'user2@gmail.com',
      password: 'User@123456',
      role: 'user',
      is_verified: 1,
    },
    {
      username: 'user_3',
      email: 'user3@gmail.com',
      password: 'User@123456',
      role: 'user',
      is_verified: 1,
    },
  ],
  
  events: (panitiaIds) => [
    {
      title: 'Konser Musik 2025',
      description: 'Konser musik besar-besaran dengan artis internasional',
      image_url: '/images/konser.jpg',
      date: '2025-03-15',
      time: '19:00',
      location: 'Jakarta International Expo',
      location_map: 'https://maps.google.com',
      capacity: 5000,
      stock: 5000,
      price: 250000,
      category_id: 1,
      panitia_id: panitiaIds[0],
      description_detail: 'Event terbesar tahun ini dengan lineup artis internasional',
      status: 'published',
      is_hidden: 0,
    },
    {
      title: 'Workshop Web Development',
      description: 'Workshop intensif belajar web development dari basic hingga advanced',
      image_url: '/images/workshop.jpg',
      date: '2025-02-20',
      time: '09:00',
      location: 'Tech Hub Indonesia',
      location_map: 'https://maps.google.com',
      capacity: 200,
      stock: 200,
      price: 150000,
      category_id: 2,
      panitia_id: panitiaIds[0],
      description_detail: 'Belajar teknologi terkini dalam industri web development',
      status: 'published',
      is_hidden: 0,
    },
    {
      title: 'Seminar Startup Indonesia',
      description: 'Berbagi pengalaman dan insights dari founder startup sukses',
      image_url: '/images/seminar.jpg',
      date: '2025-03-01',
      time: '10:00',
      location: 'Convention Center Jakarta',
      location_map: 'https://maps.google.com',
      capacity: 1000,
      stock: 1000,
      price: 100000,
      category_id: 3,
      panitia_id: panitiaIds[1],
      description_detail: 'Seminar dengan pembicara dari berbagai founder sukses',
      status: 'published',
      is_hidden: 0,
    },
    {
      title: 'Festival Seni Rupa 2025',
      description: 'Festival seni rupa menampilkan karya seniman lokal dan internasional',
      image_url: '/images/festival.jpg',
      date: '2025-04-10',
      time: '08:00',
      location: 'Museum Nasional Indonesia',
      location_map: 'https://maps.google.com',
      capacity: 3000,
      stock: 3000,
      price: 75000,
      category_id: 4,
      panitia_id: panitiaIds[1],
      description_detail: 'Festival seni terbesar dengan ratusan seniman peserta',
      status: 'published',
      is_hidden: 0,
    },
    {
      title: 'Turnamen E-Sports 2025',
      description: 'Turnamen e-sports dengan hadiah jutaan rupiah',
      image_url: '/images/esports.jpg',
      date: '2025-02-28',
      time: '18:00',
      location: 'Arena E-Sports Premium',
      location_map: 'https://maps.google.com',
      capacity: 500,
      stock: 500,
      price: 50000,
      category_id: 5,
      panitia_id: panitiaIds[0],
      description_detail: 'Turnamen e-sports dengan hadiah total 1 miliar rupiah',
      status: 'published',
      is_hidden: 0,
    },
  ],
};

async function clearTables(conn) {
  try {
    log('Membersihkan data lama...', 'info');
    
    // Disable foreign key checks temporarily
    await conn.execute('SET FOREIGN_KEY_CHECKS=0');
    
    const tables = ['transactions', 'tickets', 'events', 'users'];
    
    for (const table of tables) {
      try {
        await conn.execute(`TRUNCATE TABLE ${table}`);
        log(`Tabel ${table} berhasil dibersihkan`, 'success');
      } catch (error) {
        log(`Tabel ${table} tidak ditemukan atau error: ${error.message}`, 'warning');
      }
    }
    
    // Re-enable foreign key checks
    await conn.execute('SET FOREIGN_KEY_CHECKS=1');
  } catch (error) {
    throw new Error(`Error membersihkan tabel: ${error.message}`);
  }
}

async function seedUsers(conn) {
  try {
    log('Seeding users...', 'info');
    
    const userIds = [];
    
    for (const user of sampleData.users) {
      // Hash password
      const hashedPassword = await bcrypt.hash(user.password, 12);
      
      await conn.execute(
        `INSERT INTO users (username, email, password, role, is_verified, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [user.username, user.email, hashedPassword, user.role, user.is_verified]
      );
      
      // Get inserted user ID
      const [result] = await conn.execute(
        'SELECT id FROM users WHERE email = ?',
        [user.email]
      );
      
      if (result.length > 0) {
        userIds.push(result[0].id);
        log(`User ${user.username} (${user.email}) created`, 'success');
      }
    }
    
    return userIds;
  } catch (error) {
    throw new Error(`Error seeding users: ${error.message}`);
  }
}

async function seedEvents(conn, userIds) {
  try {
    log('Seeding events...', 'info');
    
    const panitiaIds = userIds.filter((_, i) => i > 0 && i <= 2); // Get panitia users
    const events = sampleData.events(panitiaIds);
    const eventIds = [];
    
    for (const event of events) {
      await conn.execute(
        `INSERT INTO events 
         (title, description, image_url, date, time, location, location_map, 
          capacity, stock, price, category_id, panitia_id, description_detail, 
          status, is_hidden, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          event.title, event.description, event.image_url, event.date, event.time,
          event.location, event.location_map, event.capacity, event.stock,
          event.price, event.category_id, event.panitia_id, event.description_detail,
          event.status, event.is_hidden,
        ]
      );
      
      // Get inserted event ID
      const [result] = await conn.execute(
        'SELECT id FROM events WHERE title = ? AND panitia_id = ?',
        [event.title, event.panitia_id]
      );
      
      if (result.length > 0) {
        eventIds.push(result[0].id);
        log(`Event "${event.title}" created`, 'success');
      }
    }
    
    return eventIds;
  } catch (error) {
    throw new Error(`Error seeding events: ${error.message}`);
  }
}

async function seedTickets(conn, eventIds, userIds) {
  try {
    log('Seeding tickets...', 'info');
    
    const customerIds = userIds.slice(3); // Get customer users (non-admin, non-panitia)
    let ticketCount = 0;
    
    // Create sample transactions and tickets for first 2 events
    for (let eventIdx = 0; eventIdx < Math.min(2, eventIds.length); eventIdx++) {
      const eventId = eventIds[eventIdx];
      
      // Create 2 transactions per event
      for (let custIdx = 0; custIdx < Math.min(2, customerIds.length); custIdx++) {
        const userId = customerIds[custIdx];
        const orderId = `SEED-${Date.now()}-${eventIdx}-${custIdx}`;
        
        // Insert transaction
        const [transResult] = await conn.execute(
          `INSERT INTO transactions 
           (user_id, event_id, order_id, quantity, total_price, payment_status, 
            transaction_status, fraud_status, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [userId, eventId, orderId, 2, 500000, 'completed', 'settlement', 'accept']
        );
        
        const transactionId = transResult.insertId;
        
        // Create 2 tickets per transaction
        for (let i = 0; i < 2; i++) {
          const qrCode = `QR-${transactionId}-${i}`;
          const ticketCode = `TICKET-${Date.now()}-${i}`;
          
          await conn.execute(
            `INSERT INTO tickets 
             (user_id, event_id, transaction_id, ticket_code, qr_code, status, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [userId, eventId, transactionId, ticketCode, qrCode, 'active']
          );
          
          ticketCount++;
        }
        
        log(`Transaction ${orderId} dengan 2 tickets created`, 'success');
      }
    }
    
    log(`Total ${ticketCount} tickets created`, 'success');
  } catch (error) {
    throw new Error(`Error seeding tickets: ${error.message}`);
  }
}

async function runSeed() {
  let conn;
  
  try {
    log('=== TIKETBARIS DATABASE SEEDER ===', 'info');
    log(`Environment: ${process.env.NODE_ENV}`, 'info');
    log(`Database: ${process.env.DB_NAME || 'tiket'}`, 'info');
    log('', 'info');
    
    // Get connection
    conn = await pool.getConnection();
    log('Terhubung ke database', 'success');
    
    // Clear existing data
    await clearTables(conn);
    
    // Seed users
    const userIds = await seedUsers(conn);
    
    // Seed events
    const eventIds = await seedEvents(conn, userIds);
    
    // Seed tickets and transactions
    await seedTickets(conn, eventIds, userIds);
    
    log('', 'info');
    log('=== SEEDING COMPLETED SUCCESSFULLY ===', 'success');
    log('', 'info');
    log('📊 Summary:', 'info');
    log(`   Users: ${userIds.length}`, 'info');
    log(`   Events: ${eventIds.length}`, 'info');
    log(`   Transactions & Tickets: Created`, 'info');
    log('', 'info');
    log('🔐 Test Credentials:', 'info');
    log('   Admin: admin@gmail.com / Admin@123456', 'info');
    log('   Panitia: panitia1@gmail.com / Panitia@123456', 'info');
    log('   User: user1@gmail.com / User@123456', 'info');
    log('', 'info');
    
    await conn.release();
    process.exit(0);
  } catch (error) {
    log(error.message, 'error');
    if (conn) await conn.release();
    process.exit(1);
  }
}

// Run seeder
runSeed();
