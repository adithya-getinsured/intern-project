const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

class AuthService {
  async register(userData) {
    const { username, email, password, avatar = '01.png' } = userData;
    
    // Check if user exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      throw new Error('User already exists with this email or username');
    }
    
    // Create new user
    const user = new User({
      username,
      email,
      password,
      avatar
    });
    
    await user.save();
    
    // Generate token
    const token = generateToken({ 
      userId: user._id, 
      email: user.email 
    });
    
    return {
      token,
      userId: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar
    };
  }
  
  async login(email, password) {
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }
    
    // Update online status
    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();
    
    // Generate token
    const token = generateToken({ 
      userId: user._id, 
      email: user.email 
    });
    
    return {
      token,
      userId: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar
    };
  }
  
  async getAllUsers() {
    return await User.find({}, 'username email avatar isOnline lastSeen').sort({ username: 1 });
  }
  
  async getUserProfile(userId) {
    const user = await User.findById(userId, 'username email avatar isOnline lastSeen');
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }
  
  async updateUserOnlineStatus(userId, isOnline) {
    await User.findByIdAndUpdate(userId, { 
      isOnline, 
      lastSeen: new Date() 
    });
  }
}

module.exports = new AuthService(); 