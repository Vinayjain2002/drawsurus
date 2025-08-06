const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, requireSameEnterprise } = require('../middleware/auth');

router.use(authenticateToken);

// Get user by ID

// Get user stats
// router.get('/:userId/stats', requireSameEnterprise, userController.getUserStats);

// Get online users for enterprise
router.get('/online', userController.getOnlineUsers);

// Search users
// router.get('/search', userController.searchUsers);

// Update online status
// router.put('/onlineStatus', userController.updateOnlineStatus);

// // Get current room
router.get('/currentRoom', userController.getCurrentRoom);

// // Leave current room
// router.get('/leaveroom', userController.leaveRoom);


router.get('/:userId', requireSameEnterprise, userController.getUserById);

module.exports = router;