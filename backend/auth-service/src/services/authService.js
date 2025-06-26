const User = require('../models/User');
const jwt = require('jsonwebtoken');

class AuthService {
  generateToken(userId) {
    return jwt.sign(
      { id: userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  // Register user
  async register(userData) {
    const { username, email, password } = userData;

    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      throw new Error('User already exists with this email or username');
    }

    const user = new User({
      username,
      email,
      password
    });

    await user.save();

    const token = this.generateToken(user._id);

    return {
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        isOnline: user.isOnline
      }
    };
  }

  // Login user
  async login(email, password) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    const token = this.generateToken(user._id);

    return {
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar, // Will be a link. In S3 or self host object bucket
        isOnline: user.isOnline
      }
    };
  }

  async logout(userId) {
    try {
      const user = await User.findById(userId);
      if (user) {
        user.isOnline = false;
        user.lastSeen = new Date();
        await user.save();
      }
    } catch (error) {
      throw new Error('Error while logging out: ' + error.message);
    }
  }


  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}

module.exports = new AuthService();