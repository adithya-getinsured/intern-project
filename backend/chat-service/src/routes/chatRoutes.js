const express = require('express');
const { body } = require('express-validator');
const chatController = require('../controllers/chatController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// All chat routes require authentication
router.use(authMiddleware);

// Validation
const messageValidation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message content must be between 1 and 1000 characters'),
  body('roomId')
    .notEmpty()
    .withMessage('Room ID is required')
];

// Routes
router.post('/messages', messageValidation, chatController.sendMessage);
router.get('/rooms/:roomId/messages', chatController.getRoomMessages);
router.put('/messages/:messageId', chatController.editMessage);
router.delete('/messages/:messageId', chatController.deleteMessage);
router.get('/rooms/:roomId/search', chatController.searchMessages);

module.exports = router;
