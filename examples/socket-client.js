// Example Socket.IO client for testing
// This can be used in a browser or with a Node.js client

const io = require('socket.io-client');

// Connect to the server
const socket = io('http://localhost:5000', {
  auth: {
    token: 'your-jwt-token-here' // Replace with actual JWT token
  }
});

// Connection events
socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});

// Room events
socket.on('room-joined', (data) => {
  console.log('Joined room:', data);
});

socket.on('player-joined', (data) => {
  console.log('Player joined:', data);
});

socket.on('player-left', (data) => {
  console.log('Player left:', data);
});

// Game events
socket.on('game-started', (data) => {
  console.log('Game started:', data);
});

socket.on('round-started', (data) => {
  console.log('Round started:', data);
});

socket.on('round-ended', (data) => {
  console.log('Round ended:', data);
});

socket.on('game-ended', (data) => {
  console.log('Game ended:', data);
});

// Drawing events
socket.on('stroke-received', (data) => {
  console.log('Stroke received:', data);
});

socket.on('canvas-cleared', () => {
  console.log('Canvas cleared');
});

// Chat events
socket.on('message-received', (data) => {
  console.log('Message received:', data);
});

socket.on('user-typing', (data) => {
  console.log('User typing:', data);
});

// Error events
socket.on('error', (data) => {
  console.error('Server error:', data);
});

// Example functions to interact with the server
function joinRoom(roomCode, isHost = false) {
  socket.emit('join-room', { roomCode, isHost });
}

function leaveRoom(roomCode) {
  socket.emit('leave-room', { roomCode });
}

function sendMessage(roomCode, message, type = 'chat') {
  socket.emit('send-message', { roomCode, message, type });
}

function drawStroke(roomCode, stroke) {
  socket.emit('draw-stroke', { roomCode, stroke });
}

function clearCanvas(roomCode) {
  socket.emit('clear-canvas', { roomCode });
}

function startGame(roomCode) {
  socket.emit('start-game', { roomCode });
}

function setTyping(roomCode, isTyping) {
  socket.emit('typing', { roomCode, isTyping });
}

// Export functions for use in other files
module.exports = {
  socket,
  joinRoom,
  leaveRoom,
  sendMessage,
  drawStroke,
  clearCanvas,
  startGame,
  setTyping
}; 