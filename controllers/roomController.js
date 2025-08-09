const Room = require('../models/Room');
const User = require('../models/User');
const Game = require('../models/Game');
const winston = require('winston');

class RoomController {
  // Create a new room
  async createRoom(req, res) {
    try {
      console.log("Create room is called");
      const { maxPlayers, settings } = req.body;
      const { enterpriseTag } = req.user;
      console.log("the data are defined as the", maxPlayers, settings);
      console.log("settings type:", typeof settings);
      console.log("settings value:", JSON.stringify(settings, null, 2));
      let roomCode;
      let existingRoom;
      do {
        roomCode = Room.generateRoomCode();
        existingRoom = await Room.findByRoomCode(roomCode);
      } while (existingRoom);
      console.log("Identified the room code as the ", roomCode);
      console.log("the user id is defined as the", req.user._id);
      console.log("the enterise tag is defined as the", enterpriseTag);
      // Create room
      const room = new Room({
        roomCode,
        hostId: req.user._id,
        maxPlayers: maxPlayers || 6,
        enterpriseTag,
        settings: settings || {}
      });
      console.log("the room details are defined as the", room);
      // Add host as first player
      await room.addPlayer(req.user._id, req.user.userName, true);
      await room.save();

      // Update user's current room
      req.user.currentRoomId = room._id;
      await req.user.save();

      const populatedRoom = await Room.findById(room._id)
        .populate('hostId', 'userName avatar')
        .populate('players.userId', 'userName avatar');

      res.status(201).json({
        success: true,
        message: 'Room created successfully',
        data: populatedRoom
      });

    } catch (error) {
      // winston.error('Create room error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create room',
        error: error,
        data: null
      });
    }
  }

  // Join room by code
  async joinRoom(req, res) {
    try {
      const { roomCode } = req.params;
      const { enterpriseTag } = req.user;
      console.log("the room code is defined as the", roomCode, enterpriseTag);
      const room = await Room.findByRoomCode(roomCode);
      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Room not found',
          data: null
        });
      }

      // Check if room is from same enterprise
      if (room.enterpriseTag !== enterpriseTag) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Different enterprise',
          data: null
        });
      }

      // Check if room is full
      if (room.isFull()) {
        return res.status(400).json({
          success: false,
          message: 'Room is full',
          data: null
        });
      }

      // Check if room is in playing state
      if (room.status === 'playing') {
        return res.status(400).json({
          success: false,
          message: 'Game is already in progress',
          data: null
        });
      }

      // Add player to room
      await room.addPlayer(req.user._id, req.user.userName);
      await room.save();

      // Update user's current room
      req.user.currentRoomId = room._id;
      await req.user.save();

      const populatedRoom = await Room.findById(room._id)
        .populate('hostId', 'userName avatar')
        .populate('players.userId', 'userName avatar');

      res.status(200).json({
        success: true,
        message: 'Joined room successfully',
        data: populatedRoom
      });

    } catch (error) {
      winston.error('Join room error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to join room',
        data: null
      });
    }
  }

  // Get room details
  async getRoom(req, res) {
    try {
      const { roomId } = req.params;
      console.log("get room is called with the roomId is defined as the", roomId);
      const room = await Room.findById(roomId)
        .populate('hostId', 'userName avatar')
        .populate('players.userId', 'userName avatar')
        .populate('currentGameId');

      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Room not found',
          data: null
        });
      }

      // Check enterprise access
      if (room.enterpriseTag !== req.user.enterpriseTag) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Different enterprise',
          data: null
        });
      }

      res.status(200).json({
        success: true,
        message: 'Room details retrieved successfully',
        data: room
      });

    } catch (error) {
      winston.error('Get room error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get room',
        data: null
      });
    }
  }

  // Leave room
  async leaveRoom(req, res) {
    try {
      const { roomId } = req.params;
      console.log("the room Id is defined as the", roomId);

      const room = await Room.findById(roomId);
      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Room not found'
        });
      }

      // Remove player from room
      await room.removePlayer(req.user._id);
      await room.save();

      // Update user's current room
      req.user.currentRoomId = null;
      await req.user.save();

      // If room is empty, delete it
      if (room.players.length === 0) {
        await Room.findByIdAndDelete(roomId);
      } else if (req.user._id.toString() === room.hostId.toString()) {
        // If host is leaving, transfer host to next player
        const nextPlayer = room.players[0];
        room.hostId = nextPlayer.userId;
        room.players[0].isHost = true;
        await room.save();
      }

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

  // Update room settings
  async updateRoomSettings(req, res) {
    try {
      const { roomId } = req.params;
      const { settings } = req.body;

      const room = await Room.findById(roomId);
      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Room not found',
          data: null
        });
      }

      // Check if user is host
      if (room.hostId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Only host can update room settings',
          data: null
        });
      }

      // Update settings
      room.settings = { ...room.settings, ...settings };
      await room.save();

      res.status(200).json({
        success: true,
        message: 'Room settings updated',
        data: room
      });

    } catch (error) {
      winston.error('Update room settings error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update room settings',
        data: null
      });
    }
  }

  // Get active rooms for enterprise
  async getActiveRooms(req, res) {
    try {
      const { enterpriseTag } = req.user;

      const rooms = await Room.findActiveByEnterprise(enterpriseTag);

      res.status(200).json({
        message: "Active rooms retrieved successfully",
        success: true,
        data: rooms 
      });

    } catch (error) {
      winston.error('Get active rooms error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get active rooms',
        data: null
      });
    }
  }

  // Start game
  async startGame(req, res) {
    try {
      const { roomId } = req.params;

      const room = await Room.findById(roomId);
      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Room not found'
        });
      }

      // Check if user is host
      if (room.hostId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Only host can start the game'
        });
      }

      // Check if room has enough players
      console.log(room.players);
      console.log("the no of the players are defined as the", room.players.length);
      if (room.players.length < 2) {

        return res.status(400).json({
          success: false,
          message: 'Need at least 2 players to start'
        });
      }

      // Create new game
      const game = new Game({
        roomId: room._id,
        enterpriseTag: room.enterpriseTag,
        settings: room.settings
      });
      await game.save();

      // Update room status
      room.status = 'playing';
      room.currentGameId = game._id;
      await room.save();

      res.status(200).json({
        success: true,
        message: 'Game started successfully',
        data: { game }
      });

    } catch (error) {
      winston.error('Start game error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start game'
      });
    }
  }
}

module.exports = new RoomController();