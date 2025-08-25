/**
 * Critical Hit System for MonDefense
 * Handles random critical hits with extra damage and visual effects
 */
export default class CriticalHitSystem {
  constructor() {
    // Critical hit configuration
    this.baseCritChance = 0.15; // 15% base critical hit chance
    this.critDamageMultiplier = 2.0; // Critical hits deal 2x damage
    this.superCritChance = 0.03; // 3% chance for super critical
    this.superCritMultiplier = 3.5; // Super crits deal 3.5x damage
    
    // Visual effect colors
    this.critColor = 0xFF6B35; // Orange-red for crits
    this.superCritColor = 0xFF0080; // Hot pink for super crits
    this.normalColor = 0xFFFFFF; // White for normal hits
  }

  /**
   * Calculate if an attack is a critical hit and return damage multiplier
   * @param {Object} attacker - The defense unit attacking
   * @param {Object} target - The enemy being attacked
   * @returns {Object} - {isCrit, isSuper, multiplier, color, text}
   */
  calculateCriticalHit(attacker, target) {
    // Base critical chance
    let critChance = this.baseCritChance;
    
    // Bonus crit chance based on attacker type
    if (attacker.type === 'keon') {
      critChance += 0.05; // Premium unit gets +5% crit chance
    } else if (attacker.type === 'moyaki') {
      critChance += 0.03; // Fire unit gets +3% crit chance
    }
    
    // Bonus crit chance based on enemy health (more likely to crit low health enemies)
    if (target.health < target.maxHealth * 0.3) {
      critChance += 0.1; // +10% crit chance on low health enemies
    }
    
    // Roll for critical hit
    const roll = Math.random();
    
    // Check for super critical first
    if (roll < this.superCritChance) {
      return {
        isCrit: true,
        isSuper: true,
        multiplier: this.superCritMultiplier,
        color: this.superCritColor,
        text: 'SUPER CRIT!',
        screenShake: true
      };
    }
    
    // Check for regular critical
    if (roll < critChance) {
      return {
        isCrit: true,
        isSuper: false,
        multiplier: this.critDamageMultiplier,
        color: this.critColor,
        text: 'CRITICAL!',
        screenShake: false
      };
    }
    
    // Normal hit
    return {
      isCrit: false,
      isSuper: false,
      multiplier: 1.0,
      color: this.normalColor,
      text: null,
      screenShake: false
    };
  }

  /**
   * Create visual effects for critical hits
   * @param {Phaser.Scene} scene - The game scene
   * @param {number} x - X position for effect
   * @param {number} y - Y position for effect
   * @param {Object} critInfo - Critical hit information
   */
  createCriticalEffect(scene, x, y, critInfo) {
    if (!critInfo.isCrit) return;
    
    // Create particle burst effect
    this.createCritParticles(scene, x, y, critInfo);
    
    // Create screen flash for super crits
    if (critInfo.isSuper) {
      this.createScreenFlash(scene, critInfo.color);
    }
    
    // Screen shake effect
    if (critInfo.screenShake && scene.cameras && scene.cameras.main) {
      scene.cameras.main.shake(200, 0.02);
    }
    
    // Sound effect
    this.playCritSound(scene, critInfo.isSuper);
  }

  /**
   * Create particle burst for critical hits
   */
  createCritParticles(scene, x, y, critInfo) {
    const particleCount = critInfo.isSuper ? 12 : 8;
    const particleSize = critInfo.isSuper ? 6 : 4;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = critInfo.isSuper ? 150 : 100;
      const distance = critInfo.isSuper ? 40 : 25;
      
      // Create particle
      const particle = scene.add.circle(
        x + Math.random() * 10 - 5,
        y + Math.random() * 10 - 5,
        particleSize,
        critInfo.color,
        0.8
      );
      particle.setDepth(250);
      
      // Animate particle
      scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0.2,
        duration: 400,
        ease: 'Power2',
        onComplete: () => {
          if (particle && particle.active) {
            particle.destroy();
          }
        }
      });
    }
  }

  /**
   * Create screen flash effect for super crits
   */
  createScreenFlash(scene, color) {
    if (!scene.cameras || !scene.cameras.main) return;
    
    const flash = scene.add.rectangle(
      scene.cameras.main.centerX,
      scene.cameras.main.centerY,
      scene.cameras.main.width,
      scene.cameras.main.height,
      color,
      0.3
    );
    flash.setDepth(1000);
    flash.setScrollFactor(0); // Fixed to camera
    
    scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 150,
      onComplete: () => {
        if (flash && flash.active) {
          flash.destroy();
        }
      }
    });
  }

  /**
   * Play critical hit sound effect
   */
  playCritSound(scene, isSuper) {
    try {
      if (isSuper) {
        // Try to play super crit sound, fallback to regular crit
        if (scene.sound && scene.sound.get('super_crit')) {
          scene.sound.play('super_crit', { volume: 0.4 });
        } else if (scene.sound && scene.sound.get('critical_hit')) {
          scene.sound.play('critical_hit', { volume: 0.5 });
        }
      } else {
        // Regular critical hit sound
        if (scene.sound && scene.sound.get('critical_hit')) {
          scene.sound.play('critical_hit', { volume: 0.3 });
        }
      }
    } catch (error) {
      // Silently handle sound errors
      console.warn('Could not play critical hit sound:', error.message);
    }
  }

  /**
   * Create enhanced damage text for critical hits
   */
  createCritDamageText(scene, x, y, damage, critInfo) {
    if (!scene || !scene.add) return;
    
    const fontSize = critInfo.isSuper ? 24 : (critInfo.isCrit ? 20 : 16);
    const text = critInfo.text ? critInfo.text : Math.round(damage).toString();
    
    // Create damage text
    const damageText = scene.add.text(x, y, text, {
      fontSize: `${fontSize}px`,
      fontFamily: 'Arial Black',
      color: `#${critInfo.color.toString(16).padStart(6, '0')}`,
      stroke: '#000000',
      strokeThickness: 3,
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: '#000000',
        blur: 4,
        fill: true
      }
    });
    
    damageText.setOrigin(0.5);
    damageText.setDepth(300);
    
    // Animate damage text
    const moveDistance = critInfo.isSuper ? 60 : (critInfo.isCrit ? 45 : 30);
    const duration = critInfo.isSuper ? 800 : (critInfo.isCrit ? 600 : 400);
    
    scene.tweens.add({
      targets: damageText,
      y: y - moveDistance,
      alpha: 0,
      scale: critInfo.isSuper ? 1.5 : (critInfo.isCrit ? 1.2 : 1.0),
      duration: duration,
      ease: 'Power2',
      onComplete: () => {
        if (damageText && damageText.active) {
          damageText.destroy();
        }
      }
    });
    
    return damageText;
  }
}