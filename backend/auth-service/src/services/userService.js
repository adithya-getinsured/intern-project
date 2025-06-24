const User = require('../models/User');

class UserService {
  async getUserProfile(userId) {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async updateProfile(userId, updateData) {
    const allowedUpdates = ['username', 'avatar'];
    const updates = {};

    Object.keys(updateData).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = updateData[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async getAllUsers() {
    return await User.find({})
      .select('username email avatar isOnline lastSeen')
      .sort({ username: 1 });
  }

  async updateOnlineStatus(userId, isOnline) {
    const user = await User.findById(userId);
    if (user) {
      user.isOnline = isOnline;
      user.lastSeen = new Date();
      await user.save();
    }
    return user;
  }
}

module.exports = new UserService();