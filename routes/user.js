const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, requireSameEnterprise } = require('../middleware/auth');

router.use(authenticateToken);

// Get user by ID
router.get('/:userId', requireSameEnterprise, userController.getUserById);

// Get user stats
router.get('/:userId/stats', requireSameEnterprise, userController.getUserStats);

// Get online users for enterprise
router.get('/online', userController.getOnlineUsers);

// Search users
router.get('/search', userController.searchUsers);

// Update online status
router.put('/online-status', userController.updateOnlineStatus);

// Get current room
router.get('/current-room', userController.getCurrentRoom);

// Leave current room
router.post('/leave-room', userController.leaveRoom);

module.exports = router;