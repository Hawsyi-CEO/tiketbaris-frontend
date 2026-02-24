const cron = require('node-cron');
const pool = require('../config/database');

// Auto-cancel expired pending transactions
// Runs every hour to check for expired transactions
const startTransactionExpiryScheduler = () => {
  // Run at minute 0 of every hour (e.g., 1:00, 2:00, 3:00, etc.)
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('[SCHEDULER] Checking for expired transactions...');
      
      const conn = await pool.getConnection();
      
      // Find all pending transactions that have expired
      const [expiredTransactions] = await conn.execute(
        `SELECT id, midtrans_order_id, user_id, event_id, quantity 
         FROM transactions 
         WHERE status = 'pending' 
           AND expired_at < NOW()`
      );
      
      if (expiredTransactions.length === 0) {
        console.log('[SCHEDULER] No expired transactions found');
        await conn.release();
        return;
      }
      
      console.log(`[SCHEDULER] Found ${expiredTransactions.length} expired transactions`);
      
      // Update all expired transactions to 'expired' status
      const [result] = await conn.execute(
        `UPDATE transactions 
         SET status = 'expired' 
         WHERE status = 'pending' AND expired_at < NOW()`
      );
      
      await conn.release();
      
      console.log(`[SCHEDULER] Successfully expired ${result.affectedRows} transactions`);
      
      // Log each expired transaction
      expiredTransactions.forEach(tx => {
        console.log(`  - Order ${tx.midtrans_order_id}: User ${tx.user_id}, Event ${tx.event_id}, Qty ${tx.quantity}`);
      });
      
    } catch (error) {
      console.error('[SCHEDULER] Error processing expired transactions:', error);
    }
  });
  
  console.log('[SCHEDULER] Transaction expiry scheduler started (runs every hour)');
};

module.exports = { startTransactionExpiryScheduler };
