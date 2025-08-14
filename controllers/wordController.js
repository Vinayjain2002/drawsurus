const jwt= require("jsonwebtoken")
const bcrypt= require("bcryptjs")
const Word= require("../models/Word");
const dotenv= require("dotenv")
const {validateWord} = require("../utils/validation");

dotenv.config();

class WordController{
    async createWord(req,res){
        try{
            const {error}= validateWord(req.body);
            if(error){
                console.log("error in the word creation is defined as ");
                return res.status(400).json({
                    success: false,
                    messsage: error.details[0].messsage,
                    data: null
                });
            }
            const {word, category, difficulty, isActive, createdAt, updatedAt}= req.body;
            console.log(word, category, difficulty, isActive, createdAt,updatedAt);
            const existingWord= await Word.findOne({word: word});
            if(existingWord){
                return res.status(409).json({
                    success: false,
                    data: null,
                    message: "Word Already Exists"
                });
            }
            const newWord= new Word({
                word: word,
                isActive: isActive,
                category: category,
                difficulty: difficulty
            });
            await newWord.save();
            console.log("Word Created Successfully");

            const wordCreationResponse= newWord.toObject();
            return res.status(201).json({
                success: true,
                message: "Word Created Successfully",
                data: wordCreationResponse
            });

        }
        catch(err){
            console.log(err);
            return res.status(500).json({
                success: false,
                message: "Word Created Successfully",
                data: null
            });
        }
    }

    async getWord(req,res){
        try{
            const {error}= validateWord(req.body);
            console.log("the creds are defined as");
            if(error){
                console.log(error);
                return res.status(400).json({
                    success: false,
                    message: error.details[0].message,
                    data: null
                });
            }
            const {category, difficulty}= req.body;
            console.log("Category and Difficulty are defined as", category, difficulty);
            const existingWord= await Word.find({
                $or: [{difficulty: difficulty, category: category}]
            });
           
            return res.status(200).json({
                "message": "Words get successfully",
                data: existingWord,
                success: true
            });
        }
        catch(err){
            return res.status(500).json({
                success: false,
                error: "Error finding suitable words",
                data: null
            });
        }
    }

    async getWordsOnDifficulty(req,res){
        try{
            const {error}= validateWord(req.body);
            console.log("the creds are defined as",req.body);
            if(error){
                console.log("error details are defined as", error);
                return res.status(409).json({
                    "message": "Error getting words data",
                    success: false
                });
            }
            const {difficulty}= req.body;
            console.log("data is defined as",difficulty);
            const existingWord= await Word.find({
                difficulty: difficulty
            });

            if(!existingWord){
                return res.status(200).json({
                    success: false,
                    message: "No Words data found"
                });
            }
            return res.status(200).json({
                success: true,
                message: "Suitable words identified",
                data: existingWord
            });
        }
        catch(err){
            return res.status(500).json({
                success: false,
                message: "Error identifying words"
            });
        }
    }

    async getTodayCreatedWords(req,res){
        // getting all the today crated words
        try{
            const {error}= validateWord(req.body);
            if(error){
                return res.status(409).json({
                    "message": error.details[0].message,
                    success: false,
                    data: null
                });
            }

            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const words = await Word.find({ createdAt: { $gte: yesterday } });
            return res.status(200).json({
                success: true,
                message: "Data fetched Successfully",
                data: words
            });
        }   
        catch(err){
            return res.status(500).json({
                message: "Internal Server Error",
                success: false,
                data: null
            })
        }
    }   
}


module.exports= new WordController();