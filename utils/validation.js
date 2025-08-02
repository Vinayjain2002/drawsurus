const { body, param, query, validationResult } = require('express-validator');
// const Joi = require('joi');

// // Joi validation schemas
// const validateRegistration = (data) => {
//   const schema = Joi.object({
//     userName: Joi.string()
//       .min(3)
//       .max(30)
//       .pattern(/^[a-zA-Z0-9_]+$/)
//       .required()
//       .messages({
//         'string.min': 'Username must be at least 3 characters',
//         'string.max': 'Username cannot exceed 30 characters',
//         'string.pattern.base': 'Username can only contain letters, numbers, and underscores',
//         'any.required': 'Username is required'
//       }),
//     email: Joi.string()
//       .email()
//       .required()
//       .messages({
//         'string.email': 'Please enter a valid email',
//         'any.required': 'Email is required'
//       }),
//     password: Joi.string()
//       .min(6)
//       .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
//       .required()
//       .messages({
//         'string.min': 'Password must be at least 6 characters',
//         'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, and one number',
//         'any.required': 'Password is required'
//       }),
//     enterpriseTag: Joi.string()
//       .min(2)
//       .max(50)
//       .pattern(/^[a-zA-Z0-9_-]+$/)
//       .optional()
//       .messages({
//         'string.min': 'Enterprise tag must be at least 2 characters',
//         'string.max': 'Enterprise tag cannot exceed 50 characters',
//         'string.pattern.base': 'Enterprise tag can only contain letters, numbers, hyphens, and underscores'
//       })
//   });

//   return schema.validate(data);
// };

// const validateLogin = (data) => {
//   const schema = Joi.object({
//     email: Joi.string()
//       .email()
//       .required()
//       .messages({
//         'string.email': 'Please enter a valid email',
//         'any.required': 'Email is required'
//       }),
//     password: Joi.string()
//       .required()
//       .messages({
//         'any.required': 'Password is required'
//       })
//   });

//   return schema.validate(data);
// };

// Common validation rules
const commonValidations = {
  // User validations
  username: body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
    .trim(),

  email: body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  password: body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),

  // Room validations
  roomCode: [
    param('roomCode')
      .isLength({ min: 4, max: 10 })
      .withMessage('Room code must be between 4 and 10 characters')
      .matches(/^[A-Z0-9]+$/)
      .withMessage('Room code can only contain uppercase letters and numbers')
      .toUpperCase(),
    body('roomCode')
      .optional()
      .isLength({ min: 4, max: 10 })
      .withMessage('Room code must be between 4 and 10 characters')
      .matches(/^[A-Z0-9]+$/)
      .withMessage('Room code can only contain uppercase letters and numbers')
      .toUpperCase()
  ],

  maxPlayers: body('maxPlayers')
    .optional()
    .isInt({ min: 2, max: 12 })
    .withMessage('Maximum players must be between 2 and 12'),

  // Game validations
  word: body('word')
    .isLength({ min: 2, max: 50 })
    .withMessage('Word must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Word can only contain letters and spaces')
    .trim(),

  roundTime: body('roundTime')
    .optional()
    .isInt({ min: 30, max: 120 })
    .withMessage('Round time must be between 30 and 120 seconds'),

  // Message validations
  message: body('message')
    .isLength({ min: 1, max: 500 })
    .withMessage('Message must be between 1 and 500 characters')
    .trim(),

  // Enterprise validations
  enterpriseTag: [
    body('enterpriseTag')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('Enterprise tag must be between 2 and 50 characters')
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Enterprise tag can only contain letters, numbers, hyphens, and underscores')
      .trim(),
    param('enterpriseTag')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('Enterprise tag must be between 2 and 50 characters')
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Enterprise tag can only contain letters, numbers, hyphens, and underscores')
      .trim()
  ],

  // Pagination validations
  page: query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  limit: query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  // Drawing validations
  stroke: body('stroke')
    .isObject()
    .withMessage('Stroke must be an object'),

  'stroke.x': body('stroke.x')
    .isFloat({ min: 0 })
    .withMessage('Stroke X coordinate must be a positive number'),

  'stroke.y': body('stroke.y')
    .isFloat({ min: 0 })
    .withMessage('Stroke Y coordinate must be a positive number'),

  'stroke.pressure': body('stroke.pressure')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Stroke pressure must be between 0 and 1'),

  'stroke.color': body('stroke.color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Stroke color must be a valid hex color'),

  'stroke.width': body('stroke.width')
    .optional()
    .isFloat({ min: 1, max: 20 })
    .withMessage('Stroke width must be between 1 and 20'),

  // File upload validations
  avatar: body('avatar')
    .optional()
    .isURL()
    .withMessage('Avatar must be a valid URL'),

  // Search validations
  search: query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters')
    .trim()
};

// Validation chains for different operations
const validationChains = {
  // User registration
  register: [
    commonValidations.username,
    commonValidations.email,
    commonValidations.password,
    ...commonValidations.enterpriseTag
  ],

  // User login
  login: [
    commonValidations.email,
    body('password').notEmpty().withMessage('Password is required')
  ],

  // Create room
  createRoom: [
    commonValidations.maxPlayers,
    ...commonValidations.enterpriseTag
  ],

  // Join room
  joinRoom: [
    ...commonValidations.roomCode
  ],

  // Send message
  sendMessage: [
    commonValidations.message,
    body('type')
      .optional()
      .isIn(['chat', 'guess', 'system'])
      .withMessage('Message type must be chat, guess, or system')
  ],

  // Drawing stroke
  drawStroke: [
    ...commonValidations.roomCode,
    commonValidations.stroke,
    commonValidations['stroke.x'],
    commonValidations['stroke.y'],
    commonValidations['stroke.pressure'],
    commonValidations['stroke.color'],
    commonValidations['stroke.width']
  ],

  // Update profile
  updateProfile: [
    commonValidations.username.optional(),
    commonValidations.email.optional(),
    commonValidations.avatar
  ],

  // Search
  search: [
    commonValidations.search,
    commonValidations.page,
    commonValidations.limit
  ],

  // Enterprise operations
  enterprise: [
    ...commonValidations.enterpriseTag
  ]
};

// Custom validation functions
const customValidations = {
  // Check if username is available
  isUsernameAvailable: async (username) => {
    const User = require('../models/User');
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      throw new Error('Username is already taken');
    }
    return true;
  },

  // Check if email is available
  isEmailAvailable: async (email) => {
    const User = require('../models/User');
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new Error('Email is already registered');
    }
    return true;
  },

  // Check if room exists
  roomExists: async (roomCode) => {
    const Room = require('../models/Room');
    const room = await Room.findByRoomCode(roomCode);
    if (!room) {
      throw new Error('Room not found');
    }
    return true;
  },

  // Check if user is in room
  userInRoom: async (roomCode, userId) => {
    const Room = require('../models/Room');
    const room = await Room.findByRoomCode(roomCode);
    if (!room) {
      throw new Error('Room not found');
    }
    
    const player = room.players.find(p => p.userId.toString() === userId.toString());
    if (!player) {
      throw new Error('User is not in this room');
    }
    return true;
  },

  // Check if user is room host
  isRoomHost: async (roomCode, userId) => {
    const Room = require('../models/Room');
    const room = await Room.findByRoomCode(roomCode);
    if (!room) {
      throw new Error('Room not found');
    }
    
    if (room.hostId.toString() !== userId.toString()) {
      throw new Error('Only room host can perform this action');
    }
    return true;
  }
};

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// Sanitize input data
const sanitizeInput = (req, res, next) => {
  // Remove extra whitespace from string fields
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    });
  }

  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key].trim();
      }
    });
  }

  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  commonValidations,
  validationChains,
  customValidations,
  handleValidationErrors,
  sanitizeInput
};