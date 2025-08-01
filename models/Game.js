const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: [true, 'Room ID is required']
  },
  rounds: [{
    roundNumber: {
      type: Number,
      required: true
    },
    word: {
      type: String,
      required: true
    },
    drawerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    drawerUsername: String,
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      default: null
    },
    duration: {
      type: Number, // in seconds
      default: null
    },
    correctGuesses: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      username: String,
      guessTime: Date,
      timeTaken: Number, // in seconds
      points: Number
    }],
    drawings: [{
      drawingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Drawing'
      },
      strokes: [{
        x: Number,
        y: Number,
        pressure: Number,
        color: String,
        width: Number,
        timestamp: Number
      }]
    }],
    messages: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      username: String,
      message: String,
      type: {
        type: String,
        enum: ['chat', 'guess', 'system'],
        default: 'chat'
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  gameStartedAt: {
    type: Date,
    default: Date.now
  },
  gameEndedAt: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['waiting', 'playing', 'completed', 'cancelled'],
    default: 'waiting'
  },
  settings: {
    roundTime: {
      type: Number,
      default: 60
    },
    roundsPerGame: {
      type: Number,
      default: 5
    },
    wordDifficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    }
  },
  finalScores: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String,
    totalScore: {
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
    },
    averageGuessTime: {
      type: Number,
      default: 0
    },
    rank: {
      type: Number,
      default: 0
    }
  }],
  enterpriseTag: {
    type: String,
    required: [true, 'Enterprise tag is required for game tracking'],
    trim: true
  }
}, {
  timestamps: true
});

// Instance method to add a new round
gameSchema.methods.addRound = function(roundData) {
  this.rounds.push({
    roundNumber: this.rounds.length + 1,
    word: roundData.word,
    drawerId: roundData.drawerId,
    drawerUsername: roundData.drawerUsername,
    startTime: new Date(),
    correctGuesses: [],
    drawings: [],
    messages: []
  });
  return this.save();
};

// Instance method to end current round
gameSchema.methods.endCurrentRound = function() {
  const currentRound = this.rounds[this.rounds.length - 1];
  if (currentRound && !currentRound.endTime) {
    currentRound.endTime = new Date();
    currentRound.duration = Math.floor((currentRound.endTime - currentRound.startTime) / 1000);
  }
  return this.save();
};

// Instance method to add correct guess to current round
gameSchema.methods.addCorrectGuess = function(userId, username, points, timeTaken) {
  const currentRound = this.rounds[this.rounds.length - 1];
  if (currentRound) {
    currentRound.correctGuesses.push({
      userId,
      username,
      guessTime: new Date(),
      timeTaken,
      points
    });
  }
  return this.save();
};

// Instance method to add message to current round
gameSchema.methods.addMessage = function(userId, username, message, type = 'chat') {
  const currentRound = this.rounds[this.rounds.length - 1];
  if (currentRound) {
    currentRound.messages.push({
      userId,
      username,
      message,
      type,
      timestamp: new Date()
    });
  }
  return this.save();
};

// Instance method to end game
gameSchema.methods.endGame = function(finalScores) {
  this.gameEndedAt = new Date();
  this.status = 'completed';
  this.finalScores = finalScores;
  return this.save();
};

// Instance method to calculate game duration
gameSchema.methods.getGameDuration = function() {
  if (this.gameEndedAt) {
    return Math.floor((this.gameEndedAt - this.gameStartedAt) / 1000);
  }
  return Math.floor((new Date() - this.gameStartedAt) / 1000);
};

// Instance method to get current round
gameSchema.methods.getCurrentRound = function() {
  return this.rounds[this.rounds.length - 1];
};

// Instance method to check if game is finished
gameSchema.methods.isFinished = function() {
  return this.rounds.length >= this.settings.roundsPerGame || this.status === 'completed';
};

// Static method to find active games by room
gameSchema.statics.findActiveByRoom = function(roomId) {
  return this.findOne({
    roomId,
    status: { $in: ['waiting', 'playing'] }
  });
};

// Static method to find completed games by enterprise
gameSchema.statics.findCompletedByEnterprise = function(enterpriseTag, limit = 50) {
  return this.find({
    enterpriseTag,
    status: 'completed'
  })
  .sort({ gameEndedAt: -1 })
  .limit(limit)
  .populate('roomId', 'roomCode')
  .populate('finalScores.userId', 'username avatar');
};

// Indexes for better query performance
gameSchema.index({ roomId: 1 });
gameSchema.index({ enterpriseTag: 1 });
gameSchema.index({ status: 1 });
gameSchema.index({ gameStartedAt: -1 });
gameSchema.index({ gameEndedAt: -1 });

module.exports = mongoose.model('Game', gameSchema); 