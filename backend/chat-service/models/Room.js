const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['group', 'direct'],
    default: 'group'
  },
  members: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    username: {
      type: String,
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  lastMessage: {
    content: String,
    sender: String,
    timestamp: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
roomSchema.index({ 'members.userId': 1 });
roomSchema.index({ type: 1 });

module.exports = mongoose.model('Room', roomSchema); 