const { validationResult } = require('express-validator');
const authService = require('./authController');

class AuthController {
  // Register
  async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const result = await authService.register(req.body);
      res.status(201).json({
        message: 'User registered successfully',
        ...result
      });
    } catch (error) {
      res.status(400).json({
        message: error.message
      });
    }
  }

  // Login
  async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { email, password } = req.body;
      const result = await authService.login(email, password);
      
      res.json({
        message: 'Login successful',
        ...result
      });
    } catch (error) {
      res.status(401).json({
        message: error.message
      });
    }
  }

  // Logout
  async logout(req, res) {
    try {
      await authService.logout(req.user.id);
      res.json({ message: 'Logout successful' });
    } catch (error) {
      res.status(500).json({
        message: 'Logout failed',
        error: error.message
      });
    }
  }

  // Verify token
  async verifyToken(req, res) {
    try {
      const { token } = req.body;
      const user = await authService.verifyToken(token);
      res.json({
        valid: true,
        user
      });
    } catch (error) {
      res.status(401).json({
        valid: false,
        message: error.message
      });
    }
  }

  // Get current user
  async getCurrentUser(req, res) {
    try {
      res.json({
        user: req.user
      });
    } catch (error) {
      res.status(500).json({
        message: 'Failed to get user data',
        error: error.message
      });
    }
  }
}

module.exports = new AuthController();