const chatService = require('../services/chatService');
const axios = require('axios');

class ChatController {
  async createRoom(req, res) {
    try {
      const { roomname, members } = req.body;
      const creatorId = req.user.userId;
      
      if (!roomname || !members) {
        return res.status(400).json({
          success: false,
          message: 'Room name and members are required'
        });
      }
      
      const room = await chatService.createRoom({ roomname, members }, creatorId);
      
      res.status(201).json({
        success: true,
        message: 'Room created successfully',
        data: room
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
  
  async createDirectMessage(req, res) {
    try {
      console.log('Direct message request body:', req.body);
      console.log('User from request:', req.user);
      
      const { receiverId, receiverUsername } = req.body;
      
      if (!receiverId || !receiverUsername) {
        return res.status(400).json({
          success: false,
          message: 'Receiver ID and username are required'
        });
      }
      
      const senderId = req.user.userId;
      const token = req.headers.authorization; // Get auth token from original request
      
      // Get sender info from auth service
      console.log('Fetching sender profile from auth service for ID:', senderId);
      const authResponse = await axios.get(`${process.env.AUTH_SERVICE_URL}/api/auth/profile/${senderId}`, {
        headers: {
          Authorization: token // Pass the token to auth service
        }
      });
      console.log('Auth service response:', authResponse.data);
      const sender = authResponse.data.data;
      
      const room = await chatService.createDirectMessage(
        senderId, 
        receiverId, 
        sender.username, 
        receiverUsername
      );
      
      res.status(201).json({
        success: true,
        message: 'Direct message room created/found',
        data: room
      });
    } catch (error) {
      console.error('Error in createDirectMessage:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
  
  async getMyRooms(req, res) {
    try {
      const userId = req.user.userId;
      const rooms = await chatService.getUserRooms(userId);
      
      res.json({
        success: true,
        data: rooms
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  async getRoomMessages(req, res) {
    try {
      const { roomId } = req.params;
      const { page = 1, limit = 50 } = req.query;
      
      const messages = await chatService.getRoomMessages(roomId, page, limit);
      
      res.json({
        success: true,
        data: messages
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  async markRoomAsRead(req, res) {
    try {
      const { roomId } = req.params;
      const userId = req.user.userId;
      
      await chatService.markRoomMessagesAsRead(roomId, userId);
      
      res.json({
        success: true,
        message: 'Room marked as read'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async searchRooms(req, res) {
    try {
      const { term } = req.query;
      const userId = req.user.userId;
      
      if (!term) {
        return res.json({
          success: true,
          data: []
        });
      }
      
      const rooms = await chatService.searchRooms(term, userId);
      
      res.json({
        success: true,
        data: rooms
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new ChatController(); 