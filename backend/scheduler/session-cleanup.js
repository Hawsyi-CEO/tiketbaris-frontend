const cron = require('node-cron');
const { cleanupOldSessions } = require('../middleware/device-tracker');
const { logSecurityEvent } = require('../middleware/logger');

// Cleanup old sessions every day at 2:00 AM
const startSessionCleanup = () => {
  console.log('🗂️ Session cleanup scheduler started');
  
  // Run every day at 2:00 AM (0 2 * * *)
  cron.schedule('0 2 * * *', async () => {
    try {
      console.log('🧹 Starting automatic session cleanup...');
      
      const deletedCount = await cleanupOldSessions();
      
      if (deletedCount > 0) {
        console.log(`✅ Cleaned up ${deletedCount} old session(s)`);
        
        logSecurityEvent('info', 'SESSION_CLEANUP', {
          deletedCount: deletedCount,
          timestamp: new Date().toISOString(),
          message: 'Automatic cleanup of old sessions completed'
        });
      } else {
        console.log('ℹ️ No old sessions to cleanup');
      }
    } catch (error) {
      console.error('❌ Session cleanup failed:', error);
      
      logSecurityEvent('error', 'SESSION_CLEANUP_FAILED', {
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // Manual cleanup function for testing
  const runManualCleanup = async () => {
    try {
      console.log('🧹 Running manual session cleanup...');
      const deletedCount = await cleanupOldSessions();
      console.log(`✅ Manual cleanup completed: ${deletedCount} session(s) deleted`);
      return deletedCount;
    } catch (error) {
      console.error('❌ Manual cleanup failed:', error);
      return 0;
    }
  };
  
  return {
    runManualCleanup
  };
};

module.exports = {
  startSessionCleanup
};