// const express = require('express');
// const router = express.Router();
// const authController = require('../controllers/authController');
// const { authenticateToken, authRateLimit } = require('../middleware/auth');
// const rateLimit = require('express-rate-limit');

// // Apply rate limiting to auth routes
// const authLimiter = rateLimit(authRateLimit);

// // Public routes
// router.post('/register', authLimiter, authController.register);
// router.post('/login', authLimiter, authController.login);

// // Protected routes
// router.post('/logout', authenticateToken, authController.logout);
// router.post('/refresh', authenticateToken, authController.refreshToken);
// router.get('/profile', authenticateToken, authController.getProfile);
// router.put('/profile', authenticateToken, authController.updateProfile);

// module.exports = router;