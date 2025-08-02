// const express = require('express');
// const router = express.Router();
// const roomController = require('../controllers/roomController');
// const { authenticateToken, requireSameEnterprise } = require('../middleware/auth');

// // All routes require authentication
// router.use(authenticateToken);

// // Create new room
// router.post('/', roomController.createRoom);

// // Join room by code
// router.post('/join/:roomCode', roomController.joinRoom);

// // Get room details
// router.get('/:roomId', requireSameEnterprise, roomController.getRoom);

// // Leave room
// router.post('/:roomId/leave', requireSameEnterprise, roomController.leaveRoom);

// // Update room settings
// router.put('/:roomId/settings', requireSameEnterprise, roomController.updateRoomSettings);

// // Get active rooms for enterprise
// router.get('/', roomController.getActiveRooms);

// // Start game
// router.post('/:roomId/start-game', requireSameEnterprise, roomController.startGame);

// module.exports = router;