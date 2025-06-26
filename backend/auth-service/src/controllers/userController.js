const userService = require('../services/userService');

class UserController {
  // Get user profile
  async getProfile(req, res) {
    try {
      const user = await userService.getUserProfile(req.user.id);
      res.json({ user });
    } catch (error) {
      res.status(404).json({
        message: error.message
      });
    }
  }

  // Update user profile
  async updateProfile(req, res) {
    try {
      const user = await userService.updateProfile(req.user.id, req.body);
      res.json({
        message: 'Profile updated successfully',
        user
      });
    } catch (error) {
      res.status(400).json({
        message: error.message
      });
    }
  }

  // Get all users
  async getAllUsers(req, res) {
    try {
      const users = await userService.getAllUsers();
      res.json({ users });
    } catch (error) {
      res.status(500).json({
        message: 'Failed to fetch users',
        error: error.message
      });
    }
  }

  // Update online status
  async updateOnlineStatus(req, res) {
    try {
      const { isOnline } = req.body;
      const user = await userService.updateOnlineStatus(req.user.id, isOnline);
      res.json({
        message: 'Status updated successfully',
        user
      });
    } catch (error) {
      res.status(500).json({
        message: 'Failed to update status',
        error: error.message
      });
    }
  }
}

module.exports = new UserController();
