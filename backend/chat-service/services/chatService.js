const Room = require('../models/Room');
const Message = require('../models/Message');
const axios = require('axios');

class ChatService {
  async createRoom(roomData, creatorId) {
    const { roomname, members } = roomData;
    
    // Validate members
    if (!members || members.length === 0) {
      throw new Error('Room must have at least one member');
    }
    
    // Add creator to members if not already included
    const memberIds = members.map(m => m.userId || m);
    if (!memberIds.includes(creatorId)) {
      // Get creator info from auth service
      try {
        const authResponse = await axios.get(`http://localhost:3001/api/auth/profile/${creatorId}`);
        const creator = authResponse.data.data;
        members.push({
          userId: creatorId,
          username: creator.username
        });
      } catch (error) {
        throw new Error('Failed to get creator information');
      }
    }
    
    const room = new Room({
      name: roomname,
      type: 'group',
      members: members.map(member => ({
        userId: member.userId || member,
        username: member.username
      })),
      createdBy: creatorId
    });
    
    await room.save();
    return room;
  }
  
  async createDirectMessage(senderId, receiverId, senderUsername, receiverUsername) {
    // Handle self-messaging specifically
    if (senderId === receiverId) {
      // Check if self-messaging room already exists
      const existingSelfRoom = await Room.findOne({
        type: 'direct',
        $and: [
          { 'members.userId': senderId },
          { 'members': { $size: 1 } } // Only one member (self)
        ]
      });
      
      if (existingSelfRoom) {
        return existingSelfRoom;
      }
      
      // Create new self-message room
      const selfRoom = new Room({
        name: `${senderUsername} & ${senderUsername}`,
        type: 'direct',
        members: [
          { userId: senderId, username: senderUsername }
        ],
        createdBy: senderId
      });
      
      await selfRoom.save();
      return selfRoom;
    }
    
    // For regular direct messages between two users
    // Check if direct message room already exists
    // Use $all to ensure both users are in the members array
    const existingRoom = await Room.findOne({
      type: 'direct',
      'members.userId': { $all: [senderId, receiverId] }
    });
    
    if (existingRoom) {
      return existingRoom;
    }
    
    // Create new direct message room
    const room = new Room({
      name: `${senderUsername} & ${receiverUsername}`,
      type: 'direct',
      members: [
        { userId: senderId, username: senderUsername },
        { userId: receiverId, username: receiverUsername }
      ],
      createdBy: senderId
    });
    
    await room.save();
    return room;
  }
  
  async getUserRooms(userId) {
    const rooms = await Room.find({
      'members.userId': userId
    }).sort({ updatedAt: -1 });
    
    return rooms;
  }
  
  async sendMessage(messageData) {
    const { roomId, sender, content, messageType = 'text' } = messageData;
    
    // Verify room exists and user is member
    const room = await Room.findById(roomId);
    if (!room) {
      throw new Error('Room not found');
    }
    
    const isMember = room.members.some(member => 
      member.userId.toString() === sender.userId.toString()
    );
    
    if (!isMember) {
      throw new Error('User is not a member of this room');
    }
    
    // Create message
    const message = new Message({
      roomId,
      sender,
      content,
      messageType,
      readBy: [{ userId: sender.userId }] // Mark as read by sender
    });
    
    await message.save();
    
    // Update room's last message
    room.lastMessage = {
      content,
      sender: sender.username,
      timestamp: message.createdAt
    };
    room.updatedAt = new Date();
    await room.save();
    
    return message;
  }
  
  async getRoomMessages(roomId, page = 1, limit = 50) {
    const messages = await Message.find({
      roomId,
      deleted: false
    })
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
    
    return messages.reverse(); // Return in ascending order
  }
  
  async markMessageAsRead(messageId, userId) {
    const message = await Message.findById(messageId);
    if (!message) {
      throw new Error('Message not found');
    }
    
    // Check if already read
    const alreadyRead = message.readBy.some(read => 
      read.userId.toString() === userId.toString()
    );
    
    if (!alreadyRead) {
      message.readBy.push({ userId });
      await message.save();
    }
    
    return message;
  }
  
  async markRoomMessagesAsRead(roomId, userId) {
    await Message.updateMany(
      {
        roomId,
        'readBy.userId': { $ne: userId }
      },
      {
        $push: { readBy: { userId } }
      }
    );
  }
  
  async deleteMessage(messageId, userId) {
    const message = await Message.findById(messageId);
    if (!message) {
      throw new Error('Message not found');
    }
    
    if (message.sender.userId.toString() !== userId.toString()) {
      throw new Error('You can only delete your own messages');
    }
    
    message.deleted = true;
    message.deletedAt = new Date();
    await message.save();
    
    return message;
  }
  
  async editMessage(messageId, newContent, userId) {
    const message = await Message.findById(messageId);
    if (!message) {
      throw new Error('Message not found');
    }
    
    if (message.sender.userId.toString() !== userId.toString()) {
      throw new Error('You can only edit your own messages');
    }
    
    message.content = newContent;
    message.edited = true;
    message.editedAt = new Date();
    await message.save();
    
    return message;
  }

  async searchRooms(term, userId) {
    // Search for rooms where the user is a member and the name contains the search term
    const rooms = await Room.find({
      'members.userId': userId,
      name: { $regex: term, $options: 'i' }
    });
    
    return rooms;
  }
}

module.exports = new ChatService(); 