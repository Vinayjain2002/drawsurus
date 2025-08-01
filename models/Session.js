const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  sessionId: {
    type: String,
    required: [true, 'Session ID is required'],
    unique: true
  },
  ip: {
    type: String,
    required: [true, 'IP address is required']
  },
  userAgent: {
    type: String,
    default: null
  },
  deviceInfo: {
    browser: String,
    os: String,
    device: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiration date is required']
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  logoutAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Instance method to update last activity
sessionSchema.methods.updateActivity = function() {
  this.lastActivity = new Date();
  return this.save();
};

// Instance method to logout session
sessionSchema.methods.logout = function() {
  this.isActive = false;
  this.logoutAt = new Date();
  return this.save();
};

// Instance method to check if session is expired
sessionSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

// Instance method to check if session is valid
sessionSchema.methods.isValid = function() {
  return this.isActive && !this.isExpired();
};

// Static method to find active sessions by user
sessionSchema.statics.findActiveByUser = function(userId) {
  return this.find({
    userId,
    isActive: true,
    expiresAt: { $gt: new Date() }
  });
};

// Static method to find session by session ID
sessionSchema.statics.findBySessionId = function(sessionId) {
  return this.findOne({ sessionId });
};

// Static method to cleanup expired sessions
sessionSchema.statics.cleanupExpired = function() {
  return this.updateMany(
    {
      expiresAt: { $lt: new Date() },
      isActive: true
    },
    {
      $set: {
        isActive: false,
        logoutAt: new Date()
      }
    }
  );
};

// Static method to get session statistics
// sessionSchema.statics.getSessionStats = function(userId = null) {
//   const match = {};
//   if (userId) match.userId = userId;
  
//   return this.aggregate([
//     { $match: match },
//     {
//       $group: {
//         _id: null,
//         totalSessions: { $sum: 1 },
//         activeSessions: { 
//           $sum: { 
//             $cond: [
//               { $and: [{ $eq: ['$isActive', true] }, { $gt: ['$expiresAt', new Date()] }] }, 
//               1, 
//               0 
//             ] 
//           }
//         },
//         expiredSessions: { 
//           $sum: { 
//             $cond: [{ $lt: ['$expiresAt', new Date()] }, 1, 0] 
//           }
//         }
//       }
//     }
//   ]);
// };

// Indexes for better query performance
sessionSchema.index({ sessionId: 1 });
sessionSchema.index({ userId: 1 });
sessionSchema.index({ expiresAt: 1 });
sessionSchema.index({ isActive: 1 });
sessionSchema.index({ lastActivity: -1 });

module.exports = mongoose.model('Session', sessionSchema); 