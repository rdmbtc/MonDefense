'use client';

import Phaser from 'phaser';
import ParticleEffects from '../utils/ParticleEffects.js';
import GraphicsSettings from '../utils/GraphicsSettings.js';
import PowerUpManager from '../utils/PowerUpManager.js';
import UpgradeSystem from '../utils/UpgradeSystem.js';
import SpecializationUI from '../ui/SpecializationUI.js';
import UIStyleSystem from '../utils/UIStyleSystem.js';
import Crop2 from '../classes/Crop2.js';

class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.type = 'phaser-scene';
    this.farmCoins = 0;
    this.addFarmCoinsCallback = null;
    this.crops = {};
    this.enemies = [];
    this.defenses = [];
    this.isSpawningEnemies = false;
    this.gameInitialized = false;
    this.allowPlanting = false;
    this.waveTimer = null;
    this.waveInProgress = false;
    this.specializationMenuVisible = false;
    
    // Initialize sounds object to prevent errors
    this.sounds = {};
    this.soundsLoaded = false;
    
    this.gameState = {
      wave: 1,
      score: 0,
      farmCoins: 50,
      isActive: false,
      lives: 3,
      clickDamage: 1,
      canPlant: true,
      autoWave: true,
      mana: 100, // Current mana amount
      maxMana: 100, // Maximum mana capacity
      manaRegenRate: 5, // Mana regeneration per second
      lastManaRegen: 0 // Timestamp of last mana regeneration
    };
    
    // Weather System
    this.weatherSystem = {
      currentWeather: 'sunny',
      weatherTypes: ['sunny', 'rainy', 'snow'],
      weatherEffects: null,
      weatherParticles: null,
      weatherOverlay: null,
      weatherText: null
    };
    
    this.enemiesSpawned = 0;
    this.totalEnemiesInWave = 0;
    this.pendingDefensePlacement = false;
    this.currentDefenseType = null;
    this.toolMode = 'attack'; // 'attack' or 'plant'
  }

  preload() {
    console.log('GameScene preload started');
    
    // Load effect sprites  
    this.load.image('fireball', '/effects/fireball.png');
    this.load.image('iceball', '/effects/iceball.png');
    this.load.image('coin', '/effects/coin.png');
    
    // Load enemy sprites from monster icons collection

    this.load.image('enemy_goblin', '/logo/craftpix-net-459799-free-low-level-monsters-pixel-icons-32x32/PNG/Transperent/Icon5.png');
    this.load.image('enemy_orc', '/logo/craftpix-net-459799-free-low-level-monsters-pixel-icons-32x32/PNG/Transperent/Icon10.png');
    this.load.image('enemy_dragon', '/logo/craftpix-net-459799-free-low-level-monsters-pixel-icons-32x32/PNG/Transperent/Icon15.png');
    this.load.image('enemy_skeleton', '/logo/craftpix-net-459799-free-low-level-monsters-pixel-icons-32x32/PNG/Transperent/Icon20.png');
    this.load.image('enemy_demon', '/logo/craftpix-net-459799-free-low-level-monsters-pixel-icons-32x32/PNG/Transperent/Icon25.png');
    
    // Defender sprites are loaded in LoadingScene.js
    
    // Load tileset assets
    this.load.image('tileset', '/logo/1 Tiles/FieldsTileset.png');
    this.load.image('tileset2', '/logo/1.1 Tiles/Tileset2.png');
    
    // Load individual tiles for specific uses
    this.load.image('grass1', '/logo/1 Tiles/FieldsTile_01.png');
    this.load.image('grass2', '/logo/1 Tiles/FieldsTile_02.png');
    this.load.image('soil1', '/logo/1 Tiles/FieldsTile_11.png');
    this.load.image('soil2', '/logo/1 Tiles/FieldsTile_12.png');
    
    // Load decorative objects
    this.load.image('towerPlace1', '/logo/2 Objects/PlaceForTower1.png');
    this.load.image('towerPlace2', '/logo/2 Objects/PlaceForTower2.png');
    
    // Load trees for decoration
    this.load.image('tree1', '/logo/craftpix-net-385863-free-top-down-trees-pixel-art/PNG/Assets_separately/Trees/Tree1.png');
    this.load.image('tree2', '/logo/craftpix-net-385863-free-top-down-trees-pixel-art/PNG/Assets_separately/Trees/Tree2.png');
    this.load.image('tree3', '/logo/craftpix-net-385863-free-top-down-trees-pixel-art/PNG/Assets_separately/Trees/Tree3.png');
    this.load.image('fruitTree1', '/logo/craftpix-net-385863-free-top-down-trees-pixel-art/PNG/Assets_separately/Trees/Fruit_tree1.png');
    this.load.image('fruitTree2', '/logo/craftpix-net-385863-free-top-down-trees-pixel-art/PNG/Assets_separately/Trees/Fruit_tree2.png');
    
    // Load house decorations
    this.load.image('house1', '/logo/2 Objects/7 House/1.png');
    this.load.image('house2', '/logo/2 Objects/7 House/2.png');
    this.load.image('house3', '/logo/2 Objects/7 House/3.png');
    this.load.image('house4', '/logo/2 Objects/7 House/4.png');
    
    // Load decorative elements
    this.load.image('decor1', '/logo/2 Objects/3 Decor/1.png');
    this.load.image('decor2', '/logo/2 Objects/3 Decor/2.png');
    this.load.image('decor3', '/logo/2 Objects/3 Decor/3.png');
    this.load.image('decor4', '/logo/2 Objects/3 Decor/4.png');
    this.load.image('decor5', '/logo/2 Objects/3 Decor/5.png');
    
    // Load shadows
    this.load.image('shadow1', '/logo/2 Objects/1 Shadow/1.png');
    this.load.image('shadow2', '/logo/2 Objects/1 Shadow/2.png');
    
    // Load plant growth stage sprites (numbered 1-4 for growth stages)
    this.load.image('plant1', '/logo/plants/1.png'); // Seedling stage
    this.load.image('plant2', '/logo/plants/2.png'); // Growing stage
    this.load.image('plant3', '/logo/plants/3.png'); // Mature stage
    this.load.image('plant4', '/logo/plants/4.png'); // Harvestable stage
    
    // Load UI icons from available collections
    this.load.image('icon1', '/logo/craftpix-net-459799-free-low-level-monsters-pixel-icons-32x32/PNG/Transperent/Icon1.png');
    this.load.image('icon2', '/logo/craftpix-net-459799-free-low-level-monsters-pixel-icons-32x32/PNG/Transperent/Icon2.png');
    this.load.image('icon3', '/logo/craftpix-net-459799-free-low-level-monsters-pixel-icons-32x32/PNG/Transperent/Icon3.png');
    
    // Create fallback pixel texture for effects
    this.load.image('pixel', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==');
    
    // Add load error handling
    this.load.on('loaderror', (fileObj) => {
      console.error('Error loading asset:', fileObj.key, 'from:', fileObj.url);
      
      // Create fallback textures for critical assets
      if (fileObj.type === 'image') {
        this.load.on('complete', () => {
          if (!this.textures.exists(fileObj.key)) {
            // Create a simple colored fallback
            const graphics = this.make.graphics();
            graphics.fillStyle(0x888888, 1);
            graphics.fillRect(0, 0, 32, 32);
            graphics.generateTexture(fileObj.key, 32, 32);
            console.log(`Created fallback texture for ${fileObj.key}`);
          }
        });
      }
    });
    
    console.log('GameScene preload complete');
  }

  create() {
    try {
      // Initialize graphics settings
      this.graphicsSettings = new GraphicsSettings(this);
      
      // Initialize particle effects system
      this.particleEffects = new ParticleEffects(this);
      this.particleEffects.setMaxParticles(this.graphicsSettings.getCurrentSettings().maxParticles);
      
      // Initialize power-up manager
      this.powerUpManager = new PowerUpManager(this);
      
      // Initialize upgrade system
      this.upgradeSystem = new UpgradeSystem(this);
      
      // Initialize UI style system
      this.uiStyle = new UIStyleSystem(this);
      
      // Initialize specialization UI
      this.specializationUI = new SpecializationUI(this);
      
      // Initialize object pools for better performance
      this.projectilePool = [];
      this.maxProjectiles = 50;
      
      // Pre-create projectiles
      for (let i = 0; i < this.maxProjectiles; i++) {
        const projectile = this.add.circle(0, 0, 5, 0xFFFF00, 1);
        projectile.setStrokeStyle(2, 0xFF0000);
        projectile.setActive(false);
        projectile.setVisible(false);
        this.projectilePool.push(projectile);
      }
      
      // Initialize click effect pool
      this.clickEffectPool = [];
      this.maxClickEffects = 30;
      
      // Pre-create click effects
      for (let i = 0; i < this.maxClickEffects; i++) {
        const clickEffect = this.add.circle(0, 0, 15, 0xFFFFFF, 0.5);
        clickEffect.setStrokeStyle(2, 0x00FFFF);
        clickEffect.setActive(false);
        clickEffect.setVisible(false);
        clickEffect.setDepth(100);
        this.clickEffectPool.push(clickEffect);
      }
      
      // Initialize enemy object pool
      this.enemyPool = [];
      this.maxEnemies = 50;
      
      // Set up performance monitoring
      this.frameTimeAvg = 0;
      this.frameCount = 0;
      this.lastFpsUpdate = 0;
      this.fpsText = this.uiStyle.createStyledText(
        this,
        10, 
        10, 
        'FPS: 0', 
        {
          fontSize: '16px',
          fill: '#00FF88',
          stroke: '#000000',
          strokeThickness: 2,
          shadow: {
            offsetX: 1,
            offsetY: 1,
            color: '#000000',
            blur: 2,
            fill: true
          }
        }
      ).setDepth(1000).setScrollFactor(0);
      this.fpsText.setVisible(false); // Hidden by default, toggle with F key
      
      // Add FPS toggle key
      this.input.keyboard.on('keydown-F', () => {
        this.fpsText.setVisible(!this.fpsText.visible);
      });
      
      // Set frame rate cap for better performance
      this.game.loop.targetFps = 60;
      
      console.log("Creating GameScene");
      
      // Initialize sounds from loaded audio assets
      this.initializeSounds();
      
      // Create beautiful main menu system
      this.createMainMenu();
      
      console.log("GameScene created successfully");
    } catch (error) {
      console.error("Error in GameScene create method:", error);
    }
  }

  // Update method for continuous game logic
  update(time, delta) {
    try {
      // Only update if game is active and not paused
      if (!this.gameState?.isActive || this.gameState?.isPaused) {
        return;
      }
      
      // Update power-up manager
      if (this.powerUpManager) {
        this.powerUpManager.update(time, delta);
      }
      
      // Update defenses to fire at enemies
      this.updateDefenses();
      
    } catch (error) {
      console.error("Error in update method:", error);
    }
  }
  
  // Update method with performance monitoring
  update(time, delta) {
    try {
      // Update FPS counter
      this.frameCount++;
      this.frameTimeAvg += delta;
      
      // Update FPS display every second
      if (time - this.lastFpsUpdate > 1000) {
        const fps = Math.round(1000 / (this.frameTimeAvg / this.frameCount));
        this.fpsText.setText(`FPS: ${fps}`);
        
        // Reset counters
        this.frameTimeAvg = 0;
        this.frameCount = 0;
        this.lastFpsUpdate = time;
      }
      
      // Skip updates if game is paused
      if (this.gameState && !this.gameState.isActive) return;
      
      // Update mana regeneration
      this.updateMana(time);
      
      // Update defenses
      this.updateDefenses();
      
      // Batch process enemies for better performance
      if (this.enemies && this.enemies.length > 0) {
        // Process enemies in smaller batches to avoid frame drops
        const batchSize = 5; // Process 5 enemies per frame at most
        const enemiesToProcess = Math.min(batchSize, this.enemies.length);
        
        for (let i = 0; i < enemiesToProcess; i++) {
          const enemy = this.enemies[i];
          if (enemy && enemy.active) {
            // Check for stuck enemies and fix their position
            if (enemy.x === enemy.lastX && enemy.y === enemy.lastY) {
              enemy.timeSinceLastMove += delta;
              
              // If enemy hasn't moved for 2 seconds, nudge it
              if (enemy.timeSinceLastMove > 2000) {
                // Get current path point and next point
                const currentPointIndex = enemy.currentPointIndex || 0;
                const path = this.path;
                
                if (path && path.length > currentPointIndex + 1) {
                  const nextPoint = path[currentPointIndex + 1];
                  // Nudge enemy toward next point
                  enemy.x += (nextPoint.x - enemy.x) * 0.1;
                  enemy.y += (nextPoint.y - enemy.y) * 0.1;
                  enemy.timeSinceLastMove = 0;
                }
              }
            } else {
              // Enemy is moving, reset timer
              enemy.lastX = enemy.x;
              enemy.lastY = enemy.y;
              enemy.timeSinceLastMove = 0;
            }
          }
        }
      }
      
    } catch (error) {
      console.error("Error in update method:", error);
    }
  }
  
  // Update mana regeneration
  updateMana(time) {
    try {
      // Only regenerate mana every second
      if (time - this.gameState.lastManaRegen >= 1000) {
        // Regenerate mana based on regen rate
        this.gameState.mana = Math.min(
          this.gameState.maxMana, 
          this.gameState.mana + this.gameState.manaRegenRate
        );
        
        // Update last regen time
        this.gameState.lastManaRegen = time;
        
        // Update mana UI
        if (this.manaText) {
          this.updateManaText();
        }
      }
    } catch (error) {
      console.error("Error updating mana:", error);
    }
  }

  // Update defense mana displays
  updateManaText() {
    try {
      
      // Update individual defense mana displays
      if (this.defenses && this.defenses.length > 0) {
        this.defenses.forEach(defense => {
          if (defense.manaDisplay) {
            defense.manaDisplay.setText(`Mana: ${this.gameState.mana}/${this.gameState.maxMana}`);
            // Change color based on mana level
            const manaPercentage = this.gameState.mana / this.gameState.maxMana;
            if (manaPercentage < 0.25) {
              defense.manaDisplay.setFill('#ff4444'); // Red when low
            } else if (manaPercentage < 0.5) {
              defense.manaDisplay.setFill('#ffaa44'); // Orange when medium
            } else {
              defense.manaDisplay.setFill('#00ffff'); // Cyan when high
            }
          }
        });
      }
    } catch (error) {
      console.error("Error updating mana text:", error);
    }
  }
  
  // Update defenses to fire at enemies
  updateDefenses() {
    if (!this.defenses || this.defenses.length === 0) return;
    
    const currentTime = Date.now();
    
    this.defenses.forEach(defense => {
      if (!defense || !defense.active) return;
      
      // Regenerate individual defense mana (affected by weather)
      const weatherManaBonus = this.weatherSystem ? this.weatherSystem.manaBonus : 1.0;
      const adjustedRegenRate = Math.max(500, 1000 / weatherManaBonus); // Faster regen with weather bonus
      if (currentTime - defense.lastManaRegen >= adjustedRegenRate) {
        defense.mana = Math.min(
          defense.maxMana,
          defense.mana + defense.manaRegenRate
        );
        defense.lastManaRegen = currentTime;
        
        // Update individual mana display
        if (defense.manaDisplay) {
          defense.manaDisplay.setText(`Mana: ${defense.mana}/${defense.maxMana}`);
          // Change color based on mana level
          const manaPercentage = defense.mana / defense.maxMana;
          if (manaPercentage < 0.25) {
            defense.manaDisplay.setFill('#ff4444'); // Red when low
          } else if (manaPercentage < 0.5) {
            defense.manaDisplay.setFill('#ffaa44'); // Orange when medium
          } else {
            defense.manaDisplay.setFill('#00ffff'); // Cyan when high
          }
        }
      }
      
      // Check if defense can fire - fireRate already includes speed multiplier
      if (currentTime - defense.lastFired < defense.fireRate) return;
      
      // Find enemies in range
      let closestEnemy = null;
      let closestDistance = Infinity;
      
      this.enemies.forEach(enemy => {
        if (!enemy || !enemy.active) return;
        
        const distance = Phaser.Math.Distance.Between(defense.x, defense.y, enemy.x, enemy.y);
        if (distance <= defense.range && distance < closestDistance) {
          closestDistance = distance;
          closestEnemy = enemy;
        }
      });
      
      // Fire at closest enemy
      if (closestEnemy) {
        this.fireDefenseAt(defense, closestEnemy);
        defense.lastFired = currentTime;
      }
    });
  }
  
  // Show low mana message above defense
  showLowManaMessage(defense) {
    try {
      // Create "Low Mana" text above the defense
      const lowManaText = this.uiStyle.createStyledText(
        this,
        defense.x, 
        defense.y - 70, 
        `⚡ Low Mana!\n${defense.mana}/${defense.maxMana}`, 
        {
          fontSize: '18px',
          fill: '#FF4444',
          stroke: '#000000',
          strokeThickness: 4,
          align: 'center',
          shadow: {
            offsetX: 2,
            offsetY: 2,
            color: '#000000',
            blur: 4,
            fill: true
          }
        }
      );
      lowManaText.setOrigin(0.5, 0.5);
      lowManaText.setDepth(20);
      
      // Animate the text with pulsing effect
      this.tweens.add({
        targets: lowManaText,
        alpha: { from: 0, to: 1 },
        y: defense.y - 90,
        scaleX: { from: 0.8, to: 1.2 },
        scaleY: { from: 0.8, to: 1.2 },
        duration: 400,
        ease: 'Back.easeOut',
        onComplete: () => {
          // Pulsing effect
          this.tweens.add({
            targets: lowManaText,
            scaleX: 1.0,
            scaleY: 1.0,
            duration: 200,
            yoyo: true,
            repeat: 2,
            onComplete: () => {
              // Keep visible for a moment then fade out
              this.time.delayedCall(600, () => {
                this.tweens.add({
                  targets: lowManaText,
                  alpha: 0,
                  duration: 400,
                  onComplete: () => lowManaText.destroy()
                });
              });
            }
          });
        }
      });
    } catch (error) {
      console.error("Error showing low mana message:", error);
    }
  }
  
  // Fire defense projectile at enemy
  fireDefenseAt(defense, enemy) {
    try {
      // Define mana costs for firing defenses
      const fireCosts = {
        chog: 5,
        molandak: 8, 
        moyaki: 12,
        keon: 15
      };
      
      const manaCost = fireCosts[defense.defenseType] || 5;
      
      // Check if defense has enough mana to fire
      if (defense.mana < manaCost) {
        // Show "Low Mana" message above the defense
        this.showLowManaMessage(defense);
        return; // Not enough mana, skip firing
      }
      
      // Deduct mana from individual defense
      defense.mana -= manaCost;
      
      // Update defense mana display
      if (defense.manaDisplay) {
        defense.manaDisplay.setText(`Mana: ${defense.mana}/${defense.maxMana}`);
      }
      
      // Create projectile based on defense type
      let projectileColor = 0xFFFF00;
      let projectileSize = 8;
      
      switch(defense.defenseType) {
        case 'chog':
          projectileColor = 0x00FFFF;
          projectileSize = 10;
          break;
        case 'molandak':
          projectileColor = 0xFF6600;
          projectileSize = 10;
          break;
        case 'moyaki':
          projectileColor = 0xFF00FF;
          projectileSize = 12;
          break;
        case 'keon':
          projectileColor = 0x666666;
          projectileSize = 14;
          break;
      }
      
      // Get projectile from pool
      let projectile = this.projectilePool.find(p => !p.active);
      
      // If no projectile available in pool, skip
      if (!projectile) return;
      
      // Position and activate the projectile
      projectile.setPosition(defense.x, defense.y);
      projectile.setActive(true);
      projectile.setVisible(true);
      projectile.setRadius(projectileSize);
      projectile.setFillStyle(projectileColor, 1);
      projectile.setStrokeStyle(2, 0xFFFFFF, 0.8);
      projectile.setDepth(25);
      
      const glow = this.glows.get(defense.x, defense.y);
      if(glow) {
        glow.setActive(true).setVisible(true).setRadius(projectileSize + 4).setFillStyle(projectileColor, 0.3).setDepth(24);
      }
      
      // Create visible attack line
      const attackLine = this.add.graphics();
      attackLine.setDepth(23);
      attackLine.lineStyle(2, projectileColor, 0.5);
      attackLine.lineBetween(defense.x, defense.y, enemy.x, enemy.y);
      
      // Fade out attack line
      this.tweens.add({
        targets: attackLine,
        alpha: 0,
        duration: 300,
        onComplete: () => attackLine.destroy()
      });
      
      // Animate projectile to enemy
      this.tweens.add({
        targets: [projectile, glow].filter(Boolean),
        x: enemy.x,
        y: enemy.y,
        duration: 300,
        onComplete: () => {
          // Create impact effect using object pooling
          // Initialize impact pool if not exists
          if (!this.impactPool) {
            this.impactPool = [];
            this.maxImpacts = 20;
            
            // Pre-create impacts
            for (let i = 0; i < this.maxImpacts; i++) {
              const impactEffect = this.add.circle(0, 0, 20, 0xFFFFFF, 0.6);
              impactEffect.setDepth(26);
              impactEffect.setActive(false);
              impactEffect.setVisible(false);
              this.impactPool.push(impactEffect);
            }
          }
          
          // Get impact from pool
          let impact = this.impactPool.find(i => !i.active);
          
          // If no impact available in pool, skip effect
          if (impact) {
            // Position and activate the impact
            impact.setPosition(enemy.x, enemy.y);
            impact.setFillStyle(projectileColor, 0.6);
            impact.setActive(true);
            impact.setVisible(true);
            impact.setScale(1);
            impact.setAlpha(0.6);
            
            this.tweens.add({
              targets: impact,
              scale: 2,
              alpha: 0,
              duration: 200,
              onComplete: () => {
                // Return to pool instead of destroying
                impact.setActive(false);
                impact.setVisible(false);
              }
            });
          }
          
          // Return projectile to pool instead of destroying
          projectile.setActive(false);
          projectile.setVisible(false);
          
          // Handle glow effect if it exists
          if(glow) {
            glow.setActive(false);
            glow.setVisible(false);
          }
          
          // Damage enemy (affected by weather)
          if (enemy && enemy.active) {
            const weatherDefenseBonus = this.weatherSystem ? this.weatherSystem.defenseBonus : 1.0;
            const effectiveDamage = defense.damage * weatherDefenseBonus;
            enemy.health -= effectiveDamage;
            
            // Update health bar
            if (enemy.healthBar) {
              enemy.healthBar.clear();
              const healthPercent = Math.max(0, enemy.health / enemy.maxHealth);
              enemy.healthBar.fillStyle(healthPercent > 0.5 ? 0x00FF00 : healthPercent > 0.25 ? 0xFFFF00 : 0xFF0000);
              enemy.healthBar.fillRect(0, 0, 40 * healthPercent, 6);
            }
            
            // Check if enemy is defeated
            if (enemy.health <= 0) {
              this.destroyEnemy(enemy);
            }
          }
        }
      });
      
      // Change defense sprite to attack mode briefly
      const originalTexture = defense.texture.key;
      const attackTexture = originalTexture.replace('_idle', '_attack');
      if (this.textures.exists(attackTexture)) {
        defense.setTexture(attackTexture);
        this.time.delayedCall(300, () => {
          if (defense && defense.active) {
            defense.setTexture(originalTexture);
          }
        });
      }
      
    } catch (error) {
      console.error("Error firing defense:", error);
    }
  }

  // Initialize sounds from loaded assets
  initializeSounds() {
    try {
      this.sounds = {
        ui_click: this.sound.add('ui_click', { volume: 0.3 }),
        coins: this.sound.add('coins', { volume: 0.4 }),
        enemy_hit: this.sound.add('enemy_hit', { volume: 0.4 }),
        enemy_defeat: this.sound.add('enemy_defeat', { volume: 0.5 }),
        dog_attack: this.sound.add('dog_attack', { volume: 0.3 }),
        fire_attack: this.sound.add('fire_attack', { volume: 0.4 }),
        victory: this.sound.add('victory', { volume: 0.6 }),
        you_win: this.sound.add('you_win', { volume: 0.6 }),
        bg_music: this.sound.add('bg_music', { volume: 0.2, loop: true })
      };
      
      // Create aliases for common sounds
      this.sounds.click = this.sounds.ui_click;
      this.sounds.enemyHit = this.sounds.enemy_hit;
      this.sounds.enemyDeath = this.sounds.enemy_defeat;
      this.sounds.plantCrop = this.sounds.dog_attack; // Reuse for planting
      this.sounds.harvestCrop = this.sounds.coins;
      this.sounds.gameOver = this.sounds.you_win; // Ironic, but works
      
      this.soundsLoaded = true;
      console.log("Sounds initialized successfully");
      
      // Start background music
      if (this.sounds.bg_music) {
        this.sounds.bg_music.play();
      }
      
    } catch (error) {
      console.error("Error initializing sounds:", error);
      // Create empty sound objects to prevent errors
      this.sounds = {
        click: { play: () => {} },
        enemyHit: { play: () => {} },
        enemyDeath: { play: () => {} },
        plantCrop: { play: () => {} },
        harvestCrop: { play: () => {} },
        gameOver: { play: () => {} }
      };
    }
  }

  // Create beautiful AAA-quality main menu system
  createMainMenu() {
    try {
      // Get screen dimensions for full HD support
      const centerX = this.cameras.main.width / 2;
      const centerY = this.cameras.main.height / 2;
      
      // Create menu container
      this.menuContainer = this.add.container(centerX, centerY);
      this.menuContainer.setDepth(1000);
      
      // Create animated background
      this.createMenuBackground();
      
      // Create main menu elements
      this.createMainMenuElements();
      
      // Create settings menu (hidden initially)
      this.createSettingsMenu();
      
      // Create credits menu (hidden initially)
      this.createCreditsMenu();
      
      // Create leaderboard menu (hidden initially)
      this.createLeaderboardMenu();
      
      // Create pause menu for in-game use
      this.createPauseMenu();
      
      // Create loading screen
      this.createLoadingScreen();
      
      // Setup pause controls
      this.setupPauseControls();
      
      // Show main menu initially
      this.showMainMenu();
      
      console.log("Beautiful main menu created!");
      
    } catch (error) {
      console.error("Error creating main menu:", error);
    }
  }

  // Create animated menu background
  createMenuBackground() {
    try {
      const centerX = this.cameras.main.width / 2;
      const centerY = this.cameras.main.height / 2;
      
      // Create gradient background that covers the entire screen
      const bg = this.add.graphics();
      bg.fillGradientStyle(0x1a1a2e, 0x16213e, 0x0f3460, 0x533483, 1);
      bg.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
      // Don't add to menuContainer - add directly to scene for full coverage
      
      // Add floating particles
      for (let i = 0; i < 50; i++) {
        const particle = this.add.circle(
          Phaser.Math.Between(0, this.cameras.main.width),
          Phaser.Math.Between(0, this.cameras.main.height),
          2,
          0xffffff,
          0.3
        );
        
        this.tweens.add({
          targets: particle,
          y: particle.y - 100,
          alpha: 0,
          duration: Phaser.Math.Between(3000, 6000),
          repeat: -1,
          delay: Phaser.Math.Between(0, 3000)
        });
        
        // Add particles directly to scene, not to menu container
      }
      
      // Add animated title background
      const titleBg = this.add.rectangle(centerX, centerY - 200, 500, 80, 0x000000, 0.7);
      titleBg.setStrokeStyle(3, 0x00ffff);
      this.menuContainer.add(titleBg);
      
      // Animate title background
      this.tweens.add({
        targets: titleBg,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
    } catch (error) {
      console.error("Error creating menu background:", error);
    }
  }

  // Create main menu elements
  createMainMenuElements() {
    try {
      // Game title with glow effect
      this.gameTitle = this.add.text(0, -200, "MON DEFENSE", {
        fontFamily: 'Arial Black, Impact, sans-serif',
        fontSize: '48px',
        color: '#00ffff',
        stroke: '#000000',
        strokeThickness: 6,
        shadow: {
          offsetX: 4,
          offsetY: 4,
          color: '#000000',
          blur: 8
        }
      }).setOrigin(0.5);
      this.menuContainer.add(this.gameTitle);
      
      // Add glow animation to title
      this.tweens.add({
        targets: this.gameTitle,
        alpha: 0.8,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      // Create menu buttons
      const buttonConfig = {
        width: 300,
        height: 60,
        cornerRadius: 15,
        fontSize: '24px',
        fontFamily: 'Arial Black, Impact, sans-serif'
      };
      
      // Play button
      this.playButton = this.createMenuButton(0, -100, 'PLAY GAME', 0x00ff00, buttonConfig);
      this.playButton.on('pointerdown', () => this.startGameFromMenu());
      
      // Settings button
      this.settingsButton = this.createMenuButton(0, -20, 'SETTINGS', 0x0088ff, buttonConfig);
      this.settingsButton.on('pointerdown', () => this.showSettingsMenu());
      
      // Leaderboard button
      this.leaderboardButton = this.createMenuButton(0, 60, 'LEADERBOARD', 0xff8800, buttonConfig);
      this.leaderboardButton.on('pointerdown', () => this.showLeaderboardMenu());
      
      // Credits button
      this.creditsButton = this.createMenuButton(0, 140, 'CREDITS', 0xff00ff, buttonConfig);
      this.creditsButton.on('pointerdown', () => this.showCreditsMenu());
      
      // Add subtitle
      this.subtitle = this.uiStyle.createStyledText(0, 220, "Defend Your Farm • Endless Adventure", {
        fontSize: '18px',
        fill: '#e8f4fd',
        stroke: '#1a365d',
        strokeThickness: 3,
        shadow: {
          offsetX: 2,
          offsetY: 2,
          color: '#000000',
          blur: 4,
          fill: true
        }
      }).setOrigin(0.5);
      this.menuContainer.add(this.subtitle);
      
      // Add version info
      this.versionText = this.uiStyle.createStyledText(350, 280, "v2.0", {
        fontSize: '16px',
        fill: '#a0aec0',
        stroke: '#2d3748',
        strokeThickness: 1,
        shadow: {
          offsetX: 1,
          offsetY: 1,
          color: '#000000',
          blur: 2,
          fill: true
        }
      }).setOrigin(1, 1);
      this.menuContainer.add(this.versionText);
      
    } catch (error) {
      console.error("Error creating main menu elements:", error);
    }
  }

  // Create a beautiful menu button
  createMenuButton(x, y, text, color, config) {
    try {
      const button = this.add.container(x, y);
      
      // Button background with gradient
      const bg = this.add.rectangle(0, 0, config.width, config.height, color, 0.9);
      bg.setStrokeStyle(3, 0xffffff);
      bg.setInteractive({ useHandCursor: true });
      
      // Button text
      const buttonText = this.add.text(0, 0, text, {
        fontFamily: config.fontFamily,
        fontSize: config.fontSize,
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5);
      
      button.add([bg, buttonText]);
      this.menuContainer.add(button);
      
      // Hover effects
      bg.on('pointerover', () => {
        this.tweens.add({
          targets: button,
          scaleX: 1.05,
          scaleY: 1.05,
          duration: 200,
          ease: 'Back.easeOut'
        });
        bg.setFillStyle(0xffffff, 0.2);
      });
      
      bg.on('pointerout', () => {
        this.tweens.add({
          targets: button,
          scaleX: 1,
          scaleY: 1,
          duration: 200,
          ease: 'Back.easeOut'
        });
        bg.setFillStyle(color, 0.9);
      });
      
      // Return the background so we can add event listeners to it
      return bg;
      
    } catch (error) {
      console.error("Error creating menu button:", error);
    }
  }

  // Menu navigation methods
  showMainMenu() {
    this.menuContainer.setVisible(true);
    this.settingsContainer?.setVisible(false);
    this.creditsContainer?.setVisible(false);
    this.leaderboardContainer?.setVisible(false);
  }

  // Start game from menu
  startGameFromMenu() {
    try {
      // Hide menu with fade out animation
      this.tweens.add({
        targets: this.menuContainer,
        alpha: 0,
        duration: 500,
        onComplete: () => {
          this.menuContainer.setVisible(false);
          this.menuContainer.setAlpha(1);
          
          // Start the proper game with original gameplay
          this.startGame();
        }
      });
      
    } catch (error) {
      console.error("Error starting game from menu:", error);
    }
  }

  // Main game start method (restored from backup)
  startGame() {
    try {
      console.log("Starting game with original gameplay");
      
      // Initialize game state (preserve mana properties)
      this.gameState = {
        isActive: true,
        isPaused: false,
        wave: 1,
        score: 0,
        lives: 3,
        farmCoins: 120,
        clickDamage: 0.5,
        canPlant: true,
        autoWave: true,
        mana: 100, // Current mana amount
        maxMana: 100, // Maximum mana capacity
        manaRegenRate: 5, // Mana regeneration per second
        lastManaRegen: 0 // Timestamp of last mana regeneration
      };
      
      // Initialize arrays
      this.enemies = [];
      this.crops = {};
      this.defenses = [];
      this.isSpawningEnemies = false;
      this.waveInProgress = false;
      this.enemiesSpawned = 0;
      this.totalEnemiesInWave = 0;
      
      // Create projectiles group for object pooling
      this.projectiles = this.add.group({
        classType: Phaser.GameObjects.Arc,
        maxSize: 100,
        runChildUpdate: true
      });
      this.glows = this.add.group({
        classType: Phaser.GameObjects.Arc,
        maxSize: 100,
        runChildUpdate: true
      });

      // Create game world
      this.createGameWorld();
      
      // Create game UI
      this.createGameUI();
      
      // Create toolbar
      this.createToolbar();
      
      // Start power-up manager
      this.powerUpManager.start();
      
      // Initialize weather system
      this.setWeather('sunny'); // Start with sunny weather
      
      // Start first wave
      this.startWave();
      
      console.log("Game started successfully");
      
    } catch (error) {
      console.error("Error starting game:", error);
    }
  }

  // Create modern loading screen with animations
  createLoadingScreen() {
    try {
      const centerX = this.cameras.main.width / 2;
      const centerY = this.cameras.main.height / 2;
      
      this.loadingContainer = this.add.container(centerX, centerY);
      this.loadingContainer.setDepth(1004);
      this.loadingContainer.setVisible(false);
      
      // Create gradient background
      const loadingBg = this.add.graphics();
      loadingBg.fillGradientStyle(0x000033, 0x000066, 0x000066, 0x000033, 1);
      loadingBg.fillRect(-this.cameras.main.width/2, -this.cameras.main.height/2, 
                         this.cameras.main.width, this.cameras.main.height);
      this.loadingContainer.add(loadingBg);
      
      // Add animated particles
      this.loadingParticles = [];
      for (let i = 0; i < 30; i++) {
        const particle = this.add.circle(
          Phaser.Math.Between(-this.cameras.main.width/2, this.cameras.main.width/2),
          Phaser.Math.Between(-this.cameras.main.height/2, this.cameras.main.height/2),
          Phaser.Math.Between(1, 3),
          0x00ffff,
          Phaser.Math.Between(2, 8) / 10
        );
        this.loadingParticles.push(particle);
        this.loadingContainer.add(particle);
      }
      
      // Loading title with glow effect
      const loadingTitle = this.add.text(0, -120, 'LOADING GAME', {
        fontFamily: 'Arial Black, Impact, sans-serif',
        fontSize: '42px',
        color: '#00ffff',
        stroke: '#000033',
        strokeThickness: 6,
        shadow: {
          offsetX: 2,
          offsetY: 2,
          color: '#00ffff',
          blur: 10,
          stroke: true,
          fill: true
        }
      }).setOrigin(0.5);
      this.loadingContainer.add(loadingTitle);
      
      // Add pulsing animation to title
      this.tweens.add({
        targets: loadingTitle,
        scale: { from: 1, to: 1.05 },
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      // Modern loading bar container with rounded corners
      const barContainer = this.add.graphics();
      barContainer.fillStyle(0x000000, 0.6);
      barContainer.fillRoundedRect(-210, -15, 420, 40, 20);
      barContainer.lineStyle(3, 0x00ffff, 1);
      barContainer.strokeRoundedRect(-210, -15, 420, 40, 20);
      this.loadingContainer.add(barContainer);
      
      // Loading bar fill with gradient
      this.loadingBarGraphics = this.add.graphics();
      this.loadingContainer.add(this.loadingBarGraphics);
      
      // Loading bar shine effect
      this.loadingBarShine = this.add.graphics();
      this.loadingBarShine.fillStyle(0xffffff, 0.3);
      this.loadingContainer.add(this.loadingBarShine);
      
      // Loading text with better styling
      this.loadingText = this.uiStyle.createStyledText(0, 50, 'Preparing your adventure...', {
        fontSize: '22px',
        fill: '#e8f4fd',
        stroke: '#1a365d',
        strokeThickness: 3,
        shadow: {
          offsetX: 2,
          offsetY: 2,
          color: '#000000',
          blur: 4,
          fill: true
        }
      }).setOrigin(0.5);
      this.loadingContainer.add(this.loadingText);
      
      // Loading tip with icon
      const tipIcon = this.uiStyle.createStyledText(-180, 100, '💡', {
        fontSize: 28,
        fill: '#FFD700',
        stroke: '#8B4513',
        strokeThickness: 2,
        shadow: {
          offsetX: 1,
          offsetY: 1,
          color: '#000000',
          blur: 2,
          fill: true
        }
      }).setOrigin(0.5);
      this.loadingContainer.add(tipIcon);
      
      this.loadingTip = this.uiStyle.createStyledText(-150, 100, 'TIP: Right-click enemies to attack them!', {
        fontSize: '18px',
        fill: '#a0d2eb',
        stroke: '#2d3748',
        strokeThickness: 2,
        shadow: {
          offsetX: 1,
          offsetY: 1,
          color: '#000000',
          blur: 2,
          fill: true
        },
        wordWrap: { width: 350 }
      }).setOrigin(0, 0.5);
      this.loadingContainer.add(this.loadingTip);
      
      // Enhanced loading messages
      this.loadingMessages = [
        'Planting magical defenses...',
        'Preparing enemy waves...',
        'Charging special abilities...',
        'Calibrating tower weapons...',
        'Generating resources...',
        'Almost ready for battle!'
      ];
      
      // Tips to show during loading
      this.tips = [
        'Right-click enemies to attack them directly!',
        'Place towers strategically to cover the entire path',
        'Upgrade your defenses to handle stronger enemies',
        'Plant crops in green areas to earn extra coins',
        'Watch out for boss enemies with special abilities!',
        'Different towers have different attack ranges and speeds'
      ];
      
    } catch (error) {
      console.error("Error creating loading screen:", error);
    }
  }

  // Show loading screen with enhanced animations and progress
  showLoadingScreen() {
    try {
      this.loadingContainer.setVisible(true);
      this.loadingContainer.setScale(0);
      
      // Animate in with bounce effect
      this.tweens.add({
        targets: this.loadingContainer,
        scale: 1,
        duration: 800,
        ease: 'Back.easeOut',
        overshoot: 1.2
      });
      
      // Animate particles
      this.loadingParticles.forEach(particle => {
        this.tweens.add({
          targets: particle,
          y: particle.y - Phaser.Math.Between(100, 200),
          alpha: { from: particle.alpha, to: 0 },
          duration: Phaser.Math.Between(3000, 8000),
          repeat: -1,
          delay: Phaser.Math.Between(0, 2000)
        });
      });
      
      // Show random tip
      const randomTip = this.tips[Math.floor(Math.random() * this.tips.length)];
      this.loadingTip.setText(randomTip);
      
      // Simulate loading progress with smoother animation
      let progress = 0;
      let targetProgress = 0;
      
      // Update progress bar with gradient and shine effect
      const updateProgressBar = () => {
        // Clear previous graphics
        this.loadingBarGraphics.clear();
        
        // Draw gradient fill
        const barWidth = (progress / 100) * 400;
        if (barWidth > 0) {
          this.loadingBarGraphics.fillGradientStyle(0x00ffff, 0x0088ff, 0x00ffff, 0x0088ff, 1);
          this.loadingBarGraphics.fillRoundedRect(-200, -10, barWidth, 30, 15);
        }
        
        // Update shine effect position
        this.loadingBarShine.clear();
        if (barWidth > 20) {
          const shinePos = -200 + barWidth * (Math.sin(Date.now() / 500) * 0.3 + 0.5);
          this.loadingBarShine.fillRect(shinePos - 10, -10, 20, 30);
        }
      };
      
      // Smoother progress animation
      const progressInterval = setInterval(() => {
        targetProgress += 20;
        
        // Animate to target progress
        this.tweens.add({
          targets: { p: progress },
          p: targetProgress,
          duration: 800,
          ease: 'Sine.easeInOut',
          onUpdate: (tween) => {
            progress = tween.getValue('p');
            updateProgressBar();
          }
        });

        
        // Update loading message
        const messageIndex = Math.floor((progress / 100) * this.loadingMessages.length);
        if (messageIndex < this.loadingMessages.length) {
          this.loadingText.setText(this.loadingMessages[messageIndex]);
        }
        
        // Change tip every 3 seconds
        if (targetProgress % 40 === 0 && targetProgress > 0) {
          const randomTip = this.tips[Math.floor(Math.random() * this.tips.length)];
          
          // Fade out current tip
          this.tweens.add({
            targets: this.loadingTip,
            alpha: 0,
            duration: 300,
            onComplete: () => {
              // Set new tip and fade in
              this.loadingTip.setText(randomTip);
              this.tweens.add({
                targets: this.loadingTip,
                alpha: 1,
                duration: 300
              });
            }
          });
        }
        
        if (progress >= 100) {
          clearInterval(progressInterval);
          
          // Add completion flash effect
          const flash = this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0xffffff, 0);
          this.loadingContainer.add(flash);
          
          this.tweens.add({
            targets: flash,
            alpha: 0.7,
            duration: 200,
            yoyo: true,
            onComplete: () => flash.destroy()
          });
          
          // Hide loading screen and start game with slight delay
          setTimeout(() => {
            this.tweens.add({
              targets: this.loadingContainer,
              scale: 0,
              alpha: 0,
              duration: 800,
              ease: 'Back.easeIn',
              onComplete: () => {
                this.loadingContainer.setVisible(false);
                this.loadingContainer.setAlpha(1);
                this.loadingContainer.setScale(1);
                
                // Start the actual game
                this.initializeGame();
              }
            });
          }, 800);
        }
      }, 200);
      
    } catch (error) {
      console.error("Error showing loading screen:", error);
    }
  }

  // Create game world (restored from backup)
  createGameWorld() {
    try {
      // Create background with farm tiles
      this.createBackground();
      
      // Set up input handling
      this.setupInputHandling();
      
      console.log("Game world created");
      
    } catch (error) {
      console.error("Error creating game world:", error);
    }
  }

  // Create background with proper tiles (Full HD)
  createBackground() {
    try {
      console.log("Creating background...");
      
      // Define grid cell size for the game
      this.gridCellSize = 48;
      
      // Create a dark green background base
      const bg = this.add.rectangle(960, 540, 1920, 1080, 0x1a4d1a).setOrigin(0.5);
      
      // Create the farm area (left side) - 40% of screen width
      const farmAreaWidth = Math.floor(1920 * 0.4);
      const farmArea = this.add.container(0, 0);
      for (let y = 0; y < 1080; y += this.gridCellSize) {
        for (let x = 0; x < farmAreaWidth; x += this.gridCellSize) {
          // Create soil pattern using pixel art tiles
          const soilTile = this.add.image(
            x + this.gridCellSize/2, 
            y + this.gridCellSize/2,
            Math.random() > 0.5 ? 'soil1' : 'soil2'
          ).setDisplaySize(this.gridCellSize, this.gridCellSize);
          farmArea.add(soilTile);
        }
      }
      
      // Create defense area (right side) - 60% of screen width  
      const defenseArea = this.add.container(farmAreaWidth, 0);
      for (let y = 0; y < 1080; y += this.gridCellSize) {
        for (let x = 0; x < (1920 - farmAreaWidth); x += this.gridCellSize) {
          // Create grass pattern using pixel art tiles
          const grassTile = this.add.image(
            x + this.gridCellSize/2, 
            y + this.gridCellSize/2,
            Math.random() > 0.5 ? 'grass1' : 'grass2'
          ).setDisplaySize(this.gridCellSize, this.gridCellSize);
          defenseArea.add(grassTile);
        }
      }
      
      // Store farm area width for placement logic
      this.farmAreaWidth = farmAreaWidth;
      
      // Add farm buildings and decorations (left side)
      // Add a farmhouse
      const farmhouse = this.add.image(200, 300, 'house1').setDisplaySize(120, 120);
      farmArea.add(farmhouse);
      
      // Add a barn
      const barn = this.add.image(120, 500, 'house2').setDisplaySize(100, 100);
      farmArea.add(barn);
      
      // Add fruit trees around the farm
      const fruitTree1 = this.add.image(80, 200, 'fruitTree1').setDisplaySize(90, 90);
      farmArea.add(fruitTree1);
      
      const fruitTree2 = this.add.image(320, 180, 'fruitTree2').setDisplaySize(80, 80);
      farmArea.add(fruitTree2);
      
      // Add decorative elements to the farm
      const decor1 = this.add.image(100, 400, 'decor1').setDisplaySize(50, 50);
      farmArea.add(decor1);
      
      const decor2 = this.add.image(280, 420, 'decor2').setDisplaySize(40, 40);
      farmArea.add(decor2);
      
      // Add defense area decorations (right side)
      // Add trees around the defense area
      const tree1 = this.add.image(150, 200, 'tree1').setDisplaySize(100, 100);
      defenseArea.add(tree1);
      
      const tree2 = this.add.image(800, 300, 'tree2').setDisplaySize(90, 90);
      defenseArea.add(tree2);
      
      const tree3 = this.add.image(600, 180, 'tree3').setDisplaySize(95, 95);
      defenseArea.add(tree3);
      
      // Add tower placement indicators using pixel art
      for (let y = 200; y < 900; y += 150) {
        for (let x = 150; x < 1100; x += 150) {
          // Skip placement if there's a tree or decoration nearby
          if ((x > 120 && x < 180 && y > 150 && y < 250) || // Near tree1
              (x > 770 && x < 830 && y > 250 && y < 350) || // Near tree2
              (x > 570 && x < 630 && y > 130 && y < 230)) { // Near tree3
            continue;
          }
          
          const towerPlace = this.add.image(x, y, 
            Math.random() > 0.5 ? 'towerPlace1' : 'towerPlace2'
          ).setDisplaySize(72, 72).setAlpha(0.7);
          defenseArea.add(towerPlace);
        }
      }
      
      // Add farm area indicator with a more natural look
      this.farmArea = this.add.rectangle(farmAreaWidth/2, 540, farmAreaWidth, 1080, 0x2d572d, 0.2);
      this.farmArea.setStrokeStyle(5, 0x3a6b3a);
      
      // Define enemy path from right to left with multiple lanes - SPAWN AT RIGHT EDGE
      // Enhanced multi-path system with strategic routing
      this.gameState.enemyPaths = [
        // Path 1 (Northern Route) - Fast but exposed
        {
          id: 'north',
          difficulty: 'easy',
          speedModifier: 1.2,
          preferredEnemies: ['basic', 'fast'],
          points: [
            { x: 1920, y: 150 },  // Start at right edge
            { x: 1600, y: 160 },
            { x: 1200, y: 180 },
            { x: 800, y: 200 },
            { x: 400, y: 220 },
            { x: -50, y: 240 }    // Exit at left edge
          ]
        },
        // Path 2 (Central Winding Route) - Balanced
        {
          id: 'central',
          difficulty: 'medium',
          speedModifier: 1.0,
          preferredEnemies: ['basic', 'armored'],
          points: [
            { x: 1920, y: 400 },  // Start at right edge
            { x: 1700, y: 350 },
            { x: 1500, y: 450 },
            { x: 1200, y: 380 },
            { x: 900, y: 420 },
            { x: 600, y: 360 },
            { x: 300, y: 400 },
            { x: -50, y: 400 }    // Exit at left edge
          ]
        },
        // Path 3 (Southern Maze Route) - Slow but protected
        {
          id: 'south',
          difficulty: 'hard',
          speedModifier: 0.8,
          preferredEnemies: ['armored', 'boss'],
          points: [
            { x: 1920, y: 650 },  // Start at right edge
            { x: 1750, y: 600 },
            { x: 1600, y: 650 },
            { x: 1400, y: 580 },
            { x: 1200, y: 620 },
            { x: 1000, y: 560 },
            { x: 800, y: 600 },
            { x: 600, y: 540 },
            { x: 400, y: 580 },
            { x: 200, y: 520 },
            { x: -50, y: 550 }    // Exit at left edge
          ]
        },
        // Path 4 (Surprise Diagonal Route) - Unlocked after wave 10
        {
          id: 'diagonal',
          difficulty: 'expert',
          speedModifier: 1.1,
          preferredEnemies: ['fast', 'boss'],
          unlockWave: 10,
          points: [
            { x: 1920, y: 300 },  // Start at right edge
            { x: 1600, y: 250 },
            { x: 1300, y: 350 },
            { x: 1000, y: 300 },
            { x: 700, y: 450 },
            { x: 400, y: 350 },
            { x: 100, y: 500 },
            { x: -50, y: 450 }    // Exit at left edge
          ]
        }
      ];
      
      // Initialize path analytics
      this.gameState.pathAnalytics = {
        north: { enemiesSpawned: 0, enemiesDefeated: 0, threatLevel: 'low' },
        central: { enemiesSpawned: 0, enemiesDefeated: 0, threatLevel: 'medium' },
        south: { enemiesSpawned: 0, enemiesDefeated: 0, threatLevel: 'high' },
        diagonal: { enemiesSpawned: 0, enemiesDefeated: 0, threatLevel: 'extreme' }
      };
      
      // Create path visualization
      this.createPathVisualization();
      
      // Create path analytics display
      this.createPathAnalyticsDisplay();
      
      console.log("Background created successfully");
    } catch (error) {
      console.error("Error creating background:", error);
      throw error;
    }
  }

  // Setup input handling with fixed coordinate transformation
  setupInputHandling() {
    try {
      // Disable browser context menu on right-click
      this.input.mouse.disableContextMenu();
      
      // General click handler for attacks with both left and right click support
      this.input.on('pointerdown', (pointer) => {
        // Calculate toolbar boundary properly
        const toolbarBoundary = this.cameras.main.height - 115;
        
        // Ignore clicks on the toolbar area
        if (pointer.y > toolbarBoundary) {
            return;
        }
        
        // Get world coordinates
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        
        if (pointer.rightButtonDown()) {
          // Right-click for double damage on enemies
          const originalDamage = this.gameState.clickDamage;
          this.gameState.clickDamage *= 2;
          this.handleClick(worldPoint.x, worldPoint.y);
          this.gameState.clickDamage = originalDamage;
        } else {
          // Normal left-click
          this.handleClick(worldPoint.x, worldPoint.y);
        }
      });
      
      // Enhanced keyboard shortcuts with visual feedback
      const keyboardShortcuts = {
        'keydown-A': 'attack',
        'keydown-P': 'plant',
        'keydown-ONE': 'chog',
        'keydown-TWO': 'molandak',
        'keydown-THREE': 'moyaki',
        'keydown-FOUR': 'keon'
      };
      
      Object.entries(keyboardShortcuts).forEach(([key, mode]) => {
        this.input.keyboard.on(key, () => {
          this.setToolMode(mode);
          
          // Visual feedback for keyboard shortcut usage
          this.showKeyboardShortcutFeedback(mode, key.replace('keydown-', ''));
        });
      });
      
      // Display keyboard shortcuts help
      this.input.keyboard.on('keydown-H', () => {
        this.toggleKeyboardHelp();
      });
      
      // Path visibility toggle (Shift+P to avoid conflict with plant mode)
      this.input.keyboard.on('keydown-P', (event) => {
        if (event.shiftKey) {
          this.togglePathVisibility();
        } else {
          // Default plant mode behavior
          this.setToolMode('plant');
          this.showKeyboardShortcutFeedback('plant', 'P');
        }
      });
      
      // Analytics display toggle (Shift+A to avoid conflict with attack mode)
      this.input.keyboard.on('keydown-A', (event) => {
        if (event.shiftKey) {
          this.toggleAnalyticsDisplay();
        } else {
          // Default attack mode behavior
          this.setToolMode('attack');
          this.showKeyboardShortcutFeedback('attack', 'A');
        }
      });
      
      // Specialization menu toggle
      this.input.keyboard.on('keydown-S', () => {
        this.showSpecializationMenu();
      });
      
    } catch (error) {
      console.error("Error setting up input handling:", error);
    }
  }

  // Create game UI (restored from backup)
  createGameUI() {
    try {
      const padding = 30;
      const spacing = 50;
      
      // Modern HUD Elements
      const scoreHUD = this.uiStyle.createHUDElement(padding + 80, padding + 20, 'SCORE', '0', '🎯');
      this.scoreText = scoreHUD.value;
      
      const coinsHUD = this.uiStyle.createHUDElement(padding + 80, padding + spacing + 20, 'COINS', '120', '💰');
      this.farmCoinsText = coinsHUD.value;
      
      const waveHUD = this.uiStyle.createHUDElement(padding + 80, padding + spacing * 2 + 20, 'WAVE', '1', '⚔️');
      this.waveText = waveHUD.value;
      
      const livesHUD = this.uiStyle.createHUDElement(padding + 80, padding + spacing * 3 + 20, 'LIVES', '3', '❤️');
      this.livesText = livesHUD.value;
      
      // Mana text and bar removed from top UI section
      
      // Modern Instructions Panel
      const instructionsPanel = this.uiStyle.createModernPanel(padding, this.cameras.main.height - 140, 400, 120, 'dark');
      
      this.uiStyle.createStyledText(padding + 20, this.cameras.main.height - 120, "🌱 Click farm plots to plant crops", 'bodySmall');
      this.uiStyle.createStyledText(padding + 20, this.cameras.main.height - 95, "⚔️ Click enemies to attack them", 'bodySmall');
      this.uiStyle.createStyledText(padding + 20, this.cameras.main.height - 70, "🛡️ Defend your farm from waves of enemies!", 'bodySmall');
      
      console.log("Game UI created");
      
    } catch (error) {
      console.error("Error creating game UI:", error);
    }
  }

  // Start wave (restored from backup)
  startWave() {
    try {
      if (this.waveInProgress) {
        console.log("Wave already in progress, skipping");
        return;
      }
      
      this.waveInProgress = true;
      this.enemiesSpawned = 0;
      
      // Calculate enemies for this wave
      this.totalEnemiesInWave = Math.min(5 + this.gameState.wave * 2, 20);
      
      console.log("`Starting wave ${this.gameState.wave} with ${this.totalEnemiesInWave} enemies`");
      
      // Start spawning enemies
      this.spawnEnemyWave();
      
      // Update UI
      this.updateWaveText();
      
    } catch (error) {
      console.error("Error starting wave:", error);
    }
  }

  // Spawn enemy wave
  spawnEnemyWave() {
    try {
      if (!this.gameState.isActive || !this.waveInProgress) {
        return;
      }
      
      if (this.enemiesSpawned >= this.totalEnemiesInWave) {
        console.log("All enemies spawned for this wave");
        return;
      }
      
      // Spawn enemy
      this.spawnEnemy();
      this.enemiesSpawned++;
      
      // Schedule next enemy spawn
      if (this.enemiesSpawned < this.totalEnemiesInWave) {
        this.time.delayedCall(2000, () => {
          this.spawnEnemyWave();
        });
      }
      
    } catch (error) {
      console.error("Error spawning enemy wave:", error);
    }
  }

  // Spawn single enemy (enhanced with real sprites and multiple paths)
  spawnEnemy() {
    try {
      // Enemy types based on available enemy sprites from logo folder
      const enemyTypes = [
        { sprite: 'enemy_goblin', health: 3, speed: 60, value: 15, name: 'goblin', scale: 2.0 },
        { sprite: 'enemy_orc', health: 4, speed: 40, value: 20, name: 'orc', scale: 2.2 },
        { sprite: 'enemy_dragon', health: 6, speed: 30, value: 30, name: 'dragon', scale: 2.5 },
        { sprite: 'enemy_skeleton', health: 5, speed: 45, value: 25, name: 'skeleton', scale: 2.0 },
        { sprite: 'enemy_demon', health: 8, speed: 25, value: 40, name: 'demon', scale: 2.8 }
      ];
      
      // Choose enemy type based on wave
      let enemyType;
      if (this.gameState.wave >= 8 && Math.random() < 0.15) {
        enemyType = enemyTypes[4]; // Demon (Ultimate Boss)
      } else if (this.gameState.wave >= 6 && Math.random() < 0.2) {
        enemyType = enemyTypes[3]; // Skeleton
      } else if (this.gameState.wave >= 4 && Math.random() < 0.25) {
        enemyType = enemyTypes[2]; // Dragon (Boss)
      } else if (this.gameState.wave >= 3 && Math.random() < 0.3) {
        enemyType = enemyTypes[1]; // Orc
      } else {
        enemyType = enemyTypes[0]; // Goblin
      }
      
      // Intelligent path selection based on enemy type and wave progression
      const availablePaths = this.getAvailablePathsForWave(this.gameState.wave);
      const selectedPathData = this.selectOptimalPath(enemyType, availablePaths);
      const selectedPath = selectedPathData.points;
      
      // Update path analytics
      this.gameState.pathAnalytics[selectedPathData.id].enemiesSpawned++;
      
      // Create enemy sprite using loaded image
      const startPoint = selectedPath[0];
      const enemy = this.add.image(startPoint.x, startPoint.y, enemyType.sprite);
      enemy.setScale(enemyType.scale);
      enemy.setFlipX(true); // Flip enemy sprites to face left (they're moving left)
      enemy.setInteractive({ useHandCursor: true });
      enemy.setDepth(12); // Set proper depth for enemies
      
      // Enemy properties with path modifiers
      enemy.health = enemyType.health + Math.floor(this.gameState.wave / 3);
      enemy.maxHealth = enemy.health;
      enemy.speed = enemyType.speed * selectedPathData.speedModifier;
      enemy.value = enemyType.value;
      enemy.type = enemyType.name;
      enemy.pathData = selectedPathData;
      enemy.pathIndex = this.gameState.enemyPaths.indexOf(selectedPathData);
      enemy.currentPointIndex = 0;
      
      // Add path indicator visual
      this.showPathIndicator(enemy, selectedPathData);
      
      // Health bar
      enemy.healthBar = this.add.graphics();
      enemy.healthBar.fillStyle(0xFF0000);
      enemy.healthBar.fillRect(0, 0, 40, 6);
      enemy.healthBar.x = enemy.x - 20;
      enemy.healthBar.y = enemy.y - 35;
      enemy.healthBar.setDepth(13); // Health bar above enemy
      
      // Click to attack (both left and right click)
      enemy.on('pointerdown', (pointer) => {
        // Allow attack on any click when in attack mode, or right-click in any mode
        if (this.toolMode === 'attack' || pointer.rightButtonDown()) {
          this.attackEnemy(enemy);
        }
      });
      
      // Move enemy along the path
      this.moveEnemyAlongPath(enemy, selectedPath);
      
      this.enemies.push(enemy);
      
    } catch (error) {
      console.error("Error spawning enemy:", error);
    }
  }
  
  // Get available paths for current wave
  getAvailablePathsForWave(wave) {
    return this.gameState.enemyPaths.filter(path => {
      return !path.unlockWave || wave >= path.unlockWave;
    });
  }
  
  // Select optimal path based on enemy type and current game state
  selectOptimalPath(enemyType, availablePaths) {
    // Calculate path scores based on multiple factors
    const pathScores = availablePaths.map(path => {
      let score = 0;
      
      // Preference for enemy type
      if (path.preferredEnemies.includes(enemyType.name) || 
          (enemyType.name === 'demon' && path.preferredEnemies.includes('boss')) ||
          (enemyType.name === 'dragon' && path.preferredEnemies.includes('boss'))) {
        score += 50;
      }
      
      // Balance path usage (avoid overusing same path)
      const analytics = this.gameState.pathAnalytics[path.id];
      const usageRatio = analytics.enemiesSpawned / Math.max(1, this.gameState.wave);
      score -= usageRatio * 20; // Penalty for overused paths
      
      // Difficulty scaling with wave
      if (this.gameState.wave >= 5 && path.difficulty === 'easy') {
        score -= 10; // Reduce easy path usage in later waves
      }
      if (this.gameState.wave >= 10 && path.difficulty === 'expert') {
        score += 15; // Favor expert paths in late game
      }
      
      // Random factor for unpredictability
      score += Math.random() * 30;
      
      return { path, score };
    });
    
    // Sort by score and select the best path
    pathScores.sort((a, b) => b.score - a.score);
    return pathScores[0].path;
  }
  
  // Show visual indicator for enemy path
  showPathIndicator(enemy, pathData) {
    // Create a small colored indicator above the enemy
    const colors = {
      'north': 0x00FF00,    // Green for easy/fast
      'central': 0xFFFF00,  // Yellow for balanced
      'south': 0xFF8800,    // Orange for hard
      'diagonal': 0xFF0000  // Red for expert
    };
    
    const indicator = this.add.circle(enemy.x, enemy.y - 45, 4, colors[pathData.id]);
    indicator.setDepth(14);
    indicator.setAlpha(0.8);
    
    // Attach indicator to enemy for movement
    enemy.pathIndicator = indicator;
    
    // Add pulsing effect for expert paths
    if (pathData.difficulty === 'expert') {
      this.tweens.add({
        targets: indicator,
        scaleX: 1.5,
        scaleY: 1.5,
        alpha: 0.4,
        duration: 800,
        yoyo: true,
        repeat: -1
      });
    }
   }
   
   // Create path visualization overlay
   createPathVisualization() {
     try {
       this.pathOverlays = [];
       this.pathLabels = [];
       
       const pathColors = {
         'north': { color: 0x00FF00, alpha: 0.3 },    // Green for easy
         'central': { color: 0xFFFF00, alpha: 0.3 },  // Yellow for balanced
         'south': { color: 0xFF8800, alpha: 0.3 },    // Orange for hard
         'diagonal': { color: 0xFF0000, alpha: 0.3 }  // Red for expert
       };
       
       this.gameState.enemyPaths.forEach((pathData, index) => {
         const pathColor = pathColors[pathData.id];
         
         // Create path line graphics
         const pathGraphics = this.add.graphics();
         pathGraphics.setDepth(1); // Behind most game elements
         pathGraphics.setAlpha(0); // Initially hidden
         
         // Draw path line
         pathGraphics.lineStyle(8, pathColor.color, pathColor.alpha);
         pathGraphics.beginPath();
         
         pathData.points.forEach((point, pointIndex) => {
           if (pointIndex === 0) {
             pathGraphics.moveTo(point.x, point.y);
           } else {
             pathGraphics.lineTo(point.x, point.y);
           }
         });
         
         pathGraphics.strokePath();
         
         // Add path difficulty indicators
         const midPoint = pathData.points[Math.floor(pathData.points.length / 2)];
         const difficultyText = this.add.text(midPoint.x, midPoint.y - 20, 
           `${pathData.id.toUpperCase()}\n${pathData.difficulty}\nSpeed: ${pathData.speedModifier}x`, {
           fontSize: '12px',
           fill: '#ffffff',
           backgroundColor: '#000000',
           padding: { x: 4, y: 2 },
           align: 'center'
         });
         difficultyText.setOrigin(0.5);
         difficultyText.setDepth(2);
         difficultyText.setAlpha(0); // Initially hidden
         
         this.pathOverlays.push(pathGraphics);
         this.pathLabels.push(difficultyText);
       });
       
       // Add modern path visibility toggle button
       this.pathToggleButton = this.uiStyle.createModernButton(
         120, 120, '🛤️ Show Paths [Shift+P]', 
         () => this.togglePathVisibility(),
         { variant: 'secondary', size: 'small' }
       );
       this.pathToggleButton.setDepth(20);
       
       this.pathsVisible = false;
       
     } catch (error) {
       console.error("Error creating path visualization:", error);
     }
   }
   
   // Toggle path visibility
   togglePathVisibility() {
     try {
       this.pathsVisible = !this.pathsVisible;
       const targetAlpha = this.pathsVisible ? 1 : 0;
       
       // Animate path overlays
       this.pathOverlays.forEach(overlay => {
         this.tweens.add({
           targets: overlay,
           alpha: targetAlpha,
           duration: 300,
           ease: 'Power2'
         });
       });
       
       // Animate path labels
       this.pathLabels.forEach(label => {
         this.tweens.add({
           targets: label,
           alpha: targetAlpha,
           duration: 300,
           ease: 'Power2'
         });
       });
       
       // Update button text
       const newText = this.pathsVisible ? '🛤️ Hide Paths [Shift+P]' : '🛤️ Show Paths [Shift+P]';
       if (this.pathToggleButton.list && this.pathToggleButton.list[1]) {
         this.pathToggleButton.list[1].setText(newText);
       }
       
     } catch (error) {
       console.error("Error toggling path visibility:", error);
     }
   }
    
    // Create path analytics display
    createPathAnalyticsDisplay() {
      try {
        // Analytics panel background
        this.analyticsPanel = this.add.graphics();
        this.analyticsPanel.fillStyle(0x000000, 0.8);
        this.analyticsPanel.fillRoundedRect(20, 160, 280, 200, 10);
        this.analyticsPanel.lineStyle(2, 0x444444, 1);
        this.analyticsPanel.strokeRoundedRect(20, 160, 280, 200, 10);
        this.analyticsPanel.setDepth(19);
        this.analyticsPanel.setAlpha(0); // Initially hidden
        
        // Analytics title
        this.analyticsTitle = this.add.text(30, 170, 'PATH ANALYTICS', {
          fontSize: '16px',
          fill: '#ffffff',
          fontStyle: 'bold'
        });
        this.analyticsTitle.setDepth(20);
        this.analyticsTitle.setAlpha(0);
        
        // Path statistics texts
        this.pathStatsTexts = {};
        const pathColors = {
          'north': '#00FF00',
          'central': '#FFFF00', 
          'south': '#FF8800',
          'diagonal': '#FF0000'
        };
        
        let yOffset = 200;
        Object.keys(this.gameState.pathAnalytics).forEach((pathId, index) => {
          const pathColor = pathColors[pathId];
          
          this.pathStatsTexts[pathId] = this.add.text(30, yOffset, '', {
            fontSize: '12px',
            fill: pathColor,
            fontFamily: 'monospace'
          });
          this.pathStatsTexts[pathId].setDepth(20);
          this.pathStatsTexts[pathId].setAlpha(0);
          
          yOffset += 35;
        });
        
        // Modern Analytics toggle button
        this.analyticsToggleButton = this.uiStyle.createModernButton(
          140, 370, '📊 Show Analytics [Shift+A]', 
          () => this.toggleAnalyticsDisplay(),
          { variant: 'info', size: 'small' }
        );
        this.analyticsToggleButton.setDepth(20);
        
        // Modern Specialization button
        this.specializationButton = this.uiStyle.createModernButton(
          140, 410, '⚡ Specializations [S]', 
          () => this.showSpecializationMenu(),
          { variant: 'primary', size: 'small' }
        );
        this.specializationButton.setDepth(20);
        
        this.analyticsVisible = false;
        
        // Update analytics every second
        this.time.addEvent({
          delay: 1000,
          callback: this.updatePathAnalyticsDisplay,
          callbackScope: this,
          loop: true
        });
        
      } catch (error) {
        console.error("Error creating path analytics display:", error);
      }
    }
    
    // Toggle analytics display
    toggleAnalyticsDisplay() {
      try {
        this.analyticsVisible = !this.analyticsVisible;
        const targetAlpha = this.analyticsVisible ? 1 : 0;
        
        // Animate analytics panel
        this.tweens.add({
          targets: [this.analyticsPanel, this.analyticsTitle],
          alpha: targetAlpha,
          duration: 300,
          ease: 'Power2'
        });
        
        // Animate path stats texts
        Object.values(this.pathStatsTexts).forEach(text => {
          this.tweens.add({
            targets: text,
            alpha: targetAlpha,
            duration: 300,
            ease: 'Power2'
          });
        });
        
        // Update button text
         const newAnalyticsText = this.analyticsVisible ? '📊 Hide Analytics [Shift+A]' : '📊 Show Analytics [Shift+A]';
    if (this.analyticsToggleButton.list && this.analyticsToggleButton.list[1]) {
      this.analyticsToggleButton.list[1].setText(newAnalyticsText);
    }
        
      } catch (error) {
        console.error("Error toggling analytics display:", error);
      }
    }
    
    // Update path analytics display
    updatePathAnalyticsDisplay() {
      try {
        if (!this.analyticsVisible || !this.pathStatsTexts) return;
        
        Object.entries(this.gameState.pathAnalytics).forEach(([pathId, analytics]) => {
          const successRate = analytics.enemiesSpawned > 0 ? 
            Math.round((analytics.enemiesDefeated / analytics.enemiesSpawned) * 100) : 0;
          
          const threatIndicator = {
            'low': '●',
            'medium': '●●',
            'high': '●●●',
            'extreme': '●●●●'
          }[analytics.threatLevel] || '●';
          
          const statsText = `${pathId.toUpperCase()}:\n` +
                           `Spawned: ${analytics.enemiesSpawned}\n` +
                           `Defeated: ${analytics.enemiesDefeated}\n` +
                           `Success: ${successRate}%\n` +
                           `Threat: ${threatIndicator}`;
          
          if (this.pathStatsTexts[pathId]) {
            this.pathStatsTexts[pathId].setText(statsText);
          }
        });
        
      } catch (error) {
        console.error("Error updating path analytics display:", error);
      }
    }
    
    // Show specialization menu
    showSpecializationMenu() {
      try {
        // Create a simple defense type selector
        if (this.specializationMenuVisible) {
          this.hideSpecializationMenu();
          return;
        }
        
        const defenseTypes = ['chog', 'molandak', 'moyaki', 'keon'];
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;
        
        // Create overlay
        this.specMenuOverlay = this.add.rectangle(
          centerX, centerY,
          this.cameras.main.width, this.cameras.main.height,
          0x000000, 0.5
        );
        this.specMenuOverlay.setDepth(999);
        this.specMenuOverlay.setInteractive();
        this.specMenuOverlay.on('pointerdown', () => this.hideSpecializationMenu());
        
        // Create menu panel
        this.specMenuPanel = this.add.rectangle(centerX, centerY, 600, 400, 0x2a2a2a);
        this.specMenuPanel.setStrokeStyle(3, 0x4a90e2);
        this.specMenuPanel.setDepth(1000);
        
        // Title
        this.specMenuTitle = this.add.text(centerX, centerY - 150, 'Select Defense Type to Specialize', {
          fontSize: '24px',
          fontFamily: 'Arial',
          fill: '#ffffff',
          fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(1001);
        
        // Defense type buttons with modern styling
        this.specMenuButtons = [];
        defenseTypes.forEach((defenseType, index) => {
          const x = centerX - 150 + (index % 2) * 300;
          const y = centerY - 50 + Math.floor(index / 2) * 100;
          
          const button = this.uiStyle.createModernButton(
            x, y, 220, 70, `🛡️ ${defenseType.toUpperCase()}`, 'primary',
            () => {
              this.hideSpecializationMenu();
              this.specializationUI.show(defenseType);
            },
            'large'
          );
          button.setDepth(1001);
          
          this.specMenuButtons.push(button);
        });
        
        // Close button with modern styling
        this.specMenuClose = this.uiStyle.createModernButton(
          centerX + 270, centerY - 150, 50, 50, '✕', 'danger',
          () => this.hideSpecializationMenu(),
          'small'
        );
        this.specMenuClose.setDepth(1002);
        
        this.specializationMenuVisible = true;
        
      } catch (error) {
        console.error("Error showing specialization menu:", error);
      }
    }
    
    // Hide specialization menu
    hideSpecializationMenu() {
      try {
        if (this.specMenuOverlay) this.specMenuOverlay.destroy();
        if (this.specMenuPanel) this.specMenuPanel.destroy();
        if (this.specMenuTitle) this.specMenuTitle.destroy();
        if (this.specMenuClose) this.specMenuClose.destroy();
        
        if (this.specMenuButtons) {
          this.specMenuButtons.forEach(button => {
            if (button && button.destroy) button.destroy();
          });
          this.specMenuButtons = [];
        }
        
        this.specializationMenuVisible = false;
        
      } catch (error) {
        console.error("Error hiding specialization menu:", error);
      }
    }
    
    // Move enemy along predefined path
  moveEnemyAlongPath(enemy, path) {
    try {
      if (enemy.currentPointIndex >= path.length - 1) {
        // Enemy reached the end
        this.enemyReachedEnd(enemy);
        return;
      }
      
      const currentPoint = path[enemy.currentPointIndex];
      const nextPoint = path[enemy.currentPointIndex + 1];
      
      // Calculate distance and duration
      const distance = Phaser.Math.Distance.Between(currentPoint.x, currentPoint.y, nextPoint.x, nextPoint.y);
      const duration = (distance / enemy.speed) * 1000;
      
      // Move to next point
      this.tweens.add({
        targets: enemy,
        x: nextPoint.x,
        y: nextPoint.y,
        duration: duration,
        ease: 'Linear',
        onUpdate: () => {
          // Update health bar position
          if (enemy.healthBar) {
            enemy.healthBar.x = enemy.x - 20;
            enemy.healthBar.y = enemy.y - 35;
          }
          // Update path indicator position
          if (enemy.pathIndicator) {
            enemy.pathIndicator.x = enemy.x;
            enemy.pathIndicator.y = enemy.y - 45;
          }
        },
        onComplete: () => {
          if (enemy && enemy.active) {
            enemy.currentPointIndex++;
            this.moveEnemyAlongPath(enemy, path);
          }
        }
      });
      
    } catch (error) {
      console.error("Error moving enemy along path:", error);
    }
  }


  // Handle general clicks based on tool mode with resolution synchronization
  handleClick(x, y) {
    try {
      if (!this.gameState.isActive) return;
      
      const worldX = x;
      const worldY = y;

      console.log("");
      
      // Check if click is on toolbar area to prevent accidental placement
      // Convert toolbar position to world coordinates for consistent comparison
      const toolbarY = this.cameras.main.height - 80;
      const toolbarHeight = 100; // Approximate toolbar height including buttons
      const worldToolbarY = this.cameras.main.getWorldPoint(0, toolbarY).y;
      
      if (worldY > worldToolbarY - toolbarHeight/2) {
        console.log("");
         return; // Ignore clicks on toolbar area
      }
      
      // Create click effect at world coordinates using object pooling
      this.createClickEffect(worldX, worldY);
      
      // Handle different tool modes with world coordinates
      switch (this.toolMode) {
        case 'attack':
          // Find the closest enemy within hit radius to attack only one enemy per click
          let closestEnemy = null;
          let closestDistance = Infinity;
          const hitAreaSize = 80 * (this.scale.displayScale.x + this.scale.displayScale.y) / 2;
          
          this.enemies.forEach(enemy => {
            if (!enemy.active) return;
            const distance = Phaser.Math.Distance.Between(worldX, worldY, enemy.x, enemy.y);
            if (distance < hitAreaSize && distance < closestDistance) {
              closestEnemy = enemy;
              closestDistance = distance;
            }
          });
          
          // Attack only the closest enemy if found
          if (closestEnemy) {
            this.attackEnemy(closestEnemy);
          }
          break;
          
        case 'plant':
          this.handlePlantPlacement(worldX, worldY);
          break;
          
        case 'chog':
        case 'molandak':
        case 'moyaki':
        case 'keon':
          this.handleDefensePlacement(worldX, worldY, this.toolMode);
          break;
      }
      
    } catch (error) {
      console.error("Error handling click:", error);
    }
  }

  // Create click effect with object pooling
  createClickEffect(x, y) {
    // Initialize effect pool if not exists
    if (!this.effectPool) {
      this.effectPool = [];
      this.maxEffects = 30;
      
      // Pre-create effects
      for (let i = 0; i < this.maxEffects; i++) {
        const effect = this.add.circle(0, 0, 20, 0xFFFFFF, 0.8);
        effect.setDepth(50);
        effect.setActive(false);
        effect.setVisible(false);
        this.effectPool.push(effect);
      }
    }
    
    // Get effect from pool
    let clickEffect = this.effectPool.find(e => !e.active);
    
    // If no effect available in pool, create a new one
    if (!clickEffect) {
      clickEffect = this.add.circle(0, 0, 20, 0xFFFFFF, 0.8);
      clickEffect.setDepth(50);
      this.effectPool.push(clickEffect);
    }
    
    // Activate and position effect
    clickEffect.setActive(true);
    clickEffect.setVisible(true);
    clickEffect.x = x;
    clickEffect.y = y;
    clickEffect.setScale(1);
    clickEffect.setAlpha(0.8);
    
    this.tweens.add({
      targets: clickEffect,
      scale: 2,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        // Return to pool instead of destroying
        clickEffect.setActive(false);
        clickEffect.setVisible(false);
      }
    });
  }

  // Attack enemy (enhanced)
  attackEnemy(enemy) {
    try {
      if (!enemy || !enemy.active) return;
      
      // Apply damage multiplier from power-ups
      const damageMultiplier = this.powerUpManager ? this.powerUpManager.getEffectMultiplier('damage') : 1;
      const totalDamage = this.gameState.clickDamage * damageMultiplier;
      enemy.health -= totalDamage;
      
      // Update health bar
      if (enemy.healthBar) {
        enemy.healthBar.clear();
        const healthPercent = enemy.health / enemy.maxHealth;
        enemy.healthBar.fillStyle(healthPercent > 0.5 ? 0x00FF00 : healthPercent > 0.25 ? 0xFFFF00 : 0xFF0000);
        enemy.healthBar.fillRect(0, 0, 40 * healthPercent, 6);
      }
      
      // Visual feedback - preserve original scale
      const originalScaleX = enemy.scaleX;
      const originalScaleY = enemy.scaleY;
      
      this.tweens.add({
        targets: enemy,
        scaleX: originalScaleX * 1.3,
        scaleY: originalScaleY * 1.3,
        duration: 100,
        yoyo: true,
        onComplete: () => {
          // Ensure scale is restored to original values
          enemy.setScale(originalScaleX, originalScaleY);
        }
      });
      
      // Play sound
      if (this.sounds?.enemyHit) {
        this.sounds.enemyHit.play();
      }
      
      if (enemy.health <= 0) {
        this.destroyEnemy(enemy);
      }
      
    } catch (error) {
      console.error("Error attacking enemy:", error);
    }
  }

  // Destroy enemy
  destroyEnemy(enemy) {
    try {
      // Award score and coins
      this.gameState.score += enemy.value;
      this.gameState.farmCoins += 5;
      
      // Update path analytics - enemy was defeated
      if (enemy.pathData && this.gameState.pathAnalytics[enemy.pathData.id]) {
        this.gameState.pathAnalytics[enemy.pathData.id].enemiesDefeated++;
      }
      
      // Update UI
      this.updateScoreText();
      this.updateFarmCoinsText();
      
      // Death animation
      this.tweens.add({
        targets: enemy,
        scale: 0,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          enemy.destroy();
          if (enemy.healthBar) enemy.healthBar.destroy();
          if (enemy.pathIndicator) enemy.pathIndicator.destroy();
        }
      });
      
      // Remove from array
      const index = this.enemies.indexOf(enemy);
      if (index > -1) {
        this.enemies.splice(index, 1);
      }
      
      // Play sound
      if (this.sounds?.enemyDeath) {
        this.sounds.enemyDeath.play();
      }
      
      // Check if wave is complete
      this.checkWaveComplete();
      
    } catch (error) {
      console.error("Error destroying enemy:", error);
    }
  }

  // Enemy reached end
  enemyReachedEnd(enemy) {
    try {
      this.gameState.lives--;
      this.updateLivesText();
      
      // Path analytics - enemy reached end (not defeated)
      if (enemy.pathData && this.gameState.pathAnalytics[enemy.pathData.id]) {
        // Increase threat level for paths that let enemies through
        const analytics = this.gameState.pathAnalytics[enemy.pathData.id];
        const escapeRate = (analytics.enemiesSpawned - analytics.enemiesDefeated) / analytics.enemiesSpawned;
        if (escapeRate > 0.3) {
          analytics.threatLevel = 'high';
        } else if (escapeRate > 0.1) {
          analytics.threatLevel = 'medium';
        }
      }
      
      // Remove enemy
      enemy.destroy();
      if (enemy.healthBar) enemy.healthBar.destroy();
      if (enemy.pathIndicator) enemy.pathIndicator.destroy();
      
      const index = this.enemies.indexOf(enemy);
      if (index > -1) {
        this.enemies.splice(index, 1);
      }
      
      // Check game over
      if (this.gameState.lives <= 0) {
        this.gameOver();
      } else {
        this.checkWaveComplete();
      }
      
    } catch (error) {
      console.error("Error handling enemy reached end:", error);
    }
  }

  // Check if wave is complete
  checkWaveComplete() {
    try {
      if (this.enemiesSpawned >= this.totalEnemiesInWave && this.enemies.length === 0) {
        this.waveComplete();
      }
    } catch (error) {
      console.error("Error checking wave complete:", error);
    }
  }

  // Wave complete
  waveComplete() {
    try {
      this.waveInProgress = false;
      const completedWave = this.gameState.wave;
      this.gameState.wave++;

      // Weather changes every 5 waves
      const isMilestoneWave = completedWave % 5 === 0;
      if (isMilestoneWave) {
        this.changeWeather();
      }
      
      console.log(`Wave ${completedWave} complete! Starting wave ${this.gameState.wave}`);
      
      // Bonus score
      const waveBonus = 50 * this.gameState.wave;
      this.gameState.score += waveBonus;
      this.updateScoreText();
      
      // Create wave completion message
      const completionText = this.add.text(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2 - 50,
        `Wave ${completedWave} Complete!`,
        {
          fontFamily: 'Arial',
          fontSize: isMilestoneWave ? '48px' : '36px',
          color: isMilestoneWave ? '#ffdd00' : '#ffffff',
          stroke: '#000000',
          strokeThickness: 4,
          align: 'center'
        }
      );
      completionText.setOrigin(0.5);
      completionText.setDepth(2000);
      
      // Add bonus text
      const bonusText = this.add.text(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2,
        `Bonus: ${waveBonus} points!`,
        {
          fontFamily: 'Arial',
          fontSize: '24px',
          color: '#00ffff',
          stroke: '#000000',
          strokeThickness: 2,
          align: 'center'
        }
      );
      bonusText.setOrigin(0.5);
      bonusText.setDepth(2000);
      bonusText.setAlpha(0);
      
      // Animate completion text
      this.tweens.add({
        targets: completionText,
        scaleX: { from: 0.5, to: 1 },
        scaleY: { from: 0.5, to: 1 },
        duration: 500,
        ease: 'Back.easeOut',
        onComplete: () => {
          // Show bonus text after main text appears
          this.tweens.add({
            targets: bonusText,
            alpha: 1,
            y: this.cameras.main.height / 2 + 10,
            duration: 500,
            ease: 'Sine.easeOut'
          });
        }
      });
      
      // Play sound effect
      if (this.soundManager) {
        this.soundManager.play('wave_complete', { volume: 0.5 });
      }
      
      // Add celebration effects for milestone waves
      if (isMilestoneWave && this.particleEffects) {
        this.particleEffects.createLevelCompletionCelebration();
      }
      
      // Remove texts after delay
      this.time.delayedCall(2500, () => {
        this.tweens.add({
          targets: [completionText, bonusText],
          alpha: 0,
          y: '-=50',
          duration: 500,
          onComplete: () => {
            completionText.destroy();
            bonusText.destroy();
          }
        });
      });
      
      // Start next wave after delay
      this.time.delayedCall(3000, () => {
        if (this.gameState.isActive) {
          this.startWave();
        }
      });
      
    } catch (error) {
      console.error("Error completing wave:", error);
    }
  }

  // Weather System Implementation
  changeWeather() {
    // Cycle through weather types
    const currentIndex = this.weatherSystem.weatherTypes.indexOf(this.weatherSystem.currentWeather);
    const nextIndex = (currentIndex + 1) % this.weatherSystem.weatherTypes.length;
    const newWeather = this.weatherSystem.weatherTypes[nextIndex];
    
    this.setWeather(newWeather);
  }
  
  setWeather(weatherType) {
    // Clean up previous weather effects
    this.clearWeatherEffects();
    
    this.weatherSystem.currentWeather = weatherType;
    
    // Apply weather effects
    switch (weatherType) {
      case 'sunny':
        this.applySunnyWeather();
        break;
      case 'rainy':
        this.applyRainyWeather();
        break;
      case 'snow':
        this.applySnowWeather();
        break;
    }
    
    // Show weather change notification
    this.showWeatherChangeNotification(weatherType);
  }
  
  applySunnyWeather() {
    // Bright, warm lighting
    this.cameras.main.setBackgroundColor('#87CEEB'); // Sky blue
    
    // Sunny weather effects: increased mana regeneration
    this.weatherSystem.manaBonus = 1.5;
    this.weatherSystem.enemySpeedModifier = 1.0;
    
    // Add sun rays effect
    if (this.particleEffects) {
      this.weatherSystem.weatherParticles = this.add.particles(0, 0, 'coin', {
        x: { min: 0, max: this.cameras.main.width },
        y: { min: -50, max: 0 },
        scale: { start: 0.1, end: 0.05 },
        alpha: { start: 0.3, end: 0 },
        speed: { min: 20, max: 40 },
        lifespan: 3000,
        frequency: 2000,
        tint: 0xFFD700,
        blendMode: 'ADD'
      });
      this.weatherSystem.weatherParticles.setDepth(10);
    }
  }
  
  applyRainyWeather() {
    // Dark, stormy atmosphere
    this.cameras.main.setBackgroundColor('#2F4F4F'); // Dark slate gray
    
    // Rainy weather effects: reduced enemy speed, increased defense damage
    this.weatherSystem.manaBonus = 1.0;
    this.weatherSystem.enemySpeedModifier = 0.7;
    this.weatherSystem.defenseBonus = 1.3;
    
    // Add rain particles
    if (this.add.particles) {
      this.weatherSystem.weatherParticles = this.add.particles(0, 0, 'iceball', {
        x: { min: -100, max: this.cameras.main.width + 100 },
        y: { min: -50, max: 0 },
        scale: { start: 0.05, end: 0.02 },
        alpha: { start: 0.8, end: 0.3 },
        speedX: { min: -20, max: 20 },
        speedY: { min: 200, max: 400 },
        lifespan: 2000,
        frequency: 50,
        tint: 0x87CEEB
      });
      this.weatherSystem.weatherParticles.setDepth(1000);
    }
  }
  
  applySnowWeather() {
    // Cold, winter atmosphere
    this.cameras.main.setBackgroundColor('#B0C4DE'); // Light steel blue
    
    // Snow weather effects: slower enemy movement, reduced mana regen
    this.weatherSystem.manaBonus = 0.7;
    this.weatherSystem.enemySpeedModifier = 0.5;
    this.weatherSystem.defenseBonus = 1.0;
    
    // Add snow particles
    if (this.add.particles) {
      this.weatherSystem.weatherParticles = this.add.particles(0, 0, 'coin', {
        x: { min: 0, max: this.cameras.main.width },
        y: { min: -50, max: 0 },
        scale: { start: 0.08, end: 0.12 },
        alpha: { start: 0.9, end: 0.4 },
        speedX: { min: -30, max: 30 },
        speedY: { min: 50, max: 150 },
        lifespan: 4000,
        frequency: 100,
        tint: 0xFFFFFF,
        bounce: 0.2
      });
      this.weatherSystem.weatherParticles.setDepth(1000);
    }
  }
  
  clearWeatherEffects() {
    if (this.weatherSystem.weatherParticles) {
      this.weatherSystem.weatherParticles.destroy();
      this.weatherSystem.weatherParticles = null;
    }
    if (this.weatherSystem.weatherOverlay) {
      this.weatherSystem.weatherOverlay.destroy();
      this.weatherSystem.weatherOverlay = null;
    }
    
    // Reset weather modifiers
    this.weatherSystem.manaBonus = 1.0;
    this.weatherSystem.enemySpeedModifier = 1.0;
    this.weatherSystem.defenseBonus = 1.0;
  }
  
  showWeatherChangeNotification(weatherType) {
    const weatherNames = {
      'sunny': '☀️ Sunny Weather',
      'rainy': '🌧️ Rainy Weather', 
      'snow': '❄️ Snow Weather'
    };
    
    const weatherEffects = {
      'sunny': 'Mana regeneration increased!',
      'rainy': 'Enemies slowed, defenses boosted!',
      'snow': 'Enemies frozen, mana regen reduced!'
    };
    
    // Create weather notification
    const weatherText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 - 100,
      weatherNames[weatherType],
      {
        fontFamily: 'Arial',
        fontSize: '42px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
        align: 'center'
      }
    );
    weatherText.setOrigin(0.5);
    weatherText.setDepth(2500);
    
    const effectText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 - 50,
      weatherEffects[weatherType],
      {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 2,
        align: 'center'
      }
    );
    effectText.setOrigin(0.5);
    effectText.setDepth(2500);
    
    // Animate weather notification
    this.tweens.add({
      targets: [weatherText, effectText],
      scaleX: { from: 0.3, to: 1 },
      scaleY: { from: 0.3, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 800,
      ease: 'Back.easeOut'
    });
    
    // Remove notification after delay
    this.time.delayedCall(3000, () => {
      this.tweens.add({
        targets: [weatherText, effectText],
        alpha: 0,
        y: '-=30',
        duration: 500,
        onComplete: () => {
          weatherText.destroy();
          effectText.destroy();
        }
      });
    });
  }

  // Update UI methods
  updateScoreText() {
    if (this.scoreText) {
      this.scoreText.setText(`Score: ${this.gameState.score}`);
    }
  }

  updateFarmCoinsText() {
    if (this.farmCoinsText) {
      this.farmCoinsText.setText(`Farm Coins: ${this.gameState.farmCoins}`);
    }
  }

  updateWaveText() {
    if (this.waveText) {
      this.waveText.setText(`Wave: ${this.gameState.wave}`);
    }
  }

  updateLivesText() {
    if (this.livesText) {
      this.livesText.setText(`Lives: ${this.gameState.lives}`);
    }
  }









  // Start tower firing
  startTowerFiring() {
    this.time.addEvent({
      delay: 100,
      callback: () => {
        if (this.gameState.isActive && this.defenseTowers) {
          this.defenseTowers.forEach(tower => {
            this.towerFire(tower);
          });
        }
      },
      loop: true
    });
  }

  // Tower fires at enemies
  towerFire(tower) {
    try {
      const now = Date.now();
      if (now - tower.lastFired < tower.fireRate) return;
      
      // Find enemies in range
      const enemiesInRange = this.enemies.filter(enemy => {
        const distance = Phaser.Math.Distance.Between(tower.x, tower.y, enemy.x, enemy.y);
        return distance <= tower.range;
      });
      
      if (enemiesInRange.length > 0) {
        // Fire at closest enemy
        const target = enemiesInRange[0];
        
        // Get projectile from pool
        let projectile = this.projectilePool.find(p => !p.active);
        
        // If no projectile available in pool, create a new one
        if (!projectile) {
          projectile = this.add.circle(0, 0, 5, 0xFFFF00, 1);
          projectile.setStrokeStyle(2, 0xFF0000);
          this.projectilePool.push(projectile);
        }
        
        // Activate and position projectile
        projectile.setActive(true);
        projectile.setVisible(true);
        projectile.x = tower.x;
        projectile.y = tower.y;
        
        // Move projectile to target
        this.tweens.add({
          targets: projectile,
          x: target.x,
          y: target.y,
          duration: 500,
          onComplete: () => {
            // Return projectile to pool instead of destroying
            projectile.setActive(false);
            projectile.setVisible(false);
            
            // Damage enemy with power-up multiplier applied
            const damageMultiplier = this.powerUpManager ? this.powerUpManager.getEffectMultiplier('damage') : 1;
            target.health -= tower.damage * damageMultiplier;
            
            // Visual feedback
            this.tweens.add({
              targets: target,
              scaleX: 1.3,
              scaleY: 1.3,
              duration: 100,
              yoyo: true
            });
            
            if (target.health <= 0) {
              // Enemy defeated
              this.addScore(target.value);
              this.gameState.farmCoins += 5;
              this.updateFarmCoinsText();
              
              // Play death sound
              if (this.sounds?.enemyDeath) {
                this.sounds.enemyDeath.play();
              }
              
              // Death animation
              this.tweens.add({
                targets: target,
                scale: 0,
                alpha: 0,
                duration: 300,
                onComplete: () => target.destroy()
              });
              
              // Remove from enemies array
              const index = this.enemies.indexOf(target);
              if (index > -1) {
                this.enemies.splice(index, 1);
              }
            }
          }
        });
        
        tower.lastFired = now;
        
        // Play click sound
        if (this.sounds?.click) {
          this.sounds.click.play();
        }
      }
      
    } catch (error) {
      console.error("Error in tower fire:", error);
    }
  }

  // Upgrade tower
  upgradeTower(tower) {
    if (this.gameState.farmCoins >= 50) {
      this.gameState.farmCoins -= 50;
      this.updateFarmCoinsText();
      
      // Upgrade tower stats
      tower.damage += 10;
      tower.range += 25;
      tower.fireRate = Math.max(200, tower.fireRate - 100);
      
      // Visual upgrade effect
      this.tweens.add({
        targets: [tower, tower.cannon],
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 200,
        yoyo: true
      });
      
      // Play upgrade sound
      if (this.sounds?.plantCrop) {
        this.sounds.plantCrop.play();
      }
      
      // Update tower appearance
      tower.setFillStyle(0x32CD32, 0.9);
      tower.setStrokeStyle(4, 0x006400);
    }
  }









  // Update UI text methods
  updateScoreText() {
    if (this.scoreText) {
      this.scoreText.setText(`Score: ${this.gameState.score}`);
    }
  }

  updateFarmCoinsText() {
    if (this.farmCoinsText) {
      this.farmCoinsText.setText(`Farm Coins: ${this.gameState.farmCoins}`);
    }
  }

  updateLivesText() {
    if (this.livesText) {
      this.livesText.setText(`Lives: ${this.gameState.lives}`);
    }
  }

  // Add score method
  addScore(points) {
    if (this.gameState) {
      this.gameState.score = (this.gameState.score || 0) + points;
      this.updateScoreText();
    }
  }
  
  // Update farm coins text
  updateFarmCoinsText() {
    if (this.farmCoinsText && this.gameState) {
      this.farmCoinsText.setText(`Farm Coins: ${this.gameState.farmCoins}`);
    }
  }

  // Game over (enhanced)
  gameOver() {
    try {
      this.gameState.isActive = false;
      
      // Play game over sound
      if (this.sounds?.gameOver) {
        this.sounds.gameOver.play();
      }
      
      // Save high score
      const highScores = JSON.parse(localStorage.getItem('mondefense_highscores')) || [];
      const currentHighScore = highScores.length > 0 ? highScores[0] : 0;
      highScores.push(this.gameState.score);
      highScores.sort((a, b) => b - a);
      highScores.splice(10); // Keep top 10
      localStorage.setItem('mondefense_highscores', JSON.stringify(highScores));

      if (this.gameState.score > currentHighScore) {
      }
      
      // Modern Game Over Screen
      const gameOverText = this.uiStyle.createStyledText(this.cameras.main.width / 2, this.cameras.main.height / 2 - 50, 'GAME OVER', 'h1', {
        color: this.uiStyle.colors.danger.main,
        glow: { color: this.uiStyle.colors.danger.light }
      }).setOrigin(0.5).setDepth(5000);
      
      const finalScoreText = this.uiStyle.createStyledText(this.cameras.main.width / 2, this.cameras.main.height / 2 + 20, `Final Score: ${this.gameState.score}`, 'h2')
        .setOrigin(0.5).setDepth(5000);
      
      const waveReachedText = this.uiStyle.createStyledText(this.cameras.main.width / 2, this.cameras.main.height / 2 + 60, `Waves Survived: ${this.gameState.wave - 1}`, 'h3', {
        color: this.uiStyle.colors.warning.main
      }).setOrigin(0.5).setDepth(5000);
      
      // New high score notification
      if (this.gameState.score > currentHighScore) {
        const newHighScoreText = this.uiStyle.createStyledText(this.cameras.main.width / 2, this.cameras.main.height / 2 + 100, '🏆 NEW HIGH SCORE! 🏆', 'h3', {
          color: this.uiStyle.colors.success.main,
          glow: { color: this.uiStyle.colors.success.light }
        }).setOrigin(0.5).setDepth(5000);
        
        // Animated glow effect
        this.tweens.add({
          targets: newHighScoreText,
          alpha: 0.7,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 800,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
      
      // Create modern glass-morphism background
      const gameOverPanel = this.uiStyle.createGlassPanel(this.cameras.main.width / 2, this.cameras.main.height / 2, 
        this.cameras.main.width * 0.8, this.cameras.main.height * 0.8);
      gameOverPanel.setDepth(4999);
      
      // Modern Buttons
      const playAgainButton = this.uiStyle.createModernButton(
        this.cameras.main.width / 2 - 120, 
        this.cameras.main.height / 2 + 150, 
        '🔄 PLAY AGAIN', 
        () => this.restartGame(),
        { variant: 'success' }
      );
      playAgainButton.setDepth(5000);
      
      // Return to menu button
      const menuButton = this.uiStyle.createModernButton(
        this.cameras.main.width / 2 + 120, 
        this.cameras.main.height / 2 + 150, 
        '🏠 MAIN MENU', 
        () => this.returnToMainMenu(),
        { variant: 'warning' }
      );
      menuButton.setDepth(5000);
      
    } catch (error) {
      console.error("Error in game over:", error);
    }
  }

  // Restart game
  restartGame() {
    try {
      // Clean up current game state without removing menu
      this.cleanupGameForRestart();
      
      // Start new game directly
      this.startGame();
      
    } catch (error) {
      console.error("Error restarting game:", error);
    }
  }

  // Clean up game for restart (preserves menu system)
  cleanupGameForRestart() {
    try {
      // Reset game state
      this.gameState = {
        isActive: false,
        isPaused: false,
        wave: 1,
        score: 0,
        lives: 3,
        farmCoins: 120,
        clickDamage: 0.5,
        canPlant: true,
        autoWave: true
      };
      
      // Clear game arrays
      this.enemies = [];
      this.crops = {};
      
      // Clean up defense mana displays before clearing defenses
      if (this.defenses && this.defenses.length > 0) {
        this.defenses.forEach(defense => {
          if (defense.manaDisplay) {
            defense.manaDisplay.destroy();
          }
          if (defense.rangeIndicator) {
            defense.rangeIndicator.destroy();
          }
        });
      }
      
      this.defenses = [];
      this.isSpawningEnemies = false;
      this.waveInProgress = false;
      this.enemiesSpawned = 0;
      this.totalEnemiesInWave = 0;
      
      // Stop power-up manager
      if (this.powerUpManager) {
        this.powerUpManager.stop();
        this.powerUpManager.clearAllPowerUps();
      }
      
      // Clear any running timers
      if (this.waveTimer) {
        this.waveTimer.destroy();
        this.waveTimer = null;
      }
      
      // Remove only game objects, preserve menu containers
      this.children.list.forEach(child => {
        if (child !== this.menuContainer && 
            child !== this.settingsContainer && 
            child !== this.creditsContainer && 
            child !== this.leaderboardContainer && 
            child !== this.pauseContainer && 
            child !== this.loadingContainer) {
          child.destroy();
        }
      });
      
      console.log("Game cleaned up for restart");
      
    } catch (error) {
      console.error("Error cleaning up game for restart:", error);
    }
  }





  // Create settings menu
  createSettingsMenu() {
    try {
      const centerX = this.cameras.main.width / 2;
      const centerY = this.cameras.main.height / 2;
      
      this.settingsContainer = this.add.container(centerX, centerY);
      this.settingsContainer.setDepth(1001);
      this.settingsContainer.setVisible(false);
      
      // Settings background
      const settingsBg = this.uiStyle.createGlassPanel(0, 0, 600, 500, {
        fillColor: 0x1a1a2e,
        fillAlpha: 0.95,
        strokeColor: 0x00ffff,
        strokeWidth: 3,
        cornerRadius: 15
      });
      this.settingsContainer.add(settingsBg);
      
      // Settings title
      const settingsTitle = this.uiStyle.createStyledText(0, -200, 'SETTINGS', {
        fontSize: '36px',
        color: '#00ffff',
        fontWeight: 'bold',
        shadow: true,
        glow: true
      });
      settingsTitle.setOrigin(0.5);
      this.settingsContainer.add(settingsTitle);
      
      // Back button container
      const backButtonContainer = this.add.container(0, 180);
      
      // Back button
      const backButton = this.uiStyle.createModernButton(0, 0, 200, 50, 'BACK', {
        backgroundColor: 0xff4444,
        textColor: '#ffffff',
        fontSize: '20px',
        cornerRadius: 8,
        shadow: true,
        glow: true
      });
      backButton.setInteractive({ useHandCursor: true });
      backButton.on('pointerdown', () => this.showMainMenu());
      
      const backText = backButton.getByName('text');
      
      backButtonContainer.add([backButton, backText]);
      this.settingsContainer.add(backButtonContainer);
      
    } catch (error) {
      console.error("Error creating settings menu:", error);
    }
  }

  // Create credits menu
  createCreditsMenu() {
    try {
      const centerX = this.cameras.main.width / 2;
      const centerY = this.cameras.main.height / 2;
      
      this.creditsContainer = this.add.container(centerX, centerY);
      this.creditsContainer.setDepth(1001);
      this.creditsContainer.setVisible(false);
      
      // Credits background
      const creditsBg = this.uiStyle.createGlassPanel(0, 0, 600, 500, {
        fillColor: 0x2a1a2e,
        fillAlpha: 0.95,
        strokeColor: 0xff00ff,
        strokeWidth: 3,
        cornerRadius: 15
      });
      this.creditsContainer.add(creditsBg);
      
      // Credits title
      const creditsTitle = this.uiStyle.createStyledText(0, -200, 'CREDITS', {
        fontSize: '36px',
        color: '#ff00ff',
        fontWeight: 'bold',
        shadow: true,
        glow: true
      });
      creditsTitle.setOrigin(0.5);
      this.creditsContainer.add(creditsTitle);
      
      // Credits content
      const credits = [
        'Game Design & Development',
        'Mon Defense Team',
        '',
        'Special Thanks To:',
        'Phaser.js Community',
        'Gamers Everywhere',
        '',
        'Version 2.0 - Enhanced Edition'
      ];
      
      credits.forEach((line, index) => {
        const text = this.uiStyle.createStyledText(0, -120 + (index * 30), line, {
          fontSize: '18px',
          color: index === 0 || index === 3 ? '#ffff00' : '#ffffff',
          shadow: true
        });
        text.setOrigin(0.5);
        this.creditsContainer.add(text);
      });
      
      // Back button container
      const backButtonContainer = this.add.container(0, 180);
      
      // Back button
      const backButton = this.uiStyle.createModernButton(0, 0, 200, 50, 'BACK', {
        backgroundColor: 0xff4444,
        textColor: '#ffffff',
        fontSize: '20px',
        cornerRadius: 8,
        shadow: true,
        glow: true
      });
      backButton.setInteractive({ useHandCursor: true });
      backButton.on('pointerdown', () => this.showMainMenu());
      
      const backText = backButton.getByName('text');
      
      backButtonContainer.add([backButton, backText]);
      this.creditsContainer.add(backButtonContainer);
      
    } catch (error) {
      console.error("Error creating credits menu:", error);
    }
  }

  // Create leaderboard menu
  createLeaderboardMenu() {
    try {
      const centerX = this.cameras.main.width / 2;
      const centerY = this.cameras.main.height / 2;
      
      this.leaderboardContainer = this.add.container(centerX, centerY);
      this.leaderboardContainer.setDepth(1001);
      this.leaderboardContainer.setVisible(false);
      
      // Leaderboard background
      const leaderboardBg = this.uiStyle.createGlassPanel(0, 0, 600, 500, {
        fillColor: 0x2e1a1a,
        fillAlpha: 0.95,
        strokeColor: 0xff8800,
        strokeWidth: 3,
        cornerRadius: 15
      });
      this.leaderboardContainer.add(leaderboardBg);
      
      // Leaderboard title
      const leaderboardTitle = this.uiStyle.createStyledText(0, -200, 'LEADERBOARD', {
        fontSize: '36px',
        color: '#ff8800',
        fontWeight: 'bold',
        shadow: true,
        glow: true
      });
      leaderboardTitle.setOrigin(0.5);
      this.leaderboardContainer.add(leaderboardTitle);
      
      // Load and display high scores
      this.displayLeaderboard();
      
      // Back button container
      const backButtonContainer = this.add.container(0, 180);
      
      // Back button
      const backButton = this.uiStyle.createModernButton(0, 0, 200, 50, 'BACK', {
        backgroundColor: 0xff4444,
        textColor: '#ffffff',
        fontSize: '20px',
        cornerRadius: 8,
        shadow: true,
        glow: true
      });
      backButton.setInteractive({ useHandCursor: true });
      backButton.on('pointerdown', () => this.showMainMenu());
      
      const backText = backButton.getByName('text');
      
      backButtonContainer.add([backButton, backText]);
      this.leaderboardContainer.add(backButtonContainer);
      
    } catch (error) {
      console.error("Error creating leaderboard menu:", error);
    }
  }

  // Display leaderboard scores
  displayLeaderboard() {
    try {
        // Remove all children except the first 2 (bg and title)
        if (this.leaderboardContainer.list.length > 2) {
            this.leaderboardContainer.list.splice(2).forEach(child => child.destroy());
        }
      // Get high scores from localStorage
      const highScores = JSON.parse(localStorage.getItem('mondefense_highscores')) || [];
      
      if (highScores.length === 0) {
        const noScoresText = this.add.text(0, -120, 'No high scores yet!', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.leaderboardContainer.add(noScoresText);
        return;
      }

      // Create score display
      highScores.forEach((score, index) => {
        const scoreText = this.add.text(0, -120 + (index * 40), `${index + 1}. ${score}`,
         {
            fontFamily: 'Arial Black',
            fontSize: '32px',
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        this.leaderboardContainer.add(scoreText);
      });
      
    } catch (error) {
      console.error("Error displaying leaderboard:", error);
    }
  }

  // Create pause menu for in-game use
  createPauseMenu() {
    try {
      const centerX = this.cameras.main.width / 2;
      const centerY = this.cameras.main.height / 2;
      
      this.pauseContainer = this.add.container(centerX, centerY);
      this.pauseContainer.setDepth(1002);
      this.pauseContainer.setVisible(false);
      
      // Semi-transparent overlay
      const overlay = this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.7);
      this.pauseContainer.add(overlay);
      
      // Pause menu background
      const pauseBg = this.uiStyle.createGlassPanel(0, 0, 400, 300, {
        fillColor: 0x2e2e1a,
        fillAlpha: 0.95,
        strokeColor: 0xffff00,
        strokeWidth: 3,
        cornerRadius: 15
      });
      this.pauseContainer.add(pauseBg);
      
      // Pause title
      const pauseTitle = this.uiStyle.createStyledText(0, -100, 'PAUSED', {
        fontSize: '32px',
        color: '#ffff00',
        fontWeight: 'bold',
        shadow: true,
        glow: true
      });
      pauseTitle.setOrigin(0.5);
      this.pauseContainer.add(pauseTitle);
      
      // Resume button container
      const resumeButtonContainer = this.add.container(0, -20);
      
      // Resume button
      const resumeButton = this.uiStyle.createModernButton(0, 0, 200, 50, 'RESUME', {
        backgroundColor: 0x44ff44,
        textColor: '#ffffff',
        fontSize: '20px',
        cornerRadius: 8,
        shadow: true,
        glow: true
      });
      resumeButton.setInteractive({ useHandCursor: true });
      resumeButton.on('pointerdown', () => this.resumeGame());
      
      const resumeText = resumeButton.getByName('text');
      
      resumeButtonContainer.add([resumeButton, resumeText]);
      this.pauseContainer.add(resumeButtonContainer);
      
      // Return to menu button container
      const menuButtonContainer = this.add.container(0, 50);
      
      // Return to menu button
      const menuButton = this.uiStyle.createModernButton(0, 0, 200, 50, 'MAIN MENU', {
        backgroundColor: 0xff8844,
        textColor: '#ffffff',
        fontSize: '20px',
        cornerRadius: 8,
        shadow: true,
        glow: true
      });
      menuButton.setInteractive({ useHandCursor: true });
      menuButton.on('pointerdown', () => this.returnToMainMenu());
      
      const menuText = menuButton.getByName('text');
      
      menuButtonContainer.add([menuButton, menuText]);
      this.pauseContainer.add(menuButtonContainer);
      
    } catch (error) {
      console.error("Error creating pause menu:", error);
    }
  }

  // Setup pause controls
  setupPauseControls() {
    try {
      // Add pause key (ESC or P)
      this.input.keyboard.on('keydown-ESC', () => {
        if (this.gameState?.isActive && !this.gameState.isPaused) {
          this.showPauseMenu();
        } else if (this.gameState?.isPaused) {
          this.resumeGame();
        }
      });
      
      this.input.keyboard.on('keydown-P', () => {
        if (this.gameState?.isActive && !this.gameState.isPaused) {
          this.showPauseMenu();
        } else if (this.gameState?.isPaused) {
          this.resumeGame();
        }
      });
      
    } catch (error) {
      console.error("Error setting up pause controls:", error);
    }
  }

  // Show pause menu
  showPauseMenu() {
    if (this.gameState?.isActive) {
      this.gameState.isPaused = true;
      this.pauseContainer.setVisible(true);
    }
  }

  // Resume game
  resumeGame() {
    this.gameState.isPaused = false;
    this.pauseContainer.setVisible(false);
  }

  // Return to main menu from game
  returnToMainMenu() {
    try {
      // Hide pause menu if visible
      if (this.pauseContainer) {
        this.pauseContainer.setVisible(false);
      }
      
      // Clean up game objects
      this.cleanupGame();
      
      // Show main menu with fade in
      this.menuContainer.setVisible(true);
      this.menuContainer.setAlpha(0);
      this.tweens.add({
        targets: this.menuContainer,
        alpha: 1,
        duration: 500
      });
      
      // Reset game state
      this.gameState.isActive = false;
      this.gameState.isPaused = false;
      this.gameState.score = 0;
      this.gameState.farmCoins = 100;
      this.gameState.lives = 3;
      
    } catch (error) {
      console.error("Error returning to main menu:", error);
    }
  }

  // Clean up game objects
  cleanupGame() {
    try {
      // Remove all game objects
      this.children.removeAll();
      
      // Recreate the main menu
      this.createMainMenu();
      
    } catch (error) {
      console.error("Error cleaning up game:", error);
    }
  }

  // Menu navigation methods
  showSettingsMenu() {
    this.menuContainer.setVisible(false);
    this.settingsContainer.setVisible(true);
  }

  showCreditsMenu() {
    this.menuContainer.setVisible(false);
    this.creditsContainer.setVisible(true);
  }

  showLeaderboardMenu() {
    this.menuContainer.setVisible(false);
    this.leaderboardContainer.setVisible(true);
  }

  // Create modern glassmorphism toolbar UI
  createToolbar() {
    try {
      console.log("Creating modern toolbar...");
      
      // Modern toolbar configuration
      const toolbarY = this.cameras.main.height - 80;
      const centerX = this.cameras.main.width / 2;
      const buttonSpacing = 85;
      const totalButtons = 6;
      const toolbarWidth = (totalButtons * buttonSpacing) + 40;
      
      // Create glassmorphism background container
      this.toolbarContainer = this.add.container(centerX, toolbarY);
      this.toolbarContainer.setDepth(1999);
      
      // Main toolbar background with glassmorphism effect
      const toolbarBg = this.add.graphics();
      toolbarBg.fillStyle(0x0a0a0a, 0.3);
      toolbarBg.fillRoundedRect(-toolbarWidth/2, -35, toolbarWidth, 70, 35);
      toolbarBg.lineStyle(2, 0x00ddff, 0.5);
      toolbarBg.strokeRoundedRect(-toolbarWidth/2, -35, toolbarWidth, 70, 35);
      this.toolbarContainer.add(toolbarBg);
      
      // Add subtle glow effect
      const glowBg = this.add.graphics();
      glowBg.fillStyle(0x00ddff, 0.1);
      glowBg.fillRoundedRect(-toolbarWidth/2 - 5, -40, toolbarWidth + 10, 80, 40);
      this.toolbarContainer.add(glowBg);
      
      // Animated background particles
      for (let i = 0; i < 15; i++) {
        const particle = this.add.circle(
          Phaser.Math.Between(-toolbarWidth/2, toolbarWidth/2),
          Phaser.Math.Between(-30, 30),
          2,
          0x00ddff,
          0.2
        );
        this.toolbarContainer.add(particle);
        
        this.tweens.add({
          targets: particle,
          alpha: 0.6,
          duration: Phaser.Math.Between(2000, 4000),
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
      
      // Initialize toolbar buttons object
      this.toolbarButtons = {};
      this.toolbarIcons = {};
      
      // Add descriptive text for selected tool
      this.selectedToolText = this.uiStyle.createStyledText(
        this,
        centerX, 
        toolbarY - 60, 
        'Selected: Attack Mode', 
        {
          fontSize: '18px',
          fill: '#00DDFF',
          stroke: '#000000',
          strokeThickness: 3,
          align: 'center',
          shadow: {
            offsetX: 1,
            offsetY: 1,
            color: '#000000',
            blur: 3,
            fill: true
          }
        }
      ).setOrigin(0.5).setDepth(2000);
      
      // Add tool description text
      this.toolDescriptionText = this.uiStyle.createStyledText(centerX, toolbarY - 40, 'Click enemies to attack them directly', {
        fontSize: '14px',
        fill: '#e8f4fd',
        stroke: '#1a365d',
        strokeThickness: 2,
        shadow: {
          offsetX: 1,
          offsetY: 1,
          color: '#000000',
          blur: 2,
          fill: true
        },
        align: 'center'
      }).setOrigin(0.5).setDepth(2000);
      
      this.toolbarContainer.add([this.selectedToolText, this.toolDescriptionText]);
      
      // Modern button configuration
      const buttonConfig = {
        width: 65,
        height: 65,
        radius: 32,
        iconSize: 36
      };
      
      // Calculate button positions
      const startX = -(totalButtons - 1) * buttonSpacing / 2;
      
      // Button definitions with modern styling
      const buttons = [
        {
          key: 'attack',
          x: startX,
          color: 0xff3366,
          glowColor: 0xff6699,
          icon: '⚔️',
          label: 'Attack',
          action: () => this.setToolMode('attack')
        },
        {
          key: 'plant',
          x: startX + buttonSpacing,
          color: 0x33cc66,
          glowColor: 0x66dd99,
          icon: '🌱',
          label: 'Plant',
          action: () => this.setToolMode('plant')
        },
        {
          key: 'chog',
          x: startX + buttonSpacing * 2,
          color: 0x3366ff,
          glowColor: 0x6699ff,
          icon: '🧙‍♂️',
          label: 'Chog Defense',
          sprite: 'chog_idle',
          action: () => {
            this.pendingDefenseType = 'chog';
            this.pendingDefensePlacement = true;
            this.setToolMode('chog');
            // Clear any auto-placement to prevent placing defense on toolbar
            this.input.setDefaultCursor('url(assets/cursors/tower.cur), pointer');
          }
        },
        {
          key: 'molandak',
          x: startX + buttonSpacing * 3,
          color: 0xff6633,
          glowColor: 0xff9966,
          icon: '🔥',
          label: 'Molandak Defense',
          sprite: 'molandak_idle',
          action: () => {
            this.pendingDefenseType = 'molandak';
            this.pendingDefensePlacement = true;
            this.setToolMode('molandak');
            // Clear any auto-placement to prevent placing defense on toolbar
            this.input.setDefaultCursor('url(assets/cursors/tower.cur), pointer');
          }
        },
        {
          key: 'moyaki',
          x: startX + buttonSpacing * 4,
          color: 0x9933ff,
          glowColor: 0xbb66ff,
          icon: '✨',
          label: 'Moyaki Defense',
          sprite: 'moyaki_idle',
          action: () => {
            this.pendingDefenseType = 'moyaki';
            this.pendingDefensePlacement = true;
            this.setToolMode('moyaki');
            // Clear any auto-placement to prevent placing defense on toolbar
            this.input.setDefaultCursor('url(assets/cursors/tower.cur), pointer');
          }
        },
        {
          key: 'keon',
          x: startX + buttonSpacing * 5,
          color: 0xdd3333,
          glowColor: 0xff6666,
          icon: '💥',
          label: 'Keon Defense',
          sprite: 'keon_idle',
          action: () => {
            this.pendingDefenseType = 'keon';
            this.pendingDefensePlacement = true;
            this.setToolMode('keon');
            // Clear any auto-placement to prevent placing defense on toolbar
            this.input.setDefaultCursor('url(assets/cursors/tower.cur), pointer');
          }
        }
      ];
      
      // Create modern buttons
      buttons.forEach(buttonData => {
        this.createModernButton(buttonData, buttonConfig);
      });
      
      // Set initial tool mode
      this.setToolMode('attack');
      
      console.log("Modern toolbar created successfully");
      
    } catch (error) {
      console.error("Error creating modern toolbar:", error);
    }
  }
  
  // Create a modern glassmorphism button
  createModernButton(buttonData, config) {
    try {
      const { key, x, color, glowColor, icon, sprite, action, label } = buttonData;
      
      // Button container
      const buttonContainer = this.add.container(x, 0);
      this.toolbarContainer.add(buttonContainer);
      
      // Button glow (for selected state)
      const buttonGlow = this.add.graphics();
      buttonGlow.fillStyle(glowColor, 0);
      buttonGlow.fillCircle(0, 0, config.radius + 8);
      buttonContainer.add(buttonGlow);
      
      // Button background with gradient effect
      const buttonBg = this.add.graphics();
      buttonBg.fillStyle(color, 0.7);
      buttonBg.fillCircle(0, 0, config.radius);
      buttonBg.lineStyle(2, 0xffffff, 0.3);
      buttonBg.strokeCircle(0, 0, config.radius);
      buttonContainer.add(buttonBg);
      
      // Inner highlight for depth
      const innerHighlight = this.add.graphics();
      innerHighlight.fillStyle(0xffffff, 0.2);
      innerHighlight.fillCircle(0, -8, config.radius - 8);
      buttonContainer.add(innerHighlight);
      
      // Button icon/sprite
      let buttonIcon;
      if (sprite && this.textures.exists(sprite)) {
        buttonIcon = this.add.image(0, 0, sprite);
        buttonIcon.setDisplaySize(config.iconSize, config.iconSize);
      } else {
        buttonIcon = this.add.text(0, 0, icon, {
          fontFamily: 'Arial',
          fontSize: '28px'
        }).setOrigin(0.5);
      }
      buttonContainer.add(buttonIcon);
      
      // Label (small text below button)
      const buttonLabel = this.add.text(0, config.radius + 15, label, {
        fontFamily: 'Arial',
        fontSize: '12px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);
      buttonContainer.add(buttonLabel);
      
      // Make button interactive
      const hitArea = new Phaser.Geom.Circle(0, 0, config.radius);
      buttonContainer.setInteractive(hitArea, Phaser.Geom.Circle.Contains);
      buttonContainer.setData('buttonKey', key);
      
      // Store references
      this.toolbarButtons[key] = {
        container: buttonContainer,
        background: buttonBg,
        glow: buttonGlow,
        icon: buttonIcon,
        label: buttonLabel,
        originalColor: color,
        glowColor: glowColor
      };
      
      // Add enhanced hover effects with better visual feedback
      buttonContainer.on('pointerover', () => {
        // Scale animation with bounce effect
        this.tweens.add({
          targets: buttonContainer,
          scaleX: 1.15,
          scaleY: 1.15,
          duration: 300,
          ease: 'Elastic.easeOut'
        });
        
        // Enhanced glow effect
        this.tweens.add({
          targets: buttonGlow,
          alpha: 0.6,
          scaleX: 1.2,
          scaleY: 1.2,
          duration: 300,
          ease: 'Power2.easeOut'
        });
        
        // Brighten the button background
        this.tweens.add({
          targets: buttonBg,
          alpha: 1,
          duration: 200
        });
        
        // Icon pulse effect
        this.tweens.add({
          targets: buttonIcon,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 200,
          ease: 'Back.easeOut'
        });
        
        // Label highlight
        this.tweens.add({
          targets: buttonLabel,
          alpha: 1,
          y: config.radius + 12,
          duration: 200,
          ease: 'Power2.easeOut'
        });
      });
      
      buttonContainer.on('pointerout', () => {
        const isSelected = this.toolMode === key;
        
        // Smooth scale transition
        this.tweens.add({
          targets: buttonContainer,
          scaleX: isSelected ? 1.05 : 1,
          scaleY: isSelected ? 1.05 : 1,
          duration: 250,
          ease: 'Power2.easeOut'
        });
        
        // Reset glow if not selected
        if (!isSelected) {
          this.tweens.add({
            targets: buttonGlow,
            alpha: 0,
            scaleX: 1,
            scaleY: 1,
            duration: 250
          });
          
          // Reset button background
          this.tweens.add({
            targets: buttonBg,
            alpha: 0.7,
            duration: 200
          });
        }
        
        // Reset icon scale
        this.tweens.add({
          targets: buttonIcon,
          scaleX: 1,
          scaleY: 1,
          duration: 200,
          ease: 'Power2.easeOut'
        });
        
        // Reset label position and alpha
        this.tweens.add({
          targets: buttonLabel,
          alpha: 0.8,
          y: config.radius + 15,
          duration: 200,
          ease: 'Power2.easeOut'
        });
      });
      
      // Enhanced click animation and action with better feedback
      buttonContainer.on('pointerdown', (pointer, localX, localY, event) => {
        event.stopPropagation();
        
        // Satisfying click animation with bounce back
        this.tweens.add({
          targets: buttonContainer,
          scaleX: 0.9,
          scaleY: 0.9,
          duration: 80,
          ease: 'Power3.easeIn',
          onComplete: () => {
            this.tweens.add({
              targets: buttonContainer,
              scaleX: 1.1,
              scaleY: 1.1,
              duration: 120,
              ease: 'Back.easeOut',
              onComplete: () => {
                // Execute button action
                action();
                
                // Enhanced ripple effect with multiple rings
                for (let i = 0; i < 3; i++) {
                  setTimeout(() => {
                    const ripple = this.add.graphics();
                    ripple.lineStyle(2 - i * 0.5, glowColor, 0.8 - i * 0.2);
                    ripple.strokeCircle(x, 0, config.radius + i * 5);
                    this.toolbarContainer.add(ripple);
                    
                    this.tweens.add({
                      targets: ripple,
                      scaleX: 2.5 + i * 0.5,
                      scaleY: 2.5 + i * 0.5,
                      alpha: 0,
                      duration: 500 + i * 100,
                      ease: 'Power2.easeOut',
                      onComplete: () => ripple.destroy()
                    });
                  }, i * 50);
                }
                
                // Particle burst effect
                this.createClickParticles(x, 0, glowColor);
                
                // Flash effect on button
                const flash = this.add.graphics();
                flash.fillStyle(0xffffff, 0.6);
                flash.fillCircle(x, 0, config.radius);
                this.toolbarContainer.add(flash);
                
                this.tweens.add({
                  targets: flash,
                  alpha: 0,
                  duration: 150,
                  ease: 'Power2.easeOut',
                  onComplete: () => flash.destroy()
                });
              }
            });
          }
        });
      });
      
    } catch (error) {
      console.error("Error creating modern button:", error);
    }
  }
  
  // Create particle burst effect for button clicks
  createClickParticles(x, y, color) {
    try {
      const particleCount = 8;
      const particles = [];
      
      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2;
        const distance = 20 + Math.random() * 15;
        const targetX = x + Math.cos(angle) * distance;
        const targetY = y + Math.sin(angle) * distance;
        
        const particle = this.add.graphics();
        particle.fillStyle(color, 0.8);
        particle.fillCircle(x, y, 2 + Math.random() * 2);
        this.toolbarContainer.add(particle);
        
        particles.push(particle);
        
        // Animate particle outward
        this.tweens.add({
          targets: particle,
          x: targetX,
          y: targetY,
          alpha: 0,
          scaleX: 0.2,
          scaleY: 0.2,
          duration: 300 + Math.random() * 200,
          ease: 'Power2.easeOut',
          onComplete: () => particle.destroy()
        });
      }
    } catch (error) {
      console.error("Error creating click particles:", error);
    }
  }
  
  // Show visual feedback for keyboard shortcut usage
  showKeyboardShortcutFeedback(mode, key) {
    try {
      const keyText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 100, 
        `${key.toUpperCase()} - ${mode.toUpperCase()} MODE`, {
        fontFamily: 'Arial Black',
        fontSize: '24px',
        color: '#00ff00',
        stroke: '#000000',
        strokeThickness: 3,
        align: 'center'
      }).setOrigin(0.5).setDepth(2000);
      
      // Animate the feedback text
      this.tweens.add({
        targets: keyText,
        y: keyText.y - 30,
        alpha: 0,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 1000,
        ease: 'Power2.easeOut',
        onComplete: () => keyText.destroy()
      });
      
    } catch (error) {
      console.error("Error showing keyboard shortcut feedback:", error);
    }
  }
  
  // Toggle keyboard shortcuts help display
  toggleKeyboardHelp() {
    try {
      if (this.keyboardHelpVisible) {
        // Hide help
        if (this.keyboardHelpContainer) {
          this.tweens.add({
            targets: this.keyboardHelpContainer,
            alpha: 0,
            scaleX: 0.8,
            scaleY: 0.8,
            duration: 300,
            ease: 'Power2.easeIn',
            onComplete: () => {
              this.keyboardHelpContainer.destroy();
              this.keyboardHelpContainer = null;
            }
          });
        }
        this.keyboardHelpVisible = false;
      } else {
        // Show help
        this.createKeyboardHelpDisplay();
        this.keyboardHelpVisible = true;
      }
    } catch (error) {
      console.error("Error toggling keyboard help:", error);
    }
  }
  
  // Create keyboard shortcuts help display
  createKeyboardHelpDisplay() {
    try {
      const centerX = this.cameras.main.centerX;
      const centerY = this.cameras.main.centerY;
      
      // Create container for help display
      this.keyboardHelpContainer = this.add.container(centerX, centerY).setDepth(3000);
      
      // Background
      const helpBg = this.add.graphics();
      helpBg.fillStyle(0x000000, 0.8);
      helpBg.fillRoundedRect(-200, -150, 400, 300, 10);
      helpBg.lineStyle(2, 0x00ff00, 0.8);
      helpBg.strokeRoundedRect(-200, -150, 400, 300, 10);
      this.keyboardHelpContainer.add(helpBg);
      
      // Title
      const title = this.add.text(0, -120, 'KEYBOARD SHORTCUTS', {
        fontFamily: 'Arial Black',
        fontSize: '20px',
        color: '#00ff00',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);
      this.keyboardHelpContainer.add(title);
      
      // Shortcuts list
      const shortcuts = [
        'A - Attack Mode',
        'P - Plant Mode',
        '1 - Chog Defense',
        '2 - Molandak Defense',
        '3 - Moyaki Defense',
        '4 - KEON Defense',
        'H - Toggle This Help',
        'ESC - Pause Game'
      ];
      
      shortcuts.forEach((shortcut, index) => {
        const shortcutText = this.add.text(0, -80 + (index * 20), shortcut, {
          fontFamily: 'Arial',
          fontSize: '14px',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 1
        }).setOrigin(0.5);
        this.keyboardHelpContainer.add(shortcutText);
      });
      
      // Close instruction
      const closeText = this.add.text(0, 110, 'Press H again to close', {
        fontFamily: 'Arial',
        fontSize: '12px',
        color: '#888888',
        stroke: '#000000',
        strokeThickness: 1
      }).setOrigin(0.5);
      this.keyboardHelpContainer.add(closeText);
      
      // Animate in
      this.keyboardHelpContainer.setAlpha(0).setScale(0.8);
      this.tweens.add({
        targets: this.keyboardHelpContainer,
        alpha: 1,
        scaleX: 1,
        scaleY: 1,
        duration: 300,
        ease: 'Back.easeOut'
      });
      
    } catch (error) {
      console.error("Error creating keyboard help display:", error);
    }
  }
  
  // Set tool mode with modern visual feedback
  setToolMode(mode) {
    try {
      this.toolMode = mode;
      
      // Update descriptive text based on selected tool
      const toolDescriptions = {
        attack: {
          title: 'Selected: Attack Mode',
          description: 'Click enemies to attack them directly'
        },
        plant: {
          title: 'Selected: Plant Mode',
          description: 'Click farm plots to plant crops'
        },
        chog: {
          title: 'Selected: Chog Defense',
          description: 'Cost: 50 coins, 20 mana per shot - Basic ranged defense'
        },
        molandak: {
          title: 'Selected: Molandak Defense',
          description: 'Cost: 60 coins, 25 mana per shot - Fast firing defense'
        },
        moyaki: {
          title: 'Selected: Moyaki Defense',
          description: 'Cost: 75 coins, 35 mana per shot - Magic area damage'
        },
        keon: {
          title: 'Selected: Keon Defense',
          description: 'Cost: 100 coins, 40 mana per shot - Heavy damage defense'
        }
      };
      
      const toolInfo = toolDescriptions[mode] || toolDescriptions.attack;
      if (this.selectedToolText) {
        this.selectedToolText.setText(toolInfo.title);
      }
      if (this.toolDescriptionText) {
        this.toolDescriptionText.setText(toolInfo.description);
      }
      
      // Update button visual states with enhanced feedback
      Object.keys(this.toolbarButtons).forEach(key => {
        const button = this.toolbarButtons[key];
        if (key === mode) {
          // Selected state - enhanced visual feedback
          this.tweens.add({
            targets: button.container,
            scaleX: 1.08,
            scaleY: 1.08,
            duration: 300,
            ease: 'Elastic.easeOut'
          });
          
          // Enhanced glow with pulsing effect
          this.tweens.add({
            targets: button.glow,
            alpha: 0.8,
            scaleX: 1.3,
            scaleY: 1.3,
            duration: 300,
            ease: 'Power2.easeOut'
          });
          
          // Pulsing glow animation
          this.tweens.add({
            targets: button.glow,
            alpha: 0.4,
            duration: 1000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
          });
          
          // Update background with enhanced selected appearance
          button.background.clear();
          button.background.fillStyle(button.originalColor, 1.0);
          button.background.fillCircle(0, 0, 32);
          button.background.lineStyle(4, button.glowColor, 1.0);
          button.background.strokeCircle(0, 0, 32);
          
          // Icon enhancement for selected state
          this.tweens.add({
            targets: button.icon,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 200,
            ease: 'Back.easeOut'
          });
          
          // Label enhancement
          this.tweens.add({
            targets: button.label,
            alpha: 1,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 200,
            ease: 'Back.easeOut'
          });
          
        } else {
          // Unselected state - smooth transition to normal
          this.tweens.add({
            targets: button.container,
            scaleX: 1,
            scaleY: 1,
            duration: 250,
            ease: 'Power2.easeOut'
          });
          
          // Remove glow and stop pulsing
          this.tweens.killTweensOf(button.glow);
          this.tweens.add({
            targets: button.glow,
            alpha: 0,
            scaleX: 1,
            scaleY: 1,
            duration: 250,
            ease: 'Power2.easeOut'
          });
          
          // Reset background to normal appearance
          button.background.clear();
          button.background.fillStyle(button.originalColor, 0.7);
          button.background.fillCircle(0, 0, 32);
          button.background.lineStyle(2, 0xffffff, 0.3);
          button.background.strokeCircle(0, 0, 32);
          
          // Reset icon scale
          this.tweens.add({
            targets: button.icon,
            scaleX: 1,
            scaleY: 1,
            duration: 200,
            ease: 'Power2.easeOut'
          });
          
          // Reset label
          this.tweens.add({
            targets: button.label,
            alpha: 0.8,
            scaleX: 1,
            scaleY: 1,
            duration: 200,
            ease: 'Power2.easeOut'
          });
        }
      });
      
      console.log('Tool mode set to:', mode);
      
    } catch (error) {
      console.error("Error setting tool mode:", error);
    }
  }

  // Handle plant placement when plant mode is active
  handlePlantPlacement(x, y) {
    try {
      // Check if click is in farm area (left side)
      if (x > this.farmAreaWidth) {
        console.log("Cannot plant outside farm area");
        // Visual feedback for invalid placement
        this.showPlacementError(x, y, "Plant in green farm area only!");
        return;
      }
      
      // Check if player has enough coins
      if (this.gameState.farmCoins < 25) {
        console.log("Not enough coins to plant (need 25)");
        this.showPlacementError(x, y, "Need 25 coins!");
        return;
      }
      
      // Snap to grid for organized placement
      const gridX = Math.floor(x / this.gridCellSize) * this.gridCellSize + this.gridCellSize/2;
      const gridY = Math.floor(y / this.gridCellSize) * this.gridCellSize + this.gridCellSize/2;
      
      // Check if there's already something at this location
      const plotKey = `${gridX}_${gridY}`;
      if (this.crops[plotKey]) {
        console.log("Already a crop at this location");
        this.showPlacementError(gridX, gridY, "Spot occupied!");
        return;
      }
      
      // Check nearby plots to prevent overlapping (ensures only one plant per area)
      const nearbyDistance = this.gridCellSize * 1.5; // Increased distance to prevent crowding
      for (let key in this.crops) {
        const [cropX, cropY] = key.split('_').map(Number);
        const distance = Phaser.Math.Distance.Between(gridX, gridY, cropX, cropY);
        if (distance < nearbyDistance) {
          console.log("Too close to another crop");
          this.showPlacementError(gridX, gridY, "Too close to another plant!");
          return;
        }
      }
      
      // Deduct coins
      this.gameState.farmCoins -= 25;
      this.updateFarmCoinsText();
      
      // Create new Crop2 instance with wave-based growth system
      const crop = new Crop2(this, gridX, gridY);
      
      // Add green placement indicator
      const placementIndicator = this.add.circle(gridX, gridY, this.gridCellSize/2, 0x00ff00, 0.2);
      placementIndicator.setDepth(9);
      
      // Fade in placement indicator
      this.tweens.add({
        targets: placementIndicator,
        alpha: 0.4,
        duration: 300
      });
      
      // Store crop reference with metadata
      this.crops[plotKey] = {
        crop: crop,
        indicator: placementIndicator,
        plantTime: Date.now()
      };
      
      // Play sound
      if (this.sounds?.plantCrop) {
        this.sounds.plantCrop.play();
      }
      
      // Success feedback
      this.showPlacementSuccess(gridX, gridY);
      
      console.log(`Planted static crop at ${gridX}, ${gridY}`);
      
    } catch (error) {
      console.error("Error handling plant placement:", error);
    }
  }
  
  // Show placement error feedback
  showPlacementError(x, y, message) {
    const errorText = this.uiStyle.createStyledText(x, y - 20, message, {
      fontSize: '18px',
      fill: '#ff6b6b',
      stroke: '#8b0000',
      strokeThickness: 3,
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: '#000000',
        blur: 4,
        fill: true
      }
    }).setOrigin(0.5);
    errorText.setDepth(100);
    
    this.tweens.add({
      targets: errorText,
      y: y - 50,
      alpha: 0,
      duration: 1000,
      onComplete: () => errorText.destroy()
    });
    
    // Red flash effect
    const flash = this.add.circle(x, y, 30, 0xff0000, 0.3);
    flash.setDepth(99);
    this.tweens.add({
      targets: flash,
      scale: 2,
      alpha: 0,
      duration: 300,
      onComplete: () => flash.destroy()
    });
  }
  
  // Show placement success feedback
  showPlacementSuccess(x, y) {
    const successText = this.uiStyle.createStyledText(x, y - 20, '✓ Planted!', {
      fontSize: '20px',
      fill: '#68d391',
      stroke: '#22543d',
      strokeThickness: 3,
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: '#000000',
        blur: 4,
        fill: true
      }
    }).setOrigin(0.5);
    successText.setDepth(100);
    
    this.tweens.add({
      targets: successText,
      y: y - 50,
      alpha: 0,
      duration: 1500,
      onComplete: () => successText.destroy()
    });
  }

  // Handle defense placement when defense mode is active
  handleDefensePlacement(x, y, defenseType) {
    try {
      // Check if click is in defense area (right side)
      if (x < this.farmAreaWidth) {
        console.log("Cannot place defenses in farm area");
        return;
      }
      
      // Defense costs (coins and mana)
      const defenseCosts = {
        chog: { coins: 50, mana: 20 },
        molandak: { coins: 60, mana: 25 }, 
        moyaki: { coins: 75, mana: 35 },
        keon: { coins: 100, mana: 40 }
      };
      
      const cost = defenseCosts[defenseType] || { coins: 50, mana: 20 };
      
      // Check if player has enough coins (mana is only required for firing, not placement)
      if (this.gameState.farmCoins < cost.coins) {
        console.log(`Not enough coins for ${defenseType} (need ${cost.coins})`);
        return;
      }
      
      // Check mana regeneration cooldown (prevent spam placement)
      const currentTime = Date.now();
      if (!this.lastDefensePlacement) this.lastDefensePlacement = 0;
      const manaCooldown = 2000; // 2 second cooldown between defense placements
      
      if (currentTime - this.lastDefensePlacement < manaCooldown) {
        const remainingCooldown = Math.ceil((manaCooldown - (currentTime - this.lastDefensePlacement)) / 1000);
        console.log(`Defense placement on cooldown. Wait ${remainingCooldown} seconds.`);
        return;
      }
      
      // Snap to grid
      const gridX = Math.floor(x / this.gridCellSize) * this.gridCellSize + this.gridCellSize/2;
      const gridY = Math.floor(y / this.gridCellSize) * this.gridCellSize + this.gridCellSize/2;
      
      // Check if there's already a defense at this location
      const existingDefense = this.defenses.find(d => 
        Math.abs(d.x - gridX) < this.gridCellSize && Math.abs(d.y - gridY) < this.gridCellSize
      );
      
      if (existingDefense) {
        console.log("Already a defense at this location");
        return;
      }
      
      // Deduct only coins (mana is only used for firing, not placement)
      this.gameState.farmCoins -= cost.coins;
      this.updateFarmCoinsText();
      
      // Create defense sprite
      const defense = this.add.image(gridX, gridY, `${defenseType}_idle`);
      defense.setScale(2.0);
      defense.setDepth(15);
      defense.setInteractive(); // Make interactive for hover events
      
      // Defense properties
      defense.defenseType = defenseType;
      defense.damage = this.getDefenseDamage(defenseType);
      defense.range = this.getDefenseRange(defenseType);
      defense.fireRate = this.getDefenseFireRate(defenseType);
      defense.lastFired = 0;
      
      // Create range indicator (initially hidden)
      const rangeIndicator = this.add.graphics();
      rangeIndicator.lineStyle(4, this.getDefenseRangeColor(defenseType), 0.8); // Increased thickness and alpha
      rangeIndicator.strokeCircle(gridX, gridY, defense.range);
      rangeIndicator.fillStyle(this.getDefenseRangeColor(defenseType), 0.2); // Increased alpha
      rangeIndicator.fillCircle(gridX, gridY, defense.range);
      rangeIndicator.setDepth(8); // Below everything else
      rangeIndicator.setVisible(false);
      defense.rangeIndicator = rangeIndicator;
      
      // Add hover events to show/hide range with improved visibility
      defense.on('pointerover', () => {
        console.log("Pointer over defense");
        // Ensure the range indicator is visible and reset alpha
        rangeIndicator.setAlpha(1);
        rangeIndicator.setVisible(true);
        
        // Make the range indicator more prominent
        rangeIndicator.clear();
        rangeIndicator.lineStyle(4, this.getDefenseRangeColor(defenseType), 0.9); // Increased visibility
        rangeIndicator.strokeCircle(gridX, gridY, defense.range);
        rangeIndicator.fillStyle(this.getDefenseRangeColor(defenseType), 0.3); // Increased fill opacity
        rangeIndicator.fillCircle(gridX, gridY, defense.range);
        
        // Add pulsing effect to make it more noticeable
        this.tweens.add({
          targets: rangeIndicator,
          scaleX: 1.05,
          scaleY: 1.05,
          yoyo: true,
          repeat: 2,
          duration: 300,
          ease: 'Sine.easeInOut'
        });
        
        // Scale up the defense slightly
        this.tweens.add({
          targets: defense,
          scaleX: 2.2,
          scaleY: 2.2,
          duration: 200,
          ease: 'Back.easeOut'
        });
      });
      
      defense.on('pointerout', () => {
        console.log("Pointer out of defense");
        // Fade out range indicator
        this.tweens.add({
          targets: rangeIndicator,
          alpha: 0,
          duration: 200,
          onComplete: () => rangeIndicator.setVisible(false)
        });
        // Scale back to normal
        this.tweens.add({
          targets: defense,
          scaleX: 2.0,
          scaleY: 2.0,
          duration: 200,
          ease: 'Back.easeOut'
        });
      });
      
      // Add right-click handler for specialization UI
      defense.on('pointerdown', (pointer, localX, localY, event) => {
        if (pointer.rightButtonDown()) {
          event.stopPropagation();
          this.specializationUI.show(defenseType);
        }
      });
      
      // Initialize individual defense mana system
      defense.mana = 50; // Starting mana for each defense
      defense.maxMana = 100; // Maximum mana capacity
      defense.manaRegenRate = 2; // Mana regeneration per second
      defense.lastManaRegen = Date.now();
      
      // Create individual mana display above defense
      const manaDisplay = this.add.text(gridX, gridY - 50, `Mana: ${defense.mana}/${defense.maxMana}`, {
        fontSize: '16px',
        fill: '#00ffff',
        fontFamily: 'Arial Black',
        stroke: '#000000',
        strokeThickness: 3
      });
      manaDisplay.setOrigin(0.5, 0.5);
      manaDisplay.setDepth(15);
      defense.manaDisplay = manaDisplay;
      
      // Add to defenses array
      this.defenses.push(defense);
      
      // Visual placement effect
      this.tweens.add({
        targets: defense,
        scaleX: 2.5,
        scaleY: 2.5,
        duration: 200,
        yoyo: true
      });
      
      // Play sound
      if (this.sounds?.plantCrop) {
        this.sounds.plantCrop.play();
      }
      
      console.log(`Placed ${defenseType} defense at ${gridX}, ${gridY}`);
      
    } catch (error) {
      console.error("Error handling defense placement:", error);
    }
  }

  // Get defense stats
  getDefenseDamage(type) {
    const damages = { chog: 1, molandak: 1.5, moyaki: 2, keon: 3 };
    const baseDamage = damages[type] || 1;
    // Apply damage multiplier from power-ups if available
    return baseDamage * (this.powerUpManager ? this.powerUpManager.getEffectMultiplier('damage') : 1);
  }
  
  getDefenseRange(type) {
    const ranges = { chog: 200, molandak: 180, moyaki: 250, keon: 150 }; // Increased ranges
    const baseRange = ranges[type] || 150;
    // Apply range multiplier from power-ups if available
    return baseRange * (this.powerUpManager ? this.powerUpManager.getEffectMultiplier('range') : 1);
  }
  
  // Get defense fire rate with speed multiplier from power-ups
  getDefenseFireRate(type) {
    const fireRates = { chog: 1000, molandak: 800, moyaki: 1200, keon: 2000 };
    const baseFireRate = fireRates[type] || 1000;
    // Apply speed multiplier from power-ups if available (lower fire rate = faster firing)
    return baseFireRate / (this.powerUpManager ? this.powerUpManager.getEffectMultiplier('speed') : 1);
  }
  
  // Get defense range indicator color based on type
  getDefenseRangeColor(type) {
    const colors = {
      chog: 0x00FFFF, // Cyan for chog
      molandak: 0xFF6600,   // Orange for molandak
      moyaki: 0xFF00FF, // Purple for moyaki
      keon: 0x666666  // Gray for keon
    };
    return colors[type] || 0xFFFFFF;
  }

  // Enhanced harvest method
  harvestCrop(crop, plotKey) {
    try {
      // Get crop object from storage
      const cropData = this.crops[plotKey];
      if (!cropData) return;
      
      // Calculate bonus based on growth time
      const growthTime = Date.now() - cropData.plantTime;
      const bonusMultiplier = growthTime >= 10000 ? 1.5 : 1.0; // Full growth bonus
      
      // Earn coins and score with bonus
      const coinsEarned = Math.floor(50 * bonusMultiplier);
      this.gameState.farmCoins += coinsEarned;
      this.gameState.score += 25;
      
      // Update UI
      this.updateFarmCoinsText();
      this.updateScoreText();
      
      // Get crop position for effects
      const cropX = cropData.crop.x;
      const cropY = cropData.crop.y;
      
      // Harvest animation
      const harvestEffect = this.add.circle(cropX, cropY, 40, 0xffff00, 0.5);
      harvestEffect.setDepth(12);
      this.tweens.add({
        targets: harvestEffect,
        scale: 2,
        alpha: 0,
        duration: 500,
        onComplete: () => harvestEffect.destroy()
      });
      
      // Show coins earned
      const coinText = this.uiStyle.createStyledText(cropX, cropY, `💰 +${coinsEarned} coins`, {
        fontSize: 24,
        fill: '#FFD700',
        stroke: '#8B4513',
        strokeThickness: 3,
        shadow: {
          offsetX: 2,
          offsetY: 2,
          color: '#000000',
          blur: 4,
          fill: true
        }
      }).setOrigin(0.5);
      coinText.setDepth(13);
      
      this.tweens.add({
        targets: coinText,
        y: cropY - 50,
        alpha: 0,
        duration: 1500,
        onComplete: () => coinText.destroy()
      });
      
      // Remove crop and its visual elements
      if (cropData.crop && cropData.crop.destroy) {
        cropData.crop.destroy();
      }
      if (cropData.indicator && cropData.indicator.active) {
        cropData.indicator.destroy();
      }
      
      // Clear from crops object
      delete this.crops[plotKey];
      
      // Play sound
      if (this.sounds?.harvestCrop) {
        this.sounds.harvestCrop.play();
      }
      
      console.log(`Harvested crop at ${plotKey}, earned ${coinsEarned} coins`);
      
    } catch (error) {
      console.error("Error harvesting crop:", error);
    }
  }
}

// Export the GameScene class
export default GameScene;