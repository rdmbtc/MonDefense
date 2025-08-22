export default class Crop2 extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    scene.add.existing(this);
    
    // Store properties
    this.scene = scene;
    this.growthStage = 1; // Start at stage 1
    this.maxGrowthStage = 4; // Maximum growth stage
    this.isHarvestable = false;
    this.health = 100;
    this.maxHealth = 100;
    this.isActive = true;
    this.value = 5; // Coins per harvest
    this.yieldMultiplier = 1.0; // Multiplier from upgrades
    
    // Create plant sprite
    this.createSprites();
    
    // Create health bar for crop
    this.createHealthBar();
    
    // Add interactions
    this.setSize(32, 32);
    this.setInteractive();
    this.on('pointerdown', () => {
      if (this.isHarvestable) {
        this.harvest();
      }
    });
    
    console.log(`Created crop at (${x}, ${y})`);
  }
  
  createSprites() {
    // Create shadow sprite
    this.shadowSprite = this.scene.add.image(0, 8, 'shadow1');
    this.shadowSprite.setScale(0.6);
    this.shadowSprite.setAlpha(0.4);
    this.add(this.shadowSprite);
    
    // Create plant sprite using the first growth stage
    this.plantSprite = this.scene.add.image(0, 0, 'plant1');
    this.plantSprite.setScale(0.5); // Initial scale
    this.add(this.plantSprite);
    
    // Add a small indicator that the plant is harvestable (initially hidden)
    this.harvestIndicator = this.scene.add.text(0, -20, '✓', {
      font: 'bold 14px Arial',
      fill: '#00FF00'
    }).setOrigin(0.5);
    this.harvestIndicator.setVisible(false);
    this.add(this.harvestIndicator);
  }
  
  createHealthBar() {
    // Create health bar background
    this.healthBarBg = this.scene.add.rectangle(0, -25, 30, 4, 0x000000);
    this.healthBarBg.setAlpha(0.7);
    this.add(this.healthBarBg);
    
    // Create health bar fill
    this.healthBar = this.scene.add.rectangle(-15, -25, 30, 4, 0x00FF00);
    this.healthBar.setOrigin(0, 0.5);
    this.add(this.healthBar);
    
    // Hide health bar initially
    this.healthBarBg.setVisible(false);
    this.healthBar.setVisible(false);
  }
  
  // Advance to the next growth stage when a wave is completed
  advanceGrowthStage() {
    if (this.growthStage < this.maxGrowthStage) {
      this.growthStage++;
      
      // Update the plant sprite to the new growth stage
      if (this.plantSprite) {
        // Remove old sprite
        this.plantSprite.destroy();
        
        // Create new sprite with the current growth stage
        this.plantSprite = this.scene.add.image(0, 0, `plant${this.growthStage}`);
        this.plantSprite.setScale(0.5 + (this.growthStage * 0.1)); // Increase scale with growth
        this.add(this.plantSprite);
        
        // Add growth animation
        this.scene.tweens.add({
          targets: this.plantSprite,
          scaleX: { from: 0.5, to: 0.5 + (this.growthStage * 0.1) },
          scaleY: { from: 0.5, to: 0.5 + (this.growthStage * 0.1) },
          duration: 500,
          ease: 'Back.easeOut'
        });
        
        // Play growth sound if available
        if (this.scene.soundManager) {
          this.scene.soundManager.play('grow_complete', { volume: 0.2 });
        }
        
        // Show growth effect
        this.showGrowthEffect();
      }
      
      // If reached final stage, mark as harvestable
      if (this.growthStage === this.maxGrowthStage) {
        this.setHarvestReady(true);
      }
      
      console.log(`Crop advanced to growth stage ${this.growthStage}`);
    }
  }
  
  showGrowthEffect() {
    // Create a growth effect
    const growthEffect = this.scene.add.circle(0, 0, 30, 0x00ff00, 0.3);
    growthEffect.setDepth(5);
    this.add(growthEffect);
    
    // Animate the growth effect
    this.scene.tweens.add({
      targets: growthEffect,
      scale: 2,
      alpha: 0,
      duration: 800,
      onComplete: () => growthEffect.destroy()
    });
    
    // Show floating text
    if (this.scene.showFloatingText) {
      this.scene.showFloatingText(this.x, this.y - 30, `Stage ${this.growthStage}!`, 0x00FF00);
    }
  }
  
  setHarvestReady(ready) {
    this.isHarvestable = ready;
    
    // Show/hide harvest indicator
    if (this.harvestIndicator) {
      this.harvestIndicator.setVisible(ready);
    }
    
    // Add "ready" animation if it's harvestable
    if (ready && this.plantSprite) {
      this.scene.tweens.add({
        targets: this.plantSprite,
        y: -2,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      // Show floating text
      if (this.scene.showFloatingText) {
        this.scene.showFloatingText(this.x, this.y - 30, 'Ready!', 0x00FF00);
      }
    }
  }
  
  harvest() {
    if (!this.isActive || !this.isHarvestable) {
      console.log(`Harvest failed: isActive=${this.isActive}, isHarvestable=${this.isHarvestable}`);
      return 0;
    }

    console.log(`🌾 HARVESTING crop at ${this.x}, ${this.y}, generating coins`);

    // Play harvest sound
    if (this.scene.soundManager) {
      this.scene.soundManager.play('harvest');
    }

    // Calculate yield based on growth stage
    const yieldAmount = this.calculateYield();

    // Generate coins
    if (typeof this.scene.updateFarmCoins === 'function') {
      console.log(`💰 Giving ${yieldAmount} coins to player!`);
      this.scene.updateFarmCoins(yieldAmount);

      // Show floating coins with animation
      this.scene.showFloatingText(this.x, this.y, `+${yieldAmount} coins`, 0xFFFF00);

      // Show harvest notification message
      this.showHarvestNotification(yieldAmount);

      // Add visual effect when harvesting
      this.scene.tweens.add({
        targets: this,
        y: this.y - 10,
        duration: 100,
        yoyo: true,
        ease: 'Power1'
      });
    }
    
    // Destroy the crop after harvesting
    this.destroy();

    return yieldAmount;
  }

  showHarvestNotification(yieldAmount) {
    // Create a prominent notification message
    const notificationText = this.scene.add.text(400, 100, `🌾 Crop Harvested! +${yieldAmount} Coins 💰`, {
      fontFamily: 'Arial Black',
      fontSize: '24px',
      color: '#FFFF00',
      stroke: '#000000',
      strokeThickness: 4,
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: '#000000',
        blur: 5,
        fill: true
      }
    }).setOrigin(0.5).setDepth(3000);

    // Animate the notification
    this.scene.tweens.add({
      targets: notificationText,
      scale: { from: 0.5, to: 1.2 },
      alpha: { from: 1, to: 0 },
      y: notificationText.y - 50,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => {
        notificationText.destroy();
      }
    });

    // Add a coin particle effect
    this.createCoinParticles();
  }

  createCoinParticles() {
    // Create multiple coin particles around the crop
    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI * 2 * i) / 5;
      const distance = 30;
      const particleX = this.x + Math.cos(angle) * distance;
      const particleY = this.y + Math.sin(angle) * distance;

      const coinParticle = this.scene.add.text(particleX, particleY, '💰', {
        fontSize: '20px'
      }).setDepth(2500);

      // Animate particles flying towards the coin counter
      this.scene.tweens.add({
        targets: coinParticle,
        x: 100, // Approximate position of coin counter
        y: 30,
        scale: { from: 1, to: 0.3 },
        alpha: { from: 1, to: 0 },
        duration: 1000 + (i * 100), // Stagger the animations
        ease: 'Power2',
        onComplete: () => {
          coinParticle.destroy();
        }
      });
    }
  }
  
  calculateYield() {
    // Base yield depends on growth stage
    const baseYield = this.value * this.growthStage;
    const finalYield = Math.floor(baseYield * this.yieldMultiplier);
    console.log(`Calculating yield: base=${baseYield}, multiplier=${this.yieldMultiplier}, final=${finalYield}`);
    return finalYield;
  }
  
  damage(amount) {
    // Reduce health
    this.health -= amount;
    
    // Update health bar
    this.healthBarBg.setVisible(true);
    this.healthBar.setVisible(true);
    this.healthBar.width = Math.max(0, (this.health / this.maxHealth) * 30);
    
    // Change color based on health
    if (this.health < this.maxHealth * 0.3) {
      this.healthBar.fillColor = 0xFF0000;
    } else if (this.health < this.maxHealth * 0.6) {
      this.healthBar.fillColor = 0xFFFF00;
    }
    
    // Check for destruction
    if (this.health <= 0) {
      this.destroy();
      return true;
    }
    
    // Hide health bar after delay
    this.scene.time.delayedCall(2000, () => {
      if (this.healthBarBg) {
        this.healthBarBg.setVisible(false);
        this.healthBar.setVisible(false);
      }
    });
    
    return false;
  }
  
  update() {
    // Update health bar visibility based on damage
    if (this.healthBar) {
      const healthPercentage = this.health / this.maxHealth;
      if (healthPercentage < 1.0) {
        this.healthBar.setVisible(true);
        this.updateHealthBar();
      } else {
        this.healthBar.setVisible(false);
      }
    }
  }
  
  updateHealthBar() {
    if (this.healthBar && this.healthBarBg) {
      this.healthBar.width = Math.max(0, (this.health / this.maxHealth) * 30);
      this.healthBarBg.setVisible(true);
      this.healthBar.setVisible(true);
    }
  }
  
  destroy() {
    // Clean up tweens
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.killTweensOf(this.plantSprite);
    
    // Set as inactive
    this.isActive = false;
    
    // Remove from parent
    super.destroy();
  }
}