// const Game = require('../models/Game');
// const Room = require('../models/Room');
// const Drawing = require('../models/Drawing');
// const UserStats = require('../models/UserStats');
// const winston = require('winston');

// class GameController {
//   // Get game details
//   async getGame(req, res) {
//     try {
//       const { gameId } = req.params;

//       const game = await Game.findById(gameId)
//         .populate('roomId', 'roomCode players')
//         .populate('rounds.drawerId', 'userName avatar')
//         .populate('rounds.correctGuesses.userId', 'userName avatar')
//         .populate('finalScores.userId', 'userName avatar');

//       if (!game) {
//         return res.status(404).json({
//           success: false,
//           message: 'Game not found'
//         });
//       }

//       // Check enterprise access
//       if (game.enterpriseTag !== req.user.enterpriseTag) {
//         return res.status(403).json({
//           success: false,
//           message: 'Access denied: Different enterprise'
//         });
//       }

//       res.status(200).json({
//         success: true,
//         data: { game }
//       });

//     } catch (error) {
//       winston.error('Get game error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Failed to get game'
//       });
//     }
//   }

//   // Get current round
//   async getCurrentRound(req, res) {
//     try {
//       const { gameId } = req.params;

//       const game = await Game.findById(gameId);
//       if (!game) {
//         return res.status(404).json({
//           success: false,
//           message: 'Game not found'
//         });
//       }

//       const currentRound = game.getCurrentRound();
//       if (!currentRound) {
//         return res.status(404).json({
//           success: false,
//           message: 'No active round found'
//         });
//       }

//       res.status(200).json({
//         success: true,
//         data: { round: currentRound }
//       });

//     } catch (error) {
//       winston.error('Get current round error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Failed to get current round'
//       });
//     }
//   }

//   // Submit drawing
//   async submitDrawing(req, res) {
//     try {
//       const { gameId } = req.params;
//       const { strokes } = req.body;

//       const game = await Game.findById(gameId);
//       if (!game) {
//         return res.status(404).json({
//           success: false,
//           message: 'Game not found'
//         });
//       }

//       const currentRound = game.getCurrentRound();
//       if (!currentRound) {
//         return res.status(400).json({
//           success: false,
//           message: 'No active round'
//         });
//       }

//       // Check if user is the drawer
//       if (currentRound.drawerId.toString() !== req.user._id.toString()) {
//         return res.status(403).json({
//           success: false,
//           message: 'Only the drawer can submit drawings'
//         });
//       }

//       // Create drawing record
//       const drawing = new Drawing({
//         gameId: game._id,
//         roundNumber: currentRound.roundNumber,
//         drawerId: req.user._id,
//         strokes
//       });
//       await drawing.save();

//       // Add drawing to current round
//       currentRound.drawings.push({
//         drawingId: drawing._id,
//         strokes
//       });
//       await game.save();

//       res.status(200).json({
//         success: true,
//         message: 'Drawing submitted successfully',
//         data: { drawing }
//       });

//     } catch (error) {
//       winston.error('Submit drawing error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Failed to submit drawing'
//       });
//     }
//   }

//   // Submit guess
//   async submitGuess(req, res) {
//     try {
//       const { gameId } = req.params;
//       const { guess } = req.body;

//       const game = await Game.findById(gameId);
//       if (!game) {
//         return res.status(404).json({
//           success: false,
//           message: 'Game not found'
//         });
//       }

//       const currentRound = game.getCurrentRound();
//       if (!currentRound) {
//         return res.status(400).json({
//           success: false,
//           message: 'No active round'
//         });
//       }

//       // Check if user is not the drawer
//       if (currentRound.drawerId.toString() === req.user._id.toString()) {
//         return res.status(403).json({
//           success: false,
//           message: 'Drawer cannot submit guesses'
//         });
//       }

//       // Check if already guessed correctly
//       const alreadyGuessed = currentRound.correctGuesses.find(
//         g => g.userId.toString() === req.user._id.toString()
//       );

//       if (alreadyGuessed) {
//         return res.status(400).json({
//           success: false,
//           message: 'Already guessed correctly'
//         });
//       }

//       // Check if guess is correct
//       const isCorrect = guess.toLowerCase().trim() === currentRound.word.toLowerCase().trim();
      
//       if (isCorrect) {
//         const timeTaken = Math.floor((new Date() - currentRound.startTime) / 1000);
//         const points = Math.max(10, 100 - timeTaken); // More points for faster guesses

//         // Add correct guess
//         await game.addCorrectGuess(req.user._id, req.user.userName, points, timeTaken);

//         // Add message
//         await game.addMessage(req.user._id, req.user.userName, `Guessed correctly: ${guess}`, 'guess');

//         res.status(200).json({
//           success: true,
//           message: 'Correct guess!',
//           data: { points, timeTaken }
//         });
//       } else {
//         // Add incorrect guess as message
//         await game.addMessage(req.user._id, req.user.userName, guess, 'chat');

//         res.status(200).json({
//           success: true,
//           message: 'Incorrect guess'
//         });
//       }

//     } catch (error) {
//       winston.error('Submit guess error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Failed to submit guess'
//       });
//     }
//   }

//   // End current round
//   async endRound(req, res) {
//     try {
//       const { gameId } = req.params;

//       const game = await Game.findById(gameId);
//       if (!game) {
//         return res.status(404).json({
//           success: false,
//           message: 'Game not found'
//         });
//       }

//       const currentRound = game.getCurrentRound();
//       if (!currentRound) {
//         return res.status(400).json({
//           success: false,
//           message: 'No active round'
//         });
//       }

//       // End current round
//       await game.endCurrentRound();

//       // Check if game is finished
//       if (game.isFinished()) {
//         await this.endGame(game);
//       }

//       res.status(200).json({
//         success: true,
//         message: 'Round ended successfully'
//       });

//     } catch (error) {
//       winston.error('End round error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Failed to end round'
//       });
//     }
//   }

//   // End game
//   async endGame(game) {
//     try {
//       // Calculate final scores
//       const finalScores = [];
//       const room = await Room.findById(game.roomId);

//       for (const player of room.players) {
//         const totalScore = game.rounds.reduce((score, round) => {
//           const correctGuess = round.correctGuesses.find(g => g.userId.toString() === player.userId.toString());
//           return score + (correctGuess ? correctGuess.points : 0);
//         }, 0);

//         const correctGuesses = game.rounds.reduce((count, round) => {
//           const correctGuess = round.correctGuesses.find(g => g.userId.toString() === player.userId.toString());
//           return count + (correctGuess ? 1 : 0);
//         }, 0);

//         const drawings = game.rounds.filter(round => 
//           round.drawerId.toString() === player.userId.toString()
//         ).length;

//         const averageGuessTime = correctGuesses > 0 ? 
//           game.rounds.reduce((total, round) => {
//             const correctGuess = round.correctGuesses.find(g => g.userId.toString() === player.userId.toString());
//             return total + (correctGuess ? correctGuess.timeTaken : 0);
//           }, 0) / correctGuesses : 0;

//         finalScores.push({
//           userId: player.userId,
//           username: player.username,
//           totalScore,
//           correctGuesses,
//           drawings,
//           averageGuessTime
//         });
//       }

//       // Sort by score and add ranks
//       finalScores.sort((a, b) => b.totalScore - a.totalScore);
//       finalScores.forEach((score, index) => {
//         score.rank = index + 1;
//       });

//       // End game
//       await game.endGame(finalScores);

//       // Update room status
//       room.status = 'completed';
//       await room.save();

//       // Update user stats
//       for (const score of finalScores) {
//         let userStats = await UserStats.findOne({ userId: score.userId });
//         if (!userStats) {
//           userStats = new UserStats({ userId: score.userId });
//         }

//         userStats.totalGamesPlayed += 1;
//         userStats.totalWins += score.rank === 1 ? 1 : 0;
//         userStats.totalScore += score.totalScore;
//         userStats.totalCorrectGuesses += score.correctGuesses;
//         userStats.totalDrawings += score.drawings;

//         await userStats.save();
//       }

//     } catch (error) {
//       winston.error('End game error:', error);
//       throw error;
//     }
//   }

//   // Get game history
//   async getGameHistory(req, res) {
//     try {
//       const { enterpriseTag } = req.user;
//       const { limit = 20, page = 1 } = req.query;

//       const games = await Game.findCompletedByEnterprise(enterpriseTag, parseInt(limit));

//       res.status(200).json({
//         success: true,
//         data: { games }
//       });

//     } catch (error) {
//       winston.error('Get game history error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Failed to get game history'
//       });
//     }
//   }
// }

// module.exports = new GameController();