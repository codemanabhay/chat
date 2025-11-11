// Socket.io event handlers for TweekChat real-time features
const { generateRoomName } = require('../utils/helpers');
const User = require('../models/User');

// Store active users in memory (in production, use Redis)
const activeUsers = new Map();
const typingUsers = new Map();

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('New socket connection:', socket.id);

    // User authentication and online status
    socket.on('user:connect', async (userId) => {
      try {
        socket.userId = userId;
        activeUsers.set(userId, socket.id);

        // Update user online status in database
        await User.findByIdAndUpdate(userId, {
          isOnline: true,
          lastSeen: new Date()
        });

        // Join user's personal room
        socket.join(`user:${userId}`);

        // Broadcast to all users that this user is online
        socket.broadcast.emit('user:online', { userId, isOnline: true });

        // Send online users list to the connected user
        const onlineUserIds = Array.from(activeUsers.keys());
        socket.emit('users:online', onlineUserIds);

        console.log(`User ${userId} connected`);
      } catch (error) {
        console.error('Error connecting user:', error);
      }
    });

    // Private messaging
    socket.on('message:send', async (data) => {
      try {
        const { recipientId, message } = data;
        const recipientSocketId = activeUsers.get(recipientId);

        // Generate room name for 1-on-1 chat
        const roomName = generateRoomName(socket.userId, recipientId);

        // Send message to recipient if online
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('message:receive', {
            ...message,
            sender: socket.userId
          });
        }

        // Also send to sender's other devices
        socket.to(`user:${socket.userId}`).emit('message:sent', message);

        console.log(`Message sent from ${socket.userId} to ${recipientId}`);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('message:error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing:start', (data) => {
      const { recipientId } = data;
      const recipientSocketId = activeUsers.get(recipientId);

      if (recipientSocketId) {
        io.to(recipientSocketId).emit('typing:user', {
          userId: socket.userId,
          isTyping: true
        });
      }

      // Store typing status
      if (!typingUsers.has(socket.userId)) {
        typingUsers.set(socket.userId, new Set());
      }
      typingUsers.get(socket.userId).add(recipientId);
    });

    socket.on('typing:stop', (data) => {
      const { recipientId } = data;
      const recipientSocketId = activeUsers.get(recipientId);

      if (recipientSocketId) {
        io.to(recipientSocketId).emit('typing:user', {
          userId: socket.userId,
          isTyping: false
        });
      }

      // Remove typing status
      if (typingUsers.has(socket.userId)) {
        typingUsers.get(socket.userId).delete(recipientId);
      }
    });

    // Message read receipts
    socket.on('message:read', (data) => {
      const { messageId, senderId } = data;
      const senderSocketId = activeUsers.get(senderId);

      if (senderSocketId) {
        io.to(senderSocketId).emit('message:read:confirm', {
          messageId,
          readBy: socket.userId,
          readAt: new Date()
        });
      }
    });

    // Group chat
    socket.on('group:join', (groupId) => {
      socket.join(`group:${groupId}`);
      console.log(`User ${socket.userId} joined group ${groupId}`);
    });

    socket.on('group:leave', (groupId) => {
      socket.leave(`group:${groupId}`);
      console.log(`User ${socket.userId} left group ${groupId}`);
    });

    socket.on('group:message', (data) => {
      const { groupId, message } = data;
      
      // Broadcast to all users in the group except sender
      socket.to(`group:${groupId}`).emit('group:message:receive', {
        ...message,
        sender: socket.userId
      });

      console.log(`Group message sent to ${groupId}`);
    });

    socket.on('group:typing', (data) => {
      const { groupId, isTyping } = data;
      socket.to(`group:${groupId}`).emit('group:typing:user', {
        userId: socket.userId,
        isTyping
      });
    });

    // Video/Voice call signaling
    socket.on('call:initiate', (data) => {
      const { recipientId, offer, callType } = data;
      const recipientSocketId = activeUsers.get(recipientId);

      if (recipientSocketId) {
        io.to(recipientSocketId).emit('call:incoming', {
          callerId: socket.userId,
          offer,
          callType
        });
      } else {
        socket.emit('call:unavailable', { recipientId });
      }
    });

    socket.on('call:answer', (data) => {
      const { callerId, answer } = data;
      const callerSocketId = activeUsers.get(callerId);

      if (callerSocketId) {
        io.to(callerSocketId).emit('call:answered', {
          recipientId: socket.userId,
          answer
        });
      }
    });

    socket.on('call:reject', (data) => {
      const { callerId } = data;
      const callerSocketId = activeUsers.get(callerId);

      if (callerSocketId) {
        io.to(callerSocketId).emit('call:rejected', {
          recipientId: socket.userId
        });
      }
    });

    socket.on('call:end', (data) => {
      const { recipientId } = data;
      const recipientSocketId = activeUsers.get(recipientId);

      if (recipientSocketId) {
        io.to(recipientSocketId).emit('call:ended', {
          userId: socket.userId
        });
      }
    });

    socket.on('call:ice-candidate', (data) => {
      const { recipientId, candidate } = data;
      const recipientSocketId = activeUsers.get(recipientId);

      if (recipientSocketId) {
        io.to(recipientSocketId).emit('call:ice-candidate', {
          senderId: socket.userId,
          candidate
        });
      }
    });

    // Notifications
    socket.on('notification:send', (data) => {
      const { recipientId, notification } = data;
      const recipientSocketId = activeUsers.get(recipientId);

      if (recipientSocketId) {
        io.to(recipientSocketId).emit('notification:receive', notification);
      }
    });

    // User disconnect
    socket.on('disconnect', async () => {
      try {
        if (socket.userId) {
          activeUsers.delete(socket.userId);
          typingUsers.delete(socket.userId);

          // Update user offline status
          await User.findByIdAndUpdate(socket.userId, {
            isOnline: false,
            lastSeen: new Date()
          });

          // Broadcast to all users that this user is offline
          socket.broadcast.emit('user:offline', {
            userId: socket.userId,
            lastSeen: new Date()
          });

          console.log(`User ${socket.userId} disconnected`);
        }
      } catch (error) {
        console.error('Error disconnecting user:', error);
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  // Utility function to emit to specific user
  const emitToUser = (userId, event, data) => {
    const socketId = activeUsers.get(userId);
    if (socketId) {
      io.to(socketId).emit(event, data);
    }
  };

  // Utility function to check if user is online
  const isUserOnline = (userId) => {
    return activeUsers.has(userId);
  };

  // Return utility functions for external use
  return {
    emitToUser,
    isUserOnline,
    getActiveUsers: () => Array.from(activeUsers.keys()),
    getActiveUsersCount: () => activeUsers.size
  };
};

// Export active users map for other modules
module.exports.activeUsers = activeUsers;
