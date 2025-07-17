const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/create-room', authMiddleware, chatController.createRoom);
router.post('/direct-message', authMiddleware, chatController.createDirectMessage);
router.get('/my-rooms', authMiddleware, chatController.getMyRooms);
router.get('/room/:roomId/messages', authMiddleware, chatController.getRoomMessages);
router.post('/room/:roomId/read', authMiddleware, chatController.markRoomAsRead);
router.get('/search-rooms', authMiddleware, chatController.searchRooms);

module.exports = router; 