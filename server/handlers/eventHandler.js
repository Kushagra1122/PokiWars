const { players } = require("../game/playerManager");
const { gameState } = require("../game/gameState");
const { GAME_CONFIG } = require("../config/gameConfig");
const { handlePlayerDeath, handleGameWin } = require("../game/gameLogic");
const { removePlayer } = require("../game/playerManager");

function handlePlayerHit(socket, data) {
    // Early return if game is not active or players don't exist
    if (!gameState.isActive || !players[socket.id]) return;

    const shooter = players[socket.id];
    const target = players[data.id];

    // Validate target exists and is alive
    if (!target || target.health <= 0) return;

    const dx = shooter.x - target.x;
    const dy = shooter.y - target.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxRange = 450;

    if (distance > maxRange) {
        console.warn(`Shot out of range: ${distance} > ${maxRange}`);
        return;
    }

    const damage = GAME_CONFIG.DAMAGE_PER_SHOT;
    target.health = Math.max(0, target.health - damage);

    console.log(`${shooter.char} hit ${target.char} for ${damage} damage. Health: ${target.health}`);

    // Only emit if game is still active
    if (gameState.isActive && global.gameIO) {
        global.gameIO.emit("playerHit", {
            id: data.id,
            damage: damage,
            health: target.health,
            shooterId: socket.id
        });

        if (target.health <= 0) {
            handlePlayerDeath(data.id, socket.id);
        }
    }
}

function handleDisconnect(socket) {
    console.log(`Player disconnected: ${socket.id}`);

    const disconnectedPlayer = removePlayer(socket.id);
    if (disconnectedPlayer) {
        socket.broadcast.emit("playerDisconnected", socket.id);
        console.log(`${disconnectedPlayer.char} left the game`);
        
        // Check if we need to handle game state after player leaves
        const remainingPlayers = Object.keys(players);
        
        // If no players remain, reset the game state
        if (remainingPlayers.length === 0) {
            console.log("No players remaining, game will reset when new players join");
            gameState.isActive = true; // Keep active for new players to join
        }
        // Don't trigger game over when players leave - let the remaining players continue
        else if (remainingPlayers.length >= 1 && gameState.isActive) {
            console.log(`${remainingPlayers.length} player(s) remaining, game continues normally`);
            // Just update the UI to show that a player left, but don't end the game
            if (global.gameIO) {
                global.gameIO.emit("playerLeft", {
                    playerId: socket.id,
                    playerChar: disconnectedPlayer.char,
                    remainingCount: remainingPlayers.length
                });
            }
        }
        
        // Update scores for remaining players
        const scores = {};
        remainingPlayers.forEach(id => {
            scores[id] = players[id].score;
        });
        
        if (global.gameIO) {
            global.gameIO.emit("updateScores", scores);
        }
    }
}

module.exports = { handlePlayerHit, handleDisconnect };