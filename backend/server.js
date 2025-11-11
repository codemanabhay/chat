// TweekChat - Professional Real-Time Chat Application
// Backend Server with Complete Security & AI Integration

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const path = require('path');
const passport = require('passport');
const session = require('express-session');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');
const groupRoutes = require('./routes/groups');
const aiRoutes = require('./routes/ai');

// Import middleware
const { apiLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

// Initialize Express
const app = express();
const server = http.createServer(app);

// Initialize Socket.io with CORS
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
  }
});

// Make io accessible to routes
app.set('io', io);

// Database Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected Successfully');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

connectDB();

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));

// CORS Configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Body Parser & Cookie Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Session & Passport Configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'tweetchat-session-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
app.use(passport.initialize());
app.use(passport.session());
require('../config/passport')(passport);

// MongoDB Injection Prevention
app.use(mongoSanitize());

// Rate Limiting
app.use('/api/', apiLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/ai', aiRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'success',
    message: 'TweekChat API is running!',
    timestamp: new Date().toISOString()
  });
});

// Socket.io Connection Handling
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);

  // User comes online
  socket.on('user_online', async (userId) => {
    try {
      onlineUsers.set(userId, socket.id);
      socket.userId = userId;
      socket.join(userId);
      
      // Broadcast to all users
      io.emit('user_status', { userId, status: 'online' });
      
      // Update user status in database
      const User = require('./models/User');
      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        lastSeen: new Date()
      });
    } catch (error) {
      console.error('Error in user_online:', error);
    }
  });

  // Private message
  socket.on('send_message', async (data) => {
    try {
      const { senderId, receiverId, content, messageType } = data;
      
      // Save message to database
      const Message = require('./models/Message');
      const newMessage = await Message.create({
        sender: senderId,
        receiver: receiverId,
        content,
        messageType: messageType || 'text'
      });

      // Populate sender info
      await newMessage.populate('sender', 'username profilePicture');
      
      // Send to receiver if online
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receive_message', newMessage);
      }
      
      // Send confirmation to sender
      socket.emit('message_sent', newMessage);
    } catch (error) {
      console.error('Error in send_message:', error);
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  });

  // Group message
  socket.on('send_group_message', async (data) => {
    try {
      const { senderId, groupId, content, messageType } = data;
      
      // Save message
      const Message = require('./models/Message');
      const newMessage = await Message.create({
        sender: senderId,
        group: groupId,
        content,
        messageType: messageType || 'text'
      });

      await newMessage.populate('sender', 'username profilePicture');
      
      // Broadcast to all group members
      io.to(groupId).emit('receive_group_message', newMessage);
    } catch (error) {
      console.error('Error in send_group_message:', error);
    }
  });

  // Join group room
  socket.on('join_group', (groupId) => {
    socket.join(groupId);
    console.log(`User joined group: ${groupId}`);
  });

  // Leave group room
  socket.on('leave_group', (groupId) => {
    socket.leave(groupId);
    console.log(`User left group: ${groupId}`);
  });

  // Typing indicator
  socket.on('typing', (data) => {
    const { receiverId, isTyping } = data;
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user_typing', {
        userId: socket.userId,
        isTyping
      });
    }
  });

  // User disconnects
  socket.on('disconnect', async () => {
    console.log('👋 Client disconnected:', socket.id);
    
    if (socket.userId) {
      try {
        onlineUsers.delete(socket.userId);
        io.emit('user_status', { userId: socket.userId, status: 'offline' });
        
        // Update database
        const User = require('./models/User');
        await User.findByIdAndUpdate(socket.userId, {
          isOnline: false,
          lastSeen: new Date()
        });
      } catch (error) {
        console.error('Error in disconnect:', error);
      }
    }
  });
});

// Error Handler Middleware (must be last)
app.use(errorHandler);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ 
    status: 'error',
    message: 'Route not found' 
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 TweekChat Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 Socket.io enabled`);
});
