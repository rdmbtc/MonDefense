/**
 * AAA Quality UI Style System
 * Provides modern, professional styling for all game UI elements
 */

export class UIStyleSystem {
  constructor(scene) {
    this.scene = scene;
    this.initializeStyles();
  }

  initializeStyles() {
    // Modern font stack with fallbacks
    this.fonts = {
      primary: 'Orbitron, "Exo 2", "Roboto Condensed", "Arial Black", Impact, sans-serif',
      secondary: '"Rajdhani", "Roboto", "Segoe UI", Arial, sans-serif',
      mono: '"Fira Code", "JetBrains Mono", "Consolas", monospace'
    };

    // Color palette with modern gradients
    this.colors = {
      primary: {
        main: '#00d4ff',
        light: '#4de6ff',
        dark: '#0099cc',
        gradient: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)'
      },
      secondary: {
        main: '#ff6b35',
        light: '#ff8c69',
        dark: '#cc4400',
        gradient: 'linear-gradient(135deg, #ff6b35 0%, #cc4400 100%)'
      },
      success: {
        main: '#00ff88',
        light: '#4dffaa',
        dark: '#00cc66',
        gradient: 'linear-gradient(135deg, #00ff88 0%, #00cc66 100%)'
      },
      warning: {
        main: '#ffaa00',
        light: '#ffcc4d',
        dark: '#cc8800',
        gradient: 'linear-gradient(135deg, #ffaa00 0%, #cc8800 100%)'
      },
      danger: {
        main: '#ff3366',
        light: '#ff6699',
        dark: '#cc0033',
        gradient: 'linear-gradient(135deg, #ff3366 0%, #cc0033 100%)'
      },
      neutral: {
        white: '#ffffff',
        light: '#f0f0f0',
        medium: '#888888',
        dark: '#333333',
        black: '#000000'
      }
    };

    // Typography styles
    this.typography = {
      h1: {
        fontFamily: this.fonts.primary,
        fontSize: '48px',
        fontWeight: 'bold',
        color: this.colors.primary.main,
        stroke: this.colors.neutral.black,
        strokeThickness: 3,
        shadow: {
          offsetX: 2,
          offsetY: 2,
          color: 'rgba(0, 0, 0, 0.8)',
          blur: 4,
          stroke: true,
          fill: true
        }
      },
      h2: {
        fontFamily: this.fonts.primary,
        fontSize: '36px',
        fontWeight: 'bold',
        color: this.colors.primary.light,
        stroke: this.colors.neutral.black,
        strokeThickness: 2,
        shadow: {
          offsetX: 1,
          offsetY: 1,
          color: 'rgba(0, 0, 0, 0.6)',
          blur: 3,
          stroke: true,
          fill: true
        }
      },
      h3: {
        fontFamily: this.fonts.primary,
        fontSize: '28px',
        fontWeight: 'bold',
        color: this.colors.secondary.main,
        stroke: this.colors.neutral.black,
        strokeThickness: 2
      },
      body: {
        fontFamily: this.fonts.secondary,
        fontSize: '18px',
        color: this.colors.neutral.white,
        stroke: this.colors.neutral.black,
        strokeThickness: 1
      },
      bodySmall: {
        fontFamily: this.fonts.secondary,
        fontSize: '14px',
        color: this.colors.neutral.light,
        stroke: this.colors.neutral.black,
        strokeThickness: 1
      },
      button: {
        fontFamily: this.fonts.primary,
        fontSize: '20px',
        fontWeight: 'bold',
        color: this.colors.neutral.white,
        stroke: this.colors.neutral.black,
        strokeThickness: 2
      },
      hud: {
        fontFamily: this.fonts.secondary,
        fontSize: '16px',
        fontWeight: 'bold',
        color: this.colors.primary.main,
        stroke: this.colors.neutral.black,
        strokeThickness: 2
      },
      mono: {
        fontFamily: this.fonts.mono,
        fontSize: '14px',
        color: this.colors.success.main,
        stroke: this.colors.neutral.black,
        strokeThickness: 1
      }
    };
  }

  // Create styled text with modern effects
  createStyledText(x, y, text, style = 'body', config = {}) {
    const baseStyle = { ...this.typography[style] };
    const finalStyle = { ...baseStyle, ...config };
    
    const textObj = this.scene.add.text(x, y, text, finalStyle);
    
    // Add glow effect for important text
    if (finalStyle.glow) {
      this.addGlowEffect(textObj, finalStyle.glow);
    }
    
    return textObj;
  }

  // Create modern button with gradient background and hover effects
  createModernButton(x, y, width, height, text, style = 'primary', callback = null) {
    const container = this.scene.add.container(x, y);
    
    // Background with gradient effect
    const bg = this.scene.add.graphics();
    const colorScheme = this.colors[style];
    
    // Create gradient background
    bg.fillGradientStyle(colorScheme.main, colorScheme.main, colorScheme.dark, colorScheme.dark, 1);
    bg.fillRoundedRect(-width/2, -height/2, width, height, 8);
    
    // Border with glow
    bg.lineStyle(2, colorScheme.light, 1);
    bg.strokeRoundedRect(-width/2, -height/2, width, height, 8);
    
    // Inner highlight
    const highlight = this.scene.add.graphics();
    highlight.fillStyle(0xffffff, 0.2);
    highlight.fillRoundedRect(-width/2, -height/2 + 2, width, height/3, 6);
    
    // Button text
    const buttonText = this.createStyledText(0, 0, text, 'button');
    buttonText.setOrigin(0.5);
    
    container.add([bg, highlight, buttonText]);
    
    // Interactive effects
    container.setSize(width, height);
    container.setInteractive();
    
    // Hover effects
    container.on('pointerover', () => {
      bg.clear();
      bg.fillGradientStyle(colorScheme.light, colorScheme.light, colorScheme.main, colorScheme.main, 1);
      bg.fillRoundedRect(-width/2, -height/2, width, height, 8);
      bg.lineStyle(3, colorScheme.light, 1);
      bg.strokeRoundedRect(-width/2, -height/2, width, height, 8);
      
      container.setScale(1.05);
      this.scene.sound.play('ui_click', { volume: 0.3 });
    });
    
    container.on('pointerout', () => {
      bg.clear();
      bg.fillGradientStyle(colorScheme.main, colorScheme.main, colorScheme.dark, colorScheme.dark, 1);
      bg.fillRoundedRect(-width/2, -height/2, width, height, 8);
      bg.lineStyle(2, colorScheme.light, 1);
      bg.strokeRoundedRect(-width/2, -height/2, width, height, 8);
      
      container.setScale(1.0);
    });
    
    container.on('pointerdown', () => {
      container.setScale(0.95);
    });
    
    container.on('pointerup', () => {
      container.setScale(1.05);
      if (callback) callback();
    });
    
    return { container, bg, text: buttonText };
  }

  // Create modern panel with glass morphism effect
  createModernPanel(x, y, width, height, style = 'dark') {
    const panel = this.scene.add.graphics();
    
    // Glass morphism background
    if (style === 'dark') {
      panel.fillStyle(0x000000, 0.7);
    } else {
      panel.fillStyle(0xffffff, 0.1);
    }
    
    panel.fillRoundedRect(x, y, width, height, 12);
    
    // Border with gradient
    panel.lineStyle(2, this.colors.primary.main, 0.8);
    panel.strokeRoundedRect(x, y, width, height, 12);
    
    // Inner glow
    const glow = this.scene.add.graphics();
    glow.lineStyle(1, this.colors.primary.light, 0.3);
    glow.strokeRoundedRect(x + 1, y + 1, width - 2, height - 2, 11);
    
    return { panel, glow };
  }

  // Create HUD element with modern styling
  createHUDElement(x, y, label, value, icon = null) {
    const container = this.scene.add.container(x, y);
    
    // Background
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x000000, 0.6);
    bg.fillRoundedRect(-60, -15, 120, 30, 15);
    bg.lineStyle(1, this.colors.primary.main, 0.8);
    bg.strokeRoundedRect(-60, -15, 120, 30, 15);
    
    // Icon if provided
    let iconObj = null;
    if (icon) {
      iconObj = this.createStyledText(-45, 0, icon, 'body');
      iconObj.setOrigin(0.5);
    }
    
    // Label
    const labelText = this.createStyledText(iconObj ? -20 : -40, -8, label, 'bodySmall');
    labelText.setOrigin(0, 0.5);
    
    // Value
    const valueText = this.createStyledText(iconObj ? -20 : -40, 8, value, 'hud');
    valueText.setOrigin(0, 0.5);
    
    container.add([bg, labelText, valueText]);
    if (iconObj) container.add(iconObj);
    
    return { container, label: labelText, value: valueText };
  }

  // Add glow effect to any display object
  addGlowEffect(obj, glowConfig = {}) {
    const config = {
      color: this.colors.primary.main,
      blur: 10,
      quality: 0.5,
      distance: 0,
      ...glowConfig
    };
    
    // Note: Phaser doesn't have built-in glow, but we can simulate with multiple copies
    const glow1 = this.scene.add.text(obj.x + 1, obj.y + 1, obj.text, {
      ...obj.style,
      color: config.color,
      alpha: 0.3
    }).setOrigin(obj.originX, obj.originY);
    
    const glow2 = this.scene.add.text(obj.x - 1, obj.y - 1, obj.text, {
      ...obj.style,
      color: config.color,
      alpha: 0.3
    }).setOrigin(obj.originX, obj.originY);
    
    // Place glow behind original text
    glow1.setDepth(obj.depth - 1);
    glow2.setDepth(obj.depth - 1);
    
    return [glow1, glow2];
  }

  // Create animated text with typewriter effect
  createAnimatedText(x, y, text, style = 'body', duration = 1000) {
    const textObj = this.createStyledText(x, y, '', style);
    
    let currentIndex = 0;
    const timer = this.scene.time.addEvent({
      delay: duration / text.length,
      callback: () => {
        currentIndex++;
        textObj.setText(text.substring(0, currentIndex));
        if (currentIndex >= text.length) {
          timer.destroy();
        }
      },
      repeat: text.length - 1
    });
    
    return textObj;
  }

  // Create progress bar with modern styling
  createProgressBar(x, y, width, height, progress = 0, style = 'primary') {
    const container = this.scene.add.container(x, y);
    const colorScheme = this.colors[style];
    
    // Background
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x333333, 1);
    bg.fillRoundedRect(-width/2, -height/2, width, height, height/2);
    
    // Progress fill
    const fill = this.scene.add.graphics();
    const fillWidth = width * progress;
    fill.fillGradientStyle(colorScheme.light, colorScheme.main, colorScheme.main, colorScheme.dark, 1);
    fill.fillRoundedRect(-width/2, -height/2, fillWidth, height, height/2);
    
    // Border
    const border = this.scene.add.graphics();
    border.lineStyle(2, colorScheme.main, 1);
    border.strokeRoundedRect(-width/2, -height/2, width, height, height/2);
    
    container.add([bg, fill, border]);
    
    return { container, bg, fill, border, updateProgress: (newProgress) => {
      fill.clear();
      const newFillWidth = width * newProgress;
      fill.fillGradientStyle(colorScheme.light, colorScheme.main, colorScheme.main, colorScheme.dark, 1);
      fill.fillRoundedRect(-width/2, -height/2, newFillWidth, height, height/2);
    }};
  }

  // Get color by name
  getColor(colorPath) {
    const parts = colorPath.split('.');
    let color = this.colors;
    for (const part of parts) {
      color = color[part];
    }
    return color;
  }

  // Convert hex to Phaser color
  hexToPhaser(hex) {
    return parseInt(hex.replace('#', '0x'));
  }
}

export default UIStyleSystem;