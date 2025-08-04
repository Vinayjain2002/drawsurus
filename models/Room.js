const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomCode: {
    type: String,
    required: [true, 'Room code is required'],
    unique: true,
    trim: true,
    uppercase: true,
    minlength: [4, 'Room code must be at least 4 characters'],
    maxlength: [10, 'Room code cannot exceed 10 characters']
  },
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Host ID is required']
  },
  maxPlayers: {
    type: Number,
    default: 6,
    min: [2, 'Minimum 2 players required'],
    max: [12, 'Maximum 12 players allowed']
  },
  players: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String,
    isHost: {
      type: Boolean,
      default: false
    },
    isOnline: {
      type: Boolean,
      default: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    score: {
      type: Number,
      default: 0
    },
    correctGuesses: {
      type: Number,
      default: 0
    },
    drawings: {
      type: Number,
      default: 0
    }
  }],
  currentGameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    default: null
  },
  status: {
    type: String,
    enum: ['waiting', 'playing', 'completed'],
    default: 'waiting'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  enterpriseTag: {
    type: String,
    required: [true, 'Enterprise tag is required for room tracking'],
    trim: true
  },
  settings: {
    roundTime: {
      type: Number,
      default: 60, // seconds
      min: [10, 'Minimum round time is 10 seconds'],
      max: [120, 'Maximum round time is 120 seconds']
    },
    roundsPerGame: {
      type: Number,
      default: 5,
      min: [3, 'Minimum 3 rounds per game'],
      max: [10, 'Maximum 10 rounds per game']
    },
    wordDifficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    allowCustomWords: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Instance method to add player
roomSchema.methods.addPlayer = function(userId, username, isHost = false) {
  const existingPlayer = this.players.find(p => p.userId.toString() === userId.toString());
  
  if (existingPlayer) {
    existingPlayer.isOnline = true;
    existingPlayer.joinedAt = new Date();
  } else {
    this.players.push({
      userId,
      username,
      isHost,
      isOnline: true,
      joinedAt: new Date(),
      score: 0,
      correctGuesses: 0,
      drawings: 0
    });
  }
  
  return this.save();
};

// Instance method to remove player
roomSchema.methods.removePlayer = function(userId) {
  this.players = this.players.filter(p => p.userId.toString() !== userId.toString());
  return this.save();
};

// Instance method to update player score
roomSchema.methods.updatePlayerScore = function(userId, score, correctGuesses = 0, drawings = 0) {
  const player = this.players.find(p => p.userId.toString() === userId.toString());
  if (player) {
    player.score += score;
    player.correctGuesses += correctGuesses;
    player.drawings += drawings;
  }
  return this.save();
};

// Instance method to check if room is full
roomSchema.methods.isFull = function() {
  return this.players.length >= this.maxPlayers;
};

// Instance method to get online players count
roomSchema.methods.getOnlinePlayersCount = function() {
  return this.players.filter(p => p.isOnline).length;
};

// Static method to generate room code
roomSchema.statics.generateRoomCode = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Static method to find by room code
roomSchema.statics.findByRoomCode = function(roomCode) {
  return this.findOne({ roomCode: roomCode.toUpperCase() });
};

// Static method to find active rooms by enterprise
roomSchema.statics.findActiveByEnterprise = function(enterpriseTag) {
  return this.find({
    enterpriseTag,
    status: { $in: ['waiting', 'playing'] }
  }).populate('hostId', 'username avatar');
};

// Indexes for better query performance
roomSchema.index({ roomCode: 1 });
roomSchema.index({ hostId: 1 });
roomSchema.index({ enterpriseTag: 1 });
roomSchema.index({ status: 1 });
roomSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Room', roomSchema); 