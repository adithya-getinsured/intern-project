const express = require('express');
const { body } = require('express-validator');
const roomController = require('../controllers/roomController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// All room routes require authentication
router.use(authMiddleware);

// Validation
const roomValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Room name must be between 1 and 50 characters'),
  body('description')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Description must be less than 200 characters')
];

// Routes
router.post('/', roomValidation, roomController.createRoom);
router.get('/public', roomController.getPublicRooms);
router.get('/my-rooms', roomController.getUserRooms);
router.post('/:roomId/join', roomController.joinRoom);
router.post('/:roomId/leave', roomController.leaveRoom);
router.get('/:roomId', roomController.getRoomDetails);

module.exports = router;