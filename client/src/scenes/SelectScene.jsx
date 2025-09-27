import Phaser from "phaser";

export default class SelectScene extends Phaser.Scene {
  constructor() {
    super("select");
  }

  preload() {
    this.loadCharacterAssets();
  }

  loadCharacterAssets() {
    // Get pokemonCollection from registry (passed from React component)
    const pokemonCollection = this.registry.get('pokemonCollection') || [];
    
    if (!pokemonCollection || pokemonCollection.length === 0) {
      console.warn("No pokemon collection available");
      return;
    }

    // Load character images from pokemonCollection
    pokemonCollection.forEach(pokemon => {
      if (pokemon.name && pokemon.image) {
        this.load.image(pokemon.name, pokemon.image);
      }
    });
  }

  create() {
    const { width, height } = this.scale;
    const pokemonCollection = this.registry.get('pokemonCollection') || [];

    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x1a1a2e, 0x16213e, 0x0f3460, 0x533483);
    graphics.fillRect(0, 0, width, height);

    const title = this.add
      .text(width / 2, height * 0.15, "MULTIPLAYER SHOOTER", {
        fontSize: "36px",
        fontFamily: "Arial, sans-serif",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.22, "Select Your Character", {
        fontSize: "24px",
        color: "#cccccc",
        fontStyle: "italic",
      })
      .setOrigin(0.5);

    // Create characters array from pokemonCollection
    const characters = pokemonCollection.map(pokemon => ({
      name: pokemon.name,
      color: this.getColorForPokemon(pokemon.name) // You can customize this
    }));

    if (characters.length === 0) {
      this.showNoPokemonMessage();
      return;
    }

    const startY = height * 0.4;
    const spacing = 120;
    const selectedChar = this.registry.get("selectedCharacter") || characters[0].name;
    this.selectedCharacter = selectedChar;

    this.characterButtons = [];

    characters.forEach((char, i) => {
      const x = width / 2;
      const y = startY + i * spacing;

      const container = this.add.container(x, y);

      const selectionBg = this.add.rectangle(0, 0, 350, 100, 0x333333, 0.3);
      selectionBg.setStrokeStyle(3, 0x666666);

      const sprite = this.add.image(-120, 0, char.name);
      sprite.setScale(0.6);

      const nameText = this.add
        .text(-20, -15, char.name, {
          fontSize: "28px",
          color: char.color,
          fontStyle: "bold",
        })
        .setOrigin(0, 0.5);

      const indicator = this.add.circle(120, 0, 12, 0x00ff00);
      indicator.setStrokeStyle(2, 0xffffff);
      indicator.setVisible(char.name === this.selectedCharacter);

      container.add([selectionBg, sprite, nameText, indicator]);

      selectionBg.setInteractive({ useHandCursor: true });

      selectionBg.on("pointerover", () => {
        selectionBg.setFillStyle(0x444444, 0.5);
        sprite.setScale(0.65);
        this.tweens.add({
          targets: container,
          scaleX: 1.05,
          scaleY: 1.05,
          duration: 100,
          ease: "Power2",
        });
      });

      selectionBg.on("pointerout", () => {
        selectionBg.setFillStyle(0x333333, 0.3);
        sprite.setScale(0.6);
        this.tweens.add({
          targets: container,
          scaleX: 1,
          scaleY: 1,
          duration: 100,
          ease: "Power2",
        });
      });

      selectionBg.on("pointerdown", () => {
        this.selectCharacter(char.name, i);
      });

      this.characterButtons.push({ container, indicator, char: char.name });
    });

    const startButton = this.add
      .text(width / 2, height * 0.85, "START GAME", {
        fontSize: "24px",
        color: "#ffffff",
        backgroundColor: "#2d5a27",
        padding: { x: 30, y: 15 },
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    startButton.on("pointerover", () => {
      startButton.setStyle({ backgroundColor: "#3d7a37" });
      this.tweens.add({
        targets: startButton,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 100,
        ease: "Power2",
      });
    });

    startButton.on("pointerout", () => {
      startButton.setStyle({ backgroundColor: "#2d5a27" });
      this.tweens.add({
        targets: startButton,
        scaleX: 1,
        scaleY: 1,
        duration: 100,
        ease: "Power2",
      });
    });

    startButton.on("pointerdown", () => {
      this.startGame();
    });

    this.add
      .text(
        width / 2,
        height * 0.95,
        "WASD/Arrows: Move | Mouse: Aim | Click/Space: Shoot",
        {
          fontSize: "14px",
          color: "#888888",
          align: "center",
        }
      )
      .setOrigin(0.5);

    this.input.keyboard.on("keydown-ENTER", () => {
      this.startGame();
    });

    this.input.keyboard.on("keydown-UP", () => {
      this.navigateCharacter(-1);
    });

    this.input.keyboard.on("keydown-DOWN", () => {
      this.navigateCharacter(1);
    });
  }

  getColorForPokemon(pokemonName) {
    // Customize colors based on pokemon type or name
    const colorMap = {
      'ALAKAZAM': '#9966cc',
      'BLASTOISE': '#4488cc', 
      'CHARIZARD': '#ff6644'
      // Add more mappings as needed
    };
    
    return colorMap[pokemonName] || '#ffffff'; // Default to white if not found
  }

  showNoPokemonMessage() {
    const { width, height } = this.scale;
    
    this.add
      .text(width / 2, height / 2, "No Pokémon available\nPlease check your collection", {
        fontSize: "24px",
        color: "#ff4444",
        align: "center",
      })
      .setOrigin(0.5);
  }

  selectCharacter(characterName, index) {
    this.selectedCharacter = characterName;
    this.registry.set("selectedCharacter", characterName);

    this.characterButtons.forEach((button, i) => {
      button.indicator.setVisible(i === index);

      if (i === index) {
        this.tweens.add({
          targets: button.container,
          alpha: 1,
          duration: 200,
          ease: "Power2",
        });
      } else {
        this.tweens.add({
          targets: button.container,
          alpha: 0.7,
          duration: 200,
          ease: "Power2",
        });
      }
    });

    const selectedButton = this.characterButtons[index];
    this.tweens.add({
      targets: selectedButton.indicator,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 150,
      yoyo: true,
      ease: "Power2",
    });
  }

  navigateCharacter(direction) {
    if (this.characterButtons.length === 0) return;
    
    const currentIndex = this.characterButtons.findIndex(
      (btn) => btn.char === this.selectedCharacter
    );
    const newIndex = Phaser.Math.Wrap(
      currentIndex + direction,
      0,
      this.characterButtons.length
    );

    this.selectCharacter(this.characterButtons[newIndex].char, newIndex);
  }

  startGame() {
    if (!this.selectedCharacter) {
      console.warn("No character selected");
      return;
    }

    this.cameras.main.fadeOut(300, 0, 0, 0);

    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("mainGame");
    });
  }
}