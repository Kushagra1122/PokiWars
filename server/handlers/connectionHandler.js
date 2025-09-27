const { addPlayer, removePlayer, players } = require("../game/playerManager");
const { gameState } = require("../game/gameState");
const { handlePlayerMovement } = require("./movementHandler");
const { handlePlayerHit, handleDisconnect } = require("./eventHandler");
const { GAME_CONFIG } = require("../config/gameConfig");

function handleConnection(io, socket) {
    if (!socket) {
        // Legacy support - if called the old way
        return io.on("connection", (socket) => {
            handleConnection(io, socket);
        });
    }
        console.log(`Player connected: ${socket.id}`);

        socket.on("newPlayer", (playerInfo) => {
            try {
                const newPlayer = addPlayer(socket.id, playerInfo);
                console.log(`🎮 New player ${newPlayer.char} (${socket.id}) spawned at position (${newPlayer.x}, ${newPlayer.y})`);

                const scores = {};
                Object.keys(players).forEach(id => {
                    scores[id] = players[id].score;
                });

                // Send current game state to the new player
                socket.emit("currentPlayers", { 
                    players, 
                    scores, 
                    gameActive: gameState.isActive 
                });

                socket.broadcast.emit("newPlayer", {
                    id: socket.id,
                    ...players[socket.id]
                });

                // If this is the first or second player and game is not active, make sure game is active
                const playerCount = Object.keys(players).length;
                if (!gameState.isActive && playerCount >= 1) {
                    console.log(`Game reactivated with ${playerCount} player(s)`);
                    gameState.isActive = true;
                    gameState.startTime = Date.now();
                }

            } catch (error) {
                console.error("Error handling new player:", error);
            }
        });

        socket.on("playerMovement", (data) => {
            handlePlayerMovement(socket, data);
        });

        socket.on("playerHit", (data) => {
            if (gameState.isActive) {
                handlePlayerHit(socket, data);
            }
        });

        socket.on("requestRespawn", () => {
            const { getNonOverlappingPosition } = require("../utils/positionUtils");
            const player = players[socket.id];
            
            // Only allow respawn if game is active and player exists
            if (player && gameState.isActive) {
                console.log(`Player ${player.char} (${socket.id}) requesting respawn...`);
                const newPos = getNonOverlappingPosition(player.screenWidth, player.screenHeight, players);
                player.x = newPos.x;
                player.y = newPos.y;
                player.health = GAME_CONFIG.MAX_HEALTH; // Ensure full health on respawn
                
                if (global.gameIO) {
                    global.gameIO.emit("playerRespawn", {
                        id: socket.id,
                        x: newPos.x,
                        y: newPos.y,
                        health: player.health,
                        score: player.score
                    });
                }
                console.log(`✅ Player ${player.char} respawned at position (${newPos.x}, ${newPos.y})`);
            } else {
                console.log(`❌ Failed to respawn player - game inactive or player not found for socket ${socket.id}`);
            }
        });

        socket.on("disconnect", () => {
            handleDisconnect(socket);
        });

        socket.on("ping", (callback) => {
            if (typeof callback === "function") {
                callback();
            }
        });
}

module.exports = { handleConnection };