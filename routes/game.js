const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const { authenticateToken, requireSameEnterprise } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get game details
router.get('/:gameId', requireSameEnterprise, gameController.getGame);

// Get current round
// router.get('/currentRound/:gameId', requireSameEnterprise, gameController.getCurrentRound);

// Submit drawing
// router.post('/drawing/:gameId', requireSameEnterprise, gameController.submitDrawing);

// // Submit guess
// router.post('/:gameId/guess', requireSameEnterprise, gameController.submitGuess);

// // End current round
// router.post('/:gameId/end-round', requireSameEnterprise, gameController.endRound);

// // Get game history
// router.get('/history', gameController.getGameHistory);

module.exports = router;