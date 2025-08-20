'use client';

import Phaser from 'phaser';

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
      autoWave: true
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
      
      // Create game world
      this.createGameWorld();
      
      // Create game UI
      this.createGameUI();
      
      // Create toolbar
      this.createToolbar();
      
      // Start first wave
      this.startWave();
      
      console.log("Game started successfully");
      
    } catch (error) {
      console.error("Error starting game:", error);
    }
  }

  // Create loading screen
  createLoadingScreen() {
    try {
      const centerX = this.cameras.main.width / 2;
      const centerY = this.cameras.main.height / 2;
      
      this.loadingContainer = this.add.container(centerX, centerY);
      this.loadingContainer.setDepth(1004);
      this.loadingContainer.setVisible(false);
      
      // Loading background
      const loadingBg = this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.9);
      this.loadingContainer.add(loadingBg);
      
      // Loading title
      const loadingTitle = this.add.text(0, -100, 'LOADING...', {
        fontFamily: 'Arial Black',
        fontSize: '36px',
        color: '#00ffff',
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5);
      this.loadingContainer.add(loadingTitle);
      
      // Loading bar background
      const barBg = this.add.rectangle(0, 0, 400, 30, 0x333333, 1);
      barBg.setStrokeStyle(2, 0x00ffff);
      this.loadingContainer.add(barBg);
      
      // Loading bar fill
      this.loadingBar = this.add.rectangle(-200, 0, 0, 26, 0x00ffff, 1);
      this.loadingContainer.add(this.loadingBar);
      
      // Loading text
      this.loadingText = this.add.text(0, 50, 'Preparing your farm...', {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#ffffff'
      }).setOrigin(0.5);
      this.loadingContainer.add(this.loadingText);
      
      // Loading messages
      this.loadingMessages = [
        'Planting defenses...',
        'Spawning enemies...',
        'Setting up power-ups...',
        'Almost ready...',
        'Let the battle begin!'
      ];
      
    } catch (error) {
      console.error("Error creating loading screen:", error);
    }
  }

  // Show loading screen with progress
  showLoadingScreen() {
    try {
      this.loadingContainer.setVisible(true);
      this.loadingContainer.setScale(0);
      
      // Animate in
      this.tweens.add({
        targets: this.loadingContainer,
        scale: 1,
        duration: 500,
        ease: 'Back.easeOut'
      });
      
      // Simulate loading progress
      let progress = 0;
      const loadingInterval = setInterval(() => {
        progress += 20;
        this.loadingBar.width = (progress / 100) * 400;
        this.loadingBar.x = -200 + (this.loadingBar.width / 2);
        
        // Update loading message
        const messageIndex = Math.floor((progress / 100) * this.loadingMessages.length);
        if (messageIndex < this.loadingMessages.length) {
          this.loadingText.setText(this.loadingMessages[messageIndex]);
        }
        
        if (progress >= 100) {
          clearInterval(loadingInterval);
          
          // Hide loading screen and start game
          setTimeout(() => {
            this.tweens.add({
              targets: this.loadingContainer,
              scale: 0,
              alpha: 0,
              duration: 500,
              onComplete: () => {
                this.loadingContainer.setVisible(false);
                this.loadingContainer.setAlpha(1);
                this.loadingContainer.setScale(1);
                
                // Start the actual game
                this.initializeGame();
              }
            });
          }, 500);
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
      
      // Define enemy path from right to left with multiple lanes
      this.gameState.enemyPaths = [
        // Path 1 (top)
        [
          { x: 1200, y: 150 },
          { x: 900, y: 180 },
          { x: 600, y: 200 },
          { x: 400, y: 220 },
          { x: 200, y: 250 },
          { x: 50, y: 280 },
          { x: -50, y: 300 }
        ],
        // Path 2 (middle)
        [
          { x: 1200, y: 300 },
          { x: 950, y: 320 },
          { x: 700, y: 340 },
          { x: 500, y: 360 },
          { x: 300, y: 380 },
          { x: 100, y: 400 },
          { x: -50, y: 420 }
        ],
        // Path 3 (bottom)
        [
          { x: 1200, y: 500 },
          { x: 900, y: 480 },
          { x: 600, y: 460 },
          { x: 400, y: 440 },
          { x: 200, y: 420 },
          { x: 50, y: 400 },
          { x: -50, y: 380 }
        ]
      ];
      
      console.log("Background created successfully");
    } catch (error) {
      console.error("Error creating background:", error);
      throw error;
    }
  }

  // Setup input handling
  setupInputHandling() {
    try {
      // General click handler for attacks
      this.input.on('pointerdown', (pointer) => {
        this.handleClick(pointer.x, pointer.y);
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
      enemy.setInteractive({ useHandCursor: true });
      
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
      
      // Click to attack
      enemy.on('pointerdown', () => this.attackEnemy(enemy));
      
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


  // Handle general clicks based on tool mode
  handleClick(x, y) {
    try {
      if (!this.gameState.isActive) return;
      
      // Create click effect
      const clickEffect = this.add.circle(x, y, 20, 0xFFFFFF, 0.8);
      this.tweens.add({
        targets: clickEffect,
        scale: 2,
        alpha: 0,
        duration: 300,
        onComplete: () => clickEffect.destroy()
      });
      
      // Handle different tool modes
      switch (this.toolMode) {
        case 'attack':
          // Check if we hit any enemies
          this.enemies.forEach(enemy => {
            const distance = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
            if (distance < 50) {
              this.attackEnemy(enemy);
            }
          });
          break;
          
        case 'plant':
          this.handlePlantPlacement(x, y);
          break;
          
        case 'abster':
        case 'noot':
        case 'wizard':
        case 'cannon':
          this.handleDefensePlacement(x, y, this.toolMode);
          break;
      }
      
    } catch (error) {
      console.error("Error handling click:", error);
    }
  }

  // Attack enemy (enhanced)
  attackEnemy(enemy) {
    try {
      if (!enemy || !enemy.active) return;
      
      enemy.health -= this.gameState.clickDamage;
      
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
      this.gameState.wave++;
      
      console.log(`Wave ${this.gameState.wave - 1} complete! Starting wave ${this.gameState.wave}`);
      
      // Bonus score
      this.gameState.score += 50 * this.gameState.wave;
      this.updateScoreText();
      
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
        
        // Create projectile
        const projectile = this.add.circle(tower.x, tower.y, 5, 0xFFFF00, 1);
        projectile.setStrokeStyle(2, 0xFF0000);
        
        // Move projectile to target
        this.tweens.add({
          targets: projectile,
          x: target.x,
          y: target.y,
          duration: 500,
          onComplete: () => {
            projectile.destroy();
            
            // Damage enemy
            target.health -= tower.damage;
            
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

  // Game over (enhanced)
  gameOver() {
    try {
      this.gameState.isActive = false;
      
      // Play game over sound
      if (this.sounds?.gameOver) {
        this.sounds.gameOver.play();
      }
      
      // Save high score
      const currentHighScore = localStorage.getItem('mondefense_highscore') || 0;
      if (this.gameState.score > currentHighScore) {
        localStorage.setItem('mondefense_highscore', this.gameState.score);
      }
      
      const gameOverText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 - 50, 'GAME OVER', {
        fontFamily: 'Arial Black',
        fontSize: '64px',
        color: '#FF0000',
        stroke: '#000000',
        strokeThickness: 6
      }).setOrigin(0.5);
      
      const finalScoreText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 + 20, `Final Score: ${this.gameState.score}`, {
        fontFamily: 'Arial',
        fontSize: '32px',
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5);
      
      const waveReachedText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 + 60, `Waves Survived: ${this.gameState.wave - 1}`, {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#FFFF00',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);
      
      // New high score notification
      if (this.gameState.score > currentHighScore) {
        const newHighScoreText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 + 100, 'NEW HIGH SCORE!', {
          fontFamily: 'Arial Black',
          fontSize: '28px',
          color: '#00FF00',
          stroke: '#000000',
          strokeThickness: 3
        }).setOrigin(0.5);
        
        // Glow effect
        this.tweens.add({
          targets: newHighScoreText,
          alpha: 0.5,
          duration: 500,
          yoyo: true,
          repeat: -1
        });
      }
      
      // Buttons
      const playAgainButton = this.add.rectangle(this.cameras.main.width / 2 - 120, this.cameras.main.height / 2 + 150, 200, 50, 0x00AA00, 0.9);
      playAgainButton.setStrokeStyle(3, 0xffffff);
      playAgainButton.setInteractive({ useHandCursor: true });
      playAgainButton.on('pointerdown', () => this.restartGame());
      
      const playAgainText = this.add.text(this.cameras.main.width / 2 - 120, this.cameras.main.height / 2 + 150, 'PLAY AGAIN', {
        fontFamily: 'Arial Black',
        fontSize: '18px',
        color: '#ffffff'
      }).setOrigin(0.5);
      
      // Return to menu button
      const menuButton = this.add.rectangle(this.cameras.main.width / 2 + 120, this.cameras.main.height / 2 + 150, 200, 50, 0xff8800, 0.9);
      menuButton.setStrokeStyle(3, 0xffffff);
      menuButton.setInteractive({ useHandCursor: true });
      menuButton.on('pointerdown', () => this.returnToMainMenu());
      
      const menuText = this.add.text(this.cameras.main.width / 2 + 120, this.cameras.main.height / 2 + 150, 'MAIN MENU', {
        fontFamily: 'Arial Black',
        fontSize: '18px',
        color: '#ffffff'
      }).setOrigin(0.5);
      
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
      // Get high score from localStorage
      const highScore = parseInt(localStorage.getItem('mondefense_highscore') || '0');
      
      // Create score display
      const scoreText = this.add.text(0, -120, `High Score: ${highScore}`, {
        fontFamily: 'Arial Black',
        fontSize: '32px',
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);
      this.leaderboardContainer.add(scoreText);
      
      // Add achievement status
      const achievements = this.gameState?.achievements || {};
      let achievementCount = Object.values(achievements).filter(a => a).length;
      
      const achievementText = this.add.text(0, -60, `Achievements: ${achievementCount}/8`, {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#00ff00'
      }).setOrigin(0.5);
      this.leaderboardContainer.add(achievementText);
      
      // Add motivational text
      const motivationalText = this.add.text(0, 0, 'Keep playing to beat your high score!', {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'italic'
      }).setOrigin(0.5);
      this.leaderboardContainer.add(motivationalText);
      
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
      buttonContainer.on('pointerdown', () => {
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
        return;
      }
      
      // Check if player has enough coins
      if (this.gameState.farmCoins < 25) {
        console.log("Not enough coins to plant (need 25)");
        return;
      }
      
      // Snap to grid
      const gridX = Math.floor(x / this.gridCellSize) * this.gridCellSize + this.gridCellSize/2;
      const gridY = Math.floor(y / this.gridCellSize) * this.gridCellSize + this.gridCellSize/2;
      
      // Check if there's already something at this location
      const plotKey = `${gridX}_${gridY}`;
      if (this.crops[plotKey]) {
        console.log("Already a crop at this location");
        return;
      }
      
      // Deduct coins
      this.gameState.farmCoins -= 25;
      this.updateFarmCoinsText();
      
      // Create crop visual with real plant sprite
      const plantSprites = ['plant1_idle', 'plant2_idle', 'plant3_idle'];
      const randomPlant = plantSprites[Math.floor(Math.random() * plantSprites.length)];
      const crop = this.add.image(gridX, gridY, randomPlant);
      crop.setScale(1.5);
      crop.setDepth(10);
      
      // Add growth animation
      this.tweens.add({
        targets: crop,
        scaleX: 1.8,
        scaleY: 1.8,
        duration: 3000,
        yoyo: true,
        repeat: -1
      });
      
      // Auto harvest after 10 seconds
      this.time.delayedCall(10000, () => {
        if (crop && crop.active) {
          this.harvestCrop(crop, plotKey);
        }
      });
      
      // Store crop reference
      this.crops[plotKey] = crop;
      
      // Play sound
      if (this.sounds?.plantCrop) {
        this.sounds.plantCrop.play();
      }
      
      console.log(`Planted crop at ${gridX}, ${gridY}`);
      
    } catch (error) {
      console.error("Error handling plant placement:", error);
    }
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
      
      // Defense properties
      defense.defenseType = defenseType;
      defense.damage = this.getDefenseDamage(defenseType);
      defense.range = this.getDefenseRange(defenseType);
      defense.fireRate = this.getDefenseFireRate(defenseType);
      defense.lastFired = 0;
      
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
    return damages[type] || 1;
  }
  
  getDefenseRange(type) {
    const ranges = { abster: 120, noot: 100, wizard: 150, cannon: 80 };
    return ranges[type] || 100;
  }
  
  getDefenseFireRate(type) {
    const rates = { abster: 1000, noot: 800, wizard: 1200, cannon: 2000 };
    return rates[type] || 1000;
  }

  // Enhanced harvest method
  harvestCrop(crop, plotKey) {
    try {
      // Earn coins and score
      this.gameState.farmCoins += 50;
      this.gameState.score += 25;
      
      // Update UI
      this.updateFarmCoinsText();
      this.updateScoreText();
      
      // Remove crop
      if (crop && crop.active) {
        crop.destroy();
      }
      delete this.crops[plotKey];
      
      // Play sound
      if (this.sounds?.harvestCrop) {
        this.sounds.harvestCrop.play();
      }
      
      console.log(`Harvested crop at ${plotKey}`);
      
    } catch (error) {
      console.error("Error harvesting crop:", error);
    }
  }
}

// Export the GameScene class
export default GameScene;
