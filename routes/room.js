const express = require('express');
const router = express.Router();
// const { authenticateToken, requireSameEnterprise } = require('../middleware/auth');
const {authenticateToken, requireSameEnterprise}= require("../middleware/auth");
// router.use(authenticateToken);
const roomController= require("../controllers/roomController");
// Create new room

router.use(authenticateToken);
router.post('/',roomController.createRoom );

// // Join room by code
router.post('/join/:roomCode', roomController.joinRoom);

// // Get room details
router.get('/:roomId', requireSameEnterprise, roomController.getRoom);

// // Leave room
// router.post('/:roomId/leave', requireSameEnterprise, roomController.leaveRoom);

// // Update room settings
// router.put('/:roomId/settings', requireSameEnterprise, roomController.updateRoomSettings);

// // Get active rooms for enterprise
// router.get('/', roomController.getActiveRooms);

// // Start game
// router.post('/:roomId/start-game', requireSameEnterprise, roomController.startGame);

module.exports = router;