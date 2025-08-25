export default class DefenseEvolution {
  constructor() {
    // Evolution thresholds for each defense type
    this.evolutionThresholds = {
      chog: {
        stage1: { kills: 10, name: 'Veteran Chog', damageBonus: 1.5, rangeBonus: 1.2 },
        stage2: { kills: 25, name: 'Elite Chog', damageBonus: 2.0, rangeBonus: 1.4, specialAbility: 'doubleShot' },
        stage3: { kills: 50, name: 'Legendary Chog', damageBonus: 3.0, rangeBonus: 1.6, specialAbility: 'tripleShot' }
      },
      molandak: {
        stage1: { kills: 8, name: 'Seasoned Molandak', damageBonus: 1.4, rangeBonus: 1.3 },
        stage2: { kills: 20, name: 'Master Molandak', damageBonus: 1.8, rangeBonus: 1.5, specialAbility: 'piercing' },
        stage3: { kills: 40, name: 'Arcane Molandak', damageBonus: 2.5, rangeBonus: 1.7, specialAbility: 'chainLightning' }
      },
      moyaki: {
        stage1: { kills: 12, name: 'Hardened Moyaki', damageBonus: 1.3, aoeBonus: 1.4 },
        stage2: { kills: 30, name: 'Fortress Moyaki', damageBonus: 1.7, aoeBonus: 1.6, specialAbility: 'shockwave' },
        stage3: { kills: 60, name: 'Titan Moyaki', damageBonus: 2.2, aoeBonus: 2.0, specialAbility: 'earthquake' }
      },
      keon: {
        stage1: { kills: 15, name: 'Swift Keon', damageBonus: 1.2, cooldownReduction: 0.8 },
        stage2: { kills: 35, name: 'Lightning Keon', damageBonus: 1.6, cooldownReduction: 0.6, specialAbility: 'rapidFire' },
        stage3: { kills: 70, name: 'Storm Keon', damageBonus: 2.1, cooldownReduction: 0.4, specialAbility: 'thunderstorm' }
      },
      noot: {
        stage1: { kills: 6, name: 'Alpha Noot', damageBonus: 1.6, rangeBonus: 1.1 },
        stage2: { kills: 18, name: 'Pack Leader Noot', damageBonus: 2.2, rangeBonus: 1.3, specialAbility: 'packHunt' },
        stage3: { kills: 45, name: 'Apex Noot', damageBonus: 3.2, rangeBonus: 1.5, specialAbility: 'howlOfDestruction' }
      },
      abster: {
        stage1: { kills: 20, name: 'Reinforced Abster', damageBonus: 1.1, aoeBonus: 1.5 },
        stage2: { kills: 50, name: 'Heavy Abster', damageBonus: 1.4, aoeBonus: 1.8, specialAbility: 'barrage' },
        stage3: { kills: 100, name: 'Siege Abster', damageBonus: 1.8, aoeBonus: 2.2, specialAbility: 'devastation' }
      },
      wizard: {
        stage1: { kills: 5, name: 'Apprentice Wizard', damageBonus: 1.7, manaEfficiency: 1.2 },
        stage2: { kills: 15, name: 'Archmage', damageBonus: 2.4, manaEfficiency: 1.5, specialAbility: 'meteor' },
        stage3: { kills: 35, name: 'Grand Wizard', damageBonus: 3.5, manaEfficiency: 2.0, specialAbility: 'apocalypse' }
      }
    };
    
    // Visual evolution effects
    this.evolutionColors = {
      stage1: 0x00FF00, // Green glow
      stage2: 0x0080FF, // Blue glow
      stage3: 0xFF00FF  // Purple glow
    };
    
    // Evolution particle effects
    this.evolutionParticles = {
      stage1: { color: 0x00FF00, count: 20, speed: 100 },
      stage2: { color: 0x0080FF, count: 35, speed: 150 },
      stage3: { color: 0xFF00FF, count: 50, speed: 200 }
    };
  }
  
  // Check if defense can evolve
  canEvolve(defense) {
    const thresholds = this.evolutionThresholds[defense.type];
    if (!thresholds) return null;
    
    const currentStage = defense.evolutionStage || 0;
    const nextStage = currentStage + 1;
    const stageKey = `stage${nextStage}`;
    
    if (thresholds[stageKey] && defense.enemiesDefeated >= thresholds[stageKey].kills) {
      return { stage: nextStage, data: thresholds[stageKey] };
    }
    
    return null;
  }
  
  // Get evolution progress for UI display
  getEvolutionProgress(defense) {
    const thresholds = this.evolutionThresholds[defense.type];
    if (!thresholds) return null;
    
    const currentStage = defense.evolutionStage || 0;
    const nextStage = currentStage + 1;
    const stageKey = `stage${nextStage}`;
    
    if (!thresholds[stageKey]) {
      return { isMaxLevel: true, currentStage, stageName: this.getStageName(defense) };
    }
    
    const required = thresholds[stageKey].kills;
    const current = defense.enemiesDefeated;
    const progress = Math.min(current / required, 1.0);
    
    return {
      isMaxLevel: false,
      currentStage,
      nextStage,
      progress,
      current,
      required,
      nextStageName: thresholds[stageKey].name,
      currentStageName: this.getStageName(defense)
    };
  }
  
  // Get current stage name
  getStageName(defense) {
    const thresholds = this.evolutionThresholds[defense.type];
    if (!thresholds || !defense.evolutionStage) {
      return defense.type.charAt(0).toUpperCase() + defense.type.slice(1);
    }
    
    const stageKey = `stage${defense.evolutionStage}`;
    return thresholds[stageKey]?.name || defense.type;
  }
  
  // Evolve defense to next stage
  evolveDefense(defense) {
    const evolutionData = this.canEvolve(defense);
    if (!evolutionData) return false;
    
    const { stage, data } = evolutionData;
    
    // Initialize evolution stage if not set
    if (!defense.evolutionStage) {
      defense.evolutionStage = 0;
      defense.baseDamage = defense.damage;
      defense.baseRange = defense.range;
      defense.baseCooldown = defense.cooldown;
      defense.baseAoeRadius = defense.aoeRadius;
      defense.baseManaCostPerShot = defense.manaCostPerShot;
    }
    
    // Apply evolution bonuses
    defense.evolutionStage = stage;
    
    // Apply damage bonus
    if (data.damageBonus) {
      defense.damage = defense.baseDamage * data.damageBonus;
    }
    
    // Apply range bonus
    if (data.rangeBonus) {
      defense.range = defense.baseRange * data.rangeBonus;
    }
    
    // Apply AOE bonus
    if (data.aoeBonus) {
      defense.aoeRadius = defense.baseAoeRadius * data.aoeBonus;
    }
    
    // Apply cooldown reduction
    if (data.cooldownReduction) {
      defense.cooldown = defense.baseCooldown * data.cooldownReduction;
    }
    
    // Apply mana efficiency
    if (data.manaEfficiency) {
      defense.manaCostPerShot = defense.baseManaCostPerShot / data.manaEfficiency;
    }
    
    // Add special abilities
    if (data.specialAbility) {
      defense.evolutionAbility = data.specialAbility;
    }
    
    // Create evolution visual effects
    this.createEvolutionEffects(defense, stage);
    
    // Play evolution sound
    if (defense.scene.soundManager) {
      defense.scene.soundManager.play('victory', { volume: 0.8 });
    }
    
    console.log(`${defense.type} evolved to ${data.name}! Stage ${stage}`);
    return true;
  }
  
  // Create visual evolution effects
  createEvolutionEffects(defense, stage) {
    if (!defense.scene || !defense.sprite) return;
    
    const scene = defense.scene;
    const x = defense.x;
    const y = defense.y;
    
    // Create evolution glow
    const glow = scene.add.circle(x, y, 60, this.evolutionColors[`stage${stage}`], 0.3);
    glow.setDepth(150);
    
    // Animate glow
    scene.tweens.add({
      targets: glow,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 1500,
      ease: 'Power2.easeOut',
      onComplete: () => glow.destroy()
    });
    
    // Create particle burst
    const particles = this.evolutionParticles[`stage${stage}`];
    for (let i = 0; i < particles.count; i++) {
      const angle = (i / particles.count) * Math.PI * 2;
      const particle = scene.add.circle(x, y, 3, particles.color, 0.8);
      particle.setDepth(160);
      
      const targetX = x + Math.cos(angle) * 80;
      const targetY = y + Math.sin(angle) * 80;
      
      scene.tweens.add({
        targets: particle,
        x: targetX,
        y: targetY,
        alpha: 0,
        scale: 0.2,
        duration: 800 + Math.random() * 400,
        ease: 'Power2.easeOut',
        onComplete: () => particle.destroy()
      });
    }
    
    // Add permanent evolution aura
    this.addEvolutionAura(defense, stage);
    
    // Show evolution text
    this.showEvolutionText(defense, stage);
  }
  
  // Add permanent evolution aura
  addEvolutionAura(defense, stage) {
    // Remove existing aura
    if (defense.evolutionAura) {
      defense.evolutionAura.destroy();
    }
    
    const scene = defense.scene;
    const x = defense.x;
    const y = defense.y;
    
    // Create subtle permanent aura
    defense.evolutionAura = scene.add.circle(x, y, 35, this.evolutionColors[`stage${stage}`], 0.1);
    defense.evolutionAura.setDepth(90);
    
    // Gentle pulsing animation
    scene.tweens.add({
      targets: defense.evolutionAura,
      alpha: 0.2,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }
  
  // Show evolution text notification
  showEvolutionText(defense, stage) {
    const scene = defense.scene;
    const stageName = this.getStageName(defense);
    
    const text = scene.add.text(defense.x, defense.y - 40, `EVOLVED!\n${stageName}`, {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center'
    }).setOrigin(0.5);
    
    text.setDepth(200);
    
    // Animate evolution text
    scene.tweens.add({
      targets: text,
      y: defense.y - 80,
      alpha: 0,
      scale: 1.5,
      duration: 2000,
      ease: 'Power2.easeOut',
      onComplete: () => text.destroy()
    });
  }
  
  // Apply evolution special abilities during attacks
  applyEvolutionAbility(defense, target, baseDamage) {
    if (!defense.evolutionAbility) return baseDamage;
    
    switch (defense.evolutionAbility) {
      case 'doubleShot':
        // Fire an additional projectile
        setTimeout(() => {
          if (target && target.active) {
            defense.fireProjectile(target, baseDamage * 0.7);
          }
        }, 200);
        return baseDamage;
        
      case 'tripleShot':
        // Fire two additional projectiles
        setTimeout(() => {
          if (target && target.active) {
            defense.fireProjectile(target, baseDamage * 0.6);
          }
        }, 150);
        setTimeout(() => {
          if (target && target.active) {
            defense.fireProjectile(target, baseDamage * 0.6);
          }
        }, 300);
        return baseDamage;
        
      case 'piercing':
        // Damage passes through to nearby enemies
        const nearbyEnemies = defense.scene.enemies.filter(enemy => 
          enemy !== target && 
          enemy.active && 
          Phaser.Math.Distance.Between(target.x, target.y, enemy.x, enemy.y) < 80
        );
        nearbyEnemies.forEach(enemy => {
          setTimeout(() => {
            if (enemy.active) {
              defense.applyDamageToEnemy(enemy, baseDamage * 0.5);
            }
          }, 100);
        });
        return baseDamage * 1.2;
        
      case 'chainLightning':
        // Lightning chains to nearby enemies
        this.createChainLightning(defense, target, baseDamage * 0.8, 3);
        return baseDamage;
        
      case 'shockwave':
        // Create expanding shockwave
        this.createShockwave(defense, baseDamage * 0.6);
        return baseDamage;
        
      case 'earthquake':
        // Damage all enemies on screen
        defense.scene.enemies.forEach(enemy => {
          if (enemy.active && enemy !== target) {
            setTimeout(() => {
              if (enemy.active) {
                defense.applyDamageToEnemy(enemy, baseDamage * 0.4);
              }
            }, Math.random() * 500);
          }
        });
        return baseDamage * 1.5;
        
      case 'rapidFire':
        // Reduce cooldown for next few attacks
        defense.rapidFireStacks = (defense.rapidFireStacks || 0) + 3;
        return baseDamage;
        
      case 'thunderstorm':
        // Create multiple lightning strikes
        for (let i = 0; i < 5; i++) {
          setTimeout(() => {
            const randomEnemy = defense.scene.enemies[Math.floor(Math.random() * defense.scene.enemies.length)];
            if (randomEnemy && randomEnemy.active) {
              defense.applyDamageToEnemy(randomEnemy, baseDamage * 0.8);
            }
          }, i * 200);
        }
        return baseDamage;
        
      case 'packHunt':
        // Bonus damage based on nearby defenses
        const nearbyDefenses = defense.scene.defenses.filter(def => 
          def !== defense && 
          def.active && 
          Phaser.Math.Distance.Between(defense.x, defense.y, def.x, def.y) < 150
        ).length;
        return baseDamage * (1 + nearbyDefenses * 0.3);
        
      case 'howlOfDestruction':
        // Boost all nearby defenses temporarily
        const allies = defense.scene.defenses.filter(def => 
          def !== defense && 
          def.active && 
          Phaser.Math.Distance.Between(defense.x, defense.y, def.x, def.y) < 200
        );
        allies.forEach(ally => {
          ally.howlBoost = (ally.howlBoost || 0) + 1;
          setTimeout(() => {
            if (ally.howlBoost) ally.howlBoost--;
          }, 5000);
        });
        return baseDamage * 2;
        
      case 'barrage':
        // Multiple projectiles in sequence
        for (let i = 0; i < 4; i++) {
          setTimeout(() => {
            if (target && target.active) {
              defense.fireProjectile(target, baseDamage * 0.4);
            }
          }, i * 100);
        }
        return baseDamage;
        
      case 'devastation':
        // Massive AOE explosion
        defense.performAreaAttack(target.x, target.y, baseDamage * 2, 150);
        return baseDamage;
        
      case 'meteor':
        // Delayed high damage attack
        setTimeout(() => {
          if (target && target.active) {
            defense.applyDamageToEnemy(target, baseDamage * 3);
            defense.performAreaAttack(target.x, target.y, baseDamage * 1.5, 100);
          }
        }, 1000);
        return baseDamage * 0.5;
        
      case 'apocalypse':
        // Screen-wide devastation
        defense.scene.enemies.forEach(enemy => {
          if (enemy.active) {
            setTimeout(() => {
              if (enemy.active) {
                defense.applyDamageToEnemy(enemy, baseDamage * 2);
              }
            }, Math.random() * 1000);
          }
        });
        return baseDamage;
        
      default:
        return baseDamage;
    }
  }
  
  // Create chain lightning effect
  createChainLightning(defense, startTarget, damage, chains) {
    if (chains <= 0 || !startTarget || !startTarget.active) return;
    
    // Find next target
    const nextTarget = defense.scene.enemies.find(enemy => 
      enemy !== startTarget && 
      enemy.active && 
      Phaser.Math.Distance.Between(startTarget.x, startTarget.y, enemy.x, enemy.y) < 120
    );
    
    if (nextTarget) {
      // Create lightning visual
      const lightning = defense.scene.add.line(
        0, 0, 
        startTarget.x, startTarget.y, 
        nextTarget.x, nextTarget.y, 
        0x00FFFF, 1
      );
      lightning.setLineWidth(3);
      lightning.setDepth(180);
      
      // Animate lightning
      defense.scene.tweens.add({
        targets: lightning,
        alpha: 0,
        duration: 300,
        onComplete: () => lightning.destroy()
      });
      
      // Apply damage
      defense.applyDamageToEnemy(nextTarget, damage);
      
      // Continue chain
      setTimeout(() => {
        this.createChainLightning(defense, nextTarget, damage * 0.8, chains - 1);
      }, 150);
    }
  }
  
  // Create shockwave effect
  createShockwave(defense, damage) {
    const scene = defense.scene;
    
    // Create expanding circle
    const shockwave = scene.add.circle(defense.x, defense.y, 10, 0xFFFF00, 0.3);
    shockwave.setDepth(170);
    
    // Animate expansion
    scene.tweens.add({
      targets: shockwave,
      scaleX: 8,
      scaleY: 8,
      alpha: 0,
      duration: 800,
      ease: 'Power2.easeOut',
      onComplete: () => shockwave.destroy()
    });
    
    // Damage enemies in expanding radius
    let currentRadius = 20;
    const expandInterval = setInterval(() => {
      scene.enemies.forEach(enemy => {
        if (enemy.active) {
          const distance = Phaser.Math.Distance.Between(defense.x, defense.y, enemy.x, enemy.y);
          if (distance <= currentRadius && distance > currentRadius - 20) {
            defense.applyDamageToEnemy(enemy, damage);
          }
        }
      });
      
      currentRadius += 20;
      if (currentRadius > 160) {
        clearInterval(expandInterval);
      }
    }, 100);
  }
}