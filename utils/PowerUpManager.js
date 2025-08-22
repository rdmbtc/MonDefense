/**
 * Power-Up Manager for MonDefense
 * Handles spawning, collection, and effects of power-ups
 */

class PowerUpManager {
  constructor(scene) {
    this.scene = scene;
    this.powerUps = [];
    this.spawnTimer = null;
    this.spawnInterval = 30000; // 30 seconds between power-up spawns
    this.powerUpDuration = 10000; // 10 seconds power-up effect duration
    this.powerUpTypes = ['damage', 'speed', 'range', 'coins'];
    this.powerUpEffects = {
      'damage': { multiplier: 2.0, description: '2x Damage' },
      'speed': { multiplier: 1.5, description: '1.5x Attack Speed' },
      'range': { multiplier: 1.5, description: '1.5x Attack Range' },
      'coins': { amount: 50, description: '+50 Coins' }
    };
    this.activeEffects = {};
  }

  start() {
    // Clear any existing timer
    if (this.spawnTimer) {
      this.spawnTimer.remove();
    }

    // Start spawning power-ups
    this.spawnTimer = this.scene.time.addEvent({
      delay: this.spawnInterval,
      callback: this.spawnRandomPowerUp,
      callbackScope: this,
      loop: true
    });
  }

  stop() {
    if (this.spawnTimer) {
      this.spawnTimer.remove();
      this.spawnTimer = null;
    }

    // Clean up any existing power-ups
    this.clearAllPowerUps();
  }

  spawnRandomPowerUp() {
    // Don't spawn if game is paused or not active
    if (!this.scene.gameState.isActive) return;

    // Find a valid position on the map (not on path or occupied by defenses)
    const validPosition = this.findValidPosition();
    if (!validPosition) return;

    // Choose random power-up type
    const type = this.powerUpTypes[Math.floor(Math.random() * this.powerUpTypes.length)];

    // Create power-up visual effect
    const effect = this.scene.particleEffects.createPowerUpEffect(
      validPosition.x,
      validPosition.y,
      type
    );

    // Create interactive area
    const hitArea = this.scene.add.circle(validPosition.x, validPosition.y, 30);
    hitArea.setAlpha(0.01); // Almost invisible
    hitArea.setInteractive();

    // Add click handler
    hitArea.on('pointerdown', () => {
      this.collectPowerUp(powerUp);
    });

    // Create power-up object
    const powerUp = {
      id: Date.now().toString(),
      type: type,
      x: validPosition.x,
      y: validPosition.y,
      effect: effect,
      hitArea: hitArea,
      createdAt: Date.now(),
      expiresAt: Date.now() + 15000 // Power-up disappears after 15 seconds
    };

    // Add to power-ups array
    this.powerUps.push(powerUp);

    // Add expiration timer
    this.scene.time.delayedCall(15000, () => {
      this.removePowerUp(powerUp.id);
    });

    // Add floating text to indicate what it is
    const text = this.scene.add.text(
      validPosition.x,
      validPosition.y - 40,
      this.powerUpEffects[type].description,
      {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 3
      }
    );
    text.setOrigin(0.5);
    powerUp.text = text;

    // Animate text
    this.scene.tweens.add({
      targets: text,
      y: validPosition.y - 50,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    console.log(`Spawned ${type} power-up at (${validPosition.x}, ${validPosition.y})`);
  }

  findValidPosition() {
    // Get game dimensions
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    // Try 10 times to find a valid position
    for (let i = 0; i < 10; i++) {
      const x = Math.random() * (width - 100) + 50;
      const y = Math.random() * (height - 100) + 50;

      // Check if position is valid (not on path, not on defense)
      // This is a simplified check - you may need to implement more specific logic
      let isValid = true;

      // Check if too close to any defense
      if (this.scene.defenses) {
        for (const defense of this.scene.defenses) {
          if (defense && defense.active) {
            const distance = Phaser.Math.Distance.Between(x, y, defense.x, defense.y);
            if (distance < 80) {
              isValid = false;
              break;
            }
          }
        }
      }

      // If valid position found, return it
      if (isValid) {
        return { x, y };
      }
    }

    // Couldn't find valid position
    return null;
  }

  collectPowerUp(powerUp) {
    // Apply power-up effect
    this.applyPowerUpEffect(powerUp.type);

    // Play collection sound
    if (this.scene.soundManager) {
      this.scene.soundManager.play('powerup_collect', { volume: 0.5 });
    }

    // Create collection effect
    if (this.scene.particleEffects) {
      this.scene.particleEffects.createExplosion(powerUp.x, powerUp.y, 0xFFFFFF, 'small');
    }

    // Show notification
    this.showPowerUpNotification(powerUp.type);

    // Remove power-up
    this.removePowerUp(powerUp.id);
  }

  applyPowerUpEffect(type) {
    const effect = this.powerUpEffects[type];
    
    switch (type) {
      case 'damage':
        // Apply damage boost to all defenses
        this.activeEffects.damage = {
          multiplier: effect.multiplier,
          expiresAt: Date.now() + this.powerUpDuration
        };
        break;
        
      case 'speed':
        // Apply attack speed boost to all defenses
        this.activeEffects.speed = {
          multiplier: effect.multiplier,
          expiresAt: Date.now() + this.powerUpDuration
        };
        break;
        
      case 'range':
        // Apply range boost to all defenses
        this.activeEffects.range = {
          multiplier: effect.multiplier,
          expiresAt: Date.now() + this.powerUpDuration
        };
        break;
        
      case 'coins':
        // Add coins immediately
        if (this.scene.gameState) {
          this.scene.gameState.farmCoins += effect.amount;
          this.scene.updateFarmCoinsText();
        }
        break;
    }

    // Set timer to remove temporary effects
    if (type !== 'coins') {
      this.scene.time.delayedCall(this.powerUpDuration, () => {
        delete this.activeEffects[type];
        console.log(`${type} power-up effect expired`);
      });
    }
  }

  showPowerUpNotification(type) {
    const effect = this.powerUpEffects[type];
    const message = `Power-Up: ${effect.description}`;
    
    // Create notification text
    const notification = this.scene.add.text(
      this.scene.cameras.main.width / 2,
      100,
      message,
      {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 4,
        align: 'center'
      }
    );
    notification.setOrigin(0.5);
    notification.setDepth(2000);
    notification.setAlpha(0);
    
    // Animate notification
    this.scene.tweens.add({
      targets: notification,
      alpha: 1,
      y: 120,
      duration: 500,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.time.delayedCall(2000, () => {
          this.scene.tweens.add({
            targets: notification,
            alpha: 0,
            y: 100,
            duration: 500,
            ease: 'Back.easeIn',
            onComplete: () => notification.destroy()
          });
        });
      }
    });
  }

  removePowerUp(id) {
    const index = this.powerUps.findIndex(p => p.id === id);
    if (index === -1) return;
    
    const powerUp = this.powerUps[index];
    
    // Clean up visual elements
    if (powerUp.effect) {
      if (powerUp.effect.powerUp) powerUp.effect.powerUp.destroy();
      if (powerUp.effect.glow) powerUp.effect.glow.destroy();
      if (powerUp.effect.particles) {
        powerUp.effect.particles.forEach(p => p.destroy());
      }
    }
    
    if (powerUp.hitArea) powerUp.hitArea.destroy();
    if (powerUp.text) powerUp.text.destroy();
    
    // Remove from array
    this.powerUps.splice(index, 1);
  }

  clearAllPowerUps() {
    // Copy the array to avoid modification during iteration
    const powerUpIds = this.powerUps.map(p => p.id);
    powerUpIds.forEach(id => this.removePowerUp(id));
    this.powerUps = [];
  }

  update() {
    // Check for expired power-ups
    const now = Date.now();
    const expiredPowerUps = this.powerUps.filter(p => p.expiresAt <= now);
    expiredPowerUps.forEach(p => this.removePowerUp(p.id));
  }

  // Get current effect multiplier for a specific stat
  getEffectMultiplier(type) {
    if (this.activeEffects[type] && this.activeEffects[type].expiresAt > Date.now()) {
      return this.activeEffects[type].multiplier;
    }
    return 1.0; // No effect active, return default multiplier
  }
}

export default PowerUpManager;