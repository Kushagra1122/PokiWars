// Load environment variables from .env file
require('dotenv').config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const TokenService = require("./services/tokenService");

const app = express();
const server = http.createServer(app);

// Debug environment variables
console.log('Environment check:');
console.log('PRIVATE_KEY exists:', !!process.env.PRIVATE_KEY);
console.log('PRIVATE_KEY length:', process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY.length : 'undefined');
console.log('PRIVATE_KEY first 10 chars:', process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY.substring(0, 10) + '...' : 'undefined');

// Initialize token service
let tokenService;
try {
    tokenService = new TokenService();
    console.log('✅ Token service created successfully');
} catch (error) {
    console.error('❌ Failed to create token service:', error.message);
    console.log('Please check your PRIVATE_KEY environment variable');
    // Create a dummy service that will return errors
    tokenService = {
        transferTokens: async () => ({
            success: false,
            error: 'Token service not initialized. Check PRIVATE_KEY environment variable.'
        })
    };
}

// Middleware
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});
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

// API Routes
app.post('/transfer-tokens', async (req, res) => {
    console.log('\n=== TOKEN TRANSFER REQUEST ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Request headers:', JSON.stringify(req.headers, null, 2));
    
    try {
        const { address } = req.body;
        
        console.log('Extracted address:', address);
        
        if (!address) {
            console.log('❌ Error: No address provided');
            return res.status(400).json({
                success: false,
                error: 'Address is required'
            });
        }

        console.log('✅ Address validation passed');
        console.log('Calling tokenService.transferTokens...');
        
        const result = await tokenService.transferTokens(address);
        
        console.log('Token service result:', JSON.stringify(result, null, 2));
        
        if (result.success) {
            console.log('✅ Transfer successful, sending response');
            res.json(result);
        } else {
            console.log('❌ Transfer failed, sending error response');
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('❌ API Error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
    
    console.log('=== END TOKEN TRANSFER REQUEST ===\n');
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Make io globally available to avoid circular imports
global.gameIO = io;

// Setup connection handler with lobby support
io.on("connection", (socket) => {
    console.log(`🔌 New client connected: ${socket.id} from ${socket.handshake.address}`);
    
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