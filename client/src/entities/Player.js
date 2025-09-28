import Phaser from "phaser";

export default class Player {
    constructor(scene, x, y, char) {
        this.scene = scene;
        this.health = 100;
        this.score = 0;
        this.character = char;

        // Create player sprite using character image
        this.sprite = scene.add.image(x, y, char);
        this.sprite.setScale(0.3); // Scale down the character image
        scene.physics.add.existing(this.sprite);

        // Configure physics body
        this.sprite.body.setCircle(30); // Adjust collision circle size
        this.sprite.body.setCollideWorldBounds(true);
        
        // Store radius for collision detection
        this.sprite.body.radius = 30;
        
        // Set high depth so players appear above ground elements
        this.sprite.setDepth(200);

        this.direction = { rotation: 0 };
    }

    updatePosition(x, y) {
        this.sprite.x = x;
        this.sprite.y = y;
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        return this.health;
    }

    getCharacterTexture(char) {
        // Return the character texture key
        const validCharacters = ['ALAKAZAM', 'BLASTOISE', 'CHARIZARD'];
        return validCharacters.includes(char) ? char : 'ALAKAZAM';
    }
}