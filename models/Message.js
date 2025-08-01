const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: [true, 'Room ID is required']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  username: {
    type: String,
    required: [true, 'Username is required']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  type: {
    type: String,
    enum: ['chat', 'guess', 'system'],
    default: 'chat'
  },
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    default: null
  },
  roundNumber: {
    type: Number,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  isCorrectGuess: {
    type: Boolean,
    default: false
  },
  points: {
    type: Number,
    default: 0
  },
  timeTaken: {
    type: Number, // in seconds
    default: null
  }
}, {
  timestamps: true
});

// Instance method to mark as correct guess
messageSchema.methods.markAsCorrectGuess = function(points, timeTaken) {
  this.isCorrectGuess = true;
  this.points = points;
  this.timeTaken = timeTaken;
  this.type = 'guess';
  return this.save();
};

// Static method to find messages by room
messageSchema.statics.findByRoom = function(roomId, limit = 100) {
  return this.find({ roomId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('userId', 'username avatar');
};

// Static method to find messages by game
messageSchema.statics.findByGame = function(gameId, limit = 200) {
  return this.find({ gameId })
    .sort({ timestamp: 1 })
    .limit(limit)
    .populate('userId', 'username avatar');
};

// Static method to find messages by round
messageSchema.statics.findByRound = function(gameId, roundNumber, limit = 50) {
  return this.find({ gameId, roundNumber })
    .sort({ timestamp: 1 })
    .limit(limit)
    .populate('userId', 'username avatar');
};

// Static method to find correct guesses by game
messageSchema.statics.findCorrectGuessesByGame = function(gameId) {
  return this.find({ 
    gameId, 
    isCorrectGuess: true 
  })
  .sort({ timestamp: 1 })
  .populate('userId', 'username avatar');
};

// Static method to find messages by user
messageSchema.statics.findByUser = function(userId, limit = 50) {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('roomId', 'roomCode')
    .populate('gameId', 'roomId');
};

// Static method to get message statistics
messageSchema.statics.getMessageStats = function(roomId, gameId = null) {
  const match = { roomId };
  if (gameId) match.gameId = gameId;
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalMessages: { $sum: 1 },
        totalGuesses: { 
          $sum: { $cond: [{ $eq: ['$type', 'guess'] }, 1, 0] }
        },
        correctGuesses: { 
          $sum: { $cond: ['$isCorrectGuess', 1, 0] }
        },
        totalPoints: { $sum: '$points' },
        averageGuessTime: { 
          $avg: { 
            $cond: [{ $ne: ['$timeTaken', null] }, '$timeTaken', null] 
          }
        }
      }
    }
  ]);
};

// Indexes for better query performance
messageSchema.index({ roomId: 1, timestamp: -1 });
messageSchema.index({ gameId: 1, timestamp: 1 });
messageSchema.index({ userId: 1, timestamp: -1 });
messageSchema.index({ type: 1 });
messageSchema.index({ isCorrectGuess: 1 });

module.exports = mongoose.model('Message', messageSchema); 