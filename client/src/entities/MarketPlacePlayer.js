import Phaser from "phaser";

export default class MarketPlacePlayer {
    constructor(scene, x, y, charKey) {
        this.scene = scene;
        this.char = charKey;
        this.health = 100;
        this.score = 0;
        this.moveSpeed = 160;

        // Create MarketPlacePlayer sprite with physics
        this.sprite = scene.physics.add.sprite(x, y, this.char);
        
        // Configure physics body - use rectangle instead of circle for more precise collision
        this.sprite.body.setSize(40, 40); // Smaller collision box
        this.sprite.body.setOffset(12, 12); // Center the collision box
        this.sprite.body.setCollideWorldBounds(true);
        
        // Set physics properties for smooth movement
        this.sprite.body.setBounce(0);
        this.sprite.body.setFriction(0);
        this.sprite.body.setDrag(300); // Add slight drag for better control
        this.sprite.body.setMaxVelocity(this.moveSpeed, this.moveSpeed);
        
        // Set high depth
        this.sprite.setDepth(200);

        this.direction = { rotation: 0 };

        // Store initial position
        this.initialX = x;
        this.initialY = y;
        
        // Store previous position for collision recovery
        this.previousX = x;
        this.previousY = y;
        
        // Movement state
        this.isMoving = false;
        this.lastVelocityX = 0;
        this.lastVelocityY = 0;
        
        // Collision detection radius (for tile checking)
        this.collisionRadius = 25;
        
        // Movement smoothing
        this.targetVelocityX = 0;
        this.targetVelocityY = 0;
        this.acceleration = 800; // Pixels per second squared
    }

    // Set scene reference for collision checking
    setScene(scene) {
        this.scene = scene;
    }

    updatePosition(x, y) {
        this.sprite.x = x;
        this.sprite.y = y;
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        return this.health;
    }

    // Smooth movement with collision checking and proper physics
    handleMovement(cursors, wasdKeys, deltaTime) {
        // Store current position before movement
        this.previousX = this.sprite.x;
        this.previousY = this.sprite.y;
        
        const speed = this.moveSpeed;
        let inputX = 0;
        let inputY = 0;

        // Check input for movement
        if (cursors.left.isDown || wasdKeys.A.isDown) {
            inputX = -1;
        } else if (cursors.right.isDown || wasdKeys.D.isDown) {
            inputX = 1;
        }

        if (cursors.up.isDown || wasdKeys.W.isDown) {
            inputY = -1;
        } else if (cursors.down.isDown || wasdKeys.S.isDown) {
            inputY = 1;
        }

        // Calculate target velocity
        let targetVelX = 0;
        let targetVelY = 0;

        if (inputX !== 0 || inputY !== 0) {
            this.isMoving = true;
            
            // Normalize diagonal movement
            if (inputX !== 0 && inputY !== 0) {
                inputX *= 0.7071;
                inputY *= 0.7071;
            }
            
            // Set target velocity
            targetVelX = inputX * speed;
            targetVelY = inputY * speed;
        } else {
            this.isMoving = false;
        }

        // Calculate next frame position to check for collisions
        const deltaSeconds = deltaTime / 1000;
        const futureX = this.sprite.x + (targetVelX * deltaSeconds);
        const futureY = this.sprite.y + (targetVelY * deltaSeconds);
        
        // Check for collisions
        let canMoveX = true;
        let canMoveY = true;
        
        if (this.scene && this.scene.hasCollisionAt) {
            // Check if we can move horizontally
            if (targetVelX !== 0) {
                canMoveX = !this.wouldCollideAt(futureX, this.sprite.y);
            }
            // Check if we can move vertically
            if (targetVelY !== 0) {
                canMoveY = !this.wouldCollideAt(this.sprite.x, futureY);
            }
            // Check diagonal movement
            if (targetVelX !== 0 && targetVelY !== 0 && canMoveX && canMoveY) {
                const canMoveDiagonal = !this.wouldCollideAt(futureX, futureY);
                if (!canMoveDiagonal) {
                    // If diagonal is blocked, try individual axes
                    canMoveX = canMoveX && !this.wouldCollideAt(futureX, this.sprite.y);
                    canMoveY = canMoveY && !this.wouldCollideAt(this.sprite.x, futureY);
                }
            }
        }
        
        // Apply final velocity based on collision results
        const finalVelX = canMoveX ? targetVelX : 0;
        const finalVelY = canMoveY ? targetVelY : 0;
        
        this.sprite.body.setVelocity(finalVelX, finalVelY);
        
        // Store velocity for reference
        this.lastVelocityX = finalVelX;
        this.lastVelocityY = finalVelY;

        // Update rotation only when actually moving
        if (finalVelX !== 0 || finalVelY !== 0) {
            this.direction.rotation = Math.atan2(finalVelY, finalVelX);
        }

        // Play animation based on direction
        if (this.isMoving) {
            if (finalVelY > 0) this.sprite.anims.play("walk-down", true);
            else if (finalVelY < 0) this.sprite.anims.play("walk-up", true);
            else if (finalVelX < 0) this.sprite.anims.play("walk-left", true);
            else if (finalVelX > 0) this.sprite.anims.play("walk-right", true);
        } else {
            // Stop animation or show idle frame
            this.sprite.anims.stop();
        }

    }

    // Enhanced collision handling with tiles
    handleCollisionWithTile(tile) {
        // Stop current movement
        this.sprite.body.setVelocity(0);
        
        // Move away from the colliding tile slightly
        const tileWorldX = tile.x * tile.baseWidth + tile.baseWidth / 2;
        const tileWorldY = tile.y * tile.baseHeight + tile.baseHeight / 2;
        
        const deltaX = this.sprite.x - tileWorldX;
        const deltaY = this.sprite.y - tileWorldY;
        
        // Normalize and push away
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        if (distance > 0) {
            const pushX = (deltaX / distance) * 3;
            const pushY = (deltaY / distance) * 3;
            
            this.sprite.x += pushX;
            this.sprite.y += pushY;
        }
        
        this.isMoving = false;
    }

    // Legacy collision handler for non-tile collisions
    handleCollision(collidingObject) {
        // Stop movement and return to safe position
        this.sprite.body.setVelocity(0);
        this.sprite.setPosition(this.previousX, this.previousY);
        this.isMoving = false;
    }

    // Check if character would collide at a specific position using tile-based detection
    wouldCollideAt(x, y) {
        if (!this.scene || !this.scene.hasCollisionAt) {
            return false;
        }
        
        // Check collision at multiple points around the character's collision box
        const checkPoints = [
            { x: x, y: y }, // Center
            { x: x - this.collisionRadius, y: y }, // Left
            { x: x + this.collisionRadius, y: y }, // Right
            { x: x, y: y - this.collisionRadius }, // Top
            { x: x, y: y + this.collisionRadius }, // Bottom
            { x: x - this.collisionRadius * 0.7, y: y - this.collisionRadius * 0.7 }, // Top-left
            { x: x + this.collisionRadius * 0.7, y: y - this.collisionRadius * 0.7 }, // Top-right
            { x: x - this.collisionRadius * 0.7, y: y + this.collisionRadius * 0.7 }, // Bottom-left
            { x: x + this.collisionRadius * 0.7, y: y + this.collisionRadius * 0.7 }  // Bottom-right
        ];
        
        for (const point of checkPoints) {
            if (this.scene.hasCollisionAt(point.x, point.y)) {
                return true;
            }
        }
        
        return false;
    }

    // Get current position
    getPosition() {
        return {
            x: this.sprite.x,
            y: this.sprite.y
        };
    }

    // Get collision bounds for debugging
    getCollisionBounds() {
        return {
            x: this.sprite.x - this.collisionRadius,
            y: this.sprite.y - this.collisionRadius,
            width: this.collisionRadius * 2,
            height: this.collisionRadius * 2
        };
    }

    // Destroy the entity
    destroy() {
        if (this.sprite) {
            this.sprite.destroy();
        }
    }
}