/**
 * Partner Webhook Service
 * 
 * Sends webhook notifications to partner systems
 * Used for notifying partners about payment status, ticket scans, etc.
 */

const crypto = require('crypto');
const pool = require('../config/database');

class PartnerWebhookService {
  
  /**
   * Send webhook to partner
   * @param {number} partnerId - Partner ID
   * @param {string} event - Event type (e.g., 'payment.success')
   * @param {object} payload - Data to send
   */
  static async sendWebhook(partnerId, event, payload) {
    const conn = await pool.getConnection();
    
    try {
      // Get partner webhook URL
      const [partners] = await conn.execute(
        'SELECT webhook_url, webhook_secret, name FROM partners WHERE id = ? AND is_active = 1',
        [partnerId]
      );

      if (partners.length === 0 || !partners[0].webhook_url) {
        console.log(`[WEBHOOK] No webhook URL for partner ${partnerId}, skipping`);
        return { sent: false, reason: 'no_webhook_url' };
      }

      const partner = partners[0];
      const webhookUrl = partner.webhook_url;
      const timestamp = Math.floor(Date.now() / 1000);
      
      // Prepare webhook payload
      const webhookPayload = {
        event,
        timestamp,
        data: payload
      };

      // Generate signature if partner has webhook secret
      let signature = null;
      if (partner.webhook_secret) {
        signature = this.generateSignature(webhookPayload, partner.webhook_secret);
      }

      // Send webhook
      const result = await this.makeRequest(webhookUrl, webhookPayload, signature, timestamp);
      
      // Log webhook
      await this.logWebhook(conn, partnerId, event, webhookPayload, result);

      return result;
    } catch (error) {
      console.error(`[WEBHOOK] Error sending webhook to partner ${partnerId}:`, error);
      return { sent: false, error: error.message };
    } finally {
      conn.release();
    }
  }

  /**
   * Generate HMAC signature for webhook payload
   */
  static generateSignature(payload, secret) {
    const payloadString = JSON.stringify(payload);
    return crypto.createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');
  }

  /**
   * Make HTTP request to webhook URL
   */
  static async makeRequest(url, payload, signature, timestamp) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'X-Webhook-Timestamp': timestamp.toString()
      };

      if (signature) {
        headers['X-Webhook-Signature'] = signature;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeout);

      return {
        sent: true,
        status: response.status,
        success: response.status >= 200 && response.status < 300
      };
    } catch (error) {
      if (error.name === 'AbortError') {
        return { sent: true, success: false, error: 'timeout' };
      }
      return { sent: false, success: false, error: error.message };
    }
  }

  /**
   * Log webhook attempt
   */
  static async logWebhook(conn, partnerId, event, payload, result) {
    try {
      await conn.execute(
        `INSERT INTO partner_webhooks_log (partner_id, event_type, payload, response_status, success, error_message, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [
          partnerId,
          event,
          JSON.stringify(payload),
          result.status || null,
          result.success ? 1 : 0,
          result.error || null
        ]
      );
    } catch (error) {
      // Don't fail if logging fails
      console.error('[WEBHOOK] Error logging webhook:', error);
    }
  }

  // ==================== Event-Specific Methods ====================

  /**
   * Notify partner about successful payment
   */
  static async notifyPaymentSuccess(partnerId, transaction) {
    return this.sendWebhook(partnerId, 'payment.success', {
      order_id: transaction.midtrans_order_id,
      partner_order_id: transaction.partner_order_id,
      event_id: transaction.event_id,
      partner_event_id: transaction.partner_event_id,
      buyer: {
        external_id: transaction.buyer_external_id,
        email: transaction.buyer_email,
        name: transaction.buyer_name
      },
      amount: transaction.total_amount,
      quantity: transaction.quantity,
      payment: {
        type: transaction.payment_type,
        status: 'completed'
      },
      tickets: transaction.tickets || [],
      paid_at: new Date().toISOString()
    });
  }

  /**
   * Notify partner about failed payment
   */
  static async notifyPaymentFailed(partnerId, transaction) {
    return this.sendWebhook(partnerId, 'payment.failed', {
      order_id: transaction.midtrans_order_id,
      partner_order_id: transaction.partner_order_id,
      event_id: transaction.event_id,
      status: 'failed',
      reason: transaction.failure_reason || 'payment_failed'
    });
  }

  /**
   * Notify partner about payment expiry
   */
  static async notifyPaymentExpired(partnerId, transaction) {
    return this.sendWebhook(partnerId, 'payment.expired', {
      order_id: transaction.midtrans_order_id,
      partner_order_id: transaction.partner_order_id,
      event_id: transaction.event_id,
      status: 'expired'
    });
  }

  /**
   * Notify partner about ticket scan
   */
  static async notifyTicketScanned(partnerId, ticket) {
    return this.sendWebhook(partnerId, 'ticket.scanned', {
      ticket_code: ticket.unique_code,
      partner_ticket_id: ticket.partner_ticket_id,
      event: {
        id: ticket.event_id,
        partner_event_id: ticket.partner_event_id,
        title: ticket.event_title
      },
      holder: {
        external_id: ticket.holder_external_id,
        name: ticket.holder_name
      },
      scanned_at: new Date().toISOString(),
      scanned_by: ticket.scanned_by_name
    });
  }

  /**
   * Notify partner about ticket creation
   */
  static async notifyTicketCreated(partnerId, tickets) {
    return this.sendWebhook(partnerId, 'ticket.created', {
      tickets: tickets.map(t => ({
        code: t.unique_code,
        partner_ticket_id: t.partner_ticket_id,
        event_id: t.event_id,
        partner_event_id: t.partner_event_id,
        holder_external_id: t.holder_external_id
      })),
      count: tickets.length
    });
  }

  /**
   * Notify partner about event approval
   */
  static async notifyEventApproved(partnerId, event) {
    return this.sendWebhook(partnerId, 'event.approved', {
      event_id: event.id,
      partner_event_id: event.partner_event_id,
      title: event.title,
      status: 'active',
      approved_at: new Date().toISOString()
    });
  }

  /**
   * Notify partner about event rejection
   */
  static async notifyEventRejected(partnerId, event, reason) {
    return this.sendWebhook(partnerId, 'event.rejected', {
      event_id: event.id,
      partner_event_id: event.partner_event_id,
      title: event.title,
      status: 'rejected',
      reason: reason
    });
  }

  // ==================== Retry Logic ====================

  /**
   * Retry failed webhooks
   * Call this from a scheduled job
   */
  static async retryFailedWebhooks(maxRetries = 3) {
    const conn = await pool.getConnection();
    
    try {
      // Get failed webhooks that haven't exceeded max retries
      const [failedWebhooks] = await conn.execute(
        `SELECT wl.*, p.webhook_url, p.webhook_secret
         FROM partner_webhooks_log wl
         JOIN partners p ON wl.partner_id = p.id
         WHERE wl.success = 0 
         AND wl.retry_count < ?
         AND wl.created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
         ORDER BY wl.created_at ASC
         LIMIT 50`,
        [maxRetries]
      );

      console.log(`[WEBHOOK] Found ${failedWebhooks.length} failed webhooks to retry`);

      for (const webhook of failedWebhooks) {
        const payload = JSON.parse(webhook.payload);
        const timestamp = Math.floor(Date.now() / 1000);
        
        let signature = null;
        if (webhook.webhook_secret) {
          signature = this.generateSignature(payload, webhook.webhook_secret);
        }

        const result = await this.makeRequest(webhook.webhook_url, payload, signature, timestamp);

        // Update webhook log
        await conn.execute(
          `UPDATE partner_webhooks_log 
           SET success = ?, retry_count = retry_count + 1, 
               last_retry_at = NOW(), response_status = ?, error_message = ?
           WHERE id = ?`,
          [result.success ? 1 : 0, result.status || null, result.error || null, webhook.id]
        );

        // Add delay between retries
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      return { retried: failedWebhooks.length };
    } catch (error) {
      console.error('[WEBHOOK] Error retrying webhooks:', error);
      throw error;
    } finally {
      conn.release();
    }
  }
}

module.exports = PartnerWebhookService;
