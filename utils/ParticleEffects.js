/**
 * Particle Effects Manager for MonDefense
 * Handles various visual effects like explosions, coins, sparkles, level completion celebrations, etc.
 */

class ParticleEffects {
  constructor(scene) {
    this.scene = scene;
    this.activeEffects = [];
    this.maxParticles = 50; // Default, can be overridden by graphics settings
    this.confettiColors = [0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00, 0xFF00FF, 0x00FFFF, 0xFFFFFF, 0xFFA500];
  }

  setMaxParticles(max) {
    this.maxParticles = max;
  }
  
  // Create a celebration effect for level completion
  createLevelCompletionCelebration() {
    // Don't create particles if we're at the limit
    if (this.activeEffects.length >= this.maxParticles) return;
    
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    
    // Create confetti from top of screen
    for (let i = 0; i < 50; i++) {
      if (this.activeEffects.length >= this.maxParticles) break;
      
      // Random position across top of screen
      const x = Math.random() * width;
      const y = -20;
      
      // Random confetti color
      const color = this.confettiColors[Math.floor(Math.random() * this.confettiColors.length)];
      
      // Create confetti piece
      const confetti = this.scene.add.rectangle(
        x, y,
        Math.random() * 10 + 5,
        Math.random() * 10 + 5,
        color
      );
      confetti.setDepth(2000);
      confetti.setAlpha(0.8);
      confetti.angle = Math.random() * 360;
      this.activeEffects.push(confetti);
      
      // Animate confetti falling
      this.scene.tweens.add({
        targets: confetti,
        y: height + 50,
        x: x + (Math.random() - 0.5) * 300,
        angle: confetti.angle + Math.random() * 720 - 360,
        alpha: { start: 0.8, from: 0.8, to: 0 },
        scaleX: { start: 1, from: 1, to: 0.5 },
        scaleY: { start: 1, from: 1, to: 0.5 },
        duration: 3000 + Math.random() * 2000,
        ease: 'Sine.easeInOut',
        delay: Math.random() * 3000,
        onComplete: () => {
          confetti.destroy();
          this.removeEffect(confetti);
        }
      });
    }
    
    // Create fireworks
    this.createFireworks(5);
    
    // Add screen flash
    const flash = this.scene.add.rectangle(
      width / 2, height / 2,
      width, height,
      0xFFFFFF
    );
    flash.setAlpha(0);
    flash.setDepth(1999);
    
    this.scene.tweens.add({
      targets: flash,
      alpha: { from: 0.5, to: 0 },
      duration: 500,
      ease: 'Sine.easeOut',
      onComplete: () => flash.destroy()
    });
    
    // Add screen shake for dramatic effect
    if (this.scene.graphicsSettings && this.scene.graphicsSettings.shouldShowScreenShake()) {
      this.createScreenShake(5, 500);
    }
  }

  // Create fireworks effect for celebrations
  createFireworks(count = 3) {
    if (this.activeEffects.length >= this.maxParticles) return;
    
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    
    for (let i = 0; i < count; i++) {
      // Random position for firework
      const x = Math.random() * width * 0.8 + width * 0.1;
      const y = Math.random() * height * 0.5 + height * 0.1;
      
      // Random color for this firework
      const color = this.confettiColors[Math.floor(Math.random() * this.confettiColors.length)];
      
      // Create rocket trail
      const startY = height + 50;
      const rocketTrail = [];
      
      // Create rocket
      const rocket = this.scene.add.circle(x, startY, 3, color);
      rocket.setDepth(2000);
      this.activeEffects.push(rocket);
      
      // Animate rocket upward
      this.scene.tweens.add({
        targets: rocket,
        y: y,
        duration: 1000 + Math.random() * 500,
        delay: i * 300 + Math.random() * 500,
        ease: 'Quad.easeOut',
        onUpdate: (tween) => {
          // Create trail particles
          if (Math.random() > 0.7) {
            const trail = this.scene.add.circle(
              rocket.x + (Math.random() - 0.5) * 5,
              rocket.y + 10 + Math.random() * 5,
              2,
              0xFFFFAA
            );
            trail.setAlpha(0.7);
            trail.setDepth(1999);
            rocketTrail.push(trail);
            this.activeEffects.push(trail);
            
            // Fade out trail
            this.scene.tweens.add({
              targets: trail,
              alpha: 0,
              scaleX: 0.5,
              scaleY: 0.5,
              duration: 300,
              onComplete: () => {
                trail.destroy();
                this.removeEffect(trail);
              }
            });
          }
        },
        onComplete: () => {
          // Explode at destination
          rocket.destroy();
          this.removeEffect(rocket);
          
          // Create explosion with same color
          this.createExplosion(x, y, color, 'large');
          
          // Play sound if available
          if (this.scene.sound && this.scene.sound.add) {
            const sound = this.scene.sound.add('explosion', { volume: 0.3 });
            if (sound) sound.play();
          }
        }
      });
    }
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
  
  // Create a floating power-up effect
  createPowerUpEffect(x, y, type = 'damage') {
    if (this.activeEffects.length >= this.maxParticles) return;
    
    // Define colors based on power-up type
    const colors = {
      'damage': 0xFF0000,
      'speed': 0x00FF00,
      'range': 0x0000FF,
      'coins': 0xFFD700
    };
    
    const color = colors[type] || 0xFFFFFF;
    
    // Create main power-up icon
    const powerUp = this.scene.add.star(x, y, 5, 5, 10, color);
    powerUp.setDepth(1000);
    powerUp.setAlpha(0.9);
    this.activeEffects.push(powerUp);
    
    // Add glow effect
    const glow = this.scene.add.circle(x, y, 15, color, 0.3);
    glow.setDepth(999);
    this.activeEffects.push(glow);
    
    // Create orbiting particles
    const particles = [];
    const particleCount = 5;
    
    for (let i = 0; i < particleCount; i++) {
      const particle = this.scene.add.circle(x, y, 3, color);
      particle.setAlpha(0.7);
      particle.setDepth(1000);
      particles.push(particle);
      this.activeEffects.push(particle);
      
      // Orbit animation
      this.scene.tweens.add({
        targets: particle,
        angle: 360,
        loop: -1,
        duration: 2000,
        onUpdate: (tween, target) => {
          const angle = Phaser.Math.DegToRad(target.angle);
          const radius = 20;
          target.x = powerUp.x + Math.cos(angle) * radius;
          target.y = powerUp.y + Math.sin(angle) * radius;
        }
      });
    }
    
    // Floating animation
    this.scene.tweens.add({
      targets: [powerUp, glow],
      y: y - 10,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Pulsing animation
    this.scene.tweens.add({
      targets: glow,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Rotation animation
    this.scene.tweens.add({
      targets: powerUp,
      angle: 360,
      duration: 6000,
      repeat: -1,
      ease: 'Linear'
    });
    
    return { powerUp, glow, particles };
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
