const User = require('../models/User');
const UserStats = require('../models/UserStats');

class UserController {
  // Get user by ID
  async getUserById(req, res) {
    try {
      const { userId } = req.params;
      console.log("user id is defined as", userId);
      const user = await User.findById(userId).select('-passwordHash');
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          data: null
        });
      }

      res.status(200).json({
        message: 'User retrieved successfully',
        success: true,
        data: user
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get user',
        data: null
      });
    }
  }

  // Get user stats
  async getUserStats(req, res) {
    try {
      const { userId } = req.params;
      
      let stats = await UserStats.findOne({ userId });
      if (!stats) {
        stats = new UserStats({ userId });
        await stats.save();
      }

      res.status(200).json({
        success: true,
        data: stats,
        message: "Data retrieved successfully"
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get user stats',
        data: null
      });
    }
  }

  // Get online users for enterprise
  async getOnlineUsers(req, res) {
    try {
      const { enterpriseTag } = req.user;
      
      console.log("enterprise tag is defined as ", enterpriseTag);
      const onlineUsers = await User.find({
        enterpriseTag,
        isOnline: true
      }).select('userName avatar lastOnline');
      console.log("the count of the active users is defined as the", onlineUsers.length);

      res.status(200).json({
        success: true,
        data: { users: onlineUsers }
      });

    } catch (error) {
      winston.error('Get online users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get online users'
      });
    }
  }

  // Search users by username
  async searchUsers(req, res) {
    try {
      const { userName, enterpriseTag } = req.query;
      const searchQuery = { enterpriseTag: enterpriseTag || req.user.enterpriseTag };

      if (userName) {
        searchQuery.userName = { $regex: userName, $options: 'i' };
      }

      const users = await User.find(searchQuery)
        .select('userName avatar isOnline lastOnline')
        .limit(20);

      res.status(200).json({
        success: true,
        data: { users }
      });

    } catch (error) {
      winston.error('Search users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search users'
      });
    }
  }

  // Update user online status
  async updateOnlineStatus(req, res) {
    try {
      const { isOnline } = req.body;
      console.log("the user details are defined as the", req.user);
      req.user.isOnline = isOnline;
      req.user.lastOnline = new Date();
      await req.user.save();

      res.status(200).json({
        success: true,
        message: 'Online status updated',
        data: req.user
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to update online status'
      });
    }
  }

  // Get user's current room
  async getCurrentRoom(req, res) {
    try {
      console.log("getting the details of the current room");
      console.log("and the user id is defined as the", req.user._id);
      
      const user = await User.findById(req.user._id)
        .populate('currentRoomId')
        .select('currentRoomId');

      res.status(200).json({
        success: true,
        data: room
      });

    } catch (error) {
      winston.error('Get current room error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get current room'
      });
    }
  }

  // Leave current room
  async leaveRoom(req, res) {
    try {
      console.log("the data of the user is defined as the", req.user);
      req.user.currentRoomId = null;
      await req.user.save();

      res.status(200).json({
        success: true,
        message: 'Left room successfully'
      });

    } catch (error) {
      winston.error('Leave room error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to leave room'
      });
    }
  }
}

module.exports = new UserController();