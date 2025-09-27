const { GAME_CONFIG } = require("../config/gameConfig");

let players = {};

function addPlayer(socketId, playerInfo) {
    console.log(`📝 Creating new player for socket ${socketId} with character: ${playerInfo.char || "ALAKAZAM"}`);
    
    const screenWidth = Math.max(playerInfo.screenWidth || 800, 800);
    const screenHeight = Math.max(playerInfo.screenHeight || 600, 600);
    console.log(`📐 Player screen size: ${screenWidth}x${screenHeight}`);

    const { getNonOverlappingPosition } = require("../utils/positionUtils");
    const position = getNonOverlappingPosition(screenWidth, screenHeight, players);
    console.log(`📍 Generated spawn position for ${playerInfo.char || "ALAKAZAM"}: (${position.x}, ${position.y})`);

    // Validate character selection
    const validCharacters = ['ALAKAZAM', 'BLASTOISE', 'CHARIZARD'];
    const selectedChar = validCharacters.includes(playerInfo.char) ? playerInfo.char : 'ALAKAZAM';

    players[socketId] = {
        id: socketId,
        x: position.x,
        y: position.y,
        char: selectedChar,
        health: GAME_CONFIG.MAX_HEALTH,
        score: 0,
        lastUpdate: Date.now(),
        screenWidth,
        screenHeight
    };

    console.log(`✅ Player ${players[socketId].char} successfully added to game at (${position.x}, ${position.y})`);
    return players[socketId];
}

function removePlayer(socketId) {
    if (players[socketId]) {
        const player = players[socketId];
        console.log(`👋 Player ${player.char} (${socketId}) removed from game`);
        delete players[socketId];
        return player;
    }
    console.log(`⚠️  Attempted to remove non-existent player: ${socketId}`);
    return null;
}

function updatePlayerPosition(socketId, x, y, timestamp) {
    if (players[socketId]) {
        players[socketId].x = x;
        players[socketId].y = y;
        players[socketId].lastUpdate = timestamp;
        return true;
    }
    return false;
}

function getPlayer(socketId) {
    return players[socketId];
}

function getAllPlayers() {
    return players;
}

module.exports = { 
    players, 
    addPlayer, 
    removePlayer, 
    updatePlayerPosition,
    getPlayer,
    getAllPlayers
};