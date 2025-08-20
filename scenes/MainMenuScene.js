import Phaser from 'phaser';

class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  preload() {
    // Load any additional assets for the menu if needed
  }

  create() {
    // Modern gradient background
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x1e3c72, 0x1e3c72, 0x2a5298, 0x2a5298, 1, 1, 1, 1);
    graphics.fillRect(0, 0, this.scale.width, this.scale.height);

    // Game logo/title
    const title = this.add.text(this.scale.width / 2, this.scale.height / 4, 'MonDefense', {
      fontFamily: 'Arial',
      fontSize: '48px',
      fontWeight: 'bold',
      color: '#FFFFFF',
      stroke: '#2C3E50',
      strokeThickness: 4,
      shadow: {
        color: '#000000',
        blur: 8,
        offsetX: 3,
        offsetY: 3,
        fill: true
      }
    }).setOrigin(0.5);

    // Subtitle
    const subtitle = this.add.text(this.scale.width / 2, this.scale.height / 4 + 80, 'Tower Defense Game', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#BDC3C7',
      fontStyle: 'italic'
    }).setOrigin(0.5);

    // Menu buttons
    const buttonData = [
      { text: 'Start Game', action: () => this.startGame() },
      { text: 'Graphics Settings', action: () => this.showSettings() },
      { text: 'How to Play', action: () => this.showInstructions() }
    ];

    const buttonY = this.scale.height / 2 + 50;
    const buttonSpacing = 80;

    buttonData.forEach((data, index) => {
      const y = buttonY + (index * buttonSpacing);
      this.createMenuButton(data.text, this.scale.width / 2, y, data.action);
    });

    // Version info
    this.add.text(this.scale.width - 10, this.scale.height - 10, 'v1.0.0', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#7F8C8D'
    }).setOrigin(1, 1);

    // Add some animated elements
    this.createFloatingParticles();
  }

  createMenuButton(text, x, y, callback) {
    // Button background
    const buttonWidth = 300;
    const buttonHeight = 60;
    
    const button = this.add.graphics();
    button.fillGradientStyle(0x3498DB, 0x3498DB, 0x2980B9, 0x2980B9, 1, 1, 1, 1);
    button.fillRoundedRect(x - buttonWidth/2, y - buttonHeight/2, buttonWidth, buttonHeight, 15);
    button.setInteractive(new Phaser.Geom.Rectangle(x - buttonWidth/2, y - buttonHeight/2, buttonWidth, buttonHeight), Phaser.Geom.Rectangle.Contains);

    // Button text
    const buttonText = this.add.text(x, y, text, {
      fontFamily: 'Arial',
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#FFFFFF'
    }).setOrigin(0.5);

    // Hover effects
    button.on('pointerover', () => {
      button.clear();
      button.fillGradientStyle(0x5DADE2, 0x5DADE2, 0x3498DB, 0x3498DB, 1, 1, 1, 1);
      button.fillRoundedRect(x - buttonWidth/2, y - buttonHeight/2, buttonWidth, buttonHeight, 15);
      buttonText.setScale(1.05);
    });

    button.on('pointerout', () => {
      button.clear();
      button.fillGradientStyle(0x3498DB, 0x3498DB, 0x2980B9, 0x2980B9, 1, 1, 1, 1);
      button.fillRoundedRect(x - buttonWidth/2, y - buttonHeight/2, buttonWidth, buttonHeight, 15);
      buttonText.setScale(1);
    });

    button.on('pointerdown', () => {
      // Click animation
      this.tweens.add({
        targets: [button, buttonText],
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 100,
        yoyo: true,
        ease: 'Power2',
        onComplete: callback
      });
    });

    return { button, text: buttonText };
  }

  createFloatingParticles() {
    for (let i = 0; i < 20; i++) {
      const particle = this.add.circle(
        Math.random() * this.scale.width,
        Math.random() * this.scale.height,
        Math.random() * 3 + 1,
        0xFFFFFF,
        0.3
      );

      this.tweens.add({
        targets: particle,
        y: particle.y - this.scale.height - 100,
        duration: Math.random() * 10000 + 5000,
        repeat: -1,
        onRepeat: () => {
          particle.y = this.scale.height + 100;
          particle.x = Math.random() * this.scale.width;
        }
      });
    }
  }

  startGame() {
    this.scene.start('GameScene');
  }

  showSettings() {
    // Create a simple settings overlay
    const overlay = this.add.container(0, 0);
    
    // Background
    const bg = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, 500, 400, 0x2C3E50, 0.95);
    bg.setStrokeStyle(3, 0x3498DB);
    overlay.add(bg);

    // Title
    const title = this.add.text(this.scale.width / 2, this.scale.height / 2 - 150, 'Graphics Settings', {
      fontFamily: 'Arial',
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#FFFFFF'
    }).setOrigin(0.5);
    overlay.add(title);

    // Quality buttons
    const qualities = ['Low', 'Medium', 'High', 'Ultra'];
    qualities.forEach((quality, index) => {
      const y = this.scale.height / 2 - 50 + (index * 50);
      const qualityButton = this.createQualityButton(quality.toLowerCase(), this.scale.width / 2, y);
      overlay.add([qualityButton.button, qualityButton.text]);
    });

    // Close button
    const closeButton = this.add.graphics();
    closeButton.fillGradientStyle(0xE74C3C, 0xE74C3C, 0xC0392B, 0xC0392B, 1, 1, 1, 1);
    closeButton.fillRoundedRect(this.scale.width / 2 - 50, this.scale.height / 2 + 120, 100, 40, 8);
    closeButton.setInteractive(new Phaser.Geom.Rectangle(this.scale.width / 2 - 50, this.scale.height / 2 + 120, 100, 40), Phaser.Geom.Rectangle.Contains);
    
    const closeText = this.add.text(this.scale.width / 2, this.scale.height / 2 + 140, 'Close', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#FFFFFF',
      fontWeight: 'bold'
    }).setOrigin(0.5);

    closeButton.on('pointerdown', () => {
      overlay.destroy();
    });

    overlay.add([closeButton, closeText]);
  }

  createQualityButton(quality, x, y) {
    const buttonWidth = 200;
    const buttonHeight = 35;
    
    const button = this.add.graphics();
    button.fillGradientStyle(0x34495E, 0x34495E, 0x2C3E50, 0x2C3E50, 1, 1, 1, 1);
    button.fillRoundedRect(x - buttonWidth/2, y - buttonHeight/2, buttonWidth, buttonHeight, 8);
    button.setInteractive(new Phaser.Geom.Rectangle(x - buttonWidth/2, y - buttonHeight/2, buttonWidth, buttonHeight), Phaser.Geom.Rectangle.Contains);

    const text = this.add.text(x, y, quality.toUpperCase(), {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#FFFFFF',
      fontWeight: 'bold'
    }).setOrigin(0.5);

    button.on('pointerdown', () => {
      // Save quality setting to localStorage
      localStorage.setItem('mondefense_graphics_quality', quality);
      
      // Visual feedback
      button.clear();
      button.fillGradientStyle(0x27AE60, 0x27AE60, 0x229954, 0x229954, 1, 1, 1, 1);
      button.fillRoundedRect(x - buttonWidth/2, y - buttonHeight/2, buttonWidth, buttonHeight, 8);
      
      // Reset after delay
      this.time.delayedCall(500, () => {
        button.clear();
        button.fillGradientStyle(0x34495E, 0x34495E, 0x2C3E50, 0x2C3E50, 1, 1, 1, 1);
        button.fillRoundedRect(x - buttonWidth/2, y - buttonHeight/2, buttonWidth, buttonHeight, 8);
      });
    });

    return { button, text };
  }

  showInstructions() {
    const overlay = this.add.container(0, 0);
    
    // Background
    const bg = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, 600, 500, 0x2C3E50, 0.95);
    bg.setStrokeStyle(3, 0x3498DB);
    overlay.add(bg);

    // Title
    const title = this.add.text(this.scale.width / 2, this.scale.height / 2 - 200, 'How to Play', {
      fontFamily: 'Arial',
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#FFFFFF'
    }).setOrigin(0.5);
    overlay.add(title);

    // Instructions
    const instructions = [
      '⚔️ Click enemies to attack them',
      '🌱 Plant crops on the left side to earn coins',
      '❄️ Place Ice Mages to freeze enemies',
      '🔥 Place Fire Mages for area damage',
      '⬆️ Use the upgrade menu to improve defenses',
      '💰 Collect coins from defeated enemies',
      '🛡️ Protect your farm from enemy waves!'
    ];

    instructions.forEach((instruction, index) => {
      const text = this.add.text(this.scale.width / 2, this.scale.height / 2 - 130 + (index * 35), instruction, {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#ECF0F1',
        wordWrap: { width: 500 }
      }).setOrigin(0.5);
      overlay.add(text);
    });

    // Close button
    const closeButton = this.add.graphics();
    closeButton.fillGradientStyle(0xE74C3C, 0xE74C3C, 0xC0392B, 0xC0392B, 1, 1, 1, 1);
    closeButton.fillRoundedRect(this.scale.width / 2 - 50, this.scale.height / 2 + 180, 100, 40, 8);
    closeButton.setInteractive(new Phaser.Geom.Rectangle(this.scale.width / 2 - 50, this.scale.height / 2 + 180, 100, 40), Phaser.Geom.Rectangle.Contains);
    
    const closeText = this.add.text(this.scale.width / 2, this.scale.height / 2 + 200, 'Close', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#FFFFFF',
      fontWeight: 'bold'
    }).setOrigin(0.5);

    closeButton.on('pointerdown', () => {
      overlay.destroy();
    });

    overlay.add([closeButton, closeText]);
  }
}

export default MainMenuScene;
