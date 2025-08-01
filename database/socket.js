const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const winston = require('winston');

class SocketManager {
  constructor(server) {
    this.io = socketIo(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.rooms = new Map(); // Track active rooms
    this.users = new Map(); // Track connected users
    this.gameStates = new Map(); // Track game states

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  // Setup authentication middleware
  setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        // Remove 'Bearer ' prefix if present
        const cleanToken = token.replace('Bearer ', '');
        
        const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
        socket.username = decoded.username;
        socket.enterpriseTag = decoded.enterpriseTag;
        
        next();
      } catch (error) {
        winston.error('Socket authentication error:', error);
        next(new Error('Authentication error: Invalid token'));
      }
    });
  }

  // Setup all event handlers
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      winston.info(`User connected: ${socket.username} (${socket.userId})`);
      
      // Store user connection
      this.users.set(socket.userId, {
        socketId: socket.id,
        username: socket.username,
        enterpriseTag: socket.enterpriseTag,
        currentRoom: null,
        isOnline: true,
        connectedAt: new Date()
      });

      // Handle user joining a room
      socket.on('join-room', async (data) => {
        try {
          const { roomCode, isHost = false } = data;
          
          // Validate room exists
          const room = await this.validateRoom(roomCode);
          if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
          }

          // Check if room is full
          if (room.players.length >= room.maxPlayers) {
            socket.emit('error', { message: 'Room is full' });
            return;
          }

          // Join the socket room
          socket.join(roomCode);
          
          // Update user's current room
          const user = this.users.get(socket.userId);
          user.currentRoom = roomCode;
          this.users.set(socket.userId, user);

          // Add player to room
          const player = {
            userId: socket.userId,
            username: socket.username,
            isHost: isHost,
            isOnline: true,
            joinedAt: new Date(),
            score: 0,
            correctGuesses: 0,
            drawings: 0
          };

          room.players.push(player);

          // Notify room about new player
          socket.to(roomCode).emit('player-joined', {
            player: player,
            totalPlayers: room.players.length
          });

          // Send room info to the joining player
          socket.emit('room-joined', {
            room: room,
            players: room.players
          });

          winston.info(`User ${socket.username} joined room ${roomCode}`);
        } catch (error) {
          winston.error('Error joining room:', error);
          socket.emit('error', { message: 'Failed to join room' });
        }
      });

      // Handle user leaving a room
      socket.on('leave-room', async (data) => {
        try {
          const { roomCode } = data;
          
          socket.leave(roomCode);
          
          // Update user's current room
          const user = this.users.get(socket.userId);
          user.currentRoom = null;
          this.users.set(socket.userId, user);

          // Remove player from room
          const room = this.rooms.get(roomCode);
          if (room) {
            room.players = room.players.filter(p => p.userId !== socket.userId);
            
            // Notify other players
            socket.to(roomCode).emit('player-left', {
              userId: socket.userId,
              username: socket.username,
              totalPlayers: room.players.length
            });

            // If room is empty, clean it up
            if (room.players.length === 0) {
              this.rooms.delete(roomCode);
              winston.info(`Room ${roomCode} deleted (empty)`);
            }
          }

          winston.info(`User ${socket.username} left room ${roomCode}`);
        } catch (error) {
          winston.error('Error leaving room:', error);
        }
      });

      // Handle drawing strokes
      socket.on('draw-stroke', (data) => {
        const { roomCode, stroke } = data;
        
        // Broadcast stroke to other players in the room
        socket.to(roomCode).emit('stroke-received', {
          stroke: stroke,
          drawerId: socket.userId
        });
      });

      // Handle chat messages
      socket.on('send-message', async (data) => {
        try {
          const { roomCode, message, type = 'chat' } = data;
          
          const messageData = {
            userId: socket.userId,
            username: socket.username,
            message: message,
            type: type, // 'chat', 'guess', 'system'
            timestamp: new Date()
          };

          // Save message to database
          // await this.saveMessage(roomCode, messageData);

          // Broadcast message to room
          this.io.to(roomCode).emit('message-received', messageData);

          // Check if it's a correct guess
          if (type === 'guess') {
            await this.checkGuess(roomCode, message, socket);
          }

          winston.info(`Message sent in room ${roomCode}: ${message}`);
        } catch (error) {
          winston.error('Error sending message:', error);
        }
      });

      // Handle game start
      socket.on('start-game', async (data) => {
        try {
          const { roomCode } = data;
          const room = this.rooms.get(roomCode);
          
          if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
          }

          // Check if user is host
          const player = room.players.find(p => p.userId === socket.userId);
          if (!player || !player.isHost) {
            socket.emit('error', { message: 'Only host can start the game' });
            return;
          }

          // Initialize game state
          const gameState = {
            status: 'playing',
            currentRound: 1,
            currentDrawer: null,
            currentWord: null,
            roundStartTime: null,
            roundEndTime: null,
            scores: {},
            correctGuesses: []
          };

          this.gameStates.set(roomCode, gameState);

          // Notify all players
          this.io.to(roomCode).emit('game-started', {
            gameState: gameState
          });

          // Start first round
          this.startRound(roomCode);

          winston.info(`Game started in room ${roomCode}`);
        } catch (error) {
          winston.error('Error starting game:', error);
          socket.emit('error', { message: 'Failed to start game' });
        }
      });

      // Handle canvas clear
      socket.on('clear-canvas', (data) => {
        const { roomCode } = data;
        socket.to(roomCode).emit('canvas-cleared');
      });

      // Handle user typing indicator
      socket.on('typing', (data) => {
        const { roomCode, isTyping } = data;
        socket.to(roomCode).emit('user-typing', {
          userId: socket.userId,
          username: socket.username,
          isTyping: isTyping
        });
      });

      // Handle video call signals
      socket.on('video-offer', (data) => {
        const { roomCode, offer, targetUserId } = data;
        const targetUser = this.users.get(targetUserId);
        if (targetUser) {
          this.io.to(targetUser.socketId).emit('video-offer', {
            offer: offer,
            fromUserId: socket.userId
          });
        }
      });

      socket.on('video-answer', (data) => {
        const { roomCode, answer, targetUserId } = data;
        const targetUser = this.users.get(targetUserId);
        if (targetUser) {
          this.io.to(targetUser.socketId).emit('video-answer', {
            answer: answer,
            fromUserId: socket.userId
          });
        }
      });

      socket.on('ice-candidate', (data) => {
        const { roomCode, candidate, targetUserId } = data;
        const targetUser = this.users.get(targetUserId);
        if (targetUser) {
          this.io.to(targetUser.socketId).emit('ice-candidate', {
            candidate: candidate,
            fromUserId: socket.userId
          });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        winston.info(`User disconnected: ${socket.username} (${socket.userId})`);
        
        // Update user status
        const user = this.users.get(socket.userId);
        if (user) {
          user.isOnline = false;
          user.disconnectedAt = new Date();
          this.users.set(socket.userId, user);

          // Notify room if user was in one
          if (user.currentRoom) {
            const room = this.rooms.get(user.currentRoom);
            if (room) {
              const player = room.players.find(p => p.userId === socket.userId);
              if (player) {
                player.isOnline = false;
                socket.to(user.currentRoom).emit('player-offline', {
                  userId: socket.userId,
                  username: socket.username
                });
              }
            }
          }
        }

        // Clean up after delay
        setTimeout(() => {
          this.users.delete(socket.userId);
        }, 300000); // 5 minutes
      });
    });
  }

    async validateRoom(roomCode){
        // Checking is the room exists or not
        if(!this.rooms.has(roomCode)){
            this.rooms.set(roomCode, {
                roomCode: roomCode,
                players: [],
                maxPlayers: 8,
                status: 'waiting',
                createdAt: new Date()
            });
        }
        return this.rooms.get(roomCode);
    }

    async checkGuess(roomCode, guess, socket){
        const gameState= this.gameStates.get(roomCode);

        if(!gameState || !gameState.currentWord){
            return;
        }

        const normalizedGuess = guess.toLowerCase().trim();
        const normalizedWord = gameState.currentWord.toLowerCase().trim();

        if(normalizedGuess == normalizedWord){
            if(gameState.correctGuesses.include(socket.userId)){
                // same user will get correct guess words only onetime
                return;
            }

            gameState.correctGuesses.push(socket.userId);
            const timeTaken= Date.now() - gameState.recordStartTime;
            const points= Math.max(100- Math.floor(timeTaken/10000), 10);

            const room= this.rooms.get(roomCode);
            const player= room.players.find(p=> p.userId=== socket.userId);
            if(player){
                player.score+= points;
                player.correctGuesses++;
            }

            this.io.to(roomCode).emit("correct-guess", {
                userId: socket.userId,
                username: socket.username,
                word: socket.currentWord,
                points: points,
                timeTaken: timeTaken
            });
            if(gameState.correctGuesses.length >= room.players.length-1){
                this.endRound(roomCode);
            }
        }
    }

    startRound(roomCode){
        const room= this.rooms.get(roomCode);
        const gameState= this.gameStates.get(roomCode);

        if(!room || !gameState){
            return;
        }

        const availablePlayers= room.players.filter(p=> p.isOnline);
        const currentDrawerIndex= availablePlayers.findIndex(p=> p.userId== gameState.currentDrawer);
        const nextDrawerIndex= (currentDrawerIndex+1)%availablePlayers.length;
        const nextDrawer= availablePlayers(nextDrawerIndex);

        const words = ['cat', 'dog', 'house', 'tree', 'car', 'sun', 'moon', 'star'];
        const randomWord= words[Math.floor(Math.random()* words.length)];

        gameState.currentDrawer= nextDrawer.userId;
        gameState.currentWord=randomWord;
        gameState.roundStartTime= Date.now();
        gameState.correctGuesses= [];

        this.io.to(roomCode).emit('room-started', {
            drawer: nextDrawer,
            word: randomWord,
            roundNumber: gameState.currentRoom
        });

        // Setting the round Timer ie when to end the round
        setTimeout(()=>{
            this.endRound(roomCode);
        }, 60000);
    }

    endRound(roomCode){
        const gameState= this.gameStates.get(roomCode);
        if(!gameState){
            // Game State is not found for which we need to end the game
            return;
        }

        gameState.roundEndTime= Date.now();

        this.io.to(roomCode).emit('round-ended', {
            word: gameState.currentWord,
            correctGuesses: gameState.correctGuesses,
            roundDuration: gameState.roundEndTime- gameState.roundStartTime
        });

        gameState.currentRound++;

        if(gameState.currentRound <=5){
            setTimeout(()=>{
                this.startRound(roomCode);
            }, 5000);
        }
        else{
            this.endGame(roomCode);
        }
    }

    endGame(roomCode){
        const room= this.rooms.get(roomCode);
        const gameState= this.gameStates.get(roomCode);

        if(!room || !gameState){
            return;
        }

      // Calculate final scores
    const finalScores = room.players.map(player => ({
        userId: player.userId,
        username: player.username,
        score: player.score,
        correctGuesses: player.correctGuesses,
        drawings: player.drawings
      })).sort((a, b) => b.score - a.score);
  

      this.io.to(roomCode).emit('game-ended', {
        finalScores: finalScores,
        gameDuration: Date.now()- gameState.roundStartTime
      });

      this.gameStates.delete(roomCode);
      gameState.status= 'completed';
    }

    getConnectedUserCount(){
        return this.users.size;
    }

    getActiveRoomsCount(){
        return this.rooms.size;
    }

    getRoomInfo(roomCode){
        return this.rooms.get(roomCode);
    }

    getUserInfo(userId){
        return this.users.get(userId);
    }

}

module.exports= SocketManager;