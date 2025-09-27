import Phaser from "phaser";

export default class GameOverlay {
    constructor(scene) {
        this.scene = scene;
        this.createOverlay();
    }

    createOverlay() {
        this.gameOverOverlay = this.scene.add.container(
            this.scene.scale.width / 2,
            this.scene.scale.height / 2
        );

        // Modern styled background with border
        this.gameOverBg = this.scene.add.rectangle(0, 0, 500, 350, 0x0f172a, 0.95);
        this.gameOverBg.setStrokeStyle(3, 0x00d9ff, 0.8);

        // Add inner glow effect
        this.gameOverGlow = this.scene.add.rectangle(0, 0, 510, 360, 0x00d9ff, 0.1);

        this.gameOverText = this.scene.add.text(0, -60, "", {
            fontSize: "36px",
            color: "#00d9ff",
            fontStyle: "bold",
            align: "center",
            stroke: "#000000",
            strokeThickness: 2,
            shadow: { offsetX: 2, offsetY: 2, color: "#000000", blur: 4, stroke: true, fill: true }
        }).setOrigin(0.5);

        this.gameOverSubText = this.scene.add.text(0, 0, "", {
            fontSize: "18px",
            color: "#e2e8f0",
            align: "center",
            lineSpacing: 8,
        }).setOrigin(0.5);

        // Continue playing button
        this.continueButton = this.scene.add.rectangle(0, 80, 200, 50, 0x10b981, 0.8);
        this.continueButton.setStrokeStyle(2, 0x22c55e);
        this.continueButton.setInteractive({ useHandCursor: true });
        
        this.continueButtonText = this.scene.add.text(0, 80, "Continue Playing", {
            fontSize: "16px",
            color: "#ffffff",
            fontStyle: "bold"
        }).setOrigin(0.5);

        // Add decorative elements
        this.decorTop = this.scene.add.text(0, -120, "⚔️", {
            fontSize: "32px",
            color: "#00d9ff",
        }).setOrigin(0.5);

        this.gameOverOverlay.add([
            this.gameOverGlow,
            this.gameOverBg,
            this.decorTop,
            this.gameOverText,
            this.gameOverSubText,
            this.continueButton,
            this.continueButtonText,
        ]);

        // Button interactions
        this.continueButton.on('pointerover', () => {
            this.continueButton.setFillStyle(0x22c55e, 1);
            this.scene.input.setDefaultCursor('pointer');
        });

        this.continueButton.on('pointerout', () => {
            this.continueButton.setFillStyle(0x10b981, 0.8);
            this.scene.input.setDefaultCursor('default');
        });

        this.continueButton.on('pointerdown', () => {
            this.hideGameOver();
        });

        this.gameOverOverlay.setVisible(false);
    }

    showGameOver(isWinner, winnerChar) {
        this.gameOverText.setText(isWinner ? "🏆 VICTORY!" : "💀 DEFEATED");
        this.gameOverText.setColor(isWinner ? "#10b981" : "#ef4444");
        
        this.gameOverSubText.setText(
            `${winnerChar} Fighter Wins!\n\nClick button to continue or wait for next round...`
        );

        // Update border color based on result
        this.gameOverBg.setStrokeStyle(3, isWinner ? 0x10b981 : 0xef4444, 0.8);
        this.gameOverGlow.setFillStyle(isWinner ? 0x10b981 : 0xef4444, 0.1);
        this.decorTop.setText(isWinner ? "🏆" : "💀");
        this.decorTop.setColor(isWinner ? "#10b981" : "#ef4444");

        this.gameOverOverlay.setVisible(true);

        // Add entrance animation
        this.scene.tweens.add({
            targets: this.gameOverOverlay,
            scaleX: { from: 0.5, to: 1 },
            scaleY: { from: 0.5, to: 1 },
            alpha: { from: 0, to: 1 },
            duration: 300,
            ease: 'Back.easeOut'
        });
    }

    hideGameOver() {
        this.scene.tweens.add({
            targets: this.gameOverOverlay,
            alpha: 0,
            scaleX: 0.8,
            scaleY: 0.8,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                this.gameOverOverlay.setVisible(false);
                this.scene.gameState.isGameOver = false;
            }
        });
    }
}
