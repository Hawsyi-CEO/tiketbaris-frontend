const pool = require('../config/database');

// Script to fix user role from panitia to user
// Usage: node fix-user-role.js <email>

const targetEmail = process.argv[2];

if (!targetEmail) {
  console.error('❌ Usage: node fix-user-role.js <email>');
  console.error('Example: node fix-user-role.js user@example.com');
  process.exit(1);
}

async function fixUserRole() {
  const conn = await pool.getConnection();
  
  try {
    // Find user
    const [users] = await conn.execute(
      'SELECT id, username, email, role FROM users WHERE email = ?',
      [targetEmail]
    );
    
    if (users.length === 0) {
      console.error(`❌ User with email "${targetEmail}" not found`);
      process.exit(1);
    }
    
    const user = users[0];
    console.log('\n📋 Current User Info:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Current Role: ${user.role}`);
    
    if (user.role === 'user') {
      console.log('\n✅ User already has "user" role. No changes needed.');
      process.exit(0);
    }
    
    // Update role to user
    await conn.execute(
      'UPDATE users SET role = ? WHERE id = ?',
      ['user', user.id]
    );
    
    console.log(`\n✅ Successfully changed role from "${user.role}" to "user"`);
    console.log('⚠️  User needs to logout and login again to see the changes.');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await conn.release();
  }
}

fixUserRole()
  .then(() => {
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
