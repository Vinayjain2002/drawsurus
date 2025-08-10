// definning the controllers for the use case of the guest ie where they used to Directly loged in Just using the username

const User = require('../models/User');
const jwt = require('jsonwebtoken');
const dotenv=   require("dotenv");
dotenv.config();

class GuestController{
    async createGuest(req, res) {
        try {
            const { userName, enterpriseTag } = req.body;
            console.log("the user name is defined as the", userName);
            console.log("the enterise tag is defined as the", enterpriseTag);
            
            // Check if username already exists
            const existingUser = await User.findOne({ userName, enterpriseTag });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Username already exists',
                    data: null
                });
            }

            // Create new guest user
            const guestUser = new User({
                userName,
                enterpriseTag,
                isGuest: true
            });

            await guestUser.save();

            const token = jwt.sign(
                { userId: guestUser._id},
                process.env.JWT_SECRET,
                { expiresIn: '24h' } // Token valid for 24 hours
            )

            res.status(201).json({
                success: true,
                message: 'Guest user created successfully',
                data: {
                    user: guestUser,
                    token: token
                }
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to create guest user',
                error: error.message,
                data: null
            });
        }
    }
}

module.exports= new GuestController();