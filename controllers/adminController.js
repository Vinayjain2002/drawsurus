const User= require("../models/User");
const Room= require("../models/Room");
const Game= require("../models/UserStats");
const UserStats= require("../models/UserStats");
const winston= require("winston");

class AdminController{
    static async getDashboardStats(req,res){
        try{
            const {enterpriseTag}= req.user;
            console.log(enterpriseTag);

            // get the today statics
            const todayUsers= await User.findTodayRegisteredUsers();
            console.log("today users are", todayUsers);
            const todayOnlineUsers= await User.findTodayOnlineUsers();
            console.log("today online users are defined as the", todayOnlineUsers);
            const todayCurrentUsers= await User.findTodayCurrentUser();
            console.log("current users are", todayCurrentUsers);

            const activeRooms= await Room.findActiveByEnterprise(enterpriseTag);
            console.log("active users are defined as the", activeRooms);

            // const recentGames= await Game.findCompletedByEnterprise(enterpriseTag, 10);
            // console.log("recent games are defined as the", recentGames);

            const topPlayers= await UserStats.find().populate('userId', 'userName avatar').sort({totalScore: 1}).limit(10);
            const stats= {
                today: {
                    newUsers: todayUsers.length,
                    onlineUsers: todayOnlineUsers.length,
                    currentUsers: todayCurrentUsers.length
                },
                rooms: {
                    active: activeRooms.length
                },
                // games: {
                //     recent: recentGames.length
                // },
                players: {
                    top: topPlayers
                }
            };

            return res.status(200).json({
                success: true,
                data: {stats}
            });
        }
        catch(err){
          console.log("error is defined as the", err);

            return res.status(500).json({
                success: false,
                message: "Failed to get Dashboard Statistics"
            });
        }
    }

    static async getUsers(req,res){
        try{
            const {enterpriseTag}= req.body;
            console.log("enterprise tag is defined as the", enterpriseTag);
            const {page= 1, limit=20, search}= req.query;

            const query= {enterpriseTag};
            if(search){
                query.$or= [
                    {userName: {$regex: search, $options: 'i'}},
                    {email: {$regex: search, $options: 'i'}}
                ];
            }
            console.log("the query is defined as the", query);
            const users= await User.find(query).select("-passwordHash").sort({createdAt: -1}).limit(parseInt(limit)).skip(parseInt((page)-1)*parseInt(limit));
            console.log("users are defined as the", users);
            const total= await User.countDocuments(query);

            return res.status(200).json({
                success: true,
                data: {
                    users,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        pages: Math.ceil(total/parseInt(limit))
                    }
                }
            });

        }
        catch(err){
            return res.status(500).json({
                success: false,
                message: "Failed to get users"
            });
        }
    }


    static async getUserDetails(req,res){
        try{
            const {userId}= req.params;
            const user= await User.findById(userId).select("-passwordHash");
            if(!user){
                return res.status(404).json({"message": "User not found", success: false});
            }

            const stats= await UserStats.findOne({userId});
            const recentGames = await Game.find({
                'finalScores.userId': userId,
                enterpriseTag: req.user.enterpriseTag
              })
              .sort({ gameEndedAt: -1 })
              .limit(10);
            
            return res.status(200).json({
                success: true,
                data: {
                    user,
                    stats: stats ||{},
                    recentGames
                }
            });
        }
        catch(err){
            res.status(500).json({
                    success: false,
                    message: 'Failed to get user details'
                });
        }
    }
    static async updateUser(req, res) {
        try {
          const { userId } = req.params;
          const { userName, email, isAdmin, enterpriseTag } = req.body;
    
          const user = await User.findById(userId);
          if (!user) {
            return res.status(404).json({
              success: false,
              message: 'User not found'
            });
          }
    
          // Check enterprise access
          if (user.enterpriseTag !== req.user.enterpriseTag) {
            return res.status(403).json({
              success: false,
              message: 'Access denied: Different enterprise'
            });
          }
    
          const updates = {};
          if (userName) updates.userName = userName;
          if (email) updates.email = email;
          if (typeof isAdmin === 'boolean') updates.isAdmin = isAdmin;
          if (enterpriseTag) updates.enterpriseTag = enterpriseTag;
    
          const updatedUser = await User.findByIdAndUpdate(
            userId,
            updates,
            { new: true, runValidators: true }
          ).select('-passwordHash');
    
          res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: { user: updatedUser }
          });
    
        } catch (error) {
          winston.error('Update user error:', error);
          res.status(500).json({
            success: false,
            message: 'Failed to update user'
          });
        }
      }


      static async deleteUser(req, res) {
        try {
          const { userId } = req.params;
    
          const user = await User.findById(userId);
          if (!user) {
            return res.status(404).json({
              success: false,
              message: 'User not found'
            });
          }
    
          // Check enterprise access
          if (user.enterpriseTag !== req.user.enterpriseTag) {
            return res.status(403).json({
              success: false,
              message: 'Access denied: Different enterprise'
            });
          }
    
          // Prevent deleting self
          if (userId === req.user._id.toString()) {
            return res.status(400).json({
              success: false,
              message: 'Cannot delete your own account'
            });
          }
    
          // Delete user and related data
          await User.findByIdAndDelete(userId);
          await UserStats.findOneAndDelete({ userId });
    
          res.status(200).json({
            success: true,
            message: 'User deleted successfully'
          });
    
        } catch (error) {
          winston.error('Delete user error:', error);
          res.status(500).json({
            success: false,
            message: 'Failed to delete user'
          });
        }
      }
    
      // Get enterprise analytics
      static async getAnalytics(req, res) {
        try {
          const { enterpriseTag } = req.user;
          const { period = '7d' } = req.query;
    
          // Calculate date range
          const now = new Date();
          let startDate;
          switch (period) {
            case '24h':
              startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
              break;
            case '7d':
              startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              break;
            case '30d':
              startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
              break;
            default:
              startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          }
    
          // Get analytics data
          const newUsers = await User.countDocuments({
            enterpriseTag,
            createdAt: { $gte: startDate }
          });
    
          const activeUsers = await User.countDocuments({
            enterpriseTag,
            lastOnline: { $gte: startDate }
          });
    
          const completedGames = await Game.countDocuments({
            enterpriseTag,
            status: 'completed',
            gameEndedAt: { $gte: startDate }
          });
    
          const totalScore = await UserStats.aggregate([
            { $match: { enterpriseTag } },
            { $group: { _id: null, total: { $sum: '$totalScore' } } }
          ]);
    
          const analytics = {
            period,
            newUsers,
            activeUsers,
            completedGames,
            totalScore: totalScore[0]?.total || 0
          };
    
          res.status(200).json({
            success: true,
            data: { analytics }
          });
    
        } catch (error) {
          winston.error('Get analytics error:', error);
          res.status(500).json({
            success: false,
            message: 'Failed to get analytics'
          });
        }
      }
}

module.exports = AdminController;
