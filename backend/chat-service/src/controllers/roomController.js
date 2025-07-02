const roomService = require('../services/roomService');

class RoomController {
  // Create room
  async createRoom(req, res) {
    try {
      const room = await roomService.createRoom(
        req.body, 
        req.user.id, 
        req.user.username
      );
      
      res.status(201).json({
        message: 'Room created successfully',
        room
      });
    } catch (error) {
      res.status(400).json({
        message: error.message
      });
    }
  }

  // Get public rooms
  async getPublicRooms(req, res) {
    try {
      const rooms = await roomService.getPublicRooms();
      res.json({ rooms });
    } catch (error) {
      res.status(500).json({
        message: 'Failed to fetch rooms',
        error: error.message
      });
    }
  }

  // Get user rooms
  async getUserRooms(req, res) {
    try {
      const rooms = await roomService.getUserRooms(req.user.id);
      res.json({ rooms });
    } catch (error) {
      res.status(500).json({
        message: 'Failed to fetch user rooms',
        error: error.message
      });
    }
  }

  // Join room
  async joinRoom(req, res) {
    try {
      const { roomId } = req.params;
      const room = await roomService.joinRoom(
        roomId, 
        req.user.id, 
        req.user.username
      );
      
      res.json({
        message: 'Joined room successfully',
        room
      });
    } catch (error) {
      res.status(400).json({
        message: error.message
      });
    }
  }

  // Leave room
  async leaveRoom(req, res) {
    try {
      const { roomId } = req.params;
      await roomService.leaveRoom(roomId, req.user.id);
      
      res.json({
        message: 'Left room successfully'
      });
    } catch (error) {
      res.status(400).json({
        message: error.message
      });
    }
  }

  // Get room details
  async getRoomDetails(req, res) {
    try {
      const { roomId } = req.params;
      const room = await roomService.getRoomById(roomId);
      
      res.json({ room });
    } catch (error) {
      res.status(404).json({
        message: error.message
      });
    }
  }
}

module.exports = new RoomController();
