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
        kills: 0,
        deaths: 0,
        kdRatio: 0,
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

function updatePlayerKill(killerId, victimId) {
    if (players[killerId] && players[victimId]) {
        // Increment killer's kills
        players[killerId].kills += 1;
        players[killerId].score += 10; // Bonus points for kill
        
        // Increment victim's deaths
        players[victimId].deaths += 1;
        
        // Update K/D ratios
        updateKDRatio(killerId);
        updateKDRatio(victimId);
        
        console.log(`💀 ${players[killerId].char} killed ${players[victimId].char} (K/D: ${players[killerId].kills}/${players[killerId].deaths})`);
        
        return {
            killer: players[killerId],
            victim: players[victimId]
        };
    }
    return null;
}

function updateKDRatio(playerId) {
    if (players[playerId]) {
        const player = players[playerId];
        if (player.deaths > 0) {
            player.kdRatio = player.kills / player.deaths;
        } else {
            player.kdRatio = player.kills; // If no deaths, K/D = kills
        }
    }
}

function getLeaderboard() {
    const playerList = Object.values(players).map(player => ({
        id: player.id,
        name: player.name || player.char,
        char: player.char,
        kills: player.kills,
        deaths: player.deaths,
        kdRatio: player.kdRatio,
        score: player.score
    }));
    
    // Sort by kills descending, then by K/D ratio
    return playerList.sort((a, b) => {
        if (b.kills !== a.kills) {
            return b.kills - a.kills;
        }
        return b.kdRatio - a.kdRatio;
    });
}

function resetPlayerStats() {
    Object.values(players).forEach(player => {
        player.kills = 0;
        player.deaths = 0;
        player.kdRatio = 0;
        player.score = 0;
    });
}

module.exports = { 
    players, 
    addPlayer, 
    removePlayer, 
    updatePlayerPosition,
    getPlayer,
    getAllPlayers,
    updatePlayerKill,
    updateKDRatio,
    getLeaderboard,
    resetPlayerStats
};