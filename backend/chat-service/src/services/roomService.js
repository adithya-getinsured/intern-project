const Room = require('../models/Room');

class RoomService {
  // Create a new room
  async createRoom(roomData, userId, username) {
    const existingRoom = await Room.findOne({ name: roomData.name });
    if (existingRoom) {
      throw new Error('Room already exists');
    }

    const room = new Room({
      ...roomData,
      createdBy: userId,
      members: [{
        userId,
        username,
        joinedAt: new Date()
      }]
    });

    await room.save();
    return room;
  }

  // Get all public rooms
  async getPublicRooms() {
    return await Room.find({ 
      type: 'public', 
      isActive: true 
    }).sort({ lastActivity: -1 });
  }

  // Get user's rooms
  async getUserRooms(userId) {
    return await Room.find({
      'createdBy': userId
    }).sort({ lastActivity: -1 });
  }

  // Join a room
  async joinRoom(roomId, userId, username) {
    const room = await Room.findById(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    if (!room.isActive) {
      throw new Error('Room is not active');
    }

    const isMember = room.members.some(member => member.userId === userId);
    if (isMember) {
      return room;
    }

    room.members.push({
      userId,
      username,
      joinedAt: new Date()
    });

    await room.updateActivity();
    return room;
  }

  // Leave a room
  async leaveRoom(roomId, userId) {
    const room = await Room.findById(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    room.members = room.members.filter(member => member.userId !== userId);
    if (room.members.length === 0 && room.name !== 'Global') {
      room.isActive = false;
    }

    await room.save();
    return room;
  }

  // Get room by ID
  async getRoomById(roomId) {
    const room = await Room.findById(roomId);
    if (!room) {
      throw new Error('Room not found');
    }
    return room;
  }

  // Create global room if it doesn't exist
  async ensureGlobalRoom() {
    let globalRoom = await Room.findOne({ name: 'Global' });
    if (!globalRoom) {
      globalRoom = new Room({
        name: 'Global',
        description: 'Global chat room for all users',
        type: 'public',
        createdBy: 'system',
        members: []
      });
      await globalRoom.save();
    }
    return globalRoom;
  }
}

module.exports = new RoomService();