const { players } = require("./playerManager");
const { gameState, resetGame } = require("./gameState");
const { GAME_CONFIG } = require("../config/gameConfig");
const { getNonOverlappingPosition } = require("../utils/positionUtils");

function handlePlayerDeath(deadPlayerId, killerId) {
    const deadPlayer = players[deadPlayerId];
    const killer = players[killerId];

    if (!deadPlayer || !killer || !gameState.isActive) return;
    
    killer.score += 1;

    console.log(`Player ${killer.char} (${killerId}) killed ${deadPlayer.char} (${deadPlayerId}). Score: ${killer.score}`);

    // Check for win condition first before setting up respawn
    const hasWon = killer.score >= GAME_CONFIG.WIN_SCORE;
    
    if (!hasWon) {
        // Only set up respawn if the game hasn't ended
        setTimeout(() => {
            // Double check that game is still active and player still exists
            if (gameState.isActive && players[deadPlayerId]) { 
                const deadPlayerInfo = players[deadPlayerId];
                const newPos = getNonOverlappingPosition(deadPlayerInfo.screenWidth, deadPlayerInfo.screenHeight, players);
                
                players[deadPlayerId].x = newPos.x;
                players[deadPlayerId].y = newPos.y;
                players[deadPlayerId].health = GAME_CONFIG.MAX_HEALTH;

                if (global.gameIO) {
                    global.gameIO.emit("playerRespawn", {
                        id: deadPlayerId,
                        x: newPos.x,
                        y: newPos.y,
                        health: GAME_CONFIG.MAX_HEALTH,
                        score: players[deadPlayerId].score
                    });
                }

                console.log(`Player ${deadPlayer.char} respawned at (${newPos.x}, ${newPos.y})`);
            } else {
                console.log(`Respawn cancelled: Game inactive or player ${deadPlayerId} no longer exists`);
            }
        }, GAME_CONFIG.RESPAWN_DELAY);
    }
    
    // Update scores only if game is still active
    if (gameState.isActive) {
        const scores = {};
        Object.keys(players).forEach(id => {
            scores[id] = players[id].score;
        });

        if (global.gameIO) {
            global.gameIO.emit("updateScores", scores);
        }
    }

    // Handle win condition after updating scores
    if (hasWon) {
        handleGameWin(killerId);
    }
}

function handleGameWin(winnerId) {
    // Prevent multiple game over triggers
    if (!gameState.isActive) return;
    
    const winner = players[winnerId];
    if (!winner) {
        console.error(`Winner ${winnerId} not found in players list`);
        return;
    }
    
    console.log(`Game Over! Winner: ${winner.char} (${winnerId})`);

    // Mark game as inactive immediately to prevent race conditions
    gameState.isActive = false;
    
    if (global.gameIO) {
        global.gameIO.emit("gameOver", {
            winner: winnerId,
            winnerChar: winner.char,
            finalScores: Object.keys(players).map(id => ({
                id,
                char: players[id].char,
                score: players[id].score
            }))
        });
    }
    
    // Reset the game after a delay
    setTimeout(() => {
        resetGame();
    }, GAME_CONFIG.GAME_RESTART_DELAY);
}

module.exports = { handlePlayerDeath, handleGameWin };