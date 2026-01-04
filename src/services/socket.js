import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config/api';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.eventListeners = new Map();
  }

  // Connect to Socket.io server with JWT authentication
  connect(token) {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      auth: {
        token: token
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling']
    });

    // Connection event handlers
    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('✅ Connected to WebSocket server:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log('❌ Disconnected from WebSocket server:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('🚨 Connection error:', error.message);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Reconnected after', attemptNumber, 'attempts');
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 Reconnection attempt', attemptNumber);
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('🚨 Reconnection error:', error.message);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('💥 Reconnection failed after all attempts');
    });

    return this.socket;
  }

  // Join an event room
  joinEventRoom(eventId) {
    if (!this.socket || !this.isConnected) {
      console.warn('Socket not connected, cannot join room');
      return;
    }
    
    this.socket.emit('joinEventRoom', eventId);
    console.log(`📍 Joined event room: event_${eventId}`);
  }

  // Leave an event room
  leaveEventRoom(eventId) {
    if (!this.socket || !this.isConnected) {
      return;
    }
    
    this.socket.emit('leaveEventRoom', eventId);
    console.log(`👋 Left event room: event_${eventId}`);
  }

  // Join multiple event rooms (for user dashboard)
  joinUserEvents(eventIds) {
    if (!this.socket || !this.isConnected) {
      console.warn('Socket not connected, cannot join rooms');
      return;
    }
    
    this.socket.emit('joinUserEvents', eventIds);
    console.log(`📋 Joined ${eventIds.length} user event rooms`);
  }

  // Join managed events (for panitia dashboard)
  joinManagedEvents(eventIds) {
    if (!this.socket || !this.isConnected) {
      console.warn('Socket not connected, cannot join rooms');
      return;
    }
    
    this.socket.emit('joinManagedEvents', eventIds);
    console.log(`🎫 Joined ${eventIds.length} managed event rooms`);
  }

  // Request current event statistics
  requestEventStats(eventId, callback) {
    if (!this.socket || !this.isConnected) {
      console.warn('Socket not connected');
      return;
    }
    
    this.socket.emit('requestEventStats', eventId);
    
    if (callback) {
      this.socket.once('eventStats', callback);
    }
  }

  // Listen for ticket scanned events
  onTicketScanned(callback) {
    if (!this.socket) return;
    
    this.socket.on('ticketScanned', (data) => {
      console.log('🎫 Ticket scanned:', data);
      callback(data);
    });
    
    this.eventListeners.set('ticketScanned', callback);
  }

  // Listen for my ticket scanned events
  onMyTicketScanned(callback) {
    if (!this.socket) return;
    
    this.socket.on('myTicketScanned', (data) => {
      console.log('✅ My ticket scanned:', data);
      callback(data);
    });
    
    this.eventListeners.set('myTicketScanned', callback);
  }

  // Listen for duplicate scan alerts
  onDuplicateAlert(callback) {
    if (!this.socket) return;
    
    this.socket.on('duplicateAlert', (data) => {
      console.log('⚠️ Duplicate scan alert:', data);
      callback(data);
    });
    
    this.eventListeners.set('duplicateAlert', callback);
  }

  // Listen for payment success notifications
  onPaymentSuccess(callback) {
    if (!this.socket) return;
    
    this.socket.on('paymentSuccess', (data) => {
      console.log('💰 Payment success:', data);
      callback(data);
    });
    
    this.eventListeners.set('paymentSuccess', callback);
  }

  // Listen for user joined room events
  onUserJoined(callback) {
    if (!this.socket) return;
    
    this.socket.on('userJoined', (data) => {
      console.log('👥 User joined:', data);
      callback(data);
    });
    
    this.eventListeners.set('userJoined', callback);
  }

  // Remove specific event listener
  off(eventName) {
    if (!this.socket) return;
    
    const listener = this.eventListeners.get(eventName);
    if (listener) {
      this.socket.off(eventName, listener);
      this.eventListeners.delete(eventName);
      console.log(`🔇 Removed listener for ${eventName}`);
    }
  }

  // Remove all event listeners
  removeAllListeners() {
    if (!this.socket) return;
    
    this.eventListeners.forEach((listener, eventName) => {
      this.socket.off(eventName, listener);
    });
    
    this.eventListeners.clear();
    console.log('🔇 Removed all event listeners');
  }

  // Disconnect from socket server
  disconnect() {
    if (this.socket) {
      this.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('👋 Disconnected from WebSocket server');
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id || null
    };
  }

  // Check if socket is connected
  isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
