import Phaser from "phaser";

// Import all the tileset assets properly for Vite
import marketplaceMap from "../assets/maps/marketplace.json";
import daisyRouteTiles from "../assets/maps/Daisy Route.png";
import clownJailTiles from "../assets/maps/Clown Jail.png";
import apathyHousesTiles from "../assets/maps/Apathy Houses.png";

// Import MarketPlacePlayer entity
import MarketPlacePlayer from "../entities/MarketPlacePlayer.js";

// Import MarketPlacePlayer image
import marketPlacePlayerImg from "../assets/marketplace_roam.png";

export default class MarketScene extends Phaser.Scene {
  constructor() {
    super("MarketScene");
    
    // MarketPlacePlayer properties
    this.marketPlacePlayer = null;
    this.marketPlacePlayerSpawned = false;
    this.collisionLayers = [];
  }

  preload() {
    // Load the Tiled JSON
    this.load.tilemapTiledJSON("marketplace", marketplaceMap);

    // Load all tileset images (keys must match what we'll use in addTilesetImage)
    this.load.image("daisy-route-tiles", daisyRouteTiles);
    this.load.image("clown-jail-tiles", clownJailTiles);
    this.load.image("apathy-houses-tiles", apathyHousesTiles);
    
    // Load MarketPlacePlayer character image
    this.load.spritesheet("MarketPlacePlayer", marketPlacePlayerImg, {
      frameWidth: 32,   // 128px / 4 frames
      frameHeight: 48,  // 192px / 4 rows
    });
  }

  create() {
    // Access gameData if passed from Market component
    const gameData = this.registry.get("gameData") || null;
    if (gameData) {
      console.log("Market received game data:", gameData);
    }

    // Create the map
    this.map = this.make.tilemap({ key: "marketplace" });

    // Add all tilesets (first parameter matches tileset name from JSON, second is the image key)
    const daisyRouteTileset = this.map.addTilesetImage("Daisy Route", "daisy-route-tiles");
    const clownJailTileset = this.map.addTilesetImage("Clown Jail", "clown-jail-tiles");
    const apathyHousesTileset = this.map.addTilesetImage("Apathy Houses", "apathy-houses-tiles");

    // Combine all tilesets for layer creation
    const allTilesets = [daisyRouteTileset, clownJailTileset, apathyHousesTileset];

    // Store layers for collision detection
    this.layers = {};
    this.collisionLayers = [];

    // Create layers - handle potential layer creation errors
    if (this.map.layers && this.map.layers.length > 0) {
      this.map.layers.forEach((layerData) => {
        try {
          // Pass all tilesets to each layer so it can use tiles from any tileset
          const layer = this.map.createLayer(layerData.name, allTilesets, 0, 0);
          if (layer) {
            // Optional: set layer properties if needed
            layer.setScale(1);
            this.layers[layerData.name] = layer;
            
            // Set collision based on layer name and content
            const layerNameLower = layerData.name.toLowerCase();
            
            if (layerNameLower.includes('shop') || 
                layerNameLower.includes('building') || 
                layerNameLower.includes('house') || 
                layerNameLower.includes('wall') || 
                layerNameLower.includes('obstacle') ||
                layerNameLower.includes('collision') ||
                layerData.name === 'Shops' ||
                layerData.name === 'Buildings' || 
                layerData.name === 'Walls' ||
                layerData.name === 'Obstacles') {
              
              // Set collision for all non-empty tiles in this layer
              layer.setCollisionByExclusion([-1, 0]); // All tiles except empty (-1) and transparent (0)
              this.collisionLayers.push(layer);
              console.log(`Set collision for layer: ${layerData.name}`);
              
            } else if (layerData.name.startsWith('Tile Layer')) {
              // Check if this is a border/boundary layer (typically Tile Layer 3)
              if (layerData.name === 'Tile Layer 3') {
                // This layer contains the border walls - set collision for border tiles
                const borderTileIds = [125, 126, 127, 128, 129, 130, 133, 134, 135, 136, 137, 138, 141, 142, 143, 121, 122, 123, 124, 131, 132, 139, 140, 223, 224, 238, 240, 222];
                layer.setCollisionByIncluding(borderTileIds);
                this.collisionLayers.push(layer);
                console.log(`Set collision for border layer: ${layerData.name}`);
              } else {
                // For other tile layers, check if they contain buildings
                const hasBuildings = this.checkLayerForBuildings(layer);
                if (hasBuildings) {
                  layer.setCollisionByExclusion([-1, 0]);
                  this.collisionLayers.push(layer);
                  console.log(`Set collision for tile layer with buildings: ${layerData.name}`);
                }
              }
            }
            
            console.log(`Successfully created layer: ${layerData.name}`);
          }
        } catch (error) {
          console.warn(`Failed to create layer ${layerData.name}:`, error);
        }
      });
    } else {
      console.warn("No layers found in marketplace tilemap");
    }

    // Set world bounds to map size
    const { widthInPixels, heightInPixels } = this.map;
    this.cameras.main.setBounds(0, 0, widthInPixels, heightInPixels);
    this.physics.world.setBounds(0, 0, widthInPixels, heightInPixels);

    // Store map dimensions
    this.mapWidth = widthInPixels;
    this.mapHeight = heightInPixels;

    // Set initial camera position to center of the map
    this.cameras.main.centerOn(widthInPixels / 2, heightInPixels / 2);

    // Add controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasdKeys = this.input.keyboard.addKeys('W,S,A,D');
    this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    // Store initial camera position for reset
    this.initialCameraX = widthInPixels / 2;
    this.initialCameraY = heightInPixels / 2;

    // Define walking animations for each direction
    this.anims.create({
      key: "walk-down",
      frames: this.anims.generateFrameNumbers("MarketPlacePlayer", { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1
    });

    this.anims.create({
      key: "walk-left",
      frames: this.anims.generateFrameNumbers("MarketPlacePlayer", { start: 4, end: 7 }),
      frameRate: 8,
      repeat: -1
    });

    this.anims.create({
      key: "walk-right",
      frames: this.anims.generateFrameNumbers("MarketPlacePlayer", { start: 8, end: 11 }),
      frameRate: 8,
      repeat: -1
    });

    this.anims.create({
      key: "walk-up",
      frames: this.anims.generateFrameNumbers("MarketPlacePlayer", { start: 12, end: 15 }),
      frameRate: 8,
      repeat: -1
    });


    // Spawn MarketPlacePlayer randomly (only once)
    if (!this.marketPlacePlayerSpawned) {
      this.spawnMarketPlacePlayer();
      this.marketPlacePlayerSpawned = true;
    }

    // Add shop interaction zones
    this.createShopZones();

    // Add some visual effects
    this.createMarketplaceEffects();

    // Add marketplace title overlay
    this.createMarketplaceTitle();
    
    // Log successful creation with map info
    console.log("Market scene created successfully");
    console.log(`Map dimensions: ${this.mapWidth}x${this.mapHeight}`);
    console.log(`Tilesets loaded: ${allTilesets.length}`);
    console.log(`Layers created: ${this.map.layers.length}`);
    console.log(`Collision layers: ${this.collisionLayers.length}`);
  }

  update(time, delta) {
    // Handle MarketPlacePlayer movement and camera following
    if (this.marketPlacePlayer) {
      // Handle MarketPlacePlayer keyboard movement
      this.marketPlacePlayer.handleMovement(this.cursors, this.wasdKeys, delta);
      
      // Make camera follow MarketPlacePlayer
      const marketPlacePlayerPos = this.marketPlacePlayer.getPosition();
      this.cameras.main.centerOn(marketPlacePlayerPos.x, marketPlacePlayerPos.y);
    }

    // Reset camera view with ESC key (centers on MarketPlacePlayer if spawned)
    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      if (this.marketPlacePlayer) {
        const marketPlacePlayerPos = this.marketPlacePlayer.getPosition();
        this.cameras.main.centerOn(marketPlacePlayerPos.x, marketPlacePlayerPos.y);
      } else {
        this.cameras.main.centerOn(this.initialCameraX, this.initialCameraY);
      }
      this.cameras.main.setZoom(1);
    }
  }

  createShopZones() {
    // Create interactive shop zones based on the marketplace layout
    const shopZones = [
      { x: 480, y: 320, width: 160, height: 160, name: "Potion Shop" },
      { x: 800, y: 320, width: 160, height: 160, name: "Equipment Store" },
      { x: 480, y: 640, width: 160, height: 160, name: "Pokemon Center" },
      { x: 800, y: 640, width: 160, height: 160, name: "Trade House" }
    ];

    shopZones.forEach(zone => {
      // Create invisible interactive zone
      const shopZone = this.add.zone(zone.x, zone.y, zone.width, zone.height);
      shopZone.setInteractive();
      
      // Add hover effects
      shopZone.on('pointerover', () => {
        this.showShopTooltip(zone.name, zone.x, zone.y - 80);
      });
      
      shopZone.on('pointerout', () => {
        this.hideShopTooltip();
      });
      
      shopZone.on('pointerdown', () => {
        this.openShop(zone.name);
      });
    });
  }

  createMarketplaceEffects() {
    try {
      // Add subtle ambient effects - simple floating particles
      const graphics = this.add.graphics();
      graphics.fillStyle(0xffffff, 0.3);
      
      // Create simple floating dots
      for (let i = 0; i < 10; i++) {
        const x = Phaser.Math.Between(0, this.cameras.main.width);
        const y = Phaser.Math.Between(0, this.cameras.main.height);
        
        const dot = this.add.circle(x, y, 2, 0xffffff, 0.4);
        
        // Add gentle floating animation
        this.tweens.add({
          targets: dot,
          y: y - 50,
          alpha: 0,
          duration: 4000,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    } catch (error) {
      console.warn("Could not create marketplace effects:", error);
    }
  }

  showShopTooltip(shopName, x, y) {
    // Remove existing tooltip
    this.hideShopTooltip();
    
    // Create new tooltip
    this.shopTooltip = this.add.container(x, y);
    
    const bg = this.add.rectangle(0, 0, shopName.length * 8 + 20, 30, 0x000000, 0.8);
    bg.setStrokeStyle(2, 0xffffff);
    
    const text = this.add.text(0, 0, shopName, {
      fontSize: '12px',
      fill: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    
    this.shopTooltip.add([bg, text]);
    this.shopTooltip.setScrollFactor(1); // Move with camera
  }

  hideShopTooltip() {
    if (this.shopTooltip) {
      this.shopTooltip.destroy();
      this.shopTooltip = null;
    }
  }

  openShop(shopName) {
    console.log(`Opening ${shopName}`);
    this.hideShopTooltip();
    
    // Create a simple shop dialog
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;
    
    const dialog = this.add.container(centerX, centerY);
    
    const bg = this.add.rectangle(0, 0, 300, 200, 0x222222, 0.9);
    bg.setStrokeStyle(3, 0xffffff);
    
    const title = this.add.text(0, -60, shopName, {
      fontSize: '18px',
      fill: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    
    const description = this.add.text(0, -20, 'Welcome to our shop!\nClick outside to close.', {
      fontSize: '14px',
      fill: '#cccccc',
      fontFamily: 'Arial',
      align: 'center'
    }).setOrigin(0.5);
    
    const closeBtn = this.add.text(0, 40, 'Close', {
      fontSize: '14px',
      fill: '#ffffff',
      fontFamily: 'Arial',
      backgroundColor: '#666666',
      padding: { x: 15, y: 8 }
    }).setOrigin(0.5).setInteractive();
    
    closeBtn.on('pointerdown', () => {
      dialog.destroy();
    });
    
    dialog.add([bg, title, description, closeBtn]);
    dialog.setScrollFactor(0); // Keep dialog in screen space
    
    // Close on background click
    this.input.once('pointerdown', (pointer, currentlyOver) => {
      if (currentlyOver.length === 0) {
        dialog.destroy();
      }
    });
  }

  createMarketplaceTitle() {
    // Add a welcome message that fades in
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;
    
    const titleContainer = this.add.container(centerX, centerY - 200);
    
    const titleBg = this.add.rectangle(0, 0, 400, 80, 0x000000, 0.7);
    titleBg.setStrokeStyle(2, 0xffd700);
    
    const titleText = this.add.text(0, 0, 'Welcome to PokiWars Marketplace', {
      fontSize: '20px',
      fill: '#ffd700',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    titleContainer.add([titleBg, titleText]);
    titleContainer.setScrollFactor(0); // Stay in screen space
    titleContainer.setAlpha(0);
    
    // Fade in and then fade out
    this.tweens.add({
      targets: titleContainer,
      alpha: 1,
      duration: 1000,
      ease: 'Power2.easeOut',
      yoyo: true,
      yoyoDelay: 2000,
      onComplete: () => {
        titleContainer.destroy();
      }
    });
  }

  // Spawn MarketPlacePlayer at a random valid location
  spawnMarketPlacePlayer() {
    // First create a temporary MarketPlacePlayer to get its properties
    const tempSpawn = this.getSafeSpawnPosition();
    
    // Create MarketPlacePlayer instance
    this.marketPlacePlayer = new MarketPlacePlayer(this, tempSpawn.x, tempSpawn.y, "MarketPlacePlayer");
    
    // Set collision with world bounds
    this.marketPlacePlayer.sprite.body.setCollideWorldBounds(true);
    
    // Add collision with all building/obstacle layers using proper collision detection
    this.collisionLayers.forEach((layer, index) => {
      this.physics.add.collider(this.marketPlacePlayer.sprite, layer, (sprite, tile) => {
        // Handle collision with improved response
        this.marketPlacePlayer.handleCollisionWithTile(tile);
      }, null, this);
    });
    
    // Pass reference to the scene for collision checking
    this.marketPlacePlayer.setScene(this);
    
    // Make camera follow MarketPlacePlayer immediately
    this.cameras.main.startFollow(this.marketPlacePlayer.sprite, true, 0.09, 0.09);
    this.cameras.main.setZoom(1);
    
    // Enable physics debug for visualization (set to true for debugging)
    if (this.physics.world.debugGraphic) {
      this.physics.world.debugGraphic.visible = false;
    }
    
    console.log(`MarketPlacePlayer spawned at: (${tempSpawn.x}, ${tempSpawn.y})`);
    console.log(`Collision layers setup: ${this.collisionLayers.length}`);
    
    // Validate spawn position after creation
    if (!this.isValidSpawnPosition(tempSpawn.x, tempSpawn.y)) {
      console.warn("Spawn validation failed, attempting repositioning...");
      const newPos = this.getSafeSpawnPosition();
      this.marketPlacePlayer.sprite.setPosition(newPos.x, newPos.y);
      console.log(`MarketPlacePlayer repositioned to: (${newPos.x}, ${newPos.y})`);
    }
  }



  // Check if a position is valid for spawning (not on buildings/obstacles)
  isValidSpawnPosition(x, y, characterRadius = 25) {
    if (!this.map) return true;
    
    // Check tile-based collision at the spawn position
    const tileX = Math.floor(x / this.map.tileWidth);
    const tileY = Math.floor(y / this.map.tileHeight);
    
    // Check if the position is within map bounds
    if (tileX < 0 || tileY < 0 || tileX >= this.map.width || tileY >= this.map.height) {
      return false;
    }
    
    // Check collision in a small area around the spawn point to ensure enough space
    const checkRadius = Math.ceil(characterRadius / this.map.tileWidth) + 1;
    
    for (let checkY = tileY - checkRadius; checkY <= tileY + checkRadius; checkY++) {
      for (let checkX = tileX - checkRadius; checkX <= tileX + checkRadius; checkX++) {
        if (checkX < 0 || checkY < 0 || checkX >= this.map.width || checkY >= this.map.height) {
          continue;
        }
        
        // Check all collision layers for solid tiles
        for (const layer of this.collisionLayers) {
          const tile = this.map.getTileAt(checkX, checkY, false, layer);
          if (tile && tile.index > 0) {
            // Calculate distance from spawn point to this tile center
            const tileCenterX = (checkX + 0.5) * this.map.tileWidth;
            const tileCenterY = (checkY + 0.5) * this.map.tileHeight;
            const distance = Math.sqrt((x - tileCenterX) ** 2 + (y - tileCenterY) ** 2);
            
            // If tile is too close to spawn point, reject this position
            if (distance < characterRadius + 16) { // 16 = half tile size for buffer
              return false;
            }
          }
        }
      }
    }
    
    return true;
  }

  // Helper method to check if a layer contains buildings (non-empty tiles)
  checkLayerForBuildings(layer) {
    if (!layer || !layer.layer || !layer.layer.data) {
      return false;
    }
    
    // Check if layer has any non-empty tiles (indicating buildings/structures)
    const data = layer.layer.data;
    for (let i = 0; i < data.length; i++) {
      if (data[i] && data[i].index > 0) {
        return true;
      }
    }
    return false;
  }

  // Check if there's a collision at world coordinates
  hasCollisionAt(worldX, worldY) {
    if (!this.map) return false;
    
    const tileX = Math.floor(worldX / this.map.tileWidth);
    const tileY = Math.floor(worldY / this.map.tileHeight);
    
    // Check bounds
    if (tileX < 0 || tileY < 0 || tileX >= this.map.width || tileY >= this.map.height) {
      return true; // Treat out of bounds as collision
    }
    
    // Check all collision layers
    for (const layer of this.collisionLayers) {
      const tile = this.map.getTileAt(tileX, tileY, false, layer);
      if (tile && tile.index > 0 && tile.collides) {
        return true;
      }
    }
    
    return false;
  }

  // Get a safe spawn position that avoids all collision areas
  getSafeSpawnPosition() {
    const padding = 100;
    const maxAttempts = 1000;
    const characterRadius = 25;
    
    // Try to find a safe position
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const x = Math.random() * (this.mapWidth - padding * 2) + padding;
      const y = Math.random() * (this.mapHeight - padding * 2) + padding;
      
      if (this.isValidSpawnPosition(x, y, characterRadius)) {
        return { x, y };
      }
    }
    
    // If random placement fails, try specific safe zones
    const safeZones = [
      // Center areas of the map that should be clear
      { x: this.mapWidth * 0.15, y: this.mapHeight * 0.15, width: this.mapWidth * 0.1, height: this.mapHeight * 0.1 },
      { x: this.mapWidth * 0.75, y: this.mapHeight * 0.15, width: this.mapWidth * 0.1, height: this.mapHeight * 0.1 },
      { x: this.mapWidth * 0.45, y: this.mapHeight * 0.45, width: this.mapWidth * 0.1, height: this.mapHeight * 0.1 },
      { x: this.mapWidth * 0.15, y: this.mapHeight * 0.75, width: this.mapWidth * 0.1, height: this.mapHeight * 0.1 },
      { x: this.mapWidth * 0.75, y: this.mapHeight * 0.75, width: this.mapWidth * 0.1, height: this.mapHeight * 0.1 }
    ];
    
    for (const zone of safeZones) {
      for (let attempt = 0; attempt < 50; attempt++) {
        const x = zone.x + Math.random() * zone.width;
        const y = zone.y + Math.random() * zone.height;
        
        if (this.isValidSpawnPosition(x, y, characterRadius)) {
          console.log(`Found safe zone spawn at (${x}, ${y})`);
          return { x, y };
        }
      }
    }
    
    // Last resort - center of the map
    console.warn("Could not find safe spawn position, using map center");
    return { 
      x: this.mapWidth / 2, 
      y: this.mapHeight / 2 
    };
  }

  // Clean up when scene is destroyed
  shutdown() {
    if (this.marketPlacePlayer) {
      this.marketPlacePlayer.destroy();
      this.marketPlacePlayer = null;
    }
    this.marketPlacePlayerSpawned = false;
    this.collisionLayers = [];
  }
}