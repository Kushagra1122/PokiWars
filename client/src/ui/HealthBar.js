export default class HealthBar {
  constructor(scene, x, y, health, maxHealth, isPlayer = false) {
    this.scene = scene;
    this.maxHealth = maxHealth;
    this.isPlayer = isPlayer;

    // Modern health bar with better styling
    const barWidth = isPlayer ? 60 : 50;
    const barHeight = isPlayer ? 8 : 6;
    
    this.bg = scene.add.rectangle(x - barWidth/2, y - 45, barWidth, barHeight, 0x1f2937);
    this.bg.setOrigin(0, 0.5).setStrokeStyle(1, 0x374151);

    // Add inner shadow effect
    this.innerShadow = scene.add.rectangle(x - barWidth/2, y - 45, barWidth - 2, barHeight - 2, 0x111827);
    this.innerShadow.setOrigin(0, 0.5);

    this.bar = scene.add.rectangle(x - barWidth/2 + 1, y - 45, barWidth - 2, barHeight - 2, 0x10b981);
    this.bar.setOrigin(0, 0.5);

    // Add health bar glow effect
    this.barGlow = scene.add.rectangle(x - barWidth/2 + 1, y - 45, barWidth - 2, barHeight + 2, 0x10b981, 0.3);
    this.barGlow.setOrigin(0, 0.5);

    this.text = scene.add
      .text(x, y - 55, `${health} HP`, {
        fontSize: isPlayer ? "12px" : "10px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 1,
      })
      .setOrigin(0.5);

    // Set highest depth for player health bar, regular depth for others
    const depth = isPlayer ? 1000 : 50;
    this.bg.setDepth(depth);
    this.innerShadow.setDepth(depth + 1);
    this.barGlow.setDepth(depth + 2);
    this.bar.setDepth(depth + 3);
    this.text.setDepth(depth + 4);

    this.update(health);
  }

  update(health) {
    const healthPercent = health / this.maxHealth;
    this.bar.scaleX = healthPercent;
    this.barGlow.scaleX = healthPercent;
    this.text.setText(`${health} HP`);

    // Smooth color transitions
    if (healthPercent > 0.6) {
      this.bar.fillColor = 0x10b981; // Green
      this.barGlow.fillColor = 0x10b981;
    } else if (healthPercent > 0.3) {
      this.bar.fillColor = 0xf59e0b; // Orange/Yellow
      this.barGlow.fillColor = 0xf59e0b;
    } else {
      this.bar.fillColor = 0xef4444; // Red
      this.barGlow.fillColor = 0xef4444;
    }

    // Add pulse effect when health is low
    if (healthPercent <= 0.3) {
      this.scene.tweens.add({
        targets: [this.bar, this.barGlow],
        alpha: { from: 1, to: 0.5 },
        duration: 300,
        yoyo: true,
        repeat: 0,
      });
    }
  }

  updatePosition(x, y) {
    const barWidth = this.isPlayer ? 60 : 50;
    this.bg.setPosition(x - barWidth/2, y - 45);
    this.innerShadow.setPosition(x - barWidth/2, y - 45);
    this.bar.setPosition(x - barWidth/2 + 1, y - 45);
    this.barGlow.setPosition(x - barWidth/2 + 1, y - 45);
    this.text.setPosition(x, y - 55);
  }

  destroy() {
    this.bg.destroy();
    this.innerShadow.destroy();
    this.bar.destroy();
    this.barGlow.destroy();
    this.text.destroy();
  }
}
