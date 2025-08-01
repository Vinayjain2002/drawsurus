const mongoose = require('mongoose');

const userStatsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true
  },
  gamesPlayed: {
    type: Number,
    default: 0
  },
  gamesWon: {
    type: Number,
    default: 0
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  avgGuessSpeed: {
    type: Number,
    default: 0
  },
  correctGuesses: {
    type: Number,
    default: 0
  },
  drawnWords: {
    type: Number,
    default: 0
  },
  lastGamePlayedAt: {
    type: Date,
    default: null
  },
  enterpriseTag: {
    type: String,
    required: [true, 'Enterprise tag is required for leaderboards'],
    trim: true
  },
  // Detailed statistics
  statistics: {
    totalRoundsPlayed: {
      type: Number,
      default: 0
    },
    totalRoundsWon: {
      type: Number,
      default: 0
    },
    fastestGuess: {
      type: Number,
      default: null // in seconds
    },
    longestDrawing: {
      type: Number,
      default: null // in seconds
    },
    averageDrawingTime: {
      type: Number,
      default: 0
    },
    totalDrawingTime: {
      type: Number,
      default: 0
    },
    totalGuessTime: {
      type: Number,
      default: 0
    },
    streakDays: {
      type: Number,
      default: 0
    },
    currentStreak: {
      type: Number,
      default: 0
    },
    lastPlayedDate: {
      type: Date,
      default: null
    }
  },
  // Achievement tracking
  achievements: [{
    name: String,
    description: String,
    unlockedAt: {
      type: Date,
      default: Date.now
    },
    icon: String
  }],
  // Weekly/Monthly stats for leaderboards
  weeklyStats: {
    gamesPlayed: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    correctGuesses: { type: Number, default: 0 },
    drawings: { type: Number, default: 0 },
    weekStart: { type: Date, default: null }
  },
  monthlyStats: {
    gamesPlayed: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    correctGuesses: { type: Number, default: 0 },
    drawings: { type: Number, default: 0 },
    monthStart: { type: Date, default: null }
  }
}, {
  timestamps: true
});

// Instance method to update stats after a game
userStatsSchema.methods.updateGameStats = function(gameStats) {
  this.gamesPlayed += 1;
  this.totalPoints += gameStats.points || 0;
  this.correctGuesses += gameStats.correctGuesses || 0;
  this.drawnWords += gameStats.drawings || 0;
  this.lastGamePlayedAt = new Date();
  
  // Update win count
  if (gameStats.won) {
    this.gamesWon += 1;
  }
  
  // Update average guess speed
  if (gameStats.avgGuessTime) {
    const totalGuessTime = this.statistics.totalGuessTime + gameStats.avgGuessTime;
    const totalGuesses = this.correctGuesses;
    this.avgGuessSpeed = totalGuesses > 0 ? totalGuessTime / totalGuesses : 0;
    this.statistics.totalGuessTime = totalGuessTime;
  }
  
  // Update fastest guess
  if (gameStats.fastestGuess && (!this.statistics.fastestGuess || gameStats.fastestGuess < this.statistics.fastestGuess)) {
    this.statistics.fastestGuess = gameStats.fastestGuess;
  }
  
  // Update drawing statistics
  if (gameStats.drawingTime) {
    this.statistics.totalDrawingTime += gameStats.drawingTime;
    this.statistics.averageDrawingTime = this.statistics.totalDrawingTime / this.drawnWords;
    
    if (!this.statistics.longestDrawing || gameStats.drawingTime > this.statistics.longestDrawing) {
      this.statistics.longestDrawing = gameStats.drawingTime;
    }
  }
  
  // Update streak
  this.updateStreak();
  
  return this.save();
};

// Instance method to update streak
userStatsSchema.methods.updateStreak = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (!this.statistics.lastPlayedDate) {
    this.statistics.currentStreak = 1;
    this.statistics.lastPlayedDate = today;
  } else {
    const lastPlayed = new Date(this.statistics.lastPlayedDate);
    lastPlayed.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((today - lastPlayed) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      // Consecutive day
      this.statistics.currentStreak += 1;
    } else if (diffDays === 0) {
      // Same day, don't change streak
    } else {
      // Streak broken
      if (this.statistics.currentStreak > this.statistics.streakDays) {
        this.statistics.streakDays = this.statistics.currentStreak;
      }
      this.statistics.currentStreak = 1;
    }
    
    this.statistics.lastPlayedDate = today;
  }
};

// Instance method to add achievement
userStatsSchema.methods.addAchievement = function(achievement) {
  const existingAchievement = this.achievements.find(a => a.name === achievement.name);
  if (!existingAchievement) {
    this.achievements.push(achievement);
  }
  return this.save();
};

// Instance method to get win rate
userStatsSchema.methods.getWinRate = function() {
  return this.gamesPlayed > 0 ? (this.gamesWon / this.gamesPlayed) * 100 : 0;
};

// Instance method to get average points per game
userStatsSchema.methods.getAveragePoints = function() {
  return this.gamesPlayed > 0 ? this.totalPoints / this.gamesPlayed : 0;
};

// Static method to get leaderboard by enterprise
userStatsSchema.statics.getLeaderboard = function(enterpriseTag, limit = 50) {
  return this.find({ enterpriseTag })
    .sort({ totalPoints: -1, gamesWon: -1 })
    .limit(limit)
    .populate('userId', 'username avatar');
};

// Static method to get weekly leaderboard
userStatsSchema.statics.getWeeklyLeaderboard = function(enterpriseTag, limit = 50) {
  return this.find({ 
    enterpriseTag,
    'weeklyStats.weekStart': { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
  })
    .sort({ 'weeklyStats.points': -1 })
    .limit(limit)
    .populate('userId', 'username avatar');
};

// Static method to get monthly leaderboard
userStatsSchema.statics.getMonthlyLeaderboard = function(enterpriseTag, limit = 50) {
  return this.find({ 
    enterpriseTag,
    'monthlyStats.monthStart': { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
  })
    .sort({ 'monthlyStats.points': -1 })
    .limit(limit)
    .populate('userId', 'username avatar');
};

// Static method to reset weekly stats
userStatsSchema.statics.resetWeeklyStats = function() {
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  
  return this.updateMany({}, {
    $set: {
      'weeklyStats.gamesPlayed': 0,
      'weeklyStats.points': 0,
      'weeklyStats.correctGuesses': 0,
      'weeklyStats.drawings': 0,
      'weeklyStats.weekStart': weekStart
    }
  });
};

// Static method to reset monthly stats
userStatsSchema.statics.resetMonthlyStats = function() {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  
  return this.updateMany({}, {
    $set: {
      'monthlyStats.gamesPlayed': 0,
      'monthlyStats.points': 0,
      'monthlyStats.correctGuesses': 0,
      'monthlyStats.drawings': 0,
      'monthlyStats.monthStart': monthStart
    }
  });
};

// Indexes for better query performance
userStatsSchema.index({ userId: 1 });
userStatsSchema.index({ enterpriseTag: 1 });
userStatsSchema.index({ totalPoints: -1 });
userStatsSchema.index({ gamesWon: -1 });
userStatsSchema.index({ 'weeklyStats.points': -1 });
userStatsSchema.index({ 'monthlyStats.points': -1 });

module.exports = mongoose.model('UserStats', userStatsSchema); 