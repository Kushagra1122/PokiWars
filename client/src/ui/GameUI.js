export default class GameUI {
    constructor(scene) {
        this.scene = scene;
        this.createUI();
    }

    createUI() {
        const uiDepth = 2000;

        // Score text with modern gradient style
        this.scoreText = this.scene.add.text(20, 20, "Score: 0", {
            fontSize: "22px",
            color: "#00d9ff",
            fontStyle: "bold",
            backgroundColor: "rgba(15, 23, 42, 0.9)",
            padding: { x: 15, y: 8 },
            shadow: { offsetX: 2, offsetY: 2, color: "#000000", blur: 5, stroke: true, fill: true }
        }).setDepth(uiDepth);

        // Add a subtle border effect to score
        this.scoreBackground = this.scene.add.rectangle(
            this.scoreText.x + this.scoreText.width / 2,
            this.scoreText.y + this.scoreText.height / 2,
            this.scoreText.width + 4,
            this.scoreText.height + 4,
            0x000000,
            0.3
        ).setDepth(uiDepth - 1);
        this.scoreBackground.setStrokeStyle(2, 0x00d9ff, 0.5);
    }

    updateScore(score) {
        this.scoreText.setText(`Score: ${score}`);
    }
}
