# Socket.IO Implementation Guide for Drawsurus

## Overview

This document explains the Socket.IO implementation for the Drawsurus multiplayer drawing game. The system handles real-time communication between players including drawing, chat, game management, and video calls.

## Architecture

### Server-Side (`config/socket.js`)

The `SocketManager` class handles all Socket.IO functionality:

```javascript
const SocketManager = require('./config/socket');
const socketManager = new SocketManager(server);
```

### Key Features

1. **Authentication**: JWT-based authentication for secure connections
2. **Room Management**: Dynamic room creation and player management
3. **Real-time Drawing**: Stroke synchronization across players
4. **Chat System**: Real-time messaging with typing indicators
5. **Game Logic**: Round management, scoring, and game flow
6. **Video Calls**: WebRTC signaling for video communication

## Connection Setup

### Server Initialization

```javascript
// In index.js
const SocketManager = require('./config/socket');
const socketManager = new SocketManager(server);
```

### Client Connection

```javascript
// Client-side connection
const socket = io('http://localhost:5000', {
  auth: {
    token: 'your-jwt-token-here'
  }
});
```

## Event Handlers

### Connection Events

| Event | Description | Data |
|-------|-------------|------|
| `connect` | Client connected | - |
| `disconnect` | Client disconnected | - |
| `connect_error` | Connection failed | Error object |

### Room Events

| Event | Direction | Description | Data |
|-------|-----------|-------------|------|
| `join-room` | Client → Server | Join a game room | `{ roomCode, isHost }` |
| `room-joined` | Server → Client | Successfully joined room | `{ room, players }` |
| `player-joined` | Server → Client | New player joined | `{ player, totalPlayers }` |
| `leave-room` | Client → Server | Leave current room | `{ roomCode }` |
| `player-left` | Server → Client | Player left room | `{ userId, username, totalPlayers }` |

### Drawing Events

| Event | Direction | Description | Data |
|-------|-----------|-------------|------|
| `draw-stroke` | Client → Server | Send drawing stroke | `{ roomCode, stroke }` |
| `stroke-received` | Server → Client | Receive stroke from other player | `{ stroke, drawerId }` |
| `clear-canvas` | Client → Server | Clear the drawing canvas | `{ roomCode }` |
| `canvas-cleared` | Server → Client | Canvas was cleared | - |

### Chat Events

| Event | Direction | Description | Data |
|-------|-----------|-------------|------|
| `send-message` | Client → Server | Send chat message | `{ roomCode, message, type }` |
| `message-received` | Server → Client | Receive message | `{ userId, username, message, type, timestamp }` |
| `typing` | Client → Server | Typing indicator | `{ roomCode, isTyping }` |
| `user-typing` | Server → Client | User typing status | `{ userId, username, isTyping }` |

### Game Events

| Event | Direction | Description | Data |
|-------|-----------|-------------|------|
| `start-game` | Client → Server | Start the game | `{ roomCode }` |
| `game-started` | Server → Client | Game has started | `{ gameState }` |
| `round-started` | Server → Client | New round started | `{ drawer, word, roundNumber }` |
| `round-ended` | Server → Client | Round ended | `{ word, correctGuesses, roundDuration }` |
| `game-ended` | Server → Client | Game finished | `{ finalScores, gameDuration }` |
| `correct-guess` | Server → Client | Player guessed correctly | `{ userId, username, word, points, timeTaken }` |

### Video Call Events

| Event | Direction | Description | Data |
|-------|-----------|-------------|------|
| `video-offer` | Client → Server | Send WebRTC offer | `{ roomCode, offer, targetUserId }` |
| `video-answer` | Client → Server | Send WebRTC answer | `{ roomCode, answer, targetUserId }` |
| `ice-candidate` | Client → Server | Send ICE candidate | `{ roomCode, candidate, targetUserId }` |

## Data Structures

### Player Object
```javascript
{
  userId: "string",
  username: "string",
  isHost: boolean,
  isOnline: boolean,
  joinedAt: Date,
  score: number,
  correctGuesses: number,
  drawings: number
}
```

### Room Object
```javascript
{
  roomCode: "string",
  players: [Player],
  maxPlayers: number,
  status: "waiting" | "playing" | "completed",
  createdAt: Date
}
```

### Game State Object
```javascript
{
  status: "playing" | "completed",
  currentRound: number,
  currentDrawer: "userId",
  currentWord: "string",
  roundStartTime: number,
  roundEndTime: number,
  scores: {},
  correctGuesses: ["userId"]
}
```

### Stroke Object
```javascript
{
  x: number,
  y: number,
  pressure: number,
  color: "string",
  width: number,
  timestamp: number
}
```

## Usage Examples

### Joining a Room
```javascript
// Client-side
socket.emit('join-room', { 
  roomCode: 'ABC123', 
  isHost: true 
});

socket.on('room-joined', (data) => {
  console.log('Joined room:', data.room);
  console.log('Players:', data.players);
});
```

### Sending a Drawing Stroke
```javascript
// Client-side
socket.emit('draw-stroke', {
  roomCode: 'ABC123',
  stroke: {
    x: 100,
    y: 150,
    pressure: 0.5,
    color: '#000000',
    width: 2,
    timestamp: Date.now()
  }
});

socket.on('stroke-received', (data) => {
  // Draw the stroke on canvas
  drawStroke(data.stroke);
});
```

### Sending a Chat Message
```javascript
// Client-side
socket.emit('send-message', {
  roomCode: 'ABC123',
  message: 'Is it a cat?',
  type: 'guess' // 'chat', 'guess', 'system'
});

socket.on('message-received', (data) => {
  console.log(`${data.username}: ${data.message}`);
});
```

### Starting a Game
```javascript
// Client-side (host only)
socket.emit('start-game', { roomCode: 'ABC123' });

socket.on('game-started', (data) => {
  console.log('Game started!');
  console.log('Game state:', data.gameState);
});
```

## Error Handling

### Authentication Errors
```javascript
socket.on('connect_error', (error) => {
  if (error.message.includes('Authentication error')) {
    console.error('Invalid or missing JWT token');
    // Redirect to login
  }
});
```

### Room Errors
```javascript
socket.on('error', (data) => {
  console.error('Server error:', data.message);
  // Show error to user
});
```

## Security Considerations

1. **JWT Authentication**: All connections require valid JWT tokens
2. **Room Validation**: Server validates room existence and permissions
3. **Rate Limiting**: Implement rate limiting for socket events
4. **Input Validation**: Validate all incoming data
5. **CORS Configuration**: Proper CORS setup for production

## Performance Optimization

1. **Room Cleanup**: Automatically clean up empty rooms
2. **User Cleanup**: Remove disconnected users after timeout
3. **Event Batching**: Batch drawing strokes for better performance
4. **Memory Management**: Proper cleanup of game states

## Testing

Use the provided client example (`examples/socket-client.js`) to test the Socket.IO implementation:

```javascript
const { joinRoom, sendMessage, drawStroke } = require('./examples/socket-client');

// Test joining a room
joinRoom('TEST123', true);

// Test sending a message
sendMessage('TEST123', 'Hello, world!');

// Test drawing
drawStroke('TEST123', {
  x: 100,
  y: 100,
  pressure: 1,
  color: '#000000',
  width: 2,
  timestamp: Date.now()
});
```

## Production Deployment

1. **Redis Adapter**: Use Redis for horizontal scaling
2. **Load Balancing**: Implement sticky sessions
3. **Monitoring**: Add logging and monitoring
4. **SSL/TLS**: Use secure WebSocket connections
5. **Rate Limiting**: Implement socket-level rate limiting

## Troubleshooting

### Common Issues

1. **Connection Failed**: Check JWT token and server URL
2. **Room Not Found**: Verify room code exists
3. **Drawing Not Syncing**: Check stroke data format
4. **Messages Not Received**: Verify room membership

### Debug Mode

Enable debug logging by setting the environment variable:
```bash
DEBUG=socket.io:*
```

This will provide detailed Socket.IO debugging information. 