const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Room name is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Room name must be less than 50 characters']
  },
  description: {
    type: String,
    maxlength: [200, 'Description must be less than 200 characters']
  },
  type: {
    type: String,
    enum: ['public', 'private'],
    default: 'public'
  },
  createdBy: {
    type: String, // User ID from auth service
    required: true
  },
  members: [{
    userId: String,
    username: String,
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Last room activity when accessed
roomSchema.methods.updateActivity = function() {
  this.lastActivity = new Date();
  return this.save();
};

module.exports = mongoose.model('Room', roomSchema);