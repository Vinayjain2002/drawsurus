const jwt= require("jsonwebtoken");
const bcrypt= require("bcryptjs")
const User= require("../models/User.js");
const Session = require("../models/Session.js")
const { validateRegistration } = require("../utils/validation");

class AuthController{
    async register(req,res){
        try{
            const {error}= validateRegistration(req.body);
            if(error){
                return res.status(400).json({
                    success: false,
                    message: error.details[0].message
                });
            }

            const {userName, email, password, enterpriseTag}= req.body;
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
            const session = new Session({
                userId: user._id,
                enterpriseTag: user.enterpriseTag
              });
              await session.save();

              const token = jwt.sign(
                { userId: user._id, sessionId: session.sessionId },
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
                    token,
                    sessionId: session.sessionId
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
                const {error}= validateRegistration(req.body);
                if(error){
                    return res.status(400).json({
                        success: false,
                        message: error.details[0].message
                    });
                }
                const {email,password}= req.body;
                const user= await User.findOne({email});

                if(!user){
                    return res.status(401).json({"message": "Invalid Credentials"});
                }
                const isValidPassword= user.comparePassword(password);
                if(!isValidPassword){
                    return res.status(401).json({"success": false, message: "Invalid Credentials"});
                }

                const session= new Session({
                    userId: user._id,
                    enterpriseTag: user.enterpriseTag
                });

                await session.save();

                //creating the user token
                const token= jwt.sign(
                    {userId: user._id, sessionId: session.sessionId},
                    process.env.JWT_SECRET,
                    {expiresIn: '24h'}
                );

                const userResponse= user.toObject();
                delete userResponse.passwordHash;

                return res.status(200).json({success: true,
                    message: "Login Successfully",
                    data: {
                        user: userResponse,
                        token,
                        sessionId: session.sessionId
                    }
                });
            }
            catch(err){
                return res.status(500).json({"message": "Login Failed"});
            }
        }
        
        async logout(req,res){
            try{
                const {sessionId}= req.session;
                await Session.invalidateSession(sessionId);

                if(req.user){
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
                return res.status(500).json({"message": "Logout Successful", success: false});
            }
        }

        async refreshToken(req,res){
            try{
                const {sessionId}= req.session;
                if(!sessionId){
                    return res.status(401).json({"message": "Session Id is not Identified"});
                }

                const session= await Session.findBySessionId(sessionId);
                if(!session || !session.isValid()){
                    return res.status(401).json({"message": "Session expired", success: false});
                }
                await session.updateActivity();
                const token= jwt.sign(
                    {userId: req.user._id, sessionId: session.sessionId},
                    process.env.JWT_SECRET,
                    {expiresIn: '24h'}
                );

                return res.status(200).json({success: true, message: "Token Refreshed Successfully", data: {
                    token,
                    sessionId: session.sessionId
                }});
            }
            catch(err){
                return res.status(500).json({"message": "Token refresh failed", success: false});
            }
        }

        async getProfile(req,res){
            try{
                const userResponse= req.user.toObject();
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