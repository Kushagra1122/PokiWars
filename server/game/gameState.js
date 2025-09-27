const { players } = require("./playerManager");
const { GAME_CONFIG } = require("../config/gameConfig");
const { getNonOverlappingPosition } = require("../utils/positionUtils");

let gameState = {
    isActive: true,
    startTime: Date.now()
};

function resetGame() {
    console.log("Resetting game...");
    
    // Only reset players that are still connected
    const connectedPlayerIds = Object.keys(players);
    console.log(`Resetting game for ${connectedPlayerIds.length} connected players`);
    
    connectedPlayerIds.forEach(id => {
        if (players[id]) { // Double check player still exists
            players[id].health = GAME_CONFIG.MAX_HEALTH;
            players[id].score = 0;
            const playerInfo = players[id];
            const pos = getNonOverlappingPosition(playerInfo.screenWidth, playerInfo.screenHeight, players);
            players[id].x = pos.x;
            players[id].y = pos.y;
            console.log(`Reset player ${players[id].char} (${id}) at position (${pos.x}, ${pos.y})`);
        }
    });

    gameState.isActive = true;
    gameState.startTime = Date.now();

    // Only emit reset if there are players to reset
    if (connectedPlayerIds.length > 0 && global.gameIO) {
        global.gameIO.emit("gameReset", {
            players: players,
            message: "Game has been reset!"
        });
        console.log("Game reset completed and broadcasted to clients");
    } else {
        console.log("Game reset completed - no active players to notify");
    }
}

module.exports = { gameState, resetGame };