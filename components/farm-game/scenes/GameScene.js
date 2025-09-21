'use client';

// Import the SoundManager
import SoundManager from '../utils/SoundManager';
// Import the VolumeControls
import VolumeControls from '../utils/volume-controls.js';
// Import the Defense class
import Defense from '../entities/Defense.js';

// Set up a global flag to prevent recursive/overlapping updates
let isUpdating = false;

// Ensure we only run Phaser-specific code on the client
const isBrowser = typeof window !== 'undefined';

// Create a placeholder class for SSR
class PlaceholderScene {
  constructor() {
    this.type = 'placeholder';
  }

  // Placeholder methods that match the expected interface
  init() {}
  preload() {}
  create() {}
  update() {}
  
  // Add placeholder methods for all the methods that might be called
  startGame() {}
  endGame() {}
  cleanupCurrentGame() {}
  submitScore() {}
  
  // Placeholder for farm coins management
  updateFarmCoins() {}
  getFarmCoins() { return 0; }
  
  // Placeholder for crop management
  plantCrop() {}
  harvestCrop() {}
  
  // Placeholder for enemy management
  spawnEnemy() {}
  
  // Placeholder for defense management
  placeDefense() {}
  
  // Placeholder for sound management
  playSound() {}
  
  // Placeholder for UI management
  updateUI() {}
  
  // Placeholder for game state management
  pauseGame() {}
  resumeGame() {}
}

// Initialize GameScene as the placeholder for SSR

// Only load and initialize Phaser on the client
let GameScene = PlaceholderScene;

if (isBrowser) {
  // We're on the client side, so we can safely use Phaser
  import('phaser').then(module => {
    try {
      const Phaser = module.default;
      
      // Now define the real GameScene that extends Phaser.Scene
      class GameSceneClient extends Phaser.Scene {
        constructor() {
          super('GameScene');
          this.type = 'phaser-scene';
          
          // Explicitly declare Phaser.Scene properties for TypeScript
          /** @type {Phaser.GameObjects.GameObjectFactory} */
          this.add;
          /** @type {Phaser.Tweens.TweenManager} */
          this.tweens;
          /** @type {Phaser.Textures.TextureManager} */
          this.textures;
          /** @type {Phaser.Input.InputPlugin} */
          this.input;
          /** @type {Phaser.Sound.BaseSoundManager} */
          this.sound;
          /** @type {Phaser.Time.Clock} */
          this.time;
          /** @type {Phaser.Scenes.ScenePlugin} */
          this.scene;
          this.farmCoins = 0;
          this.addFarmCoinsCallback = null;
          this.crops = {};
          this.enemies = [];
          this.isSpawningEnemies = false;
          this.gameInitialized = false;
          this.initialClickProcessed = false;
          this.allowPlanting = false;
          this.waveTimer = null;
          this.waveInProgress = false;
          this.gameState = {
            isActive: false,
            wave: 1,
            score: 0,
            health: 100,
            maxHealth: 100
          };
          this.defenses = [];
          this.projectiles = [];
          this.particles = [];
          this.ui = {};
          this.soundManager = null;
          this.volumeControls = null;
          this.isSubmittingScore = false;
          this._countdownInProgress = false;
          this.currentWaveEnemyTypes = null;
          this.farmCoinsTargetPos = null;
        }

        init() {
          console.log("GameScene init called");
          
          // Initialize game state
          this.gameState = {
            isActive: false,
            wave: 1,
            score: 0,
            health: 100,
            maxHealth: 100
          };
          
          // Initialize arrays
          this.enemies = [];
          this.defenses = [];
          this.projectiles = [];
          this.particles = [];
          
          // Initialize flags
          this.isSpawningEnemies = false;
          this.gameInitialized = false;
          this.initialClickProcessed = false;
          this.allowPlanting = false;
          this.waveInProgress = false;
          this.isSubmittingScore = false;
          this._countdownInProgress = false;
          
          // Initialize timers
          this.waveTimer = null;
          
          // Initialize UI
          this.ui = {};
          
          // Initialize crops
          this.crops = {};
          
          // Initialize farm coins
          this.farmCoins = 0;
          this.addFarmCoinsCallback = null;
          
          // Initialize current wave enemy types
          this.currentWaveEnemyTypes = null;
          
          // Initialize farm coins target position
          this.farmCoinsTargetPos = null;
        }
        
        preload() {
          try {
            // GameScene preload started
            
            // Initialize the sound manager AND PRELOAD ITS ASSETS
            this.soundManager = new SoundManager(this);
            this.soundManager.preload();
            
            // Load tree/plant assets
            this.load.image('Fruit_tree3', '/characters/craftpix-net-385863-free-top-down-trees-pixel-art/PNG/Assets_separately/Trees_shadow/Fruit_tree3.png');
            this.load.image('Moss_tree3', '/characters/craftpix-net-385863-free-top-down-trees-pixel-art/PNG/Assets_separately/Trees_shadow/Moss_tree3.png');
            
            // Load fireball assets
            this.load.image('fireball', '/fireball.png');
            this.load.image('iceball', '/iceball.png');
            
            // Load coin asset
            this.load.image('coin', '/coin.png');
            
            // Load defense assets
            this.load.image('chog_idle', '/defense/chog_idle.png');
            this.load.image('keon_idle', '/defense/keon_idle.png');
            this.load.image('noot_idle', '/defense/noot idle.png');
            
            // Load enemy assets
            this.load.image('enemy1', '/characters/monad/monad.png');
            this.load.image('enemy2', '/characters/monad/monad.png');
            this.load.image('enemy3', '/characters/monad/monad.png');
            
            console.log("GameScene preload completed");
          } catch (error) {
            console.error("Error in GameScene preload:", error);
          }
        }

        create() {
          try {
            console.log("GameScene create called");
            
            // Create background
            this.createBackground();
            
            // Setup input handlers
            this.setupInputHandlers();
            
            // Create UI elements
            this.createUI();
            
            // Initialize volume controls
            this.volumeControls = new VolumeControls(this, this.soundManager);
            this.volumeControls.createUI();
            
            // Set farm coins target position for flying coin effect
            this.farmCoinsTargetPos = { x: 100, y: 50 };
            
            // Mark as initialized
            this.gameInitialized = true;
            
            console.log("GameScene create completed");
          } catch (error) {
            console.error("Error in GameScene create:", error);
          }
        }

        update() {
          try {
            if (!this.gameState?.isActive || isUpdating) {
              return;
            }
            
            isUpdating = true;
            
            // Update enemies
            if (this.enemies && Array.isArray(this.enemies)) {
              this.enemies.forEach(enemy => {
                if (enemy && typeof enemy.update === 'function') {
                  enemy.update();
                }
              });
            }
            
            // Update defenses
            if (this.defenses && Array.isArray(this.defenses)) {
              this.defenses.forEach(defense => {
                if (defense && typeof defense.update === 'function') {
                  defense.update();
                }
              });
            }
            
            // Update projectiles
            if (this.projectiles && Array.isArray(this.projectiles)) {
              this.projectiles.forEach(projectile => {
                if (projectile && typeof projectile.update === 'function') {
                  projectile.update();
                }
              });
            }
            
            // Process missed clicks
            if (typeof this.processMissedClicks === 'function') {
              this.processMissedClicks();
            }
            
            isUpdating = false;
          } catch (error) {
            console.error("Error in GameScene update:", error);
            isUpdating = false;
          }
        }

        createBackground() {
          // Create a simple background
          this.add.rectangle(400, 300, 800, 600, 0x228B22);
        }

        setupInputHandlers() {
          // Setup click handlers
          this.input.on('pointerdown', (pointer) => {
            this.handleClick(pointer.x, pointer.y);
          });
        }

        createUI() {
          // Create UI elements
          this.ui.farmCoinsText = this.add.text(16, 16, 'Farm Coins: 0', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff'
          });
          
          this.ui.waveText = this.add.text(16, 50, 'Wave: 1', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ffffff'
          });
          
          this.ui.healthText = this.add.text(16, 80, 'Health: 100', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ffffff'
          });
          
          this.ui.scoreText = this.add.text(16, 110, 'Score: 0', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ffffff'
          });
        }

        handleClick(x, y) {
          console.log(`Click at ${x}, ${y}`);
          // Handle click logic here
        }

        startGame() {
          try {
            console.log("Starting game...");
            
            this.gameState.isActive = true;
            this.gameState.wave = 1;
            this.gameState.score = 0;
            this.gameState.health = 100;
            
            // Start first wave
            this.startWave();
            
            console.log("Game started successfully");
          } catch (error) {
            console.error("Error starting game:", error);
          }
        }

        startWave() {
          try {
            console.log(`Starting wave ${this.gameState.wave}`);
            
            this.waveInProgress = true;
            
            // Calculate enemy types for this wave
            this.currentWaveEnemyTypes = this.calculateEnemyTypes(this.gameState.wave);
            
            // Start enemy spawning
            this.isSpawningEnemies = true;
            
            // Setup enemy spawning loop
            if (typeof this.setupEnemySpawningLoop === 'function') {
              this.setupEnemySpawningLoop();
            } else {
              console.warn('setupEnemySpawningLoop function not found!');
            }
            
            // Show countdown animation
            this.showCountdownAnimation(() => {
              console.log("Countdown complete, wave started");
            });
            
          } catch (error) {
            console.error("Error starting wave:", error);
          }
        }

        calculateEnemyTypes(wave) {
          // Simple enemy type calculation based on wave
          const types = ['enemy1'];
          
          if (wave >= 3) {
            types.push('enemy2');
          }
          
          if (wave >= 5) {
            types.push('enemy3');
          }
          
          return types;
        }

        endGame(victory = false) {
          try {
            console.log("Ending game...", victory ? "Victory!" : "Defeat!");
            
            this.gameState.isActive = false;
            this.isSpawningEnemies = false;
            this.waveInProgress = false;
            
            // Clear timers
            if (this.waveTimer) {
              clearTimeout(this.waveTimer);
              this.waveTimer = null;
            }
            
            // Play appropriate sound
            if (this.soundManager) {
              if (victory) {
                this.soundManager.play('victory_fanfare', { volume: 0.9 });
              } else {
                this.soundManager.play('game_over_sting', { volume: 0.9 });
              }
              
              // Stop the background music
              this.soundManager.stopMusic();
            }
          } catch (error) {
            console.error("Error in endGame function:", error);
            // Fallback to basic game over
            this.gameState.isActive = false;
            this.add.text(400, 300, 'GAME OVER', {
              fontSize: '48px',
              fontFamily: 'Arial',
              color: '#ff0000'
            }).setOrigin(0.5);
          }
        }

        // Add helper method to validate scene context
        isSceneValid() {
          return this && this.scene && this.scene.isActive && this.scene.isActive() && 
                 this.add && typeof this.add.text === 'function';
        }

        async submitScore(score, waves, submitButton, submitText) {
          // Prevent multiple submissions
          if (this.isSubmittingScore) {
            console.log('Score submission already in progress, ignoring duplicate request');
            return;
          }
          
          this.isSubmittingScore = true;
          
          try {
            console.log(`Submitting score: ${score}, waves: ${waves}`);
            
            // Simulate score submission
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            console.log("Score submitted successfully");
            
            // Update UI
            if (submitText) {
              submitText.setText('Score Submitted!');
            }
            
          } catch (error) {
            console.error("Error submitting score:", error);
            
            // Show error message
            if (this.isSceneValid()) {
              try {
                this.add.text(400, 400, 'Failed to submit score', {
                  fontSize: '24px',
                  fontFamily: 'Arial',
                  color: '#ff0000'
                }).setOrigin(0.5);
              } catch (e) {
                console.warn('Could not create error text:', e);
              }
            }
          } finally {
            // Reset submission flag
            this.isSubmittingScore = false;
          }
        }

        // Add helper method to clean up game objects
        cleanupCurrentGame(fullCleanup) {
          // Set default value inside the method
          if (fullCleanup === undefined) fullCleanup = false;
          try {
            console.log("Cleaning up current game...", fullCleanup ? "(Full cleanup)" : "(Preserving crops)");
            
            // Stop enemy spawning and wave timers, but preserve crop timers unless full cleanup
            if (fullCleanup) {
              // Clear all timers and events
              this.time.removeAllEvents();
            }
            
            // Clear enemies
            if (this.enemies && Array.isArray(this.enemies)) {
              this.enemies.forEach(enemy => {
                if (enemy && typeof enemy.destroy === 'function') {
                  enemy.destroy();
                }
              });
              this.enemies = [];
            }
            
            // Clear defenses
            if (this.defenses && Array.isArray(this.defenses)) {
              this.defenses.forEach(defense => {
                if (defense && typeof defense.destroy === 'function') {
                  defense.destroy();
                }
              });
              this.defenses = [];
            }
            
            // Clear projectiles
            if (this.projectiles && Array.isArray(this.projectiles)) {
              this.projectiles.forEach(projectile => {
                if (projectile && typeof projectile.destroy === 'function') {
                  projectile.destroy();
                }
              });
              this.projectiles = [];
            }
            
            // Reset game state
            this.gameState = {
              isActive: false,
              wave: 1,
              score: 0,
              health: 100,
              maxHealth: 100
            };
            
            // Reset flags
            this.isSpawningEnemies = false;
            this.waveInProgress = false;
            this.initialClickProcessed = false;
            this.allowPlanting = false;
            this._countdownInProgress = false;
            
            // Clear wave timer
            if (this.waveTimer) {
              clearTimeout(this.waveTimer);
              this.waveTimer = null;
            }
            
            // Reset current wave enemy types
            this.currentWaveEnemyTypes = null;
            
            // Update UI
            this.updateUI();
            
            console.log("Game cleanup complete (End of cleanupCurrentGame)");
          } catch (error) {
            console.error("Error in cleanupCurrentGame:", error);
          }
        }

        // Add a new countdown animation that shows 3, 2, 1, FIGHT! before starting a wave
        showCountdownAnimation(onComplete) {
          try {
            // Prevent multiple countdown animations running simultaneously
            if (this._countdownInProgress) {
              console.log("Countdown already in progress, skipping duplicate");
              // Still call the completion callback to ensure game flow continues
              if (typeof onComplete === 'function') {
                onComplete();
              }
              return;
            }
            
            this._countdownInProgress = true;
            
            // Create countdown text
            const countdownText = this.add.text(400, 300, '3', {
              fontSize: '72px',
              fontFamily: 'Arial',
              color: '#ffffff',
              stroke: '#000000',
              strokeThickness: 4
            }).setOrigin(0.5);
            
            let count = 3;
            
            const countdownTimer = this.time.addEvent({
              delay: 1000,
              callback: () => {
                count--;
                if (count > 0) {
                  countdownText.setText(count.toString());
                } else if (count === 0) {
                  countdownText.setText('FIGHT!');
                } else {
                  // Countdown finished
                  countdownText.destroy();
                  this._countdownInProgress = false;
                  
                  if (typeof onComplete === 'function') {
                    onComplete();
                  }
                }
              },
              repeat: 4
            });
            
          } catch (error) {
            console.error("Error in showCountdownAnimation:", error);
            this._countdownInProgress = false;
            
            if (typeof onComplete === 'function') {
              onComplete();
            }
          }
        }

        /**
         * Handles any clicks that don't directly hit interactive objects
         * This ensures consistent click handling throughout the game area
         */
        processMissedClicks() {
          // This function handles any queued or missed clicks
          // It's a stub that can be implemented fully if needed later
          // Currently just here to prevent errors when called from update()
          return;
        }

        // Add this new function definition
        setupEnemySpawningLoop() {
            if (!this.gameState?.isActive || !this.isSpawningEnemies) {
                console.log("setupEnemySpawningLoop called but game/spawning is not active. Aborting loop setup.");
                this.isSpawningEnemies = false; // Ensure flag is false if loop isn't set up
                return;
            }

            // Use the locally captured types from startWave if available, otherwise recalculate (less ideal)
            const enemyTypesToSpawn = this.currentWaveEnemyTypes || this.calculateEnemyTypes(this.gameState.wave);

            console.log("Setting up enemy spawning loop for wave", this.gameState.wave, "with enemy types:", enemyTypesToSpawn);

            // Create a spawning timer
            const spawnDelay = Math.max(500, 2000 - (this.gameState.wave * 100)); // Faster spawning as waves progress
            
            const spawnTimer = this.time.addEvent({
                delay: spawnDelay,
                callback: () => {
                    if (this.gameState?.isActive && this.isSpawningEnemies) {
                        this.spawnEnemy(enemyTypesToSpawn);
                    } else {
                        spawnTimer.destroy();
                    }
                },
                loop: true
            });
        }

        spawnEnemy(enemyTypes) {
          try {
            if (!enemyTypes || enemyTypes.length === 0) {
              console.warn("No enemy types provided for spawning");
              return;
            }
            
            // Select random enemy type
            const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            
            // Create enemy sprite
            const enemy = this.add.sprite(0, 300, enemyType);
            enemy.setScale(0.5);
            
            // Add enemy to array
            this.enemies.push(enemy);
            
            // Simple movement
            this.tweens.add({
              targets: enemy,
              x: 800,
              duration: 5000,
              onComplete: () => {
                // Remove enemy when it reaches the end
                const index = this.enemies.indexOf(enemy);
                if (index > -1) {
                  this.enemies.splice(index, 1);
                }
                enemy.destroy();
                
                // Damage player
                this.gameState.health -= 10;
                this.updateUI();
                
                // Check game over
                if (this.gameState.health <= 0) {
                  this.endGame(false);
                }
              }
            });
            
          } catch (error) {
            console.error("Error spawning enemy:", error);
          }
        }

        // --- Defense Lifetime Management ---
        checkDefenseExpirations(currentWave) {
          if (!this.defenses || !Array.isArray(this.defenses)) {
            return;
          }
          
          console.log(`Checking defense expirations for wave ${currentWave}`);
          
          // Check each defense for expiration
          this.defenses.forEach(defense => {
            if (defense && typeof defense.checkExpiration === 'function') {
              defense.checkExpiration(currentWave);
            }
          });
        }
        
        // Method for defenses to remove themselves from the array after destruction
        removeDefenseFromArray(defense) {
          if (this.defenses && defense) {
            const index = this.defenses.indexOf(defense);
            if (index !== -1) {
              this.defenses.splice(index, 1);
              console.log(`Defense ${defense.type} removed from defenses array`);
              console.log(`Remaining defenses: ${this.defenses.length}`);
              this.defenses.forEach((def, i) => {
                console.log(`  Defense ${i}: ${def.type || 'unknown'} at (${def.x || 'N/A'}, ${def.y || 'N/A'})`);
              });
            }
          }
        }

        // --- NEW: Create Flying Coin Effect --- 
        createFlyingCoinEffect(startX, startY, amount) {
            if (!this.textures.exists('coin') || !this.farmCoinsTargetPos) {
                console.warn("Coin texture or target position missing for flying coin effect.");
                // Directly update coins as fallback if effect can't run
                this.updateFarmCoins(amount);
                return;
            }

            // Limit the number of coin sprites for performance
            const maxCoins = Math.min(amount, 10);
            
            for (let i = 0; i < maxCoins; i++) {
                // Create coin sprite
                const coin = this.add.sprite(startX, startY, 'coin');
                coin.setScale(0.3);
                
                // Add slight random offset to starting position
                coin.x += (Math.random() - 0.5) * 20;
                coin.y += (Math.random() - 0.5) * 20;
                
                // Animate coin flying to target
                this.tweens.add({
                    targets: coin,
                    x: this.farmCoinsTargetPos.x + (Math.random() - 0.5) * 30,
                    y: this.farmCoinsTargetPos.y + (Math.random() - 0.5) * 30,
                    scaleX: 0.1,
                    scaleY: 0.1,
                    duration: 800 + (Math.random() * 400), // Vary duration slightly
                    ease: 'Power2',
                    delay: i * 50, // Stagger the coins
                    onComplete: () => {
                        coin.destroy();
                    }
                });
            }

            // Play a general coin collect sound once for the batch
            if (this.soundManager) {
                this.soundManager.play('coin_collect_batch', { volume: 0.5, delay: 0.1 }); // Delay slightly
            }

            // IMPORTANT: Update the actual coin count *immediately* 
            // The visual effect is just for show
            this.updateFarmCoins(amount);
        }

        updateFarmCoins(amount) {
          this.farmCoins += amount;
          
          // Update UI
          if (this.ui.farmCoinsText) {
            this.ui.farmCoinsText.setText(`Farm Coins: ${this.farmCoins}`);
          }
          
          // Call external callback if provided
          if (typeof this.addFarmCoinsCallback === 'function') {
            this.addFarmCoinsCallback(amount);
          }
        }

        getFarmCoins() {
          return this.farmCoins;
        }

        updateUI() {
          if (this.ui.waveText) {
            this.ui.waveText.setText(`Wave: ${this.gameState.wave}`);
          }
          
          if (this.ui.healthText) {
            this.ui.healthText.setText(`Health: ${this.gameState.health}`);
          }
          
          if (this.ui.scoreText) {
            this.ui.scoreText.setText(`Score: ${this.gameState.score}`);
          }
          
          if (this.ui.farmCoinsText) {
            this.ui.farmCoinsText.setText(`Farm Coins: ${this.farmCoins}`);
          }
        }

        // Add missing methods to match PlaceholderScene interface
        plantCrop() {
          // Placeholder implementation for planting crops
          console.log('Plant crop method called');
        }

        harvestCrop() {
          // Placeholder implementation for harvesting crops
          console.log('Harvest crop method called');
        }

        placeDefense() {
          // Placeholder implementation for placing defenses
          console.log('Place defense method called');
        }

        playSound(soundKey) {
          // Implementation for playing sounds
          if (this.sound && soundKey) {
            try {
              this.sound.play(soundKey);
            } catch (e) {
              console.warn('Could not play sound:', soundKey, e);
            }
          }
        }

        updateUI() {
          // Implementation for updating UI
          this.updateUIElements();
        }

        pauseGame() {
          // Implementation for pausing the game
          if (this.scene && this.scene.pause) {
            this.scene.pause();
          }
        }

        resumeGame() {
          // Implementation for resuming the game
          if (this.scene && this.scene.resume) {
            this.scene.resume();
          }
        }

        // --- End Flying Coin Effect ---
      } // End of GameSceneClient class
      
      // Replace the placeholder with the real implementation
      GameScene = GameSceneClient;
      console.log("Client-side GameScene loaded successfully");
    } catch (error) {
      console.error("Error initializing Phaser GameScene:", error);
      // Assign placeholder back if initialization failed
      GameScene = PlaceholderScene;
    }
  }).catch(error => {
    console.error("Failed to load Phaser:", error);
    // Assign placeholder back if Phaser load failed
    GameScene = PlaceholderScene;
  });
} // End of if (isBrowser) block

// Export using ES modules
export { GameScene };