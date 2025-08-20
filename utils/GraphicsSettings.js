/**
 * Graphics Settings Manager for MonDefense
 * Handles different quality levels and optimization settings
 */

class GraphicsSettings {
  constructor(scene) {
    this.scene = scene;
    this.currentQuality = 'high'; // 'low', 'medium', 'high', 'ultra'
    this.settings = this.getDefaultSettings();
    this.loadSettings();
  }

  getDefaultSettings() {
    return {
      low: {
        particleEffects: false,
        shadowEffects: false,
        animationSmoothing: 30, // Lower FPS for animations
        textureQuality: 0.5,
        maxParticles: 10,
        uiScale: 0.8,
        screenShake: false
      },
      medium: {
        particleEffects: true,
        shadowEffects: false,
        animationSmoothing: 45,
        textureQuality: 0.75,
        maxParticles: 25,
        uiScale: 0.9,
        screenShake: true
      },
      high: {
        particleEffects: true,
        shadowEffects: true,
        animationSmoothing: 60,
        textureQuality: 1.0,
        maxParticles: 50,
        uiScale: 1.0,
        screenShake: true
      },
      ultra: {
        particleEffects: true,
        shadowEffects: true,
        animationSmoothing: 60,
        textureQuality: 1.2,
        maxParticles: 100,
        uiScale: 1.1,
        screenShake: true
      }
    };
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem('mondefense_graphics_settings');
      if (saved) {
        const data = JSON.parse(saved);
        this.currentQuality = data.quality || 'high';
      }
    } catch (error) {
      console.warn('Could not load graphics settings:', error);
    }
  }

  saveSettings() {
    try {
      localStorage.setItem('mondefense_graphics_settings', JSON.stringify({
        quality: this.currentQuality
      }));
    } catch (error) {
      console.warn('Could not save graphics settings:', error);
    }
  }

  setQuality(quality) {
    if (!this.settings[quality]) {
      console.warn('Invalid quality setting:', quality);
      return;
    }
    
    this.currentQuality = quality;
    this.saveSettings();
    this.applySettings();
  }

  getCurrentSettings() {
    return this.settings[this.currentQuality];
  }

  applySettings() {
    const settings = this.getCurrentSettings();
    
    // Apply FPS settings
    if (this.scene.game && this.scene.game.loop) {
      this.scene.game.loop.targetFps = settings.animationSmoothing;
    }

    // Apply UI scaling if scene has UI elements
    if (this.scene.scoreText) {
      const scale = settings.uiScale;
      this.scene.scoreText.setScale(scale);
      this.scene.farmCoinsText.setScale(scale);
      this.scene.waveText.setScale(scale);
      this.scene.livesText.setScale(scale);
    }

    console.log(`Graphics quality set to: ${this.currentQuality}`, settings);
  }

  // Helper methods for effects
  shouldShowParticles() {
    return this.getCurrentSettings().particleEffects;
  }

  shouldShowShadows() {
    return this.getCurrentSettings().shadowEffects;
  }

  shouldShowScreenShake() {
    return this.getCurrentSettings().screenShake;
  }

  getMaxParticles() {
    return this.getCurrentSettings().maxParticles;
  }

  getTextureQuality() {
    return this.getCurrentSettings().textureQuality;
  }

  // Auto-detect quality based on performance
  autoDetectQuality() {
    const canvas = this.scene.sys.game.canvas;
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) {
      this.setQuality('low');
      return 'low';
    }

    // Check for discrete GPU
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      if (renderer.includes('Intel') || renderer.includes('AMD Radeon R5')) {
        this.setQuality('medium');
        return 'medium';
      }
    }

    // Default to high quality
    this.setQuality('high');
    return 'high';
  }

  createSettingsMenu() {
    // Create a simple settings overlay
    const settingsContainer = this.scene.add.container(0, 0);
    settingsContainer.setDepth(10000);
    settingsContainer.visible = false;

    // Background
    const bg = this.scene.add.rectangle(
      this.scene.scale.width / 2, 
      this.scene.scale.height / 2, 
      400, 300, 
      0x000000, 
      0.8
    );
    settingsContainer.add(bg);

    // Title
    const title = this.scene.add.text(
      this.scene.scale.width / 2, 
      this.scene.scale.height / 2 - 120, 
      'Graphics Settings', {
        fontSize: '24px',
        color: '#FFFFFF',
        fontWeight: 'bold'
      }
    ).setOrigin(0.5);
    settingsContainer.add(title);

    // Quality buttons
    const qualities = ['low', 'medium', 'high', 'ultra'];
    qualities.forEach((quality, index) => {
      const button = this.scene.add.rectangle(
        this.scene.scale.width / 2, 
        this.scene.scale.height / 2 - 60 + (index * 40), 
        200, 30, 
        quality === this.currentQuality ? 0x00AA00 : 0x666666
      );
      button.setInteractive({ useHandCursor: true });
      button.on('pointerdown', () => {
        this.setQuality(quality);
        this.updateSettingsMenu(settingsContainer);
      });

      const text = this.scene.add.text(
        this.scene.scale.width / 2, 
        this.scene.scale.height / 2 - 60 + (index * 40), 
        quality.toUpperCase(), {
          fontSize: '16px',
          color: '#FFFFFF'
        }
      ).setOrigin(0.5);

      settingsContainer.add([button, text]);
    });

    // Close button
    const closeButton = this.scene.add.rectangle(
      this.scene.scale.width / 2, 
      this.scene.scale.height / 2 + 100, 
      100, 40, 
      0xFF4444
    );
    closeButton.setInteractive({ useHandCursor: true });
    closeButton.on('pointerdown', () => {
      settingsContainer.visible = false;
    });

    const closeText = this.scene.add.text(
      this.scene.scale.width / 2, 
      this.scene.scale.height / 2 + 100, 
      'Close', {
        fontSize: '16px',
        color: '#FFFFFF'
      }
    ).setOrigin(0.5);

    settingsContainer.add([closeButton, closeText]);

    return settingsContainer;
  }

  updateSettingsMenu(container) {
    // Update button colors based on current selection
    const qualities = ['low', 'medium', 'high', 'ultra'];
    qualities.forEach((quality, index) => {
      const button = container.list[2 + (index * 2)]; // Skip bg and title
      button.fillColor = quality === this.currentQuality ? 0x00AA00 : 0x666666;
    });
  }
}

export default GraphicsSettings;
