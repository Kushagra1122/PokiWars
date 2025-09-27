export default class Effects {
    constructor(scene) {
        this.scene = scene;
        // Modern crosshair design
        this.crosshair = this.scene.add.circle(0, 0, 4, 0x00d9ff, 0.8);
        this.crosshair.setStrokeStyle(2, 0xffffff, 0.9);
        
        // Add crosshair inner dot
        this.crosshairDot = this.scene.add.circle(0, 0, 1, 0xffffff);
        this.crosshairDot.setDepth(101);
        
        this.aimLine = this.scene.add.graphics();
    }

    createHitEffect(x, y) {
        // Enhanced hit effect with better particles
        for (let i = 0; i < 12; i++) {
            const particle = this.scene.add.circle(x, y, Math.random() * 3 + 1, 0xef4444);
            const angle = (i / 12) * Math.PI * 2;
            const speed = 40 + Math.random() * 60;

            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * speed,
                y: y + Math.sin(angle) * speed,
                alpha: 0,
                scaleX: 0.1,
                scaleY: 0.1,
                duration: 400,
                ease: "Power3.easeOut",
                onComplete: () => particle.destroy(),
            });
        }

        // Add impact flash
        const flash = this.scene.add.circle(x, y, 25, 0xffffff, 0.8);
        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            scaleX: 2,
            scaleY: 2,
            duration: 150,
            ease: "Power2.easeOut",
            onComplete: () => flash.destroy(),
        });
    }

    createRespawnEffect(x, y) {
        // Multiple ring effect for respawn
        for (let i = 0; i < 3; i++) {
            const ring = this.scene.add.circle(x, y, 5);
            ring.setStrokeStyle(3, 0x00d9ff);
            ring.setFillStyle(0x00d9ff, 0.2);

            this.scene.tweens.add({
                targets: ring,
                scaleX: 8,
                scaleY: 8,
                alpha: 0,
                duration: 600 + i * 200,
                delay: i * 100,
                ease: "Power2.easeOut",
                onComplete: () => ring.destroy(),
            });
        }

        // Add particles
        for (let i = 0; i < 16; i++) {
            const particle = this.scene.add.circle(x, y, 2, 0x00d9ff);
            const angle = (i / 16) * Math.PI * 2;
            
            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * 80,
                y: y + Math.sin(angle) * 80,
                alpha: 0,
                duration: 800,
                ease: "Power2.easeOut",
                onComplete: () => particle.destroy(),
            });
        }
    }

    createBulletTrail(x, y, angle) {
        const trail = this.scene.add.graphics();
        trail.lineStyle(3, 0x00d9ff, 0.8);
        trail.lineBetween(x, y, x + Math.cos(angle) * 30, y + Math.sin(angle) * 30);

        // Add glow effect
        const glowTrail = this.scene.add.graphics();
        glowTrail.lineStyle(6, 0x00d9ff, 0.3);
        glowTrail.lineBetween(x, y, x + Math.cos(angle) * 30, y + Math.sin(angle) * 30);

        this.scene.tweens.add({
            targets: [trail, glowTrail],
            alpha: 0,
            duration: 250,
            ease: "Power2.easeOut",
            onComplete: () => {
                trail.destroy();
                glowTrail.destroy();
            },
        });
    }

    createScreenShake() {
        this.scene.cameras.main.shake(100, 0.01);
    }

    createScreenFlash() {
        this.scene.cameras.main.flash(100, 255, 0, 0, false);
    }
}