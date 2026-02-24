const pool = require('../config/database');

async function checkUserRoles() {
  const conn = await pool.getConnection();
  
  try {
    console.log('=== Checking User Roles ===\n');
    
    // Get all users with their roles
    const [users] = await conn.execute(`
      SELECT 
        id, 
        username, 
        email, 
        role, 
        google_id,
        created_at
      FROM users 
      WHERE google_id IS NOT NULL
      ORDER BY created_at DESC
    `);
    
    console.log(`Found ${users.length} Google OAuth users:\n`);
    
    users.forEach((user, index) => {
      const roleEmoji = user.role === 'panitia' ? '🎭' : user.role === 'admin' ? '👑' : '👤';
      console.log(`${index + 1}. ${roleEmoji} [${user.role.toUpperCase()}] ${user.username} (${user.email})`);
      console.log(`   ID: ${user.id} | Created: ${user.created_at}`);
      console.log('');
    });
    
    // Summary
    const [summary] = await conn.execute(`
      SELECT 
        role,
        COUNT(*) as count
      FROM users
      WHERE google_id IS NOT NULL
      GROUP BY role
    `);
    
    console.log('\n=== Summary ===');
    summary.forEach(s => {
      const roleEmoji = s.role === 'panitia' ? '🎭' : s.role === 'admin' ? '👑' : '👤';
      console.log(`${roleEmoji} ${s.role}: ${s.count} users`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await conn.release();
  }
}

// Run the script
checkUserRoles()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
