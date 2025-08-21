'use client';

import Phaser from 'phaser';
import ParticleEffects from '../utils/ParticleEffects.js';
import GraphicsSettings from '../utils/GraphicsSettings.js';
import PowerUpManager from '../utils/PowerUpManager.js';

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
    this.load.image('enemy_slime', '/logo/craftpix-net-459799-free-low-level-monsters-pixel-icons-32x32/PNG/Transperent/Icon1.png');
    this.load.image('enemy_goblin', '/logo/craftpix-net-459799-free-low-level-monsters-pixel-icons-32x32/PNG/Transperent/Icon5.png');
    this.load.image('enemy_orc', '/logo/craftpix-net-459799-free-low-level-monsters-pixel-icons-32x32/PNG/Transperent/Icon10.png');
    this.load.image('enemy_dragon', '/logo/craftpix-net-459799-free-low-level-monsters-pixel-icons-32x32/PNG/Transperent/Icon15.png');
    this.load.image('enemy_skeleton', '/logo/craftpix-net-459799-free-low-level-monsters-pixel-icons-32x32/PNG/Transperent/Icon20.png');
    this.load.image('enemy_demon', '/logo/craftpix-net-459799-free-low-level-monsters-pixel-icons-32x32/PNG/Transperent/Icon25.png');
    
    // Load defender sprites
    this.load.image('abster_attack', '/characters/abster attacks.png');
    this.load.image('abster_idle', '/characters/abster idle.png');
    this.load.image('noot_attack', '/characters/noot attack.png');
    this.load.image('noot_idle', '/characters/noot idle.png');
    this.load.image('wizard_attack', '/characters/wizard attack.png');
    this.load.image('wizard_idle', '/characters/wizard idle.png');
    this.load.image('cannon_attack', '/characters/cannon attack.png');
    this.load.image('cannon_idle', '/characters/cannon idle.png');
    
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
    
    // Load plant sprites for crops
    this.load.image('plant1_idle', '/logo/craftpix-net-922184-free-predator-plant-mobs-pixel-art-pack/PNG/Plant1/Idle/Plant1_Idle_head.png');
    this.load.image('plant2_idle', '/logo/craftpix-net-922184-free-predator-plant-mobs-pixel-art-pack/PNG/Plant2/Idle/Plant2_Idle_head.png');
    this.load.image('plant3_idle', '/logo/craftpix-net-922184-free-predator-plant-mobs-pixel-art-pack/PNG/Plant3/Idle/Plant3_Idle_head.png');
    
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
      this.fpsText = this.add.text(10, 10, 'FPS: 0', {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#00FF00'
      }).setDepth(1000).setScrollFactor(0);
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
  
  // Update defenses to fire at enemies
  updateDefenses() {
    if (!this.defenses || this.defenses.length === 0) return;
    
    const currentTime = Date.now();
    
    this.defenses.forEach(defense => {
      if (!defense || !defense.active) return;
      
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
  
  // Fire defense projectile at enemy
  fireDefenseAt(defense, enemy) {
    try {
      // Create projectile based on defense type
      let projectileColor = 0xFFFF00;
      let projectileSize = 8;
      
      switch(defense.defenseType) {
        case 'abster':
          projectileColor = 0x00FFFF;
          projectileSize = 10;
          break;
        case 'noot':
          projectileColor = 0xFF6600;
          projectileSize = 10;
          break;
        case 'wizard':
          projectileColor = 0xFF00FF;
          projectileSize = 12;
          break;
        case 'cannon':
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
          
          // Damage enemy
          if (enemy && enemy.active) {
            enemy.health -= defense.damage;
            
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
      this.subtitle = this.add.text(0, 220, "Defend Your Farm • Endless Adventure", {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);
      this.menuContainer.add(this.subtitle);
      
      // Add version info
      this.versionText = this.add.text(350, 280, "v2.0", {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#888888'
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
      
      // Initialize game state
      this.gameState = {
        isActive: true,
        isPaused: false,
        wave: 1,
        score: 0,
        lives: 3,
        farmCoins: 120,
        clickDamage: 0.5,
        canPlant: true,
        autoWave: true
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
      this.loadingText = this.add.text(0, 50, 'Preparing your adventure...', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
        shadow: {
          offsetX: 1,
          offsetY: 1,
          color: '#000000',
          blur: 2
        }
      }).setOrigin(0.5);
      this.loadingContainer.add(this.loadingText);
      
      // Loading tip with icon
      const tipIcon = this.add.text(-180, 100, '💡', { fontSize: '24px' }).setOrigin(0.5);
      this.loadingContainer.add(tipIcon);
      
      this.loadingTip = this.add.text(-150, 100, 'TIP: Right-click enemies to attack them!', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: '#aaffff',
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
      this.gameState.enemyPaths = [
        // Path 1 (top) - Start from right edge of screen
        [
          { x: 1920, y: 200 },  // Start at right edge
          { x: 1700, y: 210 },
          { x: 1400, y: 220 },
          { x: 1100, y: 230 },
          { x: 800, y: 240 },
          { x: 500, y: 250 },
          { x: 200, y: 260 },
          { x: -50, y: 270 }    // Exit at left edge
        ],
        // Path 2 (middle) - Start from right edge
        [
          { x: 1920, y: 400 },  // Start at right edge
          { x: 1700, y: 400 },
          { x: 1400, y: 400 },
          { x: 1100, y: 400 },
          { x: 800, y: 400 },
          { x: 500, y: 400 },
          { x: 200, y: 400 },
          { x: -50, y: 400 }    // Exit at left edge
        ],
        // Path 3 (bottom) - Start from right edge
        [
          { x: 1920, y: 600 },  // Start at right edge
          { x: 1700, y: 590 },
          { x: 1400, y: 580 },
          { x: 1100, y: 570 },
          { x: 800, y: 560 },
          { x: 500, y: 550 },
          { x: 200, y: 540 },
          { x: -50, y: 530 }    // Exit at left edge
        ]
      ];
      
      console.log("Background created successfully");
    } catch (error) {
      console.error("Error creating background:", error);
      throw error;
    }
  }

  // Setup input handling with resolution synchronization
  setupInputHandling() {
    try {
      // Disable browser context menu on right-click
      this.input.mouse.disableContextMenu();
      
      // General click handler for attacks with both left and right click support
      this.input.on('pointerdown', (pointer) => {
        console.log(`Click at: ${pointer.x}, ${pointer.y}. Toolbar top: ${this.cameras.main.height - 115}`);
        // Ignore clicks on the toolbar area
        if (pointer.y > this.cameras.main.height - 115) {
            console.log("Click on toolbar ignored");
            return;
        }
        
        // Get world coordinates accounting for camera, scale, and resolution settings
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        
        // Apply resolution scaling factor for accurate targeting
        const resolutionScale = this.scale.displayScale;
        const adjustedWorldPoint = {
          x: worldPoint.x / resolutionScale.x,
          y: worldPoint.y / resolutionScale.y
        };
        
        console.log(`Resolution scale: ${resolutionScale.x}, ${resolutionScale.y}`);
        console.log(`Adjusted world coords: ${adjustedWorldPoint.x}, ${adjustedWorldPoint.y}`);
        
        if (pointer.rightButtonDown()) {
          // Right-click for double damage on enemies
          console.log('Right-click detected at adjusted world coords:', adjustedWorldPoint.x, adjustedWorldPoint.y);
          // Double the click damage temporarily for right-click
          const originalDamage = this.gameState.clickDamage;
          this.gameState.clickDamage *= 2;
          this.handleClick(adjustedWorldPoint.x, adjustedWorldPoint.y);
          this.gameState.clickDamage = originalDamage;
        } else {
          // Normal left-click
          this.handleClick(adjustedWorldPoint.x, adjustedWorldPoint.y);
        }
      });
      
      // Add keyboard shortcuts
      this.input.keyboard.on('keydown-P', () => {
        this.setToolMode('plant');
      });
      
      this.input.keyboard.on('keydown-ONE', () => {
        this.setToolMode('abster');
      });
      
      this.input.keyboard.on('keydown-TWO', () => {
        this.setToolMode('noot');
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
      
      // Score text
      this.scoreText = this.add.text(padding, padding, "Score: 0", {
        fontFamily: 'Arial',
        fontSize: '32px',
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 3
      });
      
      // Farm coins text
      this.farmCoinsText = this.add.text(padding, padding + spacing, "Farm Coins: 120", {
        fontFamily: 'Arial',
        fontSize: '32px',
        color: '#FFFF00',
        stroke: '#000000',
        strokeThickness: 3
      });
      
      // Wave text
      this.waveText = this.add.text(padding, padding + spacing * 2, "Wave: 1", {
        fontFamily: 'Arial',
        fontSize: '32px',
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 3
      });
      
      // Lives text
      this.livesText = this.add.text(padding, padding + spacing * 3, "Lives: 3", {
        fontFamily: 'Arial',
        fontSize: '32px',
        color: '#FF0000',
        stroke: '#000000',
        strokeThickness: 3
      });
      
      // Mana text
      this.manaText = this.add.text(padding, padding + spacing * 4, `Mana: ${this.gameState.mana}/${this.gameState.maxMana}`, {
        fontFamily: 'Arial',
        fontSize: '32px',
        color: '#00AAFF',
        stroke: '#000000',
        strokeThickness: 3
      });
      
      // Create mana bar background
      this.manaBarBg = this.add.rectangle(padding + 100, padding + spacing * 4 + 25, 200, 15, 0x000000, 0.5);
      this.manaBarBg.setOrigin(0, 0.5);
      
      // Create mana bar fill
      this.manaBarFill = this.add.rectangle(padding + 100, padding + spacing * 4 + 25, 200 * (this.gameState.mana / this.gameState.maxMana), 15, 0x00AAFF, 1);
      this.manaBarFill.setOrigin(0, 0.5);
      
      // Instructions
      this.add.text(padding, this.cameras.main.height - 120, "Click farm plots to plant crops", {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#FFFFFF'
      });
      
      this.add.text(padding, this.cameras.main.height - 90, "Click enemies to attack them", {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#FFFFFF'
      });
      
      this.add.text(padding, this.cameras.main.height - 60, "Defend your farm from waves of enemies!", {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#FFFFFF'
      });
      
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
      
      console.log(`Starting wave ${this.gameState.wave} with ${this.totalEnemiesInWave} enemies`);
      
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
        { sprite: 'enemy_slime', health: 2, speed: 50, value: 10, name: 'slime', scale: 2.0 },
        { sprite: 'enemy_goblin', health: 3, speed: 60, value: 15, name: 'goblin', scale: 2.0 },
        { sprite: 'enemy_orc', health: 4, speed: 40, value: 20, name: 'orc', scale: 2.2 },
        { sprite: 'enemy_dragon', health: 6, speed: 30, value: 30, name: 'dragon', scale: 2.5 },
        { sprite: 'enemy_skeleton', health: 5, speed: 45, value: 25, name: 'skeleton', scale: 2.0 },
        { sprite: 'enemy_demon', health: 8, speed: 25, value: 40, name: 'demon', scale: 2.8 }
      ];
      
      // Choose enemy type based on wave
      let enemyType;
      if (this.gameState.wave >= 8 && Math.random() < 0.15) {
        enemyType = enemyTypes[5]; // Demon (Ultimate Boss)
      } else if (this.gameState.wave >= 6 && Math.random() < 0.2) {
        enemyType = enemyTypes[4]; // Skeleton
      } else if (this.gameState.wave >= 4 && Math.random() < 0.25) {
        enemyType = enemyTypes[3]; // Dragon (Boss)
      } else if (this.gameState.wave >= 3 && Math.random() < 0.3) {
        enemyType = enemyTypes[2]; // Orc
      } else if (this.gameState.wave >= 2 && Math.random() < 0.4) {
        enemyType = enemyTypes[1]; // Goblin
      } else {
        enemyType = enemyTypes[0]; // Slime
      }
      
      // Choose random path from available paths
      const pathIndex = Math.floor(Math.random() * this.gameState.enemyPaths.length);
      const selectedPath = this.gameState.enemyPaths[pathIndex];
      
      // Create enemy sprite using loaded image
      const startPoint = selectedPath[0];
      const enemy = this.add.image(startPoint.x, startPoint.y, enemyType.sprite);
      enemy.setScale(enemyType.scale);
      enemy.setFlipX(true); // Flip enemy sprites to face left (they're moving left)
      enemy.setInteractive({ useHandCursor: true });
      enemy.setDepth(12); // Set proper depth for enemies
      
      // Enemy properties
      enemy.health = enemyType.health + Math.floor(this.gameState.wave / 3);
      enemy.maxHealth = enemy.health;
      enemy.speed = enemyType.speed;
      enemy.value = enemyType.value;
      enemy.type = enemyType.name;
      enemy.pathIndex = pathIndex;
      enemy.currentPointIndex = 0;
      
      // Health bar
      enemy.healthBar = this.add.graphics();
      enemy.healthBar.fillStyle(0xFF0000);
      enemy.healthBar.fillRect(0, 0, 40, 6);
      enemy.healthBar.x = enemy.x - 20;
      enemy.healthBar.y = enemy.y - 35;
      enemy.healthBar.setDepth(13); // Health bar above enemy
      
      // Click to attack (both left and right click)
      enemy.on('pointerdown', (pointer) => {
        // Always allow attack on right-click regardless of current tool mode
        if (pointer.rightButtonDown() || this.toolMode === 'attack') {
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

      console.log(`Handling click at world coordinates: ${worldX}, ${worldY}`);
      
      // Check if click is on toolbar area to prevent accidental placement
      // Convert toolbar position to world coordinates for consistent comparison
      const toolbarY = this.cameras.main.height - 80;
      const toolbarHeight = 100; // Approximate toolbar height including buttons
      const worldToolbarY = this.cameras.main.getWorldPoint(0, toolbarY).y;
      
      if (worldY > worldToolbarY - toolbarHeight/2) {
        console.log("Click detected on toolbar area - ignoring placement");
        return; // Ignore clicks on toolbar area
      }
      
      // Create click effect at world coordinates using object pooling
      this.createClickEffect(worldX, worldY);
      
      // Handle different tool modes with world coordinates
      switch (this.toolMode) {
        case 'attack':
          // Check if we hit any enemies with larger hit area for easier clicking
          this.enemies.forEach(enemy => {
            if (!enemy.active) return;
            const distance = Phaser.Math.Distance.Between(worldX, worldY, enemy.x, enemy.y);
            // Scale hit area based on resolution for consistent experience
            const hitAreaSize = 80 * (this.scale.displayScale.x + this.scale.displayScale.y) / 2;
            if (distance < hitAreaSize) {
              this.attackEnemy(enemy);
            }
          });
          break;
          
        case 'plant':
          this.handlePlantPlacement(worldX, worldY);
          break;
          
        case 'abster':
        case 'noot':
        case 'wizard':
        case 'cannon':
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
      
      // Visual feedback
      this.tweens.add({
        targets: enemy,
        scaleX: 1.3,
        scaleY: 1.3,
        duration: 100,
        yoyo: true
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
      
      // Remove enemy
      enemy.destroy();
      if (enemy.healthBar) enemy.healthBar.destroy();
      
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

      // Special celebration for milestone waves (every 5 waves)
      const isMilestoneWave = completedWave % 5 === 0;
      if (isMilestoneWave) {
        this.changeBackground();
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

  // Change background color
  changeBackground() {
    const newTintColor = Phaser.Math.RND.integerInRange(0x000000, 0x666666); // Darker colors
    this.cameras.main.setBackgroundColor(newTintColor);
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
      
      const gameOverText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 - 50, 'GAME OVER', {
        fontFamily: 'Arial Black',
        fontSize: '64px',
        color: '#FF0000',
        stroke: '#000000',
        strokeThickness: 6
      }).setOrigin(0.5).setDepth(5000); // Very high depth for game over UI
      
      const finalScoreText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 + 20, `Final Score: ${this.gameState.score}`, {
        fontFamily: 'Arial',
        fontSize: '32px',
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5).setDepth(5000);
      
      const waveReachedText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 + 60, `Waves Survived: ${this.gameState.wave - 1}`, {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#FFFF00',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5).setDepth(5000);
      
      // New high score notification
      if (this.gameState.score > currentHighScore) {
        const newHighScoreText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 + 100, 'NEW HIGH SCORE!', {
          fontFamily: 'Arial Black',
          fontSize: '28px',
          color: '#00FF00',
          stroke: '#000000',
          strokeThickness: 3
        }).setOrigin(0.5).setDepth(5000);
        
        // Glow effect
        this.tweens.add({
          targets: newHighScoreText,
          alpha: 0.5,
          duration: 500,
          yoyo: true,
          repeat: -1
        });
      }
      
      // Create semi-transparent background for game over screen
      const gameOverBg = this.add.rectangle(this.cameras.main.width / 2, this.cameras.main.height / 2, 
        this.cameras.main.width, this.cameras.main.height, 0x000000, 0.8);
      gameOverBg.setDepth(4999);
      
      // Buttons
      const playAgainButton = this.add.rectangle(this.cameras.main.width / 2 - 120, this.cameras.main.height / 2 + 150, 200, 50, 0x00AA00, 0.9);
      playAgainButton.setStrokeStyle(3, 0xffffff);
      playAgainButton.setInteractive({ useHandCursor: true });
      playAgainButton.on('pointerdown', () => this.restartGame());
      playAgainButton.setDepth(5000);
      
      const playAgainText = this.add.text(this.cameras.main.width / 2 - 120, this.cameras.main.height / 2 + 150, 'PLAY AGAIN', {
        fontFamily: 'Arial Black',
        fontSize: '18px',
        color: '#ffffff'
      }).setOrigin(0.5).setDepth(5001);
      
      // Return to menu button
      const menuButton = this.add.rectangle(this.cameras.main.width / 2 + 120, this.cameras.main.height / 2 + 150, 200, 50, 0xff8800, 0.9);
      menuButton.setStrokeStyle(3, 0xffffff);
      menuButton.setInteractive({ useHandCursor: true });
      menuButton.on('pointerdown', () => this.returnToMainMenu());
      menuButton.setDepth(5000);
      
      const menuText = this.add.text(this.cameras.main.width / 2 + 120, this.cameras.main.height / 2 + 150, 'MAIN MENU', {
        fontFamily: 'Arial Black',
        fontSize: '18px',
        color: '#ffffff'
      }).setOrigin(0.5).setDepth(5001);
      
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
      const settingsBg = this.add.rectangle(0, 0, 600, 500, 0x000000, 0.9);
      settingsBg.setStrokeStyle(4, 0x00ffff);
      this.settingsContainer.add(settingsBg);
      
      // Settings title
      const settingsTitle = this.add.text(0, -200, 'SETTINGS', {
        fontFamily: 'Arial Black',
        fontSize: '36px',
        color: '#00ffff',
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5);
      this.settingsContainer.add(settingsTitle);
      
      // Back button container
      const backButtonContainer = this.add.container(0, 180);
      
      // Back button background
      const backButton = this.add.rectangle(0, 0, 200, 50, 0xff0000, 0.9);
      backButton.setStrokeStyle(3, 0xffffff);
      backButton.setInteractive({ useHandCursor: true });
      backButton.on('pointerdown', () => this.showMainMenu());
      
      // Back button text
      const backText = this.add.text(0, 0, 'BACK', {
        fontFamily: 'Arial Black',
        fontSize: '20px',
        color: '#ffffff'
      }).setOrigin(0.5);
      
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
      const creditsBg = this.add.rectangle(0, 0, 600, 500, 0x000000, 0.9);
      creditsBg.setStrokeStyle(4, 0xff00ff);
      this.creditsContainer.add(creditsBg);
      
      // Credits title
      const creditsTitle = this.add.text(0, -200, 'CREDITS', {
        fontFamily: 'Arial Black',
        fontSize: '36px',
        color: '#ff00ff',
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5);
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
        const text = this.add.text(0, -120 + (index * 30), line, {
          fontFamily: 'Arial',
          fontSize: '18px',
          color: index === 0 || index === 3 ? '#ffff00' : '#ffffff'
        }).setOrigin(0.5);
        this.creditsContainer.add(text);
      });
      
      // Back button container
      const backButtonContainer = this.add.container(0, 180);
      
      // Back button background
      const backButton = this.add.rectangle(0, 0, 200, 50, 0xff0000, 0.9);
      backButton.setStrokeStyle(3, 0xffffff);
      backButton.setInteractive({ useHandCursor: true });
      backButton.on('pointerdown', () => this.showMainMenu());
      
      // Back button text
      const backText = this.add.text(0, 0, 'BACK', {
        fontFamily: 'Arial Black',
        fontSize: '20px',
        color: '#ffffff'
      }).setOrigin(0.5);
      
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
      const leaderboardBg = this.add.rectangle(0, 0, 600, 500, 0x000000, 0.9);
      leaderboardBg.setStrokeStyle(4, 0xff8800);
      this.leaderboardContainer.add(leaderboardBg);
      
      // Leaderboard title
      const leaderboardTitle = this.add.text(0, -200, 'LEADERBOARD', {
        fontFamily: 'Arial Black',
        fontSize: '36px',
        color: '#ff8800',
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5);
      this.leaderboardContainer.add(leaderboardTitle);
      
      // Load and display high scores
      this.displayLeaderboard();
      
      // Back button container
      const backButtonContainer = this.add.container(0, 180);
      
      // Back button background
      const backButton = this.add.rectangle(0, 0, 200, 50, 0xff0000, 0.9);
      backButton.setStrokeStyle(3, 0xffffff);
      backButton.setInteractive({ useHandCursor: true });
      backButton.on('pointerdown', () => this.showMainMenu());
      
      // Back button text
      const backText = this.add.text(0, 0, 'BACK', {
        fontFamily: 'Arial Black',
        fontSize: '20px',
        color: '#ffffff'
      }).setOrigin(0.5);
      
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
      const pauseBg = this.add.rectangle(0, 0, 400, 300, 0x000000, 0.9);
      pauseBg.setStrokeStyle(4, 0xffff00);
      this.pauseContainer.add(pauseBg);
      
      // Pause title
      const pauseTitle = this.add.text(0, -100, 'PAUSED', {
        fontFamily: 'Arial Black',
        fontSize: '32px',
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5);
      this.pauseContainer.add(pauseTitle);
      
      // Resume button container
      const resumeButtonContainer = this.add.container(0, -20);
      
      // Resume button background
      const resumeButton = this.add.rectangle(0, 0, 200, 50, 0x00ff00, 0.9);
      resumeButton.setStrokeStyle(3, 0xffffff);
      resumeButton.setInteractive({ useHandCursor: true });
      resumeButton.on('pointerdown', () => this.resumeGame());
      
      // Resume button text
      const resumeText = this.add.text(0, 0, 'RESUME', {
        fontFamily: 'Arial Black',
        fontSize: '20px',
        color: '#ffffff'
      }).setOrigin(0.5);
      
      resumeButtonContainer.add([resumeButton, resumeText]);
      this.pauseContainer.add(resumeButtonContainer);
      
      // Return to menu button container
      const menuButtonContainer = this.add.container(0, 50);
      
      // Return to menu button background
      const menuButton = this.add.rectangle(0, 0, 200, 50, 0xff8800, 0.9);
      menuButton.setStrokeStyle(3, 0xffffff);
      menuButton.setInteractive({ useHandCursor: true });
      menuButton.on('pointerdown', () => this.returnToMainMenu());
      
      // Return to menu button text
      const menuText = this.add.text(0, 0, 'MAIN MENU', {
        fontFamily: 'Arial Black',
        fontSize: '20px',
        color: '#ffffff'
      }).setOrigin(0.5);
      
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
          key: 'abster',
          x: startX + buttonSpacing * 2,
          color: 0x3366ff,
          glowColor: 0x6699ff,
          icon: '🧙‍♂️',
          label: 'Ice Mage',
          sprite: 'abster_idle',
          action: () => {
            this.pendingDefenseType = 'abster';
            this.pendingDefensePlacement = true;
            this.setToolMode('abster');
            // Clear any auto-placement to prevent placing defense on toolbar
            this.input.setDefaultCursor('url(assets/cursors/tower.cur), pointer');
          }
        },
        {
          key: 'noot',
          x: startX + buttonSpacing * 3,
          color: 0xff6633,
          glowColor: 0xff9966,
          icon: '🔥',
          label: 'Fire Mage',
          sprite: 'noot_idle',
          action: () => {
            this.pendingDefenseType = 'noot';
            this.pendingDefensePlacement = true;
            this.setToolMode('noot');
            // Clear any auto-placement to prevent placing defense on toolbar
            this.input.setDefaultCursor('url(assets/cursors/tower.cur), pointer');
          }
        },
        {
          key: 'wizard',
          x: startX + buttonSpacing * 4,
          color: 0x9933ff,
          glowColor: 0xbb66ff,
          icon: '✨',
          label: 'Wizard',
          sprite: 'wizard_idle',
          action: () => {
            this.pendingDefenseType = 'wizard';
            this.pendingDefensePlacement = true;
            this.setToolMode('wizard');
            // Clear any auto-placement to prevent placing defense on toolbar
            this.input.setDefaultCursor('url(assets/cursors/tower.cur), pointer');
          }
        },
        {
          key: 'cannon',
          x: startX + buttonSpacing * 5,
          color: 0xdd3333,
          glowColor: 0xff6666,
          icon: '💥',
          label: 'Cannon',
          sprite: 'cannon_idle',
          action: () => {
            this.pendingDefenseType = 'cannon';
            this.pendingDefensePlacement = true;
            this.setToolMode('cannon');
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
      
      // Add modern hover effects
      buttonContainer.on('pointerover', () => {
        this.tweens.add({
          targets: buttonContainer,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 200,
          ease: 'Back.easeOut'
        });
        
        this.tweens.add({
          targets: buttonGlow,
          alpha: 0.4,
          duration: 200
        });
      });
      
      buttonContainer.on('pointerout', () => {
        const isSelected = this.toolMode === key;
        this.tweens.add({
          targets: buttonContainer,
          scaleX: isSelected ? 1.05 : 1,
          scaleY: isSelected ? 1.05 : 1,
          duration: 200,
          ease: 'Back.easeOut'
        });
        
        if (!isSelected) {
          this.tweens.add({
            targets: buttonGlow,
            alpha: 0,
            duration: 200
          });
        }
      });
      
      // Click animation and action
      buttonContainer.on('pointerdown', (pointer, localX, localY, event) => {
        event.stopPropagation();
        // Satisfying click animation
        this.tweens.add({
          targets: buttonContainer,
          scaleX: 0.95,
          scaleY: 0.95,
          duration: 100,
          ease: 'Power2',
          yoyo: true,
          onComplete: () => {
            // Execute button action
            action();
            
            // Ripple effect
            const ripple = this.add.graphics();
            ripple.lineStyle(3, glowColor, 1);
            ripple.strokeCircle(x, 0, config.radius);
            this.toolbarContainer.add(ripple);
            
            this.tweens.add({
              targets: ripple,
              scaleX: 2,
              scaleY: 2,
              alpha: 0,
              duration: 400,
              ease: 'Power2',
              onComplete: () => ripple.destroy()
            });
          }
        });
      });
      
    } catch (error) {
      console.error("Error creating modern button:", error);
    }
  }
  
  // Set tool mode with modern visual feedback
  setToolMode(mode) {
    try {
      this.toolMode = mode;
      
      // Update button visual states for the modern system
      Object.keys(this.toolbarButtons).forEach(key => {
        const button = this.toolbarButtons[key];
        if (key === mode) {
          // Selected state - show glow and scale up
          this.tweens.add({
            targets: button.container,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 200,
            ease: 'Back.easeOut'
          });
          
          this.tweens.add({
            targets: button.glow,
            alpha: 0.6,
            duration: 200
          });
          
          // Update background color to be brighter
          button.background.clear();
          button.background.fillStyle(button.originalColor, 0.9);
          button.background.fillCircle(0, 0, 32);
          button.background.lineStyle(3, 0x00ff00, 0.8);
          button.background.strokeCircle(0, 0, 32);
        } else {
          // Unselected state - normal appearance
          this.tweens.add({
            targets: button.container,
            scaleX: 1,
            scaleY: 1,
            duration: 200,
            ease: 'Back.easeOut'
          });
          
          this.tweens.add({
            targets: button.glow,
            alpha: 0,
            duration: 200
          });
          
          // Reset background to normal
          button.background.clear();
          button.background.fillStyle(button.originalColor, 0.7);
          button.background.fillCircle(0, 0, 32);
          button.background.lineStyle(2, 0xffffff, 0.3);
          button.background.strokeCircle(0, 0, 32);
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
      
      // Create crop visual with STATIC PNG sprite (no GIF, no animation)
      const plantSprites = ['plant1_idle', 'plant2_idle', 'plant3_idle'];
      const selectedSprite = plantSprites[Math.floor(Math.random() * plantSprites.length)];
      
      // Create static image sprite
      const crop = this.add.image(gridX, gridY, selectedSprite);
      crop.setScale(1.5); // Fixed scale, smaller to prevent overlap
      crop.setDepth(10);
      crop.setInteractive(); // Make clickable for manual harvest
      
      // Add green placement indicator
      const placementIndicator = this.add.circle(gridX, gridY, this.gridCellSize/2, 0x00ff00, 0.2);
      placementIndicator.setDepth(9);
      
      // Simple one-time placement effect
      crop.setScale(0.1);
      crop.setAlpha(0);
      this.tweens.add({
        targets: crop,
        scaleX: 1.5,
        scaleY: 1.5,
        alpha: 1,
        duration: 500,
        ease: 'Back.easeOut',
        onComplete: () => {
          // Lock the scale and ensure no further animations
          crop.setScale(1.5);
          crop.setAlpha(1);
        }
      });
      
      // Fade in placement indicator
      this.tweens.add({
        targets: placementIndicator,
        alpha: 0.4,
        duration: 300
      });
      
      // Growth timer visual
      const timerBar = this.add.rectangle(gridX, gridY + 40, 40, 4, 0x00ff00);
      timerBar.setDepth(11);
      
      // Animate growth timer
      this.tweens.add({
        targets: timerBar,
        scaleX: 0,
        duration: 10000,
        ease: 'Linear'
      });
      
      // Auto harvest after 10 seconds
      this.time.delayedCall(10000, () => {
        if (crop && crop.active) {
          this.harvestCrop(crop, plotKey);
          placementIndicator.destroy();
          timerBar.destroy();
        }
      });
      
      // Manual harvest on click
      crop.on('pointerdown', () => {
        // Check if crop is ready (optional - could add growth stages)
        this.harvestCrop(crop, plotKey);
        placementIndicator.destroy();
        timerBar.destroy();
      });
      
      // Store crop reference with metadata
      this.crops[plotKey] = {
        sprite: crop,
        indicator: placementIndicator,
        timer: timerBar,
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
    const errorText = this.add.text(x, y - 20, message, {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ff0000',
      stroke: '#000000',
      strokeThickness: 2
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
    const successText = this.add.text(x, y - 20, '✓ Planted!', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#00ff00',
      stroke: '#000000',
      strokeThickness: 2
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
      
      // Defense costs
      const defenseCosts = {
        abster: 50,
        noot: 60, 
        wizard: 75,
        cannon: 100
      };
      
      const cost = defenseCosts[defenseType] || 50;
      
      // Check if player has enough coins
      if (this.gameState.farmCoins < cost) {
        console.log(`Not enough coins for ${defenseType} (need ${cost})`);
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
      
      // Deduct coins
      this.gameState.farmCoins -= cost;
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
    const damages = { abster: 1, noot: 1.5, wizard: 2, cannon: 3 };
    const baseDamage = damages[type] || 1;
    // Apply damage multiplier from power-ups if available
    return baseDamage * (this.powerUpManager ? this.powerUpManager.getEffectMultiplier('damage') : 1);
  }
  
  getDefenseRange(type) {
    const ranges = { abster: 200, noot: 180, wizard: 250, cannon: 150 }; // Increased ranges
    const baseRange = ranges[type] || 150;
    // Apply range multiplier from power-ups if available
    return baseRange * (this.powerUpManager ? this.powerUpManager.getEffectMultiplier('range') : 1);
  }
  
  // Get defense fire rate with speed multiplier from power-ups
  getDefenseFireRate(type) {
    const fireRates = { abster: 1000, noot: 800, wizard: 1200, cannon: 2000 };
    const baseFireRate = fireRates[type] || 1000;
    // Apply speed multiplier from power-ups if available (lower fire rate = faster firing)
    return baseFireRate / (this.powerUpManager ? this.powerUpManager.getEffectMultiplier('speed') : 1);
  }
  
  // Get defense range indicator color based on type
  getDefenseRangeColor(type) {
    const colors = {
      abster: 0x00FFFF, // Cyan for ice mage
      noot: 0xFF6600,   // Orange for fire mage
      wizard: 0xFF00FF, // Purple for wizard
      cannon: 0x666666  // Gray for cannon
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
      
      // Harvest animation
      const harvestEffect = this.add.circle(cropData.sprite.x, cropData.sprite.y, 40, 0xffff00, 0.5);
      harvestEffect.setDepth(12);
      this.tweens.add({
        targets: harvestEffect,
        scale: 2,
        alpha: 0,
        duration: 500,
        onComplete: () => harvestEffect.destroy()
      });
      
      // Show coins earned
      const coinText = this.add.text(cropData.sprite.x, cropData.sprite.y, `+${coinsEarned} coins`, {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);
      coinText.setDepth(13);
      
      this.tweens.add({
        targets: coinText,
        y: cropData.sprite.y - 50,
        alpha: 0,
        duration: 1500,
        onComplete: () => coinText.destroy()
      });
      
      // Remove crop and its visual elements
      if (cropData.sprite && cropData.sprite.active) {
        cropData.sprite.destroy();
      }
      if (cropData.indicator && cropData.indicator.active) {
        cropData.indicator.destroy();
      }
      if (cropData.timer && cropData.timer.active) {
        cropData.timer.destroy();
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
