const { players } = require("../game/playerManager");
const { gameState } = require("../game/gameState");
const { updatePlayerPosition } = require("../game/playerManager");

function handlePlayerMovement(socket, data) {
    if (players[socket.id] && gameState.isActive) {
        const player = players[socket.id];
        const now = Date.now();

        if (now - player.lastUpdate > 10) {
            const maxSpeed = 300;
            const timeDelta = (now - player.lastUpdate) / 1000;
            const maxDistance = maxSpeed * timeDelta;

            const dx = data.x - player.x;
            const dy = data.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= maxDistance || distance < 10) {
                const radius = 40;
                const newX = Math.max(radius, Math.min(player.screenWidth - radius, data.x));
                const newY = Math.max(radius, Math.min(player.screenHeight - radius, data.y));

                if (updatePlayerPosition(socket.id, newX, newY, now)) {
                    socket.broadcast.emit("playerMoved", {
                        id: socket.id,
                        x: newX,
                        y: newY
                    });
                }
            }
        }
    }
}

module.exports = { handlePlayerMovement };