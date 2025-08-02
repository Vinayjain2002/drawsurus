// const User = require('../models/User');
// const UserStats = require('../models/UserStats');
// const winston = require('winston');

// class UserController {
//   // Get user by ID
//   async getUserById(req, res) {
//     try {
//       const { userId } = req.params;
      
//       const user = await User.findById(userId).select('-passwordHash');
//       if (!user) {
//         return res.status(404).json({
//           success: false,
//           message: 'User not found'
//         });
//       }

//       res.status(200).json({
//         success: true,
//         data: { user }
//       });

//     } catch (error) {
//       winston.error('Get user error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Failed to get user'
//       });
//     }
//   }

//   // Get user stats
//   async getUserStats(req, res) {
//     try {
//       const { userId } = req.params;
      
//       let stats = await UserStats.findOne({ userId });
//       if (!stats) {
//         stats = new UserStats({ userId });
//         await stats.save();
//       }

//       res.status(200).json({
//         success: true,
//         data: { stats }
//       });

//     } catch (error) {
//       winston.error('Get user stats error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Failed to get user stats'
//       });
//     }
//   }

//   // Get online users for enterprise
//   async getOnlineUsers(req, res) {
//     try {
//       const { enterpriseTag } = req.user;
      
//       const onlineUsers = await User.find({
//         enterpriseTag,
//         isOnline: true
//       }).select('userName avatar lastOnline');

//       res.status(200).json({
//         success: true,
//         data: { users: onlineUsers }
//       });

//     } catch (error) {
//       winston.error('Get online users error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Failed to get online users'
//       });
//     }
//   }

//   // Search users by username
//   async searchUsers(req, res) {
//     try {
//       const { q, enterpriseTag } = req.query;
//       const searchQuery = { enterpriseTag: enterpriseTag || req.user.enterpriseTag };

//       if (q) {
//         searchQuery.userName = { $regex: q, $options: 'i' };
//       }

//       const users = await User.find(searchQuery)
//         .select('userName avatar isOnline lastOnline')
//         .limit(20);

//       res.status(200).json({
//         success: true,
//         data: { users }
//       });

//     } catch (error) {
//       winston.error('Search users error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Failed to search users'
//       });
//     }
//   }

//   // Update user online status
//   async updateOnlineStatus(req, res) {
//     try {
//       const { isOnline } = req.body;
      
//       req.user.isOnline = isOnline;
//       req.user.lastOnline = new Date();
//       await req.user.save();

//       res.status(200).json({
//         success: true,
//         message: 'Online status updated'
//       });

//     } catch (error) {
//       winston.error('Update online status error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Failed to update online status'
//       });
//     }
//   }

//   // Get user's current room
//   async getCurrentRoom(req, res) {
//     try {
//       const user = await User.findById(req.user._id)
//         .populate('currentRoomId')
//         .select('currentRoomId');

//       res.status(200).json({
//         success: true,
//         data: { room: user.currentRoomId }
//       });

//     } catch (error) {
//       winston.error('Get current room error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Failed to get current room'
//       });
//     }
//   }

//   // Leave current room
//   async leaveRoom(req, res) {
//     try {
//       req.user.currentRoomId = null;
//       await req.user.save();

//       res.status(200).json({
//         success: true,
//         message: 'Left room successfully'
//       });

//     } catch (error) {
//       winston.error('Leave room error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Failed to leave room'
//       });
//     }
//   }
// }

// module.exports = new UserController();