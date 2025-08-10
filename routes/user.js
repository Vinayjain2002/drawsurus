const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, requireSameEnterprise } = require('../middleware/auth');
const { Route53RecoveryCluster } = require('aws-sdk');

router.use(authenticateToken);

// Get user by ID
router.get("/:userId", userController.getUserById);
// Get user stats
// router.get('/stats/:userId', requireSameEnterprise, userController.getUserStats);

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