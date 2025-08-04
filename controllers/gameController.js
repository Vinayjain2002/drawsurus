const Game= require("../models/Game");
const Room= require("../models/Room");
const Drawing= require("../models/Drawing");
const UserStats= require("../models/UserStats");

class GameController{
    async getGame(req, res){
        try{
            const {gameId}= req.params;
            const game= await Game.findById(gameId).populate("roomId", 'roomCode players')
            .populate("rounds.drawerId", "userName avatar")
            .populate("rounds.correctGuesses.userId", "userName avatar");
            
            if(!game){
                return res.status(404).json({
                    success: false,
                    message: "Game not found"
                });
            }
            if(game.enterpriseTag !== req.user.enterpriseTag){
                return res.status(403).json({"messsage": "Access denied: Different enterprise", success: false});
            }
            return res.status(200).json({"message": "Data fetched Successfully", success: true, data: {game}});
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

                const game= await Game.findById(gameId);
                if(!game){
                    return res.status(404).json({"message": "Game not found", success: false});
                }

                // TODO: Implement guess submission logic
                return res.status(200).json({"message": "Guess submitted successfully", success: true});
            }
            catch(err){
                return res.status(500).json({"message": "Failed to submit guess", success: false});
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