const authService = require('../services/authService');

class AuthController {
  async register(req, res) {
    try {
      const { username, email, password, avatar } = req.body;
      
      // Validation
      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username, email, and password are required'
        });
      }
      
      if (avatar && !['01.png', '02.png', '03.png', '04.png', '05.png'].includes(avatar)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid avatar selection'
        });
      }
      
      const result = await authService.register({ username, email, password, avatar });
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
  
  async login(req, res) {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }
      
      const result = await authService.login(email, password);
      
      res.json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error.message
      });
    }
  }
  
  async getUsers(req, res) {
    try {
      const users = await authService.getAllUsers();
      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  async getProfile(req, res) {
    try {
      const { userId } = req.params;
      const user = await authService.getUserProfile(userId);
      
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }
  
  async logout(req, res) {
    try {
      await authService.updateUserOnlineStatus(req.user.userId, false);
      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  async updateOnlineStatus(req, res) {
    try {
      const { userId } = req.params;
      const { isOnline } = req.body;
      
      if (isOnline === undefined) {
        return res.status(400).json({
          success: false,
          message: 'isOnline status is required'
        });
      }
      
      // Allow only if it's a service request or the same user
      if (!req.isServiceRequest && req.user.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized to update this user\'s status'
        });
      }
      
      await authService.updateUserOnlineStatus(userId, isOnline);
      
      res.json({
        success: true,
        message: `User ${isOnline ? 'online' : 'offline'} status updated`,
        data: { userId, isOnline }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async validateToken(req, res) {
    try {
      // If middleware passed, token is valid and user object is available in req.user
      const user = await authService.getUserProfile(req.user.userId);
      
      res.json({
        success: true,
        message: 'Token is valid',
        data: {
          userId: user.userId,
          username: user.username,
          email: user.email,
          avatar: user.avatar
        }
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  }
}

module.exports = new AuthController(); 