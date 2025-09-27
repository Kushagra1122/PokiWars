import Phaser from "phaser";
import SocketManager from "../network/SocketManager";
import InputHandler from "../utils/InputHandler";
import Effects from "../utils/Effects";
import Player from "../entities/Player";
import GameUI from "../ui/GameUI";
import GameOverlay from "../ui/GameOverlay";
import HealthBar from "../ui/HealthBar";
import React from "react";
import { createRoot } from "react-dom/client";
import InGameLeaderboard from "../components/InGameLeaderboard";

import tilesImg from "../assets/maps/snow-tileset (1).png";
import mapJSON from "../assets/maps/snowMap.json";

export default class MainGameScene extends Phaser.Scene {
  constructor() {
    super("mainGame");
    this.moveSpeed = 200;
    this.shootCooldown = 250;
    this.lastShotTime = 0;
    this.interpolationFactor = 0.1;
    
    // Timer properties
    this.gameTimer = null;
    this.gameTimeLimit = 0; // Will be set from lobby settings
    this.gameTimeRemaining = 0;
    this.timerText = null;
    this.isTimerActive = false;
  }

  preload() {
    this.load.image("tiles", tilesImg);
    this.load.tilemapTiledJSON("map", mapJSON);
    
    // Load character images using proper import paths
    const chars = ["ALAKAZAM", "BLASTOISE", "CHARIZARD", "GENGAR", "SNORLAX", "VENUSAUR"];
    chars.forEach((char) => {
      this.load.spritesheet(char, `src/assets/characters/${char}.png`, {
        frameWidth: 64,
        frameHeight: 64
      });
    });
  }

  create() {
    const selectedChar = this.registry.get("selectedCharacter") || "ALAKAZAM";
    this.gameState = { isGameOver: false, winner: null };
    
    // Get game settings from registry or default values
    const gameSettings = this.registry.get("gameSettings") || { timeLimit: 10 };
    this.gameTimeLimit = gameSettings.timeLimit * 60; // Convert minutes to seconds
    this.gameTimeRemaining = this.gameTimeLimit;

    // --- TILEMAP SETUP ---
    this.map = this.make.tilemap({ key: "map" });
    const tileset = this.map.addTilesetImage("snow-tileset (1)", "tiles");

    this.groundLayer = this.map.createLayer("Ground", tileset, 0, 0);
    this.treesLayer = this.map.createLayer("Trees", tileset, 0, 0);
    this.stonesLayer = this.map.createLayer("Stones", tileset, 0, 0);
    this.slideLayer = this.map.createLayer("Slide", tileset, 0, 0);
    this.elevatedLayer = this.map.createLayer("Elevated", tileset, 0, 0);

    this.treesLayer.setCollisionByProperty({ collision: true });
    this.stonesLayer.setCollisionByProperty({ collision: true });

    // --- TILE SIZE ---
    this.tileWidth = tileset.tileWidth;
    this.tileHeight = tileset.tileHeight;

    // --- SCREEN REDUCTION (-190) ---
    const screenWidth = this.scale.width - 190;
    const screenHeight = this.scale.height - 190;
    const mapWidth = this.map.widthInPixels;
    const mapHeight = this.map.heightInPixels;

    this.scaleX = screenWidth / mapWidth;
    this.scaleY = screenHeight / mapHeight;
    // Apply scale to all layers
    [this.groundLayer, this.treesLayer, this.stonesLayer, this.slideLayer, this.elevatedLayer].forEach(layer => {
      layer.setScale(this.scaleX, this.scaleY);
    });

    // --- CAMERA & WORLD BOUNDS ---
    this.physics.world.setBounds(0, 0, mapWidth * this.scaleX, mapHeight * this.scaleY);
    this.cameras.main.setBounds(0, 0, mapWidth * this.scaleX, mapHeight * this.scaleY);
    this.cameras.main.centerOn(screenWidth / 2, screenHeight / 2);

    // --- PLAYER: FIND VALID SPAWN POSITION ---
    const validSpawn = this.findValidSpawnPosition();
    this.player = new Player(this, validSpawn.x, validSpawn.y, selectedChar);
    this.player.sprite.setDisplaySize(this.tileWidth * this.scaleX, this.tileHeight * this.scaleY);
    this.physics.add.collider(this.player.sprite, this.treesLayer);
    this.physics.add.collider(this.player.sprite, this.stonesLayer);

    this.createAnimations(selectedChar);

    // Depth ordering
    this.groundLayer.setDepth(0);
    this.slideLayer.setDepth(1);
    this.elevatedLayer.setDepth(2);
    this.treesLayer.setDepth(3);
    this.stonesLayer.setDepth(3);
    this.player.sprite.setDepth(250); // Local player gets highest depth among players

    // --- UI ---
    this.gameUI = new GameUI(this);
    this.gameOverlay = new GameOverlay(this);
    this.createPlayerHealthBar();
    this.createGameTimer();
    this.setupGameElements();

    // --- MANAGERS ---
    this.socketManager = new SocketManager(this);
    this.inputHandler = new InputHandler(this);
    this.effects = new Effects(this);

    // Initialize leaderboard
    this.initializeLeaderboard();

    // Connect to server
    this.socketManager.connectForGame(selectedChar);
  }

  initializeLeaderboard() {
    // Create a container for the React leaderboard component
    const leaderboardContainer = document.createElement('div');
    leaderboardContainer.id = 'leaderboard-container';
    leaderboardContainer.style.position = 'fixed';
    leaderboardContainer.style.top = '0';
    leaderboardContainer.style.left = '0';
    leaderboardContainer.style.width = '100%';
    leaderboardContainer.style.height = '100%';
    leaderboardContainer.style.pointerEvents = 'none';
    leaderboardContainer.style.zIndex = '1000';
    
    document.body.appendChild(leaderboardContainer);
    
    // Create React root and render the leaderboard
    this.leaderboardRoot = createRoot(leaderboardContainer);
    this.leaderboardRoot.render(React.createElement(InGameLeaderboard, { 
      isVisible: true 
    }));
  }

  createAnimations(selectedChar) {
    const characters = ["ALAKAZAM", "BLASTOISE", "CHARIZARD", "GENGAR", "SNORLAX", "VENUSAUR"];
    const directions = ["down", "left", "right", "up"]; // Row order
    const frameRate = 8;

    characters.forEach(char => {
      directions.forEach((dir, rowIndex) => {
        // Walking animation (4 frames per row)
        this.anims.create({
          key: `${char}_${dir}`,
          frames: this.anims.generateFrameNumbers(char, {
            start: rowIndex * 4,
            end: rowIndex * 4 + 3
          }),
          frameRate: frameRate,
          repeat: -1
        });

        // Idle animation (first frame of each row)
        this.anims.create({
          key: `${char}_${dir}_idle`,
          frames: [{ key: char, frame: rowIndex * 4 }],
          frameRate: 1,
          repeat: -1
        });
      });
    });

    // Play selected character's default idle animation
    if (this.player?.sprite) {
      this.player.sprite.anims.play(`${selectedChar}_down_idle`);
    }
  }


  setupGameElements() {
    this.shootRange = 150;
    this.bullets = this.add.group();

    this.crosshair = this.add.circle(0, 0, 2, 0xff0000).setDepth(100);
    this.aimLine = this.add.graphics().setDepth(90);

    this.otherPlayers = {};
    this.otherPlayerTargets = {};
    this.lastUpdateTime = 0;
  }

  update(time, delta) {
    if (!this.player || this.gameState.isGameOver) return;

    const { moveX, moveY } = this.inputHandler.getMovementDirection();
    const speed = this.moveSpeed;

    this.player.sprite.body.setVelocity(0);

    if (moveX !== 0 || moveY !== 0) {
      this.player.sprite.body.setVelocity(moveX * speed, moveY * speed);
      this.player.sprite.body.velocity.normalize().scale(speed);

      // Emit movement to server every 50ms
      if (this.time.now - this.lastUpdateTime > 50) {
        this.socketManager.emitMovement(this.player.sprite.x, this.player.sprite.y);
        this.lastUpdateTime = this.time.now;
      }

      // Determine animation based on direction
      let direction = "down"; // default
      if (Math.abs(moveX) > Math.abs(moveY)) {
        direction = moveX < 0 ? "left" : "right";
      } else if (Math.abs(moveY) > 0) {
        direction = moveY < 0 ? "up" : "down";
      }

      // Play walking animation if not already playing
      const walkAnim = `${this.player.char}_${direction}`;
      if (this.player.sprite.anims.getCurrentKey() !== walkAnim) {
        this.player.sprite.anims.play(walkAnim, true);
      }

    } else {
      // Idle animation based on last direction
      const currentAnim = this.player.sprite.anims.getCurrentKey();
      if (currentAnim && !currentAnim.includes("_idle")) {
        const idleAnim = `${this.player.char}_${currentAnim.split("_")[1]}_idle`;
        this.player.sprite.anims.play(idleAnim, true);
      }

      // Stop movement
      this.player.sprite.body.setVelocity(0);
    }

    this.inputHandler.update(delta);
    this.updateBullets(delta);
    this.interpolateOtherPlayers();
    this.updatePlayerHealthBar();
    this.updateOtherPlayersUI();
    this.updateGameTimer();
  }

  updateBullets(delta) {
    this.bullets.children.entries.forEach((bullet) => {
      bullet.x += bullet.velocityX * (delta / 1000);
      bullet.y += bullet.velocityY * (delta / 1000);

      const dx = bullet.targetX - bullet.startX;
      const dy = bullet.targetY - bullet.startY;
      const bulletDx = bullet.x - bullet.startX;
      const bulletDy = bullet.y - bullet.startY;

      if (bulletDx * dx + bulletDy * dy >= dx * dx + dy * dy) {
        bullet.destroy();
        return;
      }

      if (bullet.x < 0 || bullet.x > this.scale.width || bullet.y < 0 || bullet.y > this.scale.height) {
        bullet.destroy();
      }
    });
  }

  interpolateOtherPlayers() {
    Object.keys(this.otherPlayers).forEach((id) => {
      const player = this.otherPlayers[id];
      const target = this.otherPlayerTargets[id];
      if (!target) return;

      player.sprite.x = Phaser.Math.Linear(player.sprite.x, target.x, this.interpolationFactor);
      player.sprite.y = Phaser.Math.Linear(player.sprite.y, target.y, this.interpolationFactor);
    });
  }

  updateOtherPlayersUI() {
    Object.values(this.otherPlayers).forEach((player) => {
      if (player.healthBar) {
        player.healthBar.update(player.health);
        player.healthBar.updatePosition(player.sprite.x, player.sprite.y);
      }
    });
  }



  updatePlayerHealthBar() {
    if (this.player?.healthBar) {
      this.player.healthBar.update(this.player.health);
      this.player.healthBar.updatePosition(this.player.sprite.x, this.player.sprite.y);
    }
  }

  // ✅ Public method for SocketManager
  updateOtherPlayerHealthBar(player) {
    if (player?.healthBar) {
      player.healthBar.update(player.health);
      player.healthBar.updatePosition(player.sprite.x, player.sprite.y);
    }
  }

  shoot() {
    const currentTime = this.time.now;
    if (currentTime - this.lastShotTime < this.shootCooldown) return;
    this.lastShotTime = currentTime;

    const pointer = this.input.activePointer;
    const angle = Math.atan2(pointer.worldY - this.player.sprite.y, pointer.worldX - this.player.sprite.x);

    this.createBullet(this.player.sprite.x, this.player.sprite.y, angle);

    const hitTargets = [];
    Object.keys(this.otherPlayers).forEach((id) => {
      const target = this.otherPlayers[id].sprite;
      const distance = Phaser.Math.Distance.Between(this.player.sprite.x, this.player.sprite.y, target.x, target.y);

      if (distance <= this.shootRange) {
        const lineEnd = {
          x: this.player.sprite.x + Math.cos(angle) * this.shootRange,
          y: this.player.sprite.y + Math.sin(angle) * this.shootRange,
        };

        // Use the physics body radius for collision detection
        const targetRadius = target.body ? target.body.radius : 30;
        if (
          this.lineCircleIntersection(this.player.sprite.x, this.player.sprite.y, lineEnd.x, lineEnd.y, target.x, target.y, targetRadius)
        ) {
          if (!this.lineIntersectsObstacle(this.player.sprite.x, this.player.sprite.y, target.x, target.y)) {
            hitTargets.push(id);
          } else {
            this.bullets.children.entries.forEach(b => b.destroy());
          }
        }
      }
    });

    if (hitTargets.length > 0) {
      const closestTarget = hitTargets.reduce((closest, current) => {
        const dist = (id) =>
          Phaser.Math.Distance.Between(this.player.sprite.x, this.player.sprite.y, this.otherPlayers[id].sprite.x, this.otherPlayers[id].sprite.y);
        return dist(current) < dist(closest) ? current : closest;
      }, hitTargets[0]);

      this.socketManager.emitHit(closestTarget);
    }
  }

  createBullet(x, y, angle) {
    const speed = 800;
    const targetX = this.crosshair.x;
    const targetY = this.crosshair.y;

    const bullet = this.add.circle(x, y, 3, 0xffff00);
    bullet.setDepth(80); // Set bullets above game elements but below UI
    bullet.velocityX = Math.cos(angle) * speed;
    bullet.velocityY = Math.sin(angle) * speed;
    bullet.startX = x;
    bullet.startY = y;
    bullet.targetX = targetX;
    bullet.targetY = targetY;

    this.bullets.add(bullet);
    this.effects.createBulletTrail(x, y, angle);
  }

  lineCircleIntersection(x1, y1, x2, y2, cx, cy, radius) {
    const A = y2 - y1;
    const B = x1 - x2;
    const C = x2 * y1 - x1 * y2;
    const distance = Math.abs(A * cx + B * cy + C) / Math.sqrt(A * A + B * B);
    return distance <= radius;
  }

  lineIntersectsObstacle(x1, y1, x2, y2) {
    const line = new Phaser.Geom.Line(x1, y1, x2, y2);
    const obstacles = [this.treesLayer, this.stonesLayer];
    for (const layer of obstacles) {
      const tiles = layer.getTilesWithinShape(line, { isColliding: true });
      if (tiles.length > 0) return true;
    }
    return false;
  }

  takeDamage(damage) {
    this.player.takeDamage(damage);
    this.gameUI.updateHealthBar(this.player.health);
    this.updatePlayerHealthBar();
    this.effects.createScreenShake();
    this.effects.createScreenFlash();
  }

  showGameOver(winnerId, winnerChar) {
    this.gameState.isGameOver = true;
    this.gameOverlay.showGameOver(winnerId === this.socketManager.socket.id, winnerChar);
  }

  addOtherPlayer(playerInfo, id) {
    const { x, y, char, health, score } = playerInfo;
    const otherPlayer = new Player(this, x, y, char);
    otherPlayer.health = health;
    otherPlayer.score = score;
    otherPlayer.sprite.setDisplaySize(this.tileWidth * this.scaleX, this.tileHeight * this.scaleY);
    otherPlayer.sprite.setDepth(220); // Opponents get high depth but less than local player

    this.otherPlayers[id] = otherPlayer;
    this.otherPlayerTargets[id] = { x, y };

    this.createOtherPlayerHealthBar(otherPlayer);
    this.physics.add.collider(otherPlayer.sprite, this.treesLayer);
    this.physics.add.collider(otherPlayer.sprite, this.stonesLayer);
  }

  createOtherPlayerHealthBar(player) {
    player.healthBar = new HealthBar(this, player.sprite.x, player.sprite.y, player.health, 100);
  }

  createPlayerHealthBar() {
    this.player.healthBar = new HealthBar(this, this.player.sprite.x, this.player.sprite.y, this.player.health, 100, true);
  }

  createGameTimer() {
    // Create timer display in top center of screen
    const centerX = this.scale.width / 2;
    const topY = 30;
    
    // Timer background
    this.timerBg = this.add.rectangle(centerX, topY, 150, 40, 0x000000, 0.7)
      .setDepth(1000);
    
    // Timer text
    this.timerText = this.add.text(centerX, topY, this.formatTime(this.gameTimeRemaining), {
      fontSize: '20px',
      fontFamily: 'Arial',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(1001);
  }

  updateGameTimer() {
    if (!this.isTimerActive || this.gameState.isGameOver) return;
    
    // Update timer every second
    if (this.time.now % 1000 < 16) { // Roughly once per second
      this.gameTimeRemaining--;
      
      if (this.timerText) {
        this.timerText.setText(this.formatTime(this.gameTimeRemaining));
        
        // Change color as time runs out
        if (this.gameTimeRemaining <= 30) {
          this.timerText.setFill('#ff0000'); // Red for last 30 seconds
        } else if (this.gameTimeRemaining <= 60) {
          this.timerText.setFill('#ffff00'); // Yellow for last minute
        } else {
          this.timerText.setFill('#ffffff'); // White normally
        }
      }
      
      // End game when timer reaches 0
      if (this.gameTimeRemaining <= 0) {
        this.handleTimeUp();
      }
    }
  }

  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  startGameTimer() {
    this.isTimerActive = true;
  }

  stopGameTimer() {
    this.isTimerActive = false;
  }

  handleTimeUp() {
    this.stopGameTimer();
    this.gameState.isGameOver = true;
    
    // Determine winner based on highest health or score
    let winnerId = null;
    let winnerChar = null;
    let highestScore = this.player.health || 0;
    
    // Check other players
    Object.keys(this.otherPlayers).forEach(id => {
      const player = this.otherPlayers[id];
      if (player.health > highestScore) {
        highestScore = player.health;
        winnerId = id;
        winnerChar = player.sprite.texture.key;
      }
    });
    
    // If local player has highest score, they win
    if (highestScore === this.player.health) {
      winnerId = this.socketManager.socket.id;
      winnerChar = this.player.sprite.texture.key;
    }
    
    this.showGameOver(winnerId, winnerChar);
  }

  isValidSpawnPosition(x, y, minDistance = 32) {
    // Convert world coordinates to unscaled coordinates for tilemap checking
    const unscaledX = x / this.scaleX;
    const unscaledY = y / this.scaleY;
    
    const tileX = this.map.worldToTileX(unscaledX);
    const tileY = this.map.worldToTileY(unscaledY);
    
    // Check area around spawn position for collision tiles
    const radiusInTiles = Math.ceil(minDistance / Math.min(this.tileWidth, this.tileHeight));
    
    for (let offsetY = -radiusInTiles; offsetY <= radiusInTiles; offsetY++) {
        for (let offsetX = -radiusInTiles; offsetX <= radiusInTiles; offsetX++) {
            const checkX = tileX + offsetX;
            const checkY = tileY + offsetY;
            
            // Check if tile coordinates are within map bounds
            if (checkX < 0 || checkX >= this.map.width || checkY < 0 || checkY >= this.map.height) {
                continue;
            }
            
            // Check collision layers
            if (this.treesLayer.hasTileAt(checkX, checkY)) {
                const tileCenterX = (checkX + 0.5) * this.tileWidth * this.scaleX;
                const tileCenterY = (checkY + 0.5) * this.tileHeight * this.scaleY;
                const distance = Math.sqrt(Math.pow(x - tileCenterX, 2) + Math.pow(y - tileCenterY, 2));
                
                if (distance < minDistance) {
                    return false;
                }
            }
            
            if (this.stonesLayer.hasTileAt(checkX, checkY)) {
                const tileCenterX = (checkX + 0.5) * this.tileWidth * this.scaleX;
                const tileCenterY = (checkY + 0.5) * this.tileHeight * this.scaleY;
                const distance = Math.sqrt(Math.pow(x - tileCenterX, 2) + Math.pow(y - tileCenterY, 2));
                
                if (distance < minDistance) {
                    return false;
                }
            }
        }
    }
    
    return true;
  }

  findValidSpawnPosition(maxAttempts = 100) {
    const screenWidth = this.scale.width - 190;
    const screenHeight = this.scale.height - 190;
    const padding = 50; // Keep away from edges

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const x = Math.random() * (screenWidth - padding * 2) + padding;
      const y = Math.random() * (screenHeight - padding * 2) + padding;

      if (this.isValidSpawnPosition(x, y)) {
        return { x, y };
      }
    }

    // Fallback to center if no valid position found
    return { x: screenWidth / 2, y: screenHeight / 2 };
  }

  shutdown() {
    // Stop timer
    this.stopGameTimer();
    
    // Clean up timer UI
    this.timerText?.destroy();
    this.timerBg?.destroy();
    
    // Clean up UI elements
    this.crosshair?.destroy();
    this.aimLine?.destroy();
    
    // Clean up player health bars
    if (this.player?.healthBar) {
      this.player.healthBar.destroy();
    }
    
    // Clean up other players
    Object.values(this.otherPlayers).forEach((p) => {
      if (p.healthBar) p.healthBar.destroy();
      if (p.sprite) p.sprite.destroy();
    });
    
    // Clean up bullets
    if (this.bullets) {
      this.bullets.clear(true, true);
    }
    
    // Clean up leaderboard
    if (this.leaderboardRoot) {
      this.leaderboardRoot.unmount();
    }
    
    // Remove leaderboard container
    const leaderboardContainer = document.getElementById('leaderboard-container');
    if (leaderboardContainer) {
      leaderboardContainer.remove();
    }
    
    // Clean up network manager
    if (this.socketManager) {
      this.socketManager.cleanup();
    }
    
    // Clean up input handlers
    if (this.inputHandler) {
      this.input.keyboard.removeAllListeners();
      this.input.removeAllListeners();
    }
  }
}
