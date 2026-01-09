const { Server } = require('socket.io');

let io;

function initSocketServer(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://tiketbaris.id', 'https://www.tiketbaris.id']
        : ['http://localhost:5173', 'http://localhost:5020'],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
  });

  io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);

    // Join event room for real-time updates
    socket.on('joinEvent', (eventId) => {
      socket.join(`event_${eventId}`);
      console.log(`Socket ${socket.id} joined event_${eventId}`);
    });

    // Join user room for notifications
    socket.on('joinUser', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`Socket ${socket.id} joined user_${userId}`);
    });

    // Join panitia room
    socket.on('joinPanitia', (panitiaId) => {
      socket.join(`panitia_${panitiaId}`);
      console.log(`Socket ${socket.id} joined panitia_${panitiaId}`);
    });

    // QR Scanner events
    socket.on('scanTicket', (data) => {
      console.log('🎫 Ticket scanned:', data);
      // Emit to event room
      io.to(`event_${data.eventId}`).emit('ticketScanned', data);
    });

    socket.on('disconnect', () => {
      console.log('👋 Client disconnected:', socket.id);
    });
  });

  console.log('✅ Socket.IO server initialized');
  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}

// Emit notification to specific user
function emitToUser(userId, event, data) {
  if (io) {
    io.to(`user_${userId}`).emit(event, data);
  }
}

// Emit to event room
function emitToEvent(eventId, event, data) {
  if (io) {
    io.to(`event_${eventId}`).emit(event, data);
  }
}

// Emit to panitia
function emitToPanitia(panitiaId, event, data) {
  if (io) {
    io.to(`panitia_${panitiaId}`).emit(event, data);
  }
}

module.exports = {
  initSocketServer,
  getIO,
  emitToUser,
  emitToEvent,
  emitToPanitia
};
