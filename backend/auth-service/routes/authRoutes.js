const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authMiddleware, authController.logout);
router.get('/users', authMiddleware, authController.getUsers);
router.get('/profile/:userId', authMiddleware, authController.getProfile);
router.post('/users/:userId/online', authMiddleware, authController.updateOnlineStatus);
router.get('/validate-token', authMiddleware, authController.validateToken);

module.exports = router; 