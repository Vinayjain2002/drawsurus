const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');
const winston = require('winston');

// Verify JWT token middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists
    const user = await User.findById(decoded.userId).select('-passwordHash');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if session is valid
    const session = await Session.findBySessionId(decoded.sessionId);
    if (!session || !session.isValid()) {
      return res.status(401).json({
        success: false,
        message: 'Session expired or invalid'
      });
    }

    // Update session activity
    await session.updateActivity();

    // Attach user and session to request
    req.user = user;
    req.session = session;
    req.enterpriseTag = user.enterpriseTag;

    next();
  } catch (error) {
    winston.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};


// Check if user is admin (you can customize this based on your needs)
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }

  next();
};

// Check if user is in the same enterprise
const requireSameEnterprise = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const targetEnterpriseTag = req.params.enterpriseTag || req.body.enterpriseTag;
  
  if (targetEnterpriseTag && req.user.enterpriseTag !== targetEnterpriseTag) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Different enterprise'
    });
  }

  next();
};

// Rate limiting for authentication attempts
const authRateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireAdmin,
  requireSameEnterprise,
  authRateLimit
}; 