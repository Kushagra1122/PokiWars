import { io } from "socket.io-client";

class SocketManager {
  constructor(scene = null) {
    this.scene = scene;
    this.socket = null;
    this.serverUrl = "http://localhost:3001";
  }

  // Basic connection without game-specific setup
  async connect() {
    if (this.socket) {
      return this.socket;
    }

    return new Promise((resolve, reject) => {
      this.socket = io(this.serverUrl, {
        transports: ["websocket", "polling"],
        timeout: 20000,
        forceNew: false,
      });

      this.socket.on("connect", () => {
        console.log("Connected to server:", this.socket.id);
        resolve(this.socket);
      });

      this.socket.on("connect_error", (error) => {
        console.error("Connection error:", error);
        reject(error);
      });

      // Set a timeout for connection
      setTimeout(() => {
        if (!this.socket.connected) {
          reject(new Error("Connection timeout"));
        }
      }, 10000);
    });
  }

  // Game-specific connection
  async connectForGame(selectedChar) {
    await this.connect();
    
    this.socket.emit("newPlayer", {
      char: selectedChar,
      screenWidth: this.scene.scale.width - 190,  // Send the actual drawable area
      screenHeight: this.scene.scale.height - 190, // Send the actual drawable area
    });

    this.setupGameEventListeners();
  }

  // Lobby methods
  createLobby(playerInfo, callback) {
    if (!this.socket) return;
    this.socket.emit('createLobby', playerInfo, callback);
  }

  joinLobby(data, callback) {
    if (!this.socket) return;
    this.socket.emit('joinLobby', data, callback);
  }

  leaveLobby(callback) {
    if (!this.socket) return;
    this.socket.emit('leaveLobby', callback);
  }

  updateLobbySettings(settings, callback) {
    if (!this.socket) return;
    this.socket.emit('updateLobbySettings', settings, callback);
  }

  toggleReady(callback) {
    if (!this.socket) return;
    this.socket.emit('toggleReady', callback);
  }

  startGame(callback) {
    if (!this.socket) return;
    this.socket.emit('startGame', callback);
  }

  getLobbyList(callback) {
    if (!this.socket) return;
    this.socket.emit('getLobbyList', callback);
  }

  getLobbyState(callback) {
    if (!this.socket) return;
    this.socket.emit('getLobbyState', callback);
  }

  getLobbyById(lobbyId, callback) {
    if (!this.socket) return;
    this.socket.emit('getLobbyById', lobbyId, callback);
  }

  setupGameEventListeners() {
    if (!this.scene) return;
    this.socket.on("currentPlayers", (data) => {
      const { players, scores } = data;
      Object.keys(players).forEach((id) => {
        const p = players[id];
        if (id === this.socket.id) {
          this.scene.player.updatePosition(p.x, p.y);
          this.scene.gameUI.updateScore(p.score || 0);
        } else {
          this.scene.addOtherPlayer(p, id);
        }
      });
    });

    this.socket.on("newPlayer", (p) => {
      if (p.id !== this.socket.id) this.scene.addOtherPlayer(p, p.id);
    });

    this.socket.on("playerMoved", (p) => {
      if (this.scene.otherPlayers[p.id]) {
        this.scene.otherPlayerTargets[p.id] = { x: p.x, y: p.y };
      }
    });

    this.socket.on("playerHit", (data) => {
      if (data.id === this.socket.id) {
        this.scene.takeDamage(data.damage);
        this.scene.effects.createHitEffect(this.scene.player.sprite.x, this.scene.player.sprite.y);
      } else if (this.scene.otherPlayers[data.id]) {
        const target = this.scene.otherPlayers[data.id];
        target.health = Math.max(0, data.health);
        this.scene.updateOtherPlayerHealthBar(target);
        this.scene.effects.createHitEffect(target.sprite.x, target.sprite.y);
      }
    });

    this.socket.on("playerRespawn", (data) => {
      if (data.id === this.socket.id) {
        // Always accept server-validated positions
        this.scene.player.updatePosition(data.x, data.y);
        this.scene.player.health = data.health;
        this.scene.gameUI.updateHealthBar(data.health);
        this.scene.gameUI.updateScore(data.score);
        this.scene.effects.createRespawnEffect(data.x, data.y);
      } else if (this.scene.otherPlayers[data.id]) {
        const op = this.scene.otherPlayers[data.id];
        op.sprite.x = data.x;
        op.sprite.y = data.y;
        op.health = data.health;
        this.scene.updateOtherPlayerHealthBar(op);
        this.scene.otherPlayerTargets[data.id] = { x: data.x, y: data.y };
        this.scene.effects.createRespawnEffect(data.x, data.y);
      }
    });

    this.socket.on("gameOver", (data) => {
      this.scene.showGameOver(data.winner, data.winnerChar);
    });

    this.socket.on("updateScores", (scores) => {
      if (scores[this.socket.id]) this.scene.gameUI.updateScore(scores[this.socket.id]);
      Object.keys(scores).forEach((id) => {
        if (this.scene.otherPlayers[id]) this.scene.otherPlayers[id].score = scores[id];
      });
    });

    this.socket.on("playerDisconnected", (id) => {
      if (this.scene.otherPlayers[id]) {
        this.scene.otherPlayers[id].sprite.destroy();
        this.scene.otherPlayers[id].healthBar.destroy();
        delete this.scene.otherPlayers[id];
        delete this.scene.otherPlayerTargets[id];
      }
    });

    this.socket.on("gameReset", (data) => {
      // Hide game over overlay if it's showing
      if (this.scene.gameOverlay && this.scene.gameOverlay.gameOverOverlay.visible) {
        this.scene.gameOverlay.hideGameOver();
      }
      
      // Reset player positions and stats instead of restarting the entire scene
      this.resetGameState(data);
    });

    this.socket.on("playerLeft", (data) => {
      // Show a brief notification that a player left but don't end the game
      console.log(`Player ${data.playerChar} left the game. ${data.remainingCount} players remaining.`);
      
      // Show a brief notification in the game
      this.showPlayerLeftNotification(data.playerChar, data.remainingCount);
    });
  }

  requestNewSpawnPosition() {
    if (this.socket) {
      this.socket.emit("requestRespawn");
    }
  }

  emitMovement(x, y) {
    if (this.socket) this.socket.emit("playerMovement", { x, y });
  }

  emitHit(targetId) {
    if (this.socket) {
      this.socket.emit("playerHit", {
        id: targetId,
        damage: 20,
        shooterId: this.socket.id,
      });
    }
  }

  resetGameState(data) {
    // Reset local player
    if (data.players[this.socket.id]) {
      const playerData = data.players[this.socket.id];
      this.scene.player.updatePosition(playerData.x, playerData.y);
      this.scene.player.health = playerData.health;
      this.scene.gameUI.updateHealthBar(playerData.health);
      this.scene.gameUI.updateScore(playerData.score);
    }

    // Reset other players
    Object.keys(data.players).forEach((id) => {
      if (id !== this.socket.id && this.scene.otherPlayers[id]) {
        const playerData = data.players[id];
        const otherPlayer = this.scene.otherPlayers[id];
        otherPlayer.sprite.x = playerData.x;
        otherPlayer.sprite.y = playerData.y;
        otherPlayer.health = playerData.health;
        otherPlayer.score = playerData.score;
        this.scene.updateOtherPlayerHealthBar(otherPlayer);
        this.scene.otherPlayerTargets[id] = { x: playerData.x, y: playerData.y };
      }
    });

    // Reset game state
    this.scene.gameState.isGameOver = false;
    
    console.log("Game reset completed - continuing with current session");
  }

  showPlayerLeftNotification(playerChar, remainingCount) {
    // Create a temporary notification that a player left
    const notification = this.scene.add.text(
      this.scene.scale.width / 2, 
      100, 
      `${playerChar} left the game\n${remainingCount} players remaining`, 
      {
        fontSize: "20px",
        color: "#ff6b6b",
        align: "center",
        backgroundColor: "#000000aa",
        padding: { x: 15, y: 10 },
        stroke: "#ffffff",
        strokeThickness: 1
      }
    ).setOrigin(0.5).setDepth(1000);

    // Fade out after 3 seconds
    this.scene.time.delayedCall(3000, () => {
      this.scene.tweens.add({
        targets: notification,
        alpha: 0,
        duration: 500,
        onComplete: () => notification.destroy()
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  cleanup() {
    this.disconnect();
    // Clean up any remaining references
    this.scene = null;
  }
}

// Create a singleton instance for lobby use
export const socketManager = new SocketManager();

// Export the class for game use
export default SocketManager;