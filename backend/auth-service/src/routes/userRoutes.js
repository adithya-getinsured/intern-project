const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Add auth middleware to user routes
router.use(authMiddleware);

// Routes
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.get('/all', userController.getAllUsers);
router.put('/status', userController.updateOnlineStatus);

module.exports = router;