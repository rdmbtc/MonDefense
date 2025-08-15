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
    // Load all the game assets
    
    // Load tree/plant assets
    this.load.image('Fruit_tree3', '/characters/craftpix-net-385863-free-top-down-trees-pixel-art/PNG/Assets_separately/Trees_shadow/Fruit_tree3.png');
    this.load.image('Moss_tree3', '/characters/craftpix-net-385863-free-top-down-trees-pixel-art/PNG/Assets_separately/Trees_shadow/Moss_tree3.png');
    
    // Load effect assets
    this.load.image('fireball', '/effects/fireball.png');
    this.load.image('iceball', '/effects/iceball.png');
    this.load.image('coin', '/effects/coin.png');
    
    // Load tileset assets
    this.load.image('tileset', '/characters/craftpix-net-504452-free-village-pixel-tileset-for-top-down-defense/1 Tiles/FieldsTileset.png');
    this.load.image('tileset2', '/characters/craftpix-net-504452-free-village-pixel-tileset-for-top-down-defense/1.1 Tiles/Tileset2.png');
    
    // Load individual tiles
    this.load.image('grass1', '/characters/craftpix-net-504452-free-village-pixel-tileset-for-top-down-defense/1 Tiles/FieldsTile_01.png');
    this.load.image('grass2', '/characters/craftpix-net-504452-free-village-pixel-tileset-for-top-down-defense/1 Tiles/FieldsTile_02.png');
    this.load.image('soil1', '/characters/craftpix-net-504452-free-village-pixel-tileset-for-top-down-defense/1 Tiles/FieldsTile_11.png');
    this.load.image('soil2', '/characters/craftpix-net-504452-free-village-pixel-tileset-for-top-down-defense/1 Tiles/FieldsTile_12.png');
    
    // Load decorative objects
    this.load.image('towerPlace1', '/characters/craftpix-net-504452-free-village-pixel-tileset-for-top-down-defense/2 Objects/PlaceForTower1.png');
    this.load.image('towerPlace2', '/characters/craftpix-net-504452-free-village-pixel-tileset-for-top-down-defense/2 Objects/PlaceForTower2.png');
    
    // Load enemy images
    this.load.image('enemy_bird', 'characters/craftpix-net-459799-free-low-level-monsters-pixel-icons-32x32/PNG/Transperent/Icon1.png');
    this.load.image('enemy_rabbit', 'characters/craftpix-net-459799-free-low-level-monsters-pixel-icons-32x32/PNG/Transperent/Icon2.png');
    this.load.image('enemy_boss', 'characters/craftpix-net-459799-free-low-level-monsters-pixel-icons-32x32/PNG/Transperent/Icon3.png');
    this.load.image('enemy_fox', 'characters/craftpix-net-459799-free-low-level-monsters-pixel-icons-32x32/PNG/Transperent/Icon9.png');
    
    // Load defense character textures
    this.load.image('chog_idle', '/characters/chog_idle.png');
    this.load.image('chog_attack', '/characters/chog_idle.png');
    this.load.image('molandak_idle', '/characters/molandak_idle.png');
    this.load.image('molandak_attack', '/characters/molandak_idle.png');
    this.load.image('moyaki_idle', '/characters/moyaki_idle.png');
    this.load.image('moyaki_attack', '/characters/moyaki_idle.png');
    this.load.image('keon_idle', '/characters/keon_idle.png');
    this.load.image('keon_attack', '/characters/keon_idle.png');
    
    // Load legacy defense textures
    this.load.image('ABS_idle', '/characters/abster idle.png');
    this.load.image('ABS_attack', '/characters/abster attacks.png');
    this.load.image('MON_idle', '/characters/noot idle.png');
    this.load.image('MON_attack', '/characters/noot attack.png');
    
    // Load plant assets for crops
    this.load.image('plant1_idle', '/characters/craftpix-net-922184-free-predator-plant-mobs-pixel-art-pack/PNG/Plant1/Idle/Plant1_Idle_head.png');
    this.load.image('plant2_idle', '/characters/craftpix-net-922184-free-predator-plant-mobs-pixel-art-pack/PNG/Plant2/Idle/Plant2_Idle_head.png');
    this.load.image('plant3_idle', '/characters/craftpix-net-922184-free-predator-plant-mobs-pixel-art-pack/PNG/Plant3/Idle/Plant3_Idle_head.png');
    
    // Load essential pixel for effects
    this.load.image('pixel', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==');
    
    // Add error handling
    this.load.on('loaderror', (fileObj) => {
      console.warn(`Failed to load asset: ${fileObj.key}`);
      this.updateLoadingText(`Warning: ${fileObj.key} failed to load`);
    });
  }
}

export default LoadingScene;
