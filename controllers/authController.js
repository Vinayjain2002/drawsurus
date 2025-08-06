const jwt= require("jsonwebtoken");
const bcrypt= require("bcryptjs")
const User= require("../models/User.js");
const Session = require("../models/Session")
const { validateRegistration, validateLogin } = require("../utils/validation");
const { v4: uuidv4 } = require('uuid');
const dotenv=require("dotenv");
dotenv.config();

class AuthController{
    async register(req,res){
        try{
            console.log("registering user");
            const {error}= validateRegistration(req.body);
            console.log("the creds are defined as ");
            if(error){
<<<<<<< HEAD
                console.log("Validation error", error.details[0].message);
=======
                console.log(error);
>>>>>>> 9226a100f78f2e9868020422cc037b65d4ee70b2
                return res.status(400).json({
                    success: false,
                    message: error.details[0].message
                });
            }

            const {userName, email, password, enterpriseTag}= req.body;
            console.log(userName, email,password, enterpriseTag );
            const existingUser= await User.findOne({
                $or: [{email: email}, {userName: userName}]
            });
            if(existingUser){
                return res.status(409).json({
                    success: false,
                    message: "User already exists"
                });
            }

            const user= new User({
                userName: userName,
                email: email,
                password: password,
                enterpriseTag: enterpriseTag || "defaault"                
            });


            await user.save();
            console.log("user registered Successfully");
            console.log("user id is defined as the", user._id);
            
            // Generate session ID and set expiration
            const sessionId = uuidv4();
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
            console.log("session data", sessionId, expiresAt);
            
              console.log("user session Data stored successfully");
            
              const token = jwt.sign(
                { userId: user._id },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
              );
            
              const userResponse= user.toObject();
              delete userResponse.passwordHash;


              // returning the response of the user back without the passwordHash
              return res.status(201).json({
                success: true,
                message:"User Registered Successfully",
                data: {
                    user: userResponse,
                    token: token
                }
              });
        }
        catch(err){
            return res.status(500).json({
                success: false,
                message: "Registeration Failed"
            });
        }
    }

        async login(req,res){
            try{
                const {error}= validateLogin(req.body);
                if(error){
                    return res.status(400).json({
                        success: false,
                        message: error.details[0].message
                    });
                }
                console.log("User Login Creds Verified");
                const {email,password}= req.body;
                const user= await User.findOne({email});
                console.log("email and password",email, password);
                if(!user){
                    return res.status(401).json({"message": "Invalid Credentials"});
                }
                console.log("the token is defined as the", user._id);
                const isValidPassword= user.comparePassword(password);
                console.log("password validation", isValidPassword);
                if(!isValidPassword){
                    return res.status(401).json({"success": false, message: "Invalid Credentials"});
                }
                //creating the user token
                const token= jwt.sign(
                    {userId: user._id},
                    process.env.JWT_SECRET,
                    {expiresIn: '24h'}
                );
                console.log("the token is defined as the", token);

                const userResponse= user.toObject();
                delete userResponse.passwordHash;

                return res.status(200).json({success: true,
                    message: "Login Successfully",
                    data: {
                        user: userResponse,
                        token                    }
                });
            }
            catch(err){
                return res.status(500).json({"message": "Login Failed", "error": err});
            }
        }
        
        async logout(req,res){
            try{
                // const {sessionId}= req.session;
                // await Session.invalidateSession(sessionId);

                if(req.user){
                    console.log("Loging out user");
                    req.user.isOnline= false;
                    req.user.lastOnline= new Date();
                    await req.user.save();
                }

                return res.status(200).json({
                    message: "Logout Successfull",
                    success: true
                });
            
            }
            catch(err){
                return res.status(500).json({"message": "Error Logging out user", success: false, err: err});
            }
        }

        async refreshToken(req,res){
            try{
                // const {sessionId}= req.session;
                // if(!sessionId){
                //     return res.status(401).json({"message": "Session Id is not Identified"});
                // }

                // const session= await Session.findBySessionId(sessionId);
                // if(!session || !session.isValid()){
                //     return res.status(401).json({"message": "Session expired", success: false});
                // }
                // await session.updateActivity();
                const token= jwt.sign(
                    {userId: req.user._id},
                    process.env.JWT_SECRET,
                    {expiresIn: '24h'}
                );

                return res.status(200).json({success: true, message: "Token Refreshed Successfully", data: {
                    token
                }});
            }
            catch(err){
                return res.status(500).json({"message": "Token refresh failed", success: false});
            }
        }

        async getProfile(req,res){
            try{
                console.log("get request is called");

                const userResponse= req.user.toObject();
                console.log(userResponse);
                delete userResponse.passwordHash;

                res.status(200).json({success: true,data: {
                    user: userResponse
                }});
            }
            catch(err){
                res.status(500).json({"message": "Failed to get profile", success: false});
            }
        }

        async updateProfile(req,res){
            try{
                const {userName, avatar}= req.body;
                const updates={};

                if(userName){
                    const existingUser= await User.findOne({userName, _id: {$ne: req.user._id}});
                    if(existingUser){
                        return res.status(409).json({"message": "Username already taken", success: false});
                    }
                    updates.userName= userName;

                    if(avatar){
                        updates.avatar= avatar;
                    }

                    const updatedUser= await User.findByIdAndUpdate(
                        req.user._id,
                        updates,
                        {new: true, runValidators: true}
                    ).select("-passwordHash");

                    return res.status(200).json({"message": "Profile Updated Successfully", data: {
                        user: updatedUser
                    }});
                }
            }
            catch(err){
                return res.status(500).json({"message": "Profile Updated Failed", success: false});
            }
        }
}

module.exports= new AuthController();