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
                
            }
            catch(err){

            }
        }
}