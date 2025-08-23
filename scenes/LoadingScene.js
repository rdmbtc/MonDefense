import Phaser from 'phaser';

class LoadingScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LoadingScene' });
    this.loadingProgress = 0;
  }

  preload() {
    // Create loading UI first
    this.createLoadingUI();
    
    // Set up loading progress events
    this.load.on('progress', (progress) => {
      this.loadingProgress = progress;
      this.updateProgressBar(progress);
    });
    
    this.load.on('fileload', (key, type) => {
      this.updateLoadingText(`Loading ${key}...`);
    });
    
    this.load.on('complete', () => {
      this.updateLoadingText('Complete! Starting game...');
      console.log('All assets loaded successfully!');
      // Transition to game scene after a short delay
      this.time.delayedCall(500, () => {
        this.scene.start('GameScene');
      });
    });

    // Load all game assets here
    this.loadGameAssets();
  }

  createLoadingUI() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // Create gradient background
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x1e3c72, 0x1e3c72, 0x2a5298, 0x2a5298, 1);
    graphics.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);

    // Game title
    this.add.text(centerX, centerY - 200, 'MonDefense', {
      fontFamily: 'Arial',
      fontSize: '72px',
      fontWeight: 'bold',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(centerX, centerY - 130, 'Tower Defense Game', {
      fontFamily: 'Arial',
      fontSize: '32px',
      color: '#CCCCCC'
    }).setOrigin(0.5);

    // Loading text
    this.loadingText = this.add.text(centerX, centerY - 50, 'Loading assets...', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#FFFFFF'
    }).setOrigin(0.5);

    // Progress bar background
    this.progressBarBg = this.add.graphics();
    this.progressBarBg.fillStyle(0x333333, 1);
    this.progressBarBg.fillRoundedRect(centerX - 300, centerY, 600, 30, 15);
    this.progressBarBg.lineStyle(2, 0xFFFFFF, 1);
    this.progressBarBg.strokeRoundedRect(centerX - 300, centerY, 600, 30, 15);

    // Progress bar fill
    this.progressBar = this.add.graphics();

    // Progress percentage text
    this.progressText = this.add.text(centerX, centerY + 50, '0%', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#FFFFFF'
    }).setOrigin(0.5);

    // Tips text
    const tips = [
      '💡 Tip: Plant crops on the LEFT to earn coins',
      '💡 Tip: Place defenders on the RIGHT to protect crops',
      '💡 Tip: Click enemies to attack them directly',
      '💡 Tip: Upgrade your defenses for better performance',
      '💡 Tip: Each wave gets progressively harder'
    ];
    
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    this.add.text(centerX, centerY + 120, randomTip, {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#FFFF88',
      align: 'center',
      wordWrap: { width: 800 }
    }).setOrigin(0.5);

    // Version text
    this.add.text(centerX, this.cameras.main.height - 50, 'Built with Vite + Phaser', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#888888'
    }).setOrigin(0.5);
  }

  updateProgressBar(progress) {
    this.progressBar.clear();
    
    // Create gradient progress bar
    const barWidth = 596; // Slightly smaller than background
    const fillWidth = barWidth * progress;
    
    if (fillWidth > 0) {
      // Gradient from blue to green as it progresses
      const startColor = progress < 0.5 ? 0x0088FF : 0x00BB00;
      const endColor = progress < 0.5 ? 0x00BBFF : 0x00FF00;
      
      this.progressBar.fillGradientStyle(startColor, endColor, startColor, endColor, 1);
      this.progressBar.fillRoundedRect(
        this.cameras.main.width / 2 - 298, 
        this.cameras.main.height / 2 + 2, 
        fillWidth, 
        26, 
        13
      );
    }

    // Update percentage text
    const percentage = Math.floor(progress * 100);
    this.progressText.setText(`${percentage}%`);
  }

  updateLoadingText(text) {
    this.loadingText.setText(text);
  }

  loadGameAssets() {
    try {
      // Load defense character textures (these exist)
    this.load.image('chog_idle', '/characters/chog_idle.png');
    this.load.image('chog_attack', '/characters/chog_idle.png');
    this.load.image('molandak_idle', '/characters/molandak_idle.png');
    this.load.image('molandak_attack', '/characters/molandak_idle.png');
    this.load.image('moyaki_idle', '/characters/moyaki_idle.png');
    this.load.image('moyaki_attack', '/characters/moyaki_idle.png');
    this.load.image('keon_idle', '/characters/keon_idle.png');
    this.load.image('keon_attack', '/characters/keon_idle.png');
    
      // Load legacy defense textures (these exist)
    this.load.image('ABS_idle', '/characters/abster idle.png');
    this.load.image('ABS_attack', '/characters/abster attacks.png');
    this.load.image('MON_idle', '/characters/noot idle.png');
    this.load.image('MON_attack', '/characters/noot attack.png');
    
      // Load wizard and cannon (these exist)
      this.load.image('wizard_idle', '/characters/wizard idle.png');
      this.load.image('wizard_attack', '/characters/wizard attack.png');
      this.load.image('cannon_idle', '/characters/cannon idle.png');
      this.load.image('cannon_attack', '/characters/cannon attack.png');
      
      // Load effects (these exist)
      this.load.image('fireball', '/effects/fireball.png');
      this.load.image('iceball', '/effects/iceball.png');
      this.load.image('coin', '/effects/coin.png');
      
      // Load enemy sprites from monster packs (correct paths)
      this.load.image('enemy_rabbit', '/logo/craftpix-net-459799-free-low-level-monsters-pixel-icons-32x32/PNG/Transperent/Icon1.png');
      this.load.image('enemy_bird', '/logo/craftpix-net-459799-free-low-level-monsters-pixel-icons-32x32/PNG/Transperent/Icon2.png');
      this.load.image('enemy_fox', '/logo/craftpix-net-459799-free-low-level-monsters-pixel-icons-32x32/PNG/Transperent/Icon3.png');
      this.load.image('enemy_boss', '/logo/craftpix-net-459799-free-low-level-monsters-pixel-icons-32x32/PNG/Transperent/Icon4.png');
  
      this.load.image('enemy_ghost', '/logo/craftpix-net-459799-free-low-level-monsters-pixel-icons-32x32/PNG/Transperent/Icon5.png');
      this.load.image('enemy_skeleton', '/logo/craftpix-net-459799-free-low-level-monsters-pixel-icons-32x32/PNG/Transperent/Icon6.png');
      this.load.image('enemy_bat', '/logo/craftpix-net-459799-free-low-level-monsters-pixel-icons-32x32/PNG/Transperent/Icon7.png');
      this.load.image('enemy_spider', '/logo/craftpix-net-459799-free-low-level-monsters-pixel-icons-32x32/PNG/Transperent/Icon8.png');
      this.load.image('enemy_wolf', '/logo/craftpix-net-459799-free-low-level-monsters-pixel-icons-32x32/PNG/Transperent/Icon9.png');
      this.load.image('enemy_snake', '/logo/craftpix-net-459799-free-low-level-monsters-pixel-icons-32x32/PNG/Transperent/Icon10.png');
      this.load.image('enemy_goblin', '/logo/craftpix-net-459799-free-low-level-monsters-pixel-icons-32x32/PNG/Transperent/Icon11.png');
      this.load.image('enemy_dragon', '/logo/craftpix-net-459799-free-low-level-monsters-pixel-icons-32x32/PNG/Transperent/Icon12.png');
      this.load.image('enemy_demon', '/logo/craftpix-net-459799-free-low-level-monsters-pixel-icons-32x32/PNG/Transperent/Icon13.png');
      
      // Load tiles and backgrounds (correct paths)
      this.load.image('grass1', '/logo/1 Tiles/FieldsTile_01.png');
      this.load.image('grass2', '/logo/1 Tiles/FieldsTile_02.png');
      this.load.image('soil1', '/logo/1 Tiles/FieldsTile_03.png');
      this.load.image('soil2', '/logo/1 Tiles/FieldsTile_04.png');
      this.load.image('tileset', '/logo/1 Tiles/FieldsTileset.png');
      this.load.image('tileset2', '/logo/1 Tiles/FieldsTilesetTest.png');
      
      // Load trees and decorations (correct paths)
      this.load.image('Fruit_tree3', '/logo/craftpix-net-385863-free-top-down-trees-pixel-art/PNG/Assets_separately/Trees/Fruit_tree3.png');
      this.load.image('Moss_tree3', '/logo/craftpix-net-385863-free-top-down-trees-pixel-art/PNG/Assets_separately/Trees/Moss_tree3.png');
      
      // Load tower placement spots
      this.load.image('towerPlace1', '/logo/2 Objects/PlaceForTower1.png');
      this.load.image('towerPlace2', '/logo/2 Objects/PlaceForTower2.png');
      
      // Load plant growth stage sprites (numbered 1-4 for growth stages)
    this.load.image('plant1', '/logo/plants/1.png'); // Seedling stage
    this.load.image('plant2', '/logo/plants/2.png'); // Growing stage
    this.load.image('plant3', '/logo/plants/3.png'); // Mature stage
    this.load.image('plant4', '/logo/plants/4.png'); // Harvestable stage
      
      // Load sound effects
      this.load.audio('bg_music', '/SFX/bg_music.mp3');
      this.load.audio('ui_click', '/SFX/ui_click.mp3');
      this.load.audio('coins', '/SFX/coins.mp3');
      this.load.audio('enemy_hit', '/SFX/enemy_hit.mp3');
      this.load.audio('enemy_defeat', '/SFX/enemy_defeat.mp3');
      this.load.audio('dog_attack', '/SFX/dog_attack.mp3');
      this.load.audio('fire_attack', '/SFX/fire_attack.mp3');
      this.load.audio('victory', '/SFX/victory.mp3');
      this.load.audio('you_win', '/SFX/you_win.mp3');
    
    // Load essential pixel for effects
    this.load.image('pixel', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==');
    
    // Add error handling
    this.load.on('loaderror', (fileObj) => {
        console.warn(`Failed to load asset: ${fileObj.key} from ${fileObj.url}`);
        this.updateLoadingText(`Warning: ${fileObj.key} failed to load`);
        // Create a fallback colored rectangle
        this.createFallbackTexture(fileObj.key);
    });
    
    // Add success handling for debugging
    this.load.on('filecomplete', (key, type, data) => {
        console.log(`Successfully loaded: ${key}`);
    });
      
      console.log("Started loading game assets...");
      console.log("Loading enemy sprites...");
      console.log("Loading tiles and backgrounds...");
      console.log("Loading trees and decorations...");
      console.log("Loading plant sprites...");
      console.log("Loading sound effects...");
      
    } catch (error) {
      console.error("Error in loadGameAssets:", error);
    }
  }
  
  // Create fallback texture for failed assets
  createFallbackTexture(key) {
    const colorMap = {
      // Enemies
      'enemy_rabbit': 0xFF69B4,
      'enemy_bird': 0xFF0000,
      'enemy_fox': 0xFF8C00,
      'enemy_boss': 0x800080,

      'enemy_ghost': 0xFFFFFF,
      'enemy_skeleton': 0xF5F5DC,
      'enemy_bat': 0x2F4F4F,
      'enemy_spider': 0x8B4513,
      'enemy_wolf': 0x696969,
      'enemy_snake': 0x9ACD32,
      'enemy_goblin': 0x228B22,
      'enemy_dragon': 0x8B0000,
      'enemy_demon': 0x4B0082,
      
      // Environment
      'grass1': 0x32CD32,
      'grass2': 0x228B22,
      'soil1': 0x8B4513,
      'soil2': 0xA0522D,
      'tileset': 0x8FBC8F,
      'tileset2': 0x90EE90,
      'Fruit_tree3': 0x228B22,
      'Moss_tree3': 0x006400,
      'towerPlace1': 0x696969,
      'towerPlace2': 0x808080,
      
      // Plants
      'plant1_idle': 0x00FF00,
      'plant2_idle': 0x32CD32,
      'plant3_idle': 0x228B22,
      
      // Effects
      'fireball': 0xFF4500,
      'iceball': 0x00FFFF,
      'coin': 0xFFD700
    };
    
    const color = colorMap[key] || 0xFF00FF; // Default magenta for unknown
    
    const graphics = this.add.graphics();
    graphics.fillStyle(color, 1);
    graphics.fillRect(0, 0, 32, 32);
    graphics.generateTexture(key, 32, 32);
    graphics.destroy();
    
    console.log(`Created fallback texture for ${key} with color ${color.toString(16)}`);
  }
}

export default LoadingScene;
