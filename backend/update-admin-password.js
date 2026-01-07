const bcrypt = require('bcryptjs');
const pool = require('./config/database');

const updateAdminPassword = async () => {
  try {
    const email = 'admin@gmail.com';
    const newPassword = 'admin123';
    
    // Generate Node.js compatible hash
    const hash = await bcrypt.hash(newPassword, 10);
    console.log('New hash for admin:', hash);
    
    // Update database
    const conn = await pool.getConnection();
    const [result] = await conn.execute(
      'UPDATE admins SET password = ? WHERE email = ?',
      [hash, email]
    );
    await conn.release();
    
    console.log('Admin password updated. Affected rows:', result.affectedRows);
    
    // Test verification
    const isValid = await bcrypt.compare(newPassword, hash);
    console.log('Password verification test:', isValid);
    
  } catch (error) {
    console.error('Error updating admin password:', error);
  }
  
  process.exit(0);
};

updateAdminPassword();