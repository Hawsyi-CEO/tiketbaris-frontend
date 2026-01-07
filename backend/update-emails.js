const mysql = require('mysql2');
const bcrypt = require('bcryptjs');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    port: 3306,
    database: 'tiket'
});

async function updateAccounts() {
    console.log('🔄 Updating accounts dengan email @gmail.com...');
    
    try {
        // Create passwords
        const adminPass = await bcrypt.hash('admin123', 10);
        const panitiaPass = await bcrypt.hash('panitia123', 10);
        const userPass = await bcrypt.hash('user123', 10);
        
        // Clear existing accounts
        connection.query('DELETE FROM admins', (err) => {
            if (err) console.log('Note: admins table cleared');
        });
        
        connection.query('DELETE FROM users', (err) => {
            if (err) console.log('Note: users table cleared');
        });
        
        // Insert new accounts with various email domains
        const insertSQL = `
        INSERT INTO admins (username, email, password) VALUES 
        ('admin', 'admin@gmail.com', '${adminPass}'),
        ('superadmin', 'superadmin@yahoo.com', '${adminPass}');
        
        INSERT INTO users (username, email, password, role) VALUES 
        ('panitia1', 'panitia@gmail.com', '${panitiaPass}', 'panitia'),
        ('panitia2', 'organizer@outlook.com', '${panitiaPass}', 'panitia'),
        ('user1', 'user@gmail.com', '${userPass}', 'user'),
        ('user2', 'test@yahoo.com', '${userPass}', 'user'),
        ('user3', 'demo@hotmail.com', '${userPass}', 'user');
        `;
        
        connection.query(insertSQL, (error) => {
            if (error) {
                console.error('❌ Error:', error.message);
                return;
            }
            
            console.log('✅ Accounts updated dengan berbagai domain email:');
            console.log('');
            console.log('👑 ADMIN:');
            console.log('   admin@gmail.com / admin123');
            console.log('   superadmin@yahoo.com / admin123');
            console.log('');
            console.log('🎫 PANITIA:');
            console.log('   panitia@gmail.com / panitia123');
            console.log('   organizer@outlook.com / panitia123');
            console.log('');
            console.log('👤 USER:');
            console.log('   user@gmail.com / user123');
            console.log('   test@yahoo.com / user123');
            console.log('   demo@hotmail.com / user123');
            console.log('');
            console.log('💡 Anda juga bisa register dengan email domain apapun!');
            console.log('   (@gmail.com, @yahoo.com, @outlook.com, @company.com, dll)');
            
            connection.end();
        });
        
    } catch (error) {
        console.error('❌ Error hashing passwords:', error);
        connection.end();
    }
}

updateAccounts();