/**
 * Particle Effects Manager for MonDefense
 * Handles various visual effects like explosions, coins, sparkles, etc.
 */

class ParticleEffects {
  constructor(scene) {
    this.scene = scene;
    this.activeEffects = [];
    this.maxParticles = 50; // Default, can be overridden by graphics settings
  }

  setMaxParticles(max) {
    this.maxParticles = max;
  }

  // Create explosion effect when enemies are defeated
  createExplosion(x, y, color = 0xFF6600, size = 'medium') {
    if (this.activeEffects.length >= this.maxParticles) return;

    const particleCount = size === 'small' ? 8 : size === 'large' ? 20 : 12;
    const maxDistance = size === 'small' ? 30 : size === 'large' ? 60 : 45;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const distance = Math.random() * maxDistance + 20;
      const endX = x + Math.cos(angle) * distance;
      const endY = y + Math.sin(angle) * distance;
      
      const particle = this.scene.add.circle(x, y, Math.random() * 4 + 2, color);
      particle.setAlpha(0.8);
      particle.setDepth(1000);
      
      this.activeEffects.push(particle);
      
      this.scene.tweens.add({
        targets: particle,
        x: endX,
        y: endY,
        alpha: 0,
        scaleX: 0.1,
        scaleY: 0.1,
        duration: 400 + Math.random() * 200,
        ease: 'Cubic.easeOut',
        onComplete: () => {
          particle.destroy();
          this.removeEffect(particle);
        }
      });
    }
  }

  // Create coin collection effect
  createCoinEffect(x, y, targetX, targetY) {
    if (this.activeEffects.length >= this.maxParticles) return;

    // Create sparkle at collection point
    for (let i = 0; i < 6; i++) {
      const sparkle = this.scene.add.star(
        x + (Math.random() - 0.5) * 20, 
        y + (Math.random() - 0.5) * 20, 
        5, 2, 4, 0xFFD700
      );
      sparkle.setDepth(1000);
      sparkle.setAlpha(0.8);
      this.activeEffects.push(sparkle);
      
      this.scene.tweens.add({
        targets: sparkle,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        rotation: Math.PI * 2,
        duration: 300,
        ease: 'Back.easeIn',
        onComplete: () => {
          sparkle.destroy();
          this.removeEffect(sparkle);
        }
      });
    }

    // Create floating coin that moves to UI
    const coin = this.scene.add.circle(x, y, 8, 0xFFD700);
    coin.setStrokeStyle(2, 0xFFAA00);
    coin.setDepth(1500);
    this.activeEffects.push(coin);
    
    this.scene.tweens.add({
      targets: coin,
      x: targetX,
      y: targetY,
      scaleX: 0.5,
      scaleY: 0.5,
      duration: 600,
      ease: 'Quad.easeInOut',
      onComplete: () => {
        // Final sparkle at destination
        this.createSparkle(targetX, targetY, 0xFFD700, 3);
        coin.destroy();
        this.removeEffect(coin);
      }
    });
  }

  // Create sparkle effect
  createSparkle(x, y, color = 0xFFFFFF, count = 5) {
    if (this.activeEffects.length >= this.maxParticles) return;

    for (let i = 0; i < count; i++) {
      const sparkle = this.scene.add.star(
        x + (Math.random() - 0.5) * 10, 
        y + (Math.random() - 0.5) * 10, 
        4, 1, 3, color
      );
      sparkle.setDepth(1000);
      sparkle.setAlpha(1);
      this.activeEffects.push(sparkle);
      
      this.scene.tweens.add({
        targets: sparkle,
        alpha: 0,
        scaleX: 1.5,
        scaleY: 1.5,
        rotation: Math.PI,
        duration: 250 + Math.random() * 150,
        ease: 'Sine.easeOut',
        onComplete: () => {
          sparkle.destroy();
          this.removeEffect(sparkle);
        }
      });
    }
  }

  // Create magic effect for spellcasters
  createMagicEffect(x, y, color = 0x4444FF, type = 'fire') {
    if (this.activeEffects.length >= this.maxParticles) return;

    if (type === 'fire') {
      // Fire effect
      for (let i = 0; i < 8; i++) {
        const flame = this.scene.add.circle(
          x + (Math.random() - 0.5) * 15, 
          y + (Math.random() - 0.5) * 15, 
          Math.random() * 3 + 2, 
          Math.random() > 0.5 ? 0xFF4400 : 0xFF8800
        );
        flame.setDepth(900);
        flame.setAlpha(0.8);
        this.activeEffects.push(flame);
        
        this.scene.tweens.add({
          targets: flame,
          y: y - 30 - Math.random() * 20,
          alpha: 0,
          scaleX: 0.1,
          scaleY: 0.1,
          duration: 300 + Math.random() * 200,
          ease: 'Quad.easeOut',
          onComplete: () => {
            flame.destroy();
            this.removeEffect(flame);
          }
        });
      }
    } else if (type === 'ice') {
      // Ice effect
      for (let i = 0; i < 6; i++) {
        const ice = this.scene.add.polygon(
          x + (Math.random() - 0.5) * 15, 
          y + (Math.random() - 0.5) * 15, 
          [0, -4, 3, 2, -3, 2], 
          0x4488FF
        );
        ice.setDepth(900);
        ice.setAlpha(0.9);
        this.activeEffects.push(ice);
        
        this.scene.tweens.add({
          targets: ice,
          y: y - 25 - Math.random() * 15,
          alpha: 0,
          rotation: Math.PI * 2,
          scaleX: 0.2,
          scaleY: 0.2,
          duration: 400 + Math.random() * 200,
          ease: 'Sine.easeOut',
          onComplete: () => {
            ice.destroy();
            this.removeEffect(ice);
          }
        });
      }
    }
  }

  // Create healing effect
  createHealEffect(x, y) {
    if (this.activeEffects.length >= this.maxParticles) return;

    for (let i = 0; i < 8; i++) {
      const heal = this.scene.add.star(
        x + (Math.random() - 0.5) * 20, 
        y + Math.random() * 30, 
        6, 2, 5, 0x44FF44
      );
      heal.setDepth(900);
      heal.setAlpha(0.7);
      this.activeEffects.push(heal);
      
      this.scene.tweens.add({
        targets: heal,
        y: y - 40 - Math.random() * 20,
        alpha: 0,
        scaleX: 0.3,
        scaleY: 0.3,
        rotation: Math.PI,
        duration: 500 + Math.random() * 200,
        ease: 'Sine.easeOut',
        onComplete: () => {
          heal.destroy();
          this.removeEffect(heal);
        }
      });
    }
  }

  // Create screen shake effect
  createScreenShake(intensity = 5, duration = 200) {
    if (!this.scene.cameras || !this.scene.cameras.main) return;
    
    const camera = this.scene.cameras.main;
    const originalX = camera.scrollX;
    const originalY = camera.scrollY;
    
    this.scene.tweens.add({
      targets: camera,
      duration: duration,
      repeat: 0,
      onUpdate: () => {
        camera.setScroll(
          originalX + (Math.random() - 0.5) * intensity,
          originalY + (Math.random() - 0.5) * intensity
        );
      },
      onComplete: () => {
        camera.setScroll(originalX, originalY);
      }
    });
  }

  // Create level up effect
  createLevelUpEffect(x, y) {
    if (this.activeEffects.length >= this.maxParticles) return;

    // Golden ring expanding outward
    const ring = this.scene.add.circle(x, y, 5, 0x000000, 0);
    ring.setStrokeStyle(4, 0xFFD700);
    ring.setDepth(1000);
    this.activeEffects.push(ring);
    
    this.scene.tweens.add({
      targets: ring,
      scaleX: 6,
      scaleY: 6,
      alpha: 0,
      duration: 800,
      ease: 'Quad.easeOut',
      onComplete: () => {
        ring.destroy();
        this.removeEffect(ring);
      }
    });

    // Sparkles around the effect
    for (let i = 0; i < 12; i++) {
      setTimeout(() => {
        if (this.activeEffects.length < this.maxParticles) {
          this.createSparkle(
            x + (Math.random() - 0.5) * 60, 
            y + (Math.random() - 0.5) * 60, 
            0xFFD700, 
            1
          );
        }
      }, i * 50);
    }
  }

  // Clean up effects
  removeEffect(effect) {
    const index = this.activeEffects.indexOf(effect);
    if (index > -1) {
      this.activeEffects.splice(index, 1);
    }
  }

  // Clear all effects (useful for scene cleanup)
  clearAllEffects() {
    this.activeEffects.forEach(effect => {
      if (effect && effect.destroy) {
        effect.destroy();
      }
    });
    this.activeEffects = [];
  }

  // Get current effect count (for performance monitoring)
  getEffectCount() {
    return this.activeEffects.length;
  }
}

export default ParticleEffects;
