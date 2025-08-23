import Phaser from 'phaser';
import UIStyleSystem from '../utils/UIStyleSystem.js';

class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  preload() {
    // Load any additional assets for the menu if needed
  }

  create() {
    // Initialize UI Style System
    this.uiStyle = new UIStyleSystem(this);
    
    // Modern gradient background
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x0f0f23, 0x0f0f23, 0x1a1a2e, 0x1a1a2e, 1, 1, 1, 1);
    graphics.fillRect(0, 0, this.scale.width, this.scale.height);

    // Game logo/title with modern styling
    const title = this.uiStyle.createStyledText(
      this.scale.width / 2, 
      this.scale.height / 4, 
      '🛡️ MonDefense', 
      'title', 
      { 
        glow: { color: this.uiStyle.colors.primary.light },
        animated: true 
      }
    ).setOrigin(0.5);

    // Modern subtitle
    const subtitle = this.uiStyle.createStyledText(
      this.scale.width / 2, 
      this.scale.height / 4 + 80, 
      'Epic Tower Defense Adventure', 
      'h2',
      { color: this.uiStyle.colors.text.secondary }
    ).setOrigin(0.5);

    // Modern Menu buttons
    const buttonData = [
      { text: '🎮 Start Game', action: () => this.startGame(), variant: 'primary' },
      { text: '⚙️ Graphics Settings', action: () => this.showSettings(), variant: 'secondary' },
      { text: '❓ How to Play', action: () => this.showInstructions(), variant: 'info' }
    ];

    const buttonY = this.scale.height / 2 + 50;
    const buttonSpacing = 80;

    buttonData.forEach((data, index) => {
      const y = buttonY + (index * buttonSpacing);
      this.uiStyle.createModernButton(
        this.scale.width / 2, 
        y, 
        data.text, 
        data.action,
        { variant: data.variant, size: 'large' }
      );
    });

    // Modern version info
    this.uiStyle.createStyledText(
      this.scale.width - 10, 
      this.scale.height - 10, 
      'v1.0.0 ✨', 
      'mono',
      { color: this.uiStyle.colors.text.muted }
    ).setOrigin(1, 1);

    // Add some animated elements
    this.createFloatingParticles();
  }

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
    
    // Modern background panel
    const bgPanel = this.uiStyle.createGlassPanel(
      this.scale.width / 2 - 250, this.scale.height / 2 - 200, 500, 400
    );
    overlay.add([bgPanel.panel, bgPanel.glow]);

    // Modern title
    const title = this.uiStyle.createStyledText(
      this.scale.width / 2, this.scale.height / 2 - 150, 
      '⚙️ Graphics Settings', 
      'h2'
    ).setOrigin(0.5);
    overlay.add(title);

    // Quality buttons with modern styling
    const qualities = ['Low', 'Medium', 'High', 'Ultra'];
    qualities.forEach((quality, index) => {
      const y = this.scale.height / 2 - 50 + (index * 50);
      const qualityButton = this.uiStyle.createModernButton(
        this.scale.width / 2, y, 220, 40, `⚙️ ${quality.toUpperCase()}`, 'secondary',
        () => {
          // Save quality setting to localStorage
          localStorage.setItem('mondefense_graphics_quality', quality.toLowerCase());
          // Visual feedback could be added here
        }
      );
      overlay.add(qualityButton);
    });

    // Close button with modern styling
    const closeButton = this.uiStyle.createModernButton(
      this.scale.width / 2, this.scale.height / 2 + 140, 120, 45, '✕ Close', 'danger',
      () => overlay.destroy()
    );

    overlay.add(closeButton);
  }



  showInstructions() {
    const overlay = this.add.container(0, 0);
    
    // Modern background panel
    const bgPanel = this.uiStyle.createGlassPanel(
      this.scale.width / 2 - 300, this.scale.height / 2 - 250, 600, 500
    );
    overlay.add([bgPanel.panel, bgPanel.glow]);

    // Modern title
    const title = this.uiStyle.createStyledText(
      this.scale.width / 2, this.scale.height / 2 - 200, 
      '❓ How to Play', 
      'h2'
    ).setOrigin(0.5);
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
      const text = this.uiStyle.createStyledText(
        this.scale.width / 2, this.scale.height / 2 - 130 + (index * 35), 
        instruction, 
        'body',
        { 
          color: this.uiStyle.colors.neutral.light,
          wordWrap: { width: 500 }
        }
      ).setOrigin(0.5);
      overlay.add(text);
    });

    // Close button with modern styling
    const closeButton = this.uiStyle.createModernButton(
      this.scale.width / 2, this.scale.height / 2 + 190, 120, 45, '✕ Close', 'danger',
      () => overlay.destroy()
    );

    overlay.add(closeButton);
  }
}

export default MainMenuScene;
