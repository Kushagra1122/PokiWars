const { GAME_CONFIG } = require("../config/gameConfig");
const { isValidSpawnPosition } = require("./tilemapUtils");

function getRandomPosition(screenWidth, screenHeight) {
    const padding = GAME_CONFIG.PLAYER_SIZE;
    return {
        x: Math.floor(Math.random() * (screenWidth - padding * 2)) + padding,
        y: Math.floor(Math.random() * (screenHeight - padding * 2)) + padding,
    };
}

function getNonOverlappingPosition(screenWidth, screenHeight, players) {
    let position;
    let attempts = 0;
    const maxAttempts = 500; // Increased attempts to find valid position
    
    console.log(`🎯 Searching for valid spawn position (screen: ${screenWidth}x${screenHeight}, existing players: ${Object.keys(players).length})`);

    do {
        position = getRandomPosition(screenWidth, screenHeight);
        attempts++;

        const tooClose = isPositionTooClose(position, players);
        const hasCollision = !isValidSpawnPosition(position.x, position.y, screenWidth, screenHeight);
        
        if (attempts <= 5 || attempts % 50 === 0) { // Log first few attempts and every 50th attempt
            console.log(`🔍 Attempt ${attempts}: Position (${position.x}, ${position.y}) - TooClose: ${tooClose}, HasCollision: ${hasCollision}`);
        }

        if (attempts >= maxAttempts) {
            console.warn(`⚠️  Could not find non-overlapping collision-free position after ${maxAttempts} attempts, using best available position: (${position.x}, ${position.y})`);
            break;
        }
    } while (
        isPositionTooClose(position, players) || 
        !isValidSpawnPosition(position.x, position.y, screenWidth, screenHeight)
    );

    console.log(`✅ Found valid spawn position after ${attempts} attempts: (${position.x}, ${position.y})`);
    return position;
}

function isPositionTooClose(position, players) {
    const tooClose = Object.values(players).some(player => {
        const dx = player.x - position.x;
        const dy = player.y - position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < GAME_CONFIG.MIN_SPAWN_DISTANCE;
    });
    
    if (tooClose) {
        const closePlayers = Object.values(players).filter(player => {
            const dx = player.x - position.x;
            const dy = player.y - position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance < GAME_CONFIG.MIN_SPAWN_DISTANCE;
        });
        console.log(`⚠️  Position (${position.x}, ${position.y}) too close to ${closePlayers.length} player(s)`);
    }
    
    return tooClose;
}

module.exports = { getRandomPosition, getNonOverlappingPosition, isPositionTooClose };