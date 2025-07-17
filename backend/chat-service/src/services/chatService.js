const Message = require('../models/Message');
const Room = require('../models/Room');

class ChatService {
  // Send a message
  async sendMessage(messageData) {
    const { content, senderId, senderUsername, roomId, type = 'text', replyTo } = messageData;
    const room = await Room.findById(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    const isMember = room.members.some(member => member.userId === senderId);
    if (!isMember && room.name !== 'Global') {
      throw new Error('User is not a member of this room');
    }

    const message = new Message({
      content,
      senderId,
      senderUsername,
      roomId,
      type,
      replyTo
    });

    await message.save();
    await room.updateActivity();

    if (replyTo) {
      await message.populate('replyTo', 'content senderUsername createdAt');
    }

    return message;
  }

  // Get messages for a room
  async getRoomMessages(roomId, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    
    const messages = await Message.find({ roomId })
      .populate('replyTo', 'content senderUsername createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return messages.reverse(); // Return in chronological order
  }

  // Edit a message
  async editMessage(messageId, senderId, newContent) {
    const message = await Message.findById(messageId);
    
    if (!message) {
      throw new Error('Message not found');
    }

    if (message.senderId !== senderId) {
      throw new Error('Unauthorized to edit this message');
    }

    message.content = newContent;
    message.edited = true;
    message.editedAt = new Date();
    
    await message.save();
    return message;
  }

  // Delete a message
  async deleteMessage(messageId, senderId) {
    const message = await Message.findById(messageId);
    
    if (!message) {
      throw new Error('Message not found');
    }

    if (message.senderId !== senderId) {
      throw new Error('Unauthorized to delete this message');
    }

    await Message.findByIdAndDelete(messageId);
    return { messageId, roomId: message.roomId.toString() };
  }

  // Get recent messages for multiple rooms
  async getRecentMessages(roomIds, limit = 10) {
    return await Message.find({ 
      roomId: { $in: roomIds } 
    })
      .populate('replyTo', 'content senderUsername createdAt')
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  // Search messages
  async searchMessages(roomId, query, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    const messages = await Message.find({
      roomId,
      content: { $regex: query, $options: 'i' }
    })
      .populate('replyTo', 'content senderUsername createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return messages;
  }
}

module.exports = new ChatService();