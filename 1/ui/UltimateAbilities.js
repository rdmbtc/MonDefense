/**
 * Ultimate Abilities System
 * Provides powerful skills with long cooldowns for strategic gameplay
 */
class UltimateAbilities {
  constructor(scene) {
    this.scene = scene;
    this.abilities = {
      meteor: {
        id: 'meteor',
        name: 'Meteor Strike',
        description: 'Devastating area attack that damages all enemies on screen',
        icon: '☄️',
        cooldown: 60000, // 60 seconds
        lastUsed: 0,
        manaCost: 100,
        unlockWave: 5,
        damage: 200,
        range: 300
      },
      freeze: {
        id: 'freeze',
        name: 'Time Freeze',
        description: 'Freezes all enemies for 5 seconds',
        icon: '❄️',
        cooldown: 45000, // 45 seconds
        lastUsed: 0,
        manaCost: 80,
        unlockWave: 8,
        duration: 5000
      },
      shield: {
        id: 'shield',
        name: 'Divine Shield',
        description: 'Temporary invincibility - no life loss for 10 seconds',
        icon: '🛡️',
        cooldown: 90000, // 90 seconds
        lastUsed: 0,
        manaCost: 120,
        unlockWave: 12,
        duration: 10000
      },
      lightning: {
        id: 'lightning',
        name: 'Chain Lightning',
        description: 'Lightning that jumps between enemies, dealing massive damage',
        icon: '⚡',
        cooldown: 30000, // 30 seconds
        lastUsed: 0,
        manaCost: 60,
        unlockWave: 3,
        damage: 150,
        chains: 8
      },
      heal: {
        id: 'heal',
        name: 'Life Restoration',
        description: 'Restores 2 lives and heals all defenses',
        icon: '💚',
        cooldown: 120000, // 120 seconds
        lastUsed: 0,
        manaCost: 150,
        unlockWave: 15,
        livesRestored: 2
      }
    };
    
    this.activeEffects = {
      invincible: false,
      frozen: false,
      invincibleEndTime: 0,
      frozenEndTime: 0
    };
    
    this.ui = null;
    this.buttons = {};
  }
  
  /**
   * Initialize the ultimate abilities UI
   */
  createUI() {
    const padding = 20;
    const buttonSize = 60;
    const spacing = 10;
    const startX = this.scene.cameras.main.width - (buttonSize + padding);
    const startY = 200;
    
    // Create background panel for abilities
    const panelWidth = buttonSize + 20;
    const panelHeight = Object.keys(this.abilities).length * (buttonSize + spacing) + 20;
    
    this.ui = this.scene.uiStyle.createModernPanel(
      startX - 10, 
      startY - 10, 
      panelWidth, 
      panelHeight, 
      'dark'
    );
    
    // Create ability buttons
    let yOffset = 0;
    Object.values(this.abilities).forEach(ability => {
      if (this.scene.gameState.wave >= ability.unlockWave) {
        const button = this.createAbilityButton(
          startX, 
          startY + yOffset, 
          buttonSize, 
          ability
        );
        this.buttons[ability.id] = button;
        yOffset += buttonSize + spacing;
      }
    });
  }
  
  /**
   * Create an individual ability button
   */
  createAbilityButton(x, y, size, ability) {
    const container = this.scene.add.container(x, y);
    
    // Button background
    const bg = this.scene.add.rectangle(0, 0, size, size, 0x2a2a2a)
      .setStrokeStyle(2, 0x4a4a4a)
      .setInteractive({ useHandCursor: true });
    
    // Ability icon
    const icon = this.scene.add.text(0, -8, ability.icon, {
      fontSize: '24px',
      align: 'center'
    }).setOrigin(0.5);
    
    // Cooldown overlay
    const cooldownOverlay = this.scene.add.rectangle(0, 0, size, size, 0x000000, 0.7)
      .setVisible(false);
    
    // Cooldown text
    const cooldownText = this.scene.add.text(0, 8, '', {
      fontSize: '12px',
      fill: '#ffffff',
      align: 'center'
    }).setOrigin(0.5).setVisible(false);
    
    // Mana cost indicator
    const manaCost = this.scene.add.text(0, size/2 - 8, ability.manaCost, {
      fontSize: '10px',
      fill: '#00aaff',
      align: 'center'
    }).setOrigin(0.5);
    
    container.add([bg, icon, cooldownOverlay, cooldownText, manaCost]);
    
    // Button interaction
    bg.on('pointerdown', () => {
      this.useAbility(ability.id);
    });
    
    // Hover effects
    bg.on('pointerover', () => {
      if (this.canUseAbility(ability.id)) {
        bg.setFillStyle(0x3a3a3a);
        this.showTooltip(ability, x, y);
      }
    });
    
    bg.on('pointerout', () => {
      bg.setFillStyle(0x2a2a2a);
      this.hideTooltip();
    });
    
    return {
      container,
      bg,
      icon,
      cooldownOverlay,
      cooldownText,
      manaCost,
      ability
    };
  }
  
  /**
   * Check if an ability can be used
   */
  canUseAbility(abilityId) {
    const ability = this.abilities[abilityId];
    const currentTime = this.scene.time.now;
    const timeSinceLastUse = currentTime - ability.lastUsed;
    
    return (
      this.scene.gameState.wave >= ability.unlockWave &&
      timeSinceLastUse >= ability.cooldown &&
      this.scene.gameState.mana >= ability.manaCost
    );
  }
  
  /**
   * Use an ultimate ability
   */
  useAbility(abilityId) {
    if (!this.canUseAbility(abilityId)) {
      return false;
    }
    
    const ability = this.abilities[abilityId];
    
    // Consume mana
    this.scene.gameState.mana -= ability.manaCost;
    this.scene.updateManaBar();
    
    // Set cooldown
    ability.lastUsed = this.scene.time.now;
    
    // Execute ability effect
    this.executeAbility(ability);
    
    // Play sound effect
    this.scene.soundManager?.playSound('ui_click');
    
    console.log(`Used ultimate ability: ${ability.name}`);
    return true;
  }
  
  /**
   * Execute the specific ability effect
   */
  executeAbility(ability) {
    switch (ability.id) {
      case 'meteor':
        this.meteorStrike(ability);
        break;
      case 'freeze':
        this.timeFreeze(ability);
        break;
      case 'shield':
        this.divineShield(ability);
        break;
      case 'lightning':
        this.chainLightning(ability);
        break;
      case 'heal':
        this.lifeRestoration(ability);
        break;
    }
  }
  
  /**
   * Meteor Strike - Damages all enemies on screen
   */
  meteorStrike(ability) {
    // Create visual effect
    const meteors = [];
    for (let i = 0; i < 5; i++) {
      const x = Phaser.Math.Between(100, this.scene.cameras.main.width - 100);
      const y = Phaser.Math.Between(100, this.scene.cameras.main.height - 100);
      
      const meteor = this.scene.add.circle(x, y, 30, 0xff4444, 0.8)
        .setScale(0.1);
      
      meteors.push(meteor);
      
      // Animate meteor
      this.scene.tweens.add({
        targets: meteor,
        scaleX: 1,
        scaleY: 1,
        alpha: 1,
        duration: 500,
        ease: 'Power2',
        onComplete: () => {
          // Damage enemies in range
          this.scene.enemies.forEach(enemy => {
            const distance = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
            if (distance <= ability.range) {
              enemy.takeDamage(ability.damage);
              
              // Visual damage effect
              const damageText = this.scene.add.text(enemy.x, enemy.y - 30, ability.damage, {
                fontSize: '20px',
                fill: '#ff4444',
                fontStyle: 'bold'
              }).setOrigin(0.5);
              
              this.scene.tweens.add({
                targets: damageText,
                y: enemy.y - 60,
                alpha: 0,
                duration: 1000,
                onComplete: () => damageText.destroy()
              });
            }
          });
          
          // Remove meteor after explosion
          this.scene.tweens.add({
            targets: meteor,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 300,
            onComplete: () => meteor.destroy()
          });
        }
      });
    }
  }
  
  /**
   * Time Freeze - Freezes all enemies
   */
  timeFreeze(ability) {
    this.activeEffects.frozen = true;
    this.activeEffects.frozenEndTime = this.scene.time.now + ability.duration;
    
    // Visual effect - tint all enemies blue
    this.scene.enemies.forEach(enemy => {
      enemy.setTint(0x88ccff);
      enemy.frozenSpeed = enemy.speed;
      enemy.speed = 0;
    });
    
    // Screen effect
    const freezeOverlay = this.scene.add.rectangle(
      this.scene.cameras.main.centerX,
      this.scene.cameras.main.centerY,
      this.scene.cameras.main.width,
      this.scene.cameras.main.height,
      0x88ccff,
      0.2
    ).setScrollFactor(0);
    
    this.scene.tweens.add({
      targets: freezeOverlay,
      alpha: 0,
      duration: ability.duration,
      onComplete: () => freezeOverlay.destroy()
    });
  }
  
  /**
   * Divine Shield - Temporary invincibility
   */
  divineShield(ability) {
    this.activeEffects.invincible = true;
    this.activeEffects.invincibleEndTime = this.scene.time.now + ability.duration;
    
    // Visual effect - golden glow around screen
    const shieldOverlay = this.scene.add.rectangle(
      this.scene.cameras.main.centerX,
      this.scene.cameras.main.centerY,
      this.scene.cameras.main.width,
      this.scene.cameras.main.height,
      0xffd700,
      0.1
    ).setScrollFactor(0);
    
    // Pulsing effect
    this.scene.tweens.add({
      targets: shieldOverlay,
      alpha: 0.3,
      duration: 1000,
      yoyo: true,
      repeat: Math.floor(ability.duration / 2000),
      onComplete: () => shieldOverlay.destroy()
    });
  }
  
  /**
   * Chain Lightning - Lightning that jumps between enemies
   */
  chainLightning(ability) {
    if (this.scene.enemies.length === 0) return;
    
    let currentTarget = this.scene.enemies[0];
    let hitEnemies = new Set();
    let chains = 0;
    
    const chainNext = (target) => {
      if (!target || chains >= ability.chains || hitEnemies.has(target)) {
        return;
      }
      
      hitEnemies.add(target);
      chains++;
      
      // Damage current target
      target.takeDamage(ability.damage);
      
      // Visual lightning effect
      const lightning = this.scene.add.line(
        0, 0,
        target.x - 50, target.y,
        target.x + 50, target.y,
        0xffff00
      ).setLineWidth(3);
      
      this.scene.tweens.add({
        targets: lightning,
        alpha: 0,
        duration: 200,
        onComplete: () => lightning.destroy()
      });
      
      // Find next target
      let nextTarget = null;
      let closestDistance = Infinity;
      
      this.scene.enemies.forEach(enemy => {
        if (!hitEnemies.has(enemy)) {
          const distance = Phaser.Math.Distance.Between(target.x, target.y, enemy.x, enemy.y);
          if (distance < closestDistance && distance <= 200) {
            closestDistance = distance;
            nextTarget = enemy;
          }
        }
      });
      
      // Chain to next target after delay
      if (nextTarget) {
        this.scene.time.delayedCall(100, () => chainNext(nextTarget));
      }
    };
    
    chainNext(currentTarget);
  }
  
  /**
   * Life Restoration - Restores lives and heals defenses
   */
  lifeRestoration(ability) {
    // Restore lives
    this.scene.gameState.lives = Math.min(
      this.scene.gameState.lives + ability.livesRestored,
      this.scene.gameState.maxLives || 10
    );
    this.scene.updateLivesText();
    
    // Heal all defenses
    this.scene.defenses.forEach(defense => {
      if (defense.health < defense.maxHealth) {
        defense.health = defense.maxHealth;
        defense.clearTint(); // Remove damage tint
      }
    });
    
    // Visual healing effect
    const healEffect = this.scene.add.circle(
      this.scene.cameras.main.centerX,
      this.scene.cameras.main.centerY,
      50,
      0x00ff00,
      0.5
    ).setScrollFactor(0);
    
    this.scene.tweens.add({
      targets: healEffect,
      scaleX: 10,
      scaleY: 10,
      alpha: 0,
      duration: 1000,
      onComplete: () => healEffect.destroy()
    });
  }
  
  /**
   * Update method - called every frame
   */
  update() {
    const currentTime = this.scene.time.now;
    
    // Update active effects
    if (this.activeEffects.frozen && currentTime >= this.activeEffects.frozenEndTime) {
      this.endTimeFreeze();
    }
    
    if (this.activeEffects.invincible && currentTime >= this.activeEffects.invincibleEndTime) {
      this.activeEffects.invincible = false;
    }
    
    // Update button cooldowns
    Object.values(this.buttons).forEach(button => {
      this.updateButtonCooldown(button);
    });
  }
  
  /**
   * End time freeze effect
   */
  endTimeFreeze() {
    this.activeEffects.frozen = false;
    
    this.scene.enemies.forEach(enemy => {
      enemy.clearTint();
      if (enemy.frozenSpeed !== undefined) {
        enemy.speed = enemy.frozenSpeed;
        delete enemy.frozenSpeed;
      }
    });
  }
  
  /**
   * Update button cooldown display
   */
  updateButtonCooldown(button) {
    const ability = button.ability;
    const currentTime = this.scene.time.now;
    const timeSinceLastUse = currentTime - ability.lastUsed;
    const remainingCooldown = ability.cooldown - timeSinceLastUse;
    
    if (remainingCooldown > 0) {
      // Show cooldown overlay
      button.cooldownOverlay.setVisible(true);
      button.cooldownText.setVisible(true);
      button.cooldownText.setText(Math.ceil(remainingCooldown / 1000));
      button.bg.setFillStyle(0x1a1a1a);
    } else {
      // Hide cooldown overlay
      button.cooldownOverlay.setVisible(false);
      button.cooldownText.setVisible(false);
      
      if (this.scene.gameState.mana >= ability.manaCost) {
        button.bg.setFillStyle(0x2a2a2a);
      } else {
        button.bg.setFillStyle(0x1a1a2a); // Slightly blue tint for insufficient mana
      }
    }
  }
  
  /**
   * Show ability tooltip
   */
  showTooltip(ability, x, y) {
    if (this.tooltip) {
      this.tooltip.destroy();
    }
    
    const tooltipText = `${ability.name}\n${ability.description}\nCooldown: ${ability.cooldown/1000}s\nMana: ${ability.manaCost}`;
    
    this.tooltip = this.scene.add.text(x - 200, y, tooltipText, {
      fontSize: '12px',
      fill: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 },
      wordWrap: { width: 180 }
    }).setDepth(1000);
  }
  
  /**
   * Hide ability tooltip
   */
  hideTooltip() {
    if (this.tooltip) {
      this.tooltip.destroy();
      this.tooltip = null;
    }
  }
  
  /**
   * Check if player is currently invincible
   */
  isInvincible() {
    return this.activeEffects.invincible;
  }
  
  /**
   * Check if enemies are currently frozen
   */
  areEnemiesFrozen() {
    return this.activeEffects.frozen;
  }
  
  /**
   * Unlock new abilities based on wave progression
   */
  checkUnlocks() {
    Object.values(this.abilities).forEach(ability => {
      if (this.scene.gameState.wave >= ability.unlockWave && !this.buttons[ability.id]) {
        // Create button for newly unlocked ability
        const existingButtons = Object.keys(this.buttons).length;
        const buttonSize = 60;
        const spacing = 10;
        const startX = this.scene.cameras.main.width - (buttonSize + 30);
        const startY = 200 + existingButtons * (buttonSize + spacing);
        
        const button = this.createAbilityButton(startX, startY, buttonSize, ability);
        this.buttons[ability.id] = button;
        
        // Show unlock notification
        this.showUnlockNotification(ability);
      }
    });
  }
  
  /**
   * Show ability unlock notification
   */
  showUnlockNotification(ability) {
    const notification = this.scene.add.text(
      this.scene.cameras.main.centerX,
      this.scene.cameras.main.centerY - 100,
      `Ultimate Ability Unlocked!\n${ability.icon} ${ability.name}`,
      {
        fontSize: '24px',
        fill: '#ffd700',
        align: 'center',
        fontStyle: 'bold',
        backgroundColor: '#000000',
        padding: { x: 20, y: 10 }
      }
    ).setOrigin(0.5).setDepth(1000).setScrollFactor(0);
    
    this.scene.tweens.add({
      targets: notification,
      y: notification.y - 50,
      alpha: 0,
      duration: 3000,
      onComplete: () => notification.destroy()
    });
  }
}

export default UltimateAbilities;