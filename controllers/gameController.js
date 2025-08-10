const Game= require("../models/Game");
const Room= require("../models/Room");
const Drawing= require("../models/Drawing");
const UserStats= require("../models/UserStats");

class GameController{
    async getGame(req, res){
        try{
            const {gameId}= req.params;
            console.log("game id is defined as the", gameId);
            const game= await Game.findById(gameId).populate("roomId", 'roomCode players')
            .populate("rounds.drawerId", "userName avatar")
            .populate("rounds.correctGuesses.userId", "userName avatar");
            console.log("game data ", game);
            
            if(!game){
                return res.status(404).json({
                    success: false,
                    message: "Game not found"
                });
            }
            if(game.enterpriseTag !== req.user.enterpriseTag){
                return res.status(403).json({"messsage": "Access denied: Different enterprise", success: false});
            }
            return res.status(200).json({"message": "Data fetched Successfully", success: true, data: game});
        }
        catch(err){
            return res.status(500).json({"message": "Failed to get game", success: false});
        }
    }

        async getCurrentRound(req,res){
            try{
                const {gameId}= req.params;
                const game= await Game.findById(gameId);
                if(!game){
                    return res.status(404).json({"message": "Game not found", success: false});
                }
                const currentRound= game.getCurrentRound();
                if(!currentRound){
                    return res.status(404).json({"message": "No Active round found"});
                }
                return res.status(200).json({"message": "Data fetched Successfully", data: {
                    round: currentRound,
                    success: true
                }});
            }
            catch(err){
                return res.status(500).json({success: false,"message": "Failed to get current Round"});
            }
        }
    
        async submitDrawing(req,res){
            try{
                const {gameId}= req.params;
                const {strokes}= req.body;

                const game= await Game.findById(gameId);
                if(!game){
                    return res.status(404).json({"message": "Game not found", success: false});
                }

                const currentRound= game.getCurrentRound();
                if(!currentRound){
                    return res.status(400).json({"message": "No active round",success: false });
                }
                
                // TODO: Implement drawing submission logic
                return res.status(200).json({"message": "Drawing submitted successfully", success: true});
            }
            catch(err){
                return res.status(500).json({"message": "Failed to submit drawing", success: false});
            }
        }

        async submitGuess(req,res){
            try{
                const {gameId}= req.params;
                const {guess}= req.body;

                if (!guess || typeof guess !== 'string') {
                    return res.status(400).json({"message": "Valid guess is required", success: false});
                }

                const game= await Game.findById(gameId);
                if(!game){
                    return res.status(404).json({"message": "Game not found", success: false});
                }

                // Check if game is active
                if (game.status !== 'playing') {
                    return res.status(400).json({"message": "Game is not active", success: false});
                }

                // Get current round
                const currentRound = game.getCurrentRound();
                if (!currentRound) {
                    return res.status(400).json({"message": "No active round found", success: false});
                }

                // Check if round has ended
                if (currentRound.endTime) {
                    return res.status(400).json({"message": "Round has already ended", success: false});
                }

                // Check if user is not the drawer
                if (currentRound.drawerId.toString() === req.user._id.toString()) {
                    return res.status(400).json({"message": "Drawer cannot submit guesses", success: false});
                }

                // Check if user has already guessed correctly
                const hasAlreadyGuessed = currentRound.correctGuesses.some(
                    correctGuess => correctGuess.userId.toString() === req.user._id.toString()
                );

                if (hasAlreadyGuessed) {
                    return res.status(400).json({"message": "You have already guessed correctly", success: false});
                }

                // Validate guess against current word
                const normalizedGuess = guess.toLowerCase().trim();
                const normalizedWord = currentRound.word.toLowerCase().trim();

                if (normalizedGuess === normalizedWord) {
                    // Calculate time taken and points
                    const timeTaken = Math.floor((new Date() - currentRound.startTime) / 1000);
                    const points = Math.max(100 - Math.floor(timeTaken / 10), 10);

                    // Add correct guess to the round
                    await game.addCorrectGuess(req.user._id, req.user.userName, points, timeTaken);

                    // Add message to the round
                    await game.addMessage(req.user._id, req.user.userName, guess, 'guess');

                    return res.status(200).json({
                        "message": "Correct guess!", 
                        success: true,
                        data: {
                            isCorrect: true,
                            points: points,
                            timeTaken: timeTaken,
                            word: currentRound.word
                        }
                    });
                } else {
                    // Add incorrect guess as a message
                    await game.addMessage(req.user._id, req.user.userName, guess, 'guess');

                    return res.status(200).json({
                        "message": "Incorrect guess", 
                        success: true,
                        data: {
                            isCorrect: false
                        }
                    });
                }
            }
            catch(err){
                console.error('Submit guess error:', err);
                return res.status(500).json({"message": "Failed to submit guess", success: false});
            }
        }

        async createGame(req,res){
            try{
                const {roomId, wordDifficulty, settings}= req.body;
                if(!roomId){
                    return res.status(400).json({"message": "Room ID is required", success: false});
                }

                const room= await Room.findById(roomId);
                if(!room){
                    return res.status(404).json({"message": "Room not found", success: false});
                }

                if(room.enterpriseTag !== req.user.enterpriseTag){
                    return res.status(403).json({"message": "Access denied: Different enterprise", success: false});
                }

                // Create new game
                const game= new Game({
                    roomId: room._id,
                    rounds: [],
                    status: 'waiting',
                    settings: settings || {},
                    finalScores: [],
                    enterpriseTag: req.user.enterpriseTag
                });
                await game.save();

                return res.status(201).json({"message": "Game created successfully", success: true, data: game});
            }
            catch(err){
                return res.status(500).json({"message": "Failed to create game", success: false});
            }
        }

        
        async endRound(req,res){
            try{
                const {gameId}= req.params;
                const game= await Game.findById(gameId);
                if(!game){
                    return res.status(404).json({"message": "Game not found", success: false});
                }

                // TODO: Implement round ending logic
                return res.status(200).json({"message": "Round ended successfully", success: true});
            }
            catch(err){
                return res.status(500).json({"message": "Failed to end round", success: false});
            }
        }

        async getGameHistory(req,res){
            try{
                // TODO: Implement game history logic
                return res.status(200).json({"message": "Game history fetched successfully", success: true, data: []});
            }
            catch(err){
                return res.status(500).json({"message": "Failed to get game history", success: false});
            }
        }
}

module.exports = new GameController();