const { socketAuthMiddleware } = require('../middleware/authMiddleware');
const chatService = require('../services/chatService');
const roomService = require('../services/roomService');

module.exports = (io) => {
  io.use(socketAuthMiddleware);

  const activeUsers = new Map();
  const userRooms = new Map();

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.username} (${socket.id})`);
    activeUsers.set(socket.user.id, {
      socketId: socket.id,
      username: socket.user.username,
      avatar: socket.user.avatar,
      joinedAt: new Date()
    });

    // Ensure global room exists and join user
    roomService.ensureGlobalRoom().then(globalRoom => {
      roomService.joinRoom(globalRoom._id, socket.user.id, socket.user.username)
        .then(() => {
          socket.join(globalRoom._id.toString());
          if (!userRooms.has(socket.user.id)) {
            userRooms.set(socket.user.id, new Set());
          }
          userRooms.get(socket.user.id).add(globalRoom._id.toString());
        });
    });

    socket.broadcast.emit('user_online', {
      userId: socket.user.id,
      username: socket.user.username,
      avatar: socket.user.avatar
    });
    socket.emit('active_users', Array.from(activeUsers.values()));

    // Join room
    socket.on('join_room', async (data) => {
      try {
        const { roomId } = data;
        const room = await roomService.joinRoom(roomId, socket.user.id, socket.user.username);
        
        socket.join(roomId);
        
        if (!userRooms.has(socket.user.id)) {
          userRooms.set(socket.user.id, new Set());
        }
        userRooms.get(socket.user.id).add(roomId);

        socket.to(roomId).emit('user_joined_room', {
          roomId,
          user: {
            userId: socket.user.id,
            username: socket.user.username,
            avatar: socket.user.avatar
          }
        });

        socket.emit('joined_room', { room });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Leave room
    socket.on('leave_room', async (data) => {
      try {
        const { roomId } = data;
        await roomService.leaveRoom(roomId, socket.user.id);
        
        socket.leave(roomId);
        
        if (userRooms.has(socket.user.id)) {
          userRooms.get(socket.user.id).delete(roomId);
        }

        socket.to(roomId).emit('user_left_room', {
          roomId,
          userId: socket.user.id,
          username: socket.user.username
        });

        socket.emit('left_room', { roomId });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Send message
    socket.on('send_message', async (data) => {
      try {
        const messageData = {
          content: data.content,
          senderId: socket.user.id,
          senderUsername: socket.user.username,
          roomId: data.roomId,
          type: data.type || 'text',
          replyTo: data.replyTo
        };

        const message = await chatService.sendMessage(messageData);

        io.to(data.roomId).emit('new_message', message);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Edit message
    socket.on('edit_message', async (data) => {
      try {
        const message = await chatService.editMessage(
          data.messageId, 
          socket.user.id, 
          data.content
        );
        io.to(message.roomId).emit('message_edited', message);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Delete message
    socket.on('delete_message', async (data) => {
      try {
        const messageId = await chatService.deleteMessage(
          data.messageId, 
          socket.user.id
        );
        io.to(data.roomId).emit('message_deleted', { messageId });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Typing indicators
    socket.on('typing_start', (data) => {
      socket.to(data.roomId).emit('user_typing', {
        userId: socket.user.id,
        username: socket.user.username,
        roomId: data.roomId
      });
    });

    socket.on('typing_stop', (data) => {
      socket.to(data.roomId).emit('user_stopped_typing', {
        userId: socket.user.id,
        roomId: data.roomId
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.username} (${socket.id})`);
      activeUsers.delete(socket.user.id);
      userRooms.delete(socket.user.id);
      socket.broadcast.emit('user_offline', {
        userId: socket.user.id,
        username: socket.user.username
      });
    });
  });
};