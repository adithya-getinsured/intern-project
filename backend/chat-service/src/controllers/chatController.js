const chatService = require('../services/chatService');

class ChatController {
  // Send message
  async sendMessage(req, res) {
    try {
      const { content, roomId, type, replyTo } = req.body;
      
      const messageData = {
        content,
        senderId: req.user.id,
        senderUsername: req.user.username,
        roomId,
        type,
        replyTo
      };

      const message = await chatService.sendMessage(messageData);
      
      res.status(201).json({
        message: 'Message sent successfully',
        data: message
      });
    } catch (error) {
      res.status(400).json({
        message: error.message
      });
    }
  }

  // Get room messages
  async getRoomMessages(req, res) {
    try {
      const { roomId } = req.params;
      const { page = 1, limit = 50 } = req.query;
      
      const messages = await chatService.getRoomMessages(
        roomId, 
        parseInt(page), 
        parseInt(limit)
      );
      
      res.json({
        messages,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    } catch (error) {
      res.status(400).json({
        message: error.message
      });
    }
  }

  // Edit message
  async editMessage(req, res) {
    try {
      const { messageId } = req.params;
      const { content } = req.body;
      
      const message = await chatService.editMessage(
        messageId, 
        req.user.id, 
        content
      );
      
      res.json({
        message: 'Message updated successfully',
        data: message
      });
    } catch (error) {
      res.status(400).json({
        message: error.message
      });
    }
  }

  // Delete message
  async deleteMessage(req, res) {
    try {
      const { messageId } = req.params;
      
      await chatService.deleteMessage(messageId, req.user.id);
      
      res.json({
        message: 'Message deleted successfully'
      });
    } catch (error) {
      res.status(400).json({
        message: error.message
      });
    }
  }

  // Search messages
  async searchMessages(req, res) {
    try {
      const { roomId } = req.params;
      const { q: query, page = 1, limit = 20 } = req.query;
      
      if (!query) {
        return res.status(400).json({
          message: 'Search query is required'
        });
      }

      const messages = await chatService.searchMessages(
        roomId, 
        query, 
        parseInt(page), 
        parseInt(limit)
      );
      
      res.json({
        messages,
        query,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    } catch (error) {
      res.status(400).json({
        message: error.message
      });
    }
  }
}

module.exports = new ChatController();