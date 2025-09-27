import Phaser from "phaser";

export default class InputHandler {
    constructor(scene) {
        this.scene = scene;
        this.setupInput();
    }

    setupInput() {
        try {
            this.cursors = this.scene.input.keyboard.createCursorKeys();
            this.keys = this.scene.input.keyboard.addKeys("W,A,S,D,SPACE");

            this.pointerDownHandler = (pointer) => {
                if (pointer.leftButtonDown() && this.scene.shoot) {
                    this.scene.shoot();
                }
            };

            this.keyDownHandler = () => {
                if (this.scene.shoot) {
                    this.scene.shoot();
                }
            };

            this.scene.input.on("pointerdown", this.pointerDownHandler);
            this.scene.input.keyboard.on("keydown-SPACE", this.keyDownHandler);
        } catch (error) {
            console.error("Error setting up input handlers:", error);
        }
    }

    cleanup() {
        try {
            if (this.scene.input) {
                this.scene.input.off("pointerdown", this.pointerDownHandler);
                this.scene.input.keyboard.off("keydown-SPACE", this.keyDownHandler);
            }
        } catch (error) {
            console.error("Error cleaning up input handlers:", error);
        }
    }

    update(delta) {
        this.updateAiming();
    }

    getMovementDirection() {
        let moveX = 0, moveY = 0;

        if (this.cursors.left.isDown || this.keys.A.isDown) moveX -= 1;
        if (this.cursors.right.isDown || this.keys.D.isDown) moveX += 1;
        if (this.cursors.up.isDown || this.keys.W.isDown) moveY -= 1;
        if (this.cursors.down.isDown || this.keys.S.isDown) moveY += 1;

        return { moveX, moveY };
    }

    updateAiming() {
        if (!this.scene.crosshair || !this.scene.player) return;

        const pointer = this.scene.input.activePointer;

        const dx = pointer.worldX - this.scene.player.sprite.x;
        const dy = pointer.worldY - this.scene.player.sprite.y;
        const angle = Math.atan2(dy, dx);
        const distance = Math.min(Math.sqrt(dx * dx + dy * dy), this.scene.shootRange);

        this.scene.player.direction.rotation = angle + Math.PI / 2;

        this.scene.crosshair.x = this.scene.player.sprite.x + Math.cos(angle) * distance;
        this.scene.crosshair.y = this.scene.player.sprite.y + Math.sin(angle) * distance;
        
        // Update crosshair dot position
        if (this.scene.effects && this.scene.effects.crosshairDot) {
            this.scene.effects.crosshairDot.x = this.scene.crosshair.x;
            this.scene.effects.crosshairDot.y = this.scene.crosshair.y;
        }
    }
}