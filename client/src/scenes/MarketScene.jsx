import Phaser from "phaser";

// Tile assets
import marketplaceMap from "../assets/maps/marketplace.json";
import daisyRouteTiles from "../assets/maps/Daisy Route.png";
import clownJailTiles from "../assets/maps/Clown Jail.png";
import apathyHousesTiles from "../assets/maps/Apathy Houses.png";

// Player
import MarketPlacePlayer from "../entities/MarketPlacePlayer.js";
import marketPlacePlayerImg from "../assets/marketplace_roam.png";

export default class MarketScene extends Phaser.Scene {
  constructor() {
    super("MarketScene");
    this.marketPlacePlayer = null;
    this.marketPlacePlayerSpawned = false;
    this.collisionLayers = [];
  }

  preload() {
    this.load.tilemapTiledJSON("marketplace", marketplaceMap);
    this.load.image("daisy-route-tiles", daisyRouteTiles);
    this.load.image("clown-jail-tiles", clownJailTiles);
    this.load.image("apathy-houses-tiles", apathyHousesTiles);
    this.load.spritesheet("MarketPlacePlayer", marketPlacePlayerImg, {
      frameWidth: 32,
      frameHeight: 48,
    });
  }

  create() {
    const gameData = this.registry.get("gameData") || null;
    if (gameData) console.log("Market received game data:", gameData);

    // Create map
    this.map = this.make.tilemap({ key: "marketplace" });
    const daisyRouteTileset = this.map.addTilesetImage("Daisy Route", "daisy-route-tiles");
    const clownJailTileset = this.map.addTilesetImage("Clown Jail", "clown-jail-tiles");
    const apathyHousesTileset = this.map.addTilesetImage("Apathy Houses", "apathy-houses-tiles");
    const allTilesets = [daisyRouteTileset, clownJailTileset, apathyHousesTileset];

    this.layers = {};
    this.collisionLayers = [];

    // Create layers & set collision for walls/buildings
    this.map.layers.forEach(layerData => {
      const layer = this.map.createLayer(layerData.name, allTilesets, 0, 0);
      if (!layer) return;

      this.layers[layerData.name] = layer;

      if (
        /shop|building|house|wall|obstacle/i.test(layerData.name) ||
        ["Shops", "Buildings", "Walls", "Obstacles"].includes(layerData.name)
      ) {
        layer.setCollisionByExclusion([-1, 0]);
        this.collisionLayers.push(layer);
      }
    });

    // World & camera bounds
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.initialCameraX = this.map.widthInPixels / 2;
    this.initialCameraY = this.map.heightInPixels / 2;
    this.cameras.main.centerOn(this.initialCameraX, this.initialCameraY);

    // Controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasdKeys = this.input.keyboard.addKeys("W,S,A,D");
    this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    // Player animations
    ["down", "left", "right", "up"].forEach((dir, i) => {
      this.anims.create({
        key: `walk-${dir}`,
        frames: this.anims.generateFrameNumbers("MarketPlacePlayer", { start: i * 4, end: i * 4 + 3 }),
        frameRate: 8,
        repeat: -1,
      });
    });

    // Spawn player
    if (!this.marketPlacePlayerSpawned) {
      this.spawnMarketPlacePlayer();
      this.marketPlacePlayerSpawned = true;
    }

    // Create shop zones
    this.createShopZones();

    // Optional: simple particle effects
    this.createMarketplaceEffects();
  }

  update(time, delta) {
    if (this.marketPlacePlayer) {
      this.marketPlacePlayer.handleMovement(this.cursors, this.wasdKeys, delta);
      const pos = this.marketPlacePlayer.getPosition();
      this.cameras.main.centerOn(pos.x, pos.y);
    }

    if (Phaser.Input.Keyboard.JustDown(this.escKey) && this.marketPlacePlayer) {
      const pos = this.marketPlacePlayer.getPosition();
      this.cameras.main.centerOn(pos.x, pos.y);
      this.cameras.main.setZoom(1);
    }
  }

  createShopZones() {
    const data = [{ x: 800, y: 640, width: 64, height: 96, name: "Store" }];

    this.shopZones = data.map(d => {
      const zone = this.add.zone(d.x, d.y, d.width, d.height).setOrigin(0.5);
      this.physics.add.existing(zone);
      zone.body.setAllowGravity(false);
      zone.body.setImmovable(true);
      zone.shopName = d.name;
      return zone;
    });
  }

  createMarketplaceEffects() {
    const graphics = this.add.graphics();
    graphics.fillStyle(0xffffff, 0.3);
    for (let i = 0; i < 10; i++) {
      const x = Phaser.Math.Between(0, this.cameras.main.width);
      const y = Phaser.Math.Between(0, this.cameras.main.height);
      const dot = this.add.circle(x, y, 2, 0xffffff, 0.4);
      this.tweens.add({
        targets: dot,
        y: y - 50,
        alpha: 0,
        duration: 4000,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  }

  spawnMarketPlacePlayer() {
    const spawn = this.getSafeSpawnPosition();
    this.marketPlacePlayer = new MarketPlacePlayer(this, spawn.x, spawn.y, "MarketPlacePlayer");
    this.marketPlacePlayer.sprite.body.setCollideWorldBounds(true);

    this.collisionLayers.forEach(layer => {
      this.physics.add.collider(this.marketPlacePlayer.sprite, layer, (sprite, tile) => {
        this.marketPlacePlayer.handleCollisionWithTile(tile);
      });
    });

    this.marketPlacePlayer.setScene(this);
    this.cameras.main.startFollow(this.marketPlacePlayer.sprite, true, 0.09, 0.09);
    this.cameras.main.setZoom(1);
  }

  isValidSpawnPosition(x, y, radius = 25) {
    if (!this.map) return true;
    const tileX = Math.floor(x / this.map.tileWidth);
    const tileY = Math.floor(y / this.map.tileHeight);
    if (tileX < 0 || tileY < 0 || tileX >= this.map.width || tileY >= this.map.height) return false;

    for (let layer of this.collisionLayers) {
      const tile = this.map.getTileAt(tileX, tileY, false, layer);
      if (tile && tile.index > 0 && tile.collides) return false;
    }
    return true;
  }

  getSafeSpawnPosition() {
    const padding = 100;
    for (let attempt = 0; attempt < 1000; attempt++) {
      const x = Math.random() * (this.map.widthInPixels - padding * 2) + padding;
      const y = Math.random() * (this.map.heightInPixels - padding * 2) + padding;
      if (this.isValidSpawnPosition(x, y)) return { x, y };
    }
    return { x: this.map.widthInPixels / 2, y: this.map.heightInPixels / 2 };
  }
}
