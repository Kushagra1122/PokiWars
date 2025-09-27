const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" },
    pingTimeout: 60000,
    pingInterval: 25000
});

// Import modules
const { GAME_CONFIG } = require("./config/gameConfig");
const { gameState, resetGame } = require("./game/gameState");
const { players, addPlayer, removePlayer, updatePlayerPosition } = require("./game/playerManager");
const { handleConnection } = require("./handlers/connectionHandler");
const { handleLobbyConnection } = require("./lobby/lobbyHandler");

// Make io globally available to avoid circular imports
global.gameIO = io;

// Setup connection handler with lobby support
io.on("connection", (socket) => {
    // Handle game connections
    handleConnection(io, socket);
    
    // Handle lobby connections on the same socket
    handleLobbyConnection(io, socket);
});

// Server monitoring
setInterval(() => {
    const playerCount = Object.keys(players).length;
    if (playerCount > 0) {
        console.log(`Active players: ${playerCount}, Game active: ${gameState.isActive}`);
    }
}, 30000);

// Error handling
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down server...');
    io.emit('serverShutdown', { message: 'Server is shutting down' });
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Game configuration:`, GAME_CONFIG);
});

// Export for testing if needed
module.exports = { io, server };