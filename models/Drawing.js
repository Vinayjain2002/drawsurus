const mongoose = require('mongoose');

const drawingSchema = new mongoose.Schema({
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: [true, 'Game ID is required']
  },
  roundNumber: {
    type: Number,
    required: [true, 'Round number is required'],
    min: [1, 'Round number must be at least 1']
  },
  drawerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Drawer ID is required']
  },
  drawerUsername: {
    type: String,
    required: [true, 'Drawer username is required']
  },
  word: {
    type: String,
    required: [true, 'Word is required']
  },
  strokes: [{
    x: {
      type: Number,
      required: true
    },
    y: {
      type: Number,
      required: true
    },
    pressure: {
      type: Number,
      default: 1,
      min: [0, 'Pressure must be between 0 and 1'],
      max: [1, 'Pressure must be between 0 and 1']
    },
    color: {
      type: String,
      default: '#000000',
      match: [/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color']
    },
    width: {
      type: Number,
      default: 2,
      min: [1, 'Width must be at least 1'],
      max: [20, 'Width cannot exceed 20']
    },
    timestamp: {
      type: Number,
      required: true
    }
  }],
  canvasWidth: {
    type: Number,
    default: 800
  },
  canvasHeight: {
    type: Number,
    default: 600
  },
  drawingTime: {
    type: Number, // in seconds
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Instance method to add stroke
drawingSchema.methods.addStroke = function(stroke) {
  this.strokes.push({
    x: stroke.x,
    y: stroke.y,
    pressure: stroke.pressure || 1,
    color: stroke.color || '#000000',
    width: stroke.width || 2,
    timestamp: stroke.timestamp || Date.now()
  });
  return this.save();
};

// Instance method to add multiple strokes
drawingSchema.methods.addStrokes = function(strokes) {
  const formattedStrokes = strokes.map(stroke => ({
    x: stroke.x,
    y: stroke.y,
    pressure: stroke.pressure || 1,
    color: stroke.color || '#000000',
    width: stroke.width || 2,
    timestamp: stroke.timestamp || Date.now()
  }));
  
  this.strokes.push(...formattedStrokes);
  return this.save();
};

// Instance method to clear strokes
drawingSchema.methods.clearStrokes = function() {
  this.strokes = [];
  return this.save();
};

// Instance method to complete drawing
drawingSchema.methods.complete = function() {
  this.completedAt = new Date();
  if (this.strokes.length > 0) {
    const firstStroke = this.strokes[0];
    const lastStroke = this.strokes[this.strokes.length - 1];
    this.drawingTime = Math.floor((lastStroke.timestamp - firstStroke.timestamp) / 1000);
  }
  return this.save();
};

// Instance method to get stroke count
drawingSchema.methods.getStrokeCount = function() {
  return this.strokes.length;
};

// Instance method to get drawing duration
drawingSchema.methods.getDrawingDuration = function() {
  if (this.completedAt) {
    return Math.floor((this.completedAt - this.createdAt) / 1000);
  }
  return Math.floor((new Date() - this.createdAt) / 1000);
};

// Instance method to get drawing as image data (for export)
drawingSchema.methods.getImageData = function() {
  return {
    strokes: this.strokes,
    canvasWidth: this.canvasWidth,
    canvasHeight: this.canvasHeight,
    word: this.word,
    drawer: this.drawerUsername,
    createdAt: this.createdAt,
    completedAt: this.completedAt
  };
};

// Static method to find drawings by game
drawingSchema.statics.findByGame = function(gameId) {
  return this.find({ gameId }).sort({ roundNumber: 1 });
};

// Static method to find drawings by drawer
drawingSchema.statics.findByDrawer = function(drawerId, limit = 50) {
  return this.find({ drawerId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('gameId', 'roomId');
};

// Static method to find drawings by round
drawingSchema.statics.findByRound = function(gameId, roundNumber) {
  return this.findOne({ gameId, roundNumber });
};

// Indexes for better query performance
drawingSchema.index({ gameId: 1, roundNumber: 1 });
drawingSchema.index({ drawerId: 1 });
drawingSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Drawing', drawingSchema); 