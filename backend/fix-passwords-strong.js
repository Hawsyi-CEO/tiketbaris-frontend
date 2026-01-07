const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function checkAndFixPasswords() {
  try {
    console.log('🔐 Checking passwords...\n');
    
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'tiket'
    });

    const [users] = await conn.execute('SELECT id, username, email, password FROM users');
    
    const testPasswords = {
      'admin@tiketbaris.id': 'Admin@123',
      'user@test.com': 'User@123',
      'organizer@test.com': 'Organizer@123'
    };

    console.log('📋 Testing passwords:\n');
    
    for (const user of users) {
      const testPassword = testPasswords[user.email];
      if (testPassword) {
        const isMatch = await bcrypt.compare(testPassword, user.password);
        console.log(`${user.email}`);
        console.log(`  Username: ${user.username}`);
        console.log(`  Password: ${testPassword}`);
        console.log(`  Match: ${isMatch ? '✅ YES' : '❌ NO'}`);
        console.log('');
        
        if (!isMatch) {
          console.log(`  🔧 Fixing password for ${user.email}...`);
          const hashedPassword = await bcrypt.hash(testPassword, 12);
          await conn.execute(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, user.id]
          );
          console.log(`  ✅ Password updated!\n`);
        }
      }
    }

    // Clear sessions
    await conn.execute('DELETE FROM user_sessions');
    console.log('✅ Cleared all sessions\n');

    await conn.end();
    
    console.log('✅ All done! Try login now with:');
    console.log('   admin@tiketbaris.id / Admin@123');
    console.log('   user@test.com / User@123');
    console.log('   organizer@test.com / Organizer@123');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAndFixPasswords();
