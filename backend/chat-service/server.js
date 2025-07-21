const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const axios = require('axios');
const { generateToken } = require('./utils/jwt');
require('dotenv').config();

const chatRoutes = require('./routes/chatRoutes');
const chatService = require('./services/chatService');
const { socketAuthMiddleware } = require('./middleware/authMiddleware');

// Create service-to-service authentication token
const createServiceToken = () => {
  return generateToken({
    service: 'chat-service',
    isServiceToken: true
  });
};

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type", "x-requested-with"],
    credentials: true
  },
  allowEIO3: true, // Allow Engine.IO v3 client
  transports: ['websocket', 'polling'],
  pingTimeout: 60000
});

const PORT = process.env.PORT || 3002;
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/chat', chatRoutes);

app.get('/', (req, res) => {
  res.json({ status: 'Chat Service is running' });
});

const serviceAxios = axios.create();
serviceAxios.interceptors.request.use(config => {
  const serviceToken = createServiceToken();
  config.headers.Authorization = `Bearer ${serviceToken}`;
  return config;
});

// Socket.io authentication middleware
io.use((socket, next) => {
  console.log('Socket attempting connection...', socket.id);
  next();
});

io.use(socketAuthMiddleware);

// Socket.io connection handling
io.on('connection', async (socket) => {
  console.log(`User connected: ${socket.userId} with socket ID: ${socket.id}`);
  
  // Update user online status
  try {
    await serviceAxios.post(`${process.env.AUTH_SERVICE_URL}/api/auth/users/${socket.userId}/online`, {
      isOnline: true
    });
    console.log(`User ${socket.userId} marked as online`);
  } catch (error) {
    console.error('Failed to update user online status:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
  
  // Join user to their rooms
  try {
    const rooms = await chatService.getUserRooms(socket.userId);
    rooms.forEach(room => {
      socket.join(room._id.toString());
      console.log(`User ${socket.userId} joined room ${room._id}`);
    });
  } catch (error) {
    console.error('Failed to join user rooms:', error.message);
    socket.emit('error', { message: 'Failed to join rooms: ' + error.message });
  }
  
  // Handle joining a room
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.userId} joined room ${roomId}`);
  });
  
  // Handle leaving a room
  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
    console.log(`User ${socket.userId} left room ${roomId}`);
  });
  
  // Handle sending a message
  socket.on('send-message', async (data) => {
    try {
      const { roomId, content, messageType = 'text' } = data;
      console.log(`Attempting to send message in room ${roomId} by user ${socket.userId}`);
      
      // Get user info from auth service
      const authResponse = await serviceAxios.get(`${process.env.AUTH_SERVICE_URL}/api/auth/profile/${socket.userId}`);
      const user = authResponse.data.data;
      
      const message = await chatService.sendMessage({
        roomId,
        sender: {
          userId: socket.userId,
          username: user.username
        },
        content,
        messageType
      });
      
      // Emit message to all users in the room
      io.to(roomId).emit('new-message', {
        ...message.toObject(),
        sender: {
          userId: socket.userId,
          username: user.username,
          avatar: user.avatar
        }
      });
      
      console.log(`Message sent in room ${roomId} by ${user.username}`);
    } catch (error) {
      socket.emit('error', { message: error.message });
      console.error('Send message error:', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
    }
  });
  
  // Handle editing a message
  socket.on('edit-message', async (data) => {
    try {
      const { messageId, newContent } = data;
      
      const message = await chatService.editMessage(messageId, newContent, socket.userId);
      
      // Emit updated message to all users in the room
      io.to(message.roomId.toString()).emit('message-edited', {
        messageId,
        content: newContent,
        edited: true,
        editedAt: message.editedAt
      });
      
      // Emit room update to all users
      const updatedRoom = await chatService.getRoomById(message.roomId);
      if (updatedRoom) {
        io.to(message.roomId.toString()).emit('room-updated', updatedRoom);
      }
      
      console.log(`Message ${messageId} edited by ${socket.userId}`);
    } catch (error) {
      socket.emit('error', { message: error.message });
      console.error('Edit message error:', error.message);
    }
  });
  
  // Handle deleting a message
  socket.on('delete-message', async (data) => {
    try {
      const { messageId } = data;
      
      const message = await chatService.deleteMessage(messageId, socket.userId);
      
      // Emit deleted message to all users in the room
      io.to(message.roomId.toString()).emit('message-deleted', {
        messageId,
        deleted: true,
        deletedAt: message.deletedAt
      });
      
      // Emit room update to all users
      const updatedRoom = await chatService.getRoomById(message.roomId);
      if (updatedRoom) {
        io.to(message.roomId.toString()).emit('room-updated', updatedRoom);
      }
      
      console.log(`Message ${messageId} deleted by ${socket.userId}`);
    } catch (error) {
      socket.emit('error', { message: error.message });
      console.error('Delete message error:', error.message);
    }
  });
  
  // Handle marking messages as read
  socket.on('mark-as-read', async (data) => {
    try {
      const { roomId } = data;
      
      await chatService.markRoomMessagesAsRead(roomId, socket.userId);
      
      // Emit read status to other users in the room
      socket.to(roomId).emit('messages-read', {
        userId: socket.userId,
        roomId,
        readAt: new Date()
      });
      
      console.log(`Messages marked as read in room ${roomId} by ${socket.userId}`);
    } catch (error) {
      socket.emit('error', { message: error.message });
      console.error('Mark as read error:', error.message);
    }
  });
  
  // Handle typing indicators
  socket.on('typing-start', (data) => {
    const { roomId, username } = data;
    socket.to(roomId).emit('user-typing', { userId: socket.userId, username });
  });
  
  socket.on('typing-stop', (data) => {
    const { roomId } = data;
    socket.to(roomId).emit('user-stopped-typing', { userId: socket.userId });
  });
  
  // Handle errors
  socket.on('error', (error) => {
    console.error(`Socket error for user ${socket.userId}:`, error);
  });
  
  // Handle disconnect
  socket.on('disconnect', async () => {
    console.log(`User disconnected: ${socket.userId}`);
    
    // Update user offline status
    try {
      await serviceAxios.post(`${process.env.AUTH_SERVICE_URL}/api/auth/users/${socket.userId}/online`, {
        isOnline: false
      });
      console.log(`User ${socket.userId} marked as offline`);
    } catch (error) {
      console.error('Failed to update user offline status:', error.message);
    }
  });
});

//global catch
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB (Chat Service)');
    server.listen(PORT, () => {
      console.log(`Chat Service running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  }); 