/**
 * Specialization UI for MonDefense
 * Allows players to choose and upgrade defense specialization paths
 */

import UIStyleSystem from '../utils/UIStyleSystem.js';

class SpecializationUI {
  constructor(scene) {
    this.scene = scene;
    this.isVisible = false;
    this.currentDefenseType = null;
    this.container = null;
    this.pathCards = [];
    this.upgradePanel = null;
    this.uiStyle = new UIStyleSystem(scene);
    
    this.createUI();
  }

  createUI() {
    // Main container
    this.container = this.scene.add.container(0, 0);
    this.container.setDepth(1000);
    this.container.setVisible(false);

    // Background overlay
    this.overlay = this.scene.add.rectangle(
      this.scene.cameras.main.centerX,
      this.scene.cameras.main.centerY,
      this.scene.cameras.main.width,
      this.scene.cameras.main.height,
      0x000000,
      0.7
    );
    this.overlay.setInteractive();
    this.overlay.on('pointerdown', () => this.hide());
    this.container.add(this.overlay);

    // Main panel with modern glass morphism
    const panelElements = this.uiStyle.createGlassPanel(
      this.scene.cameras.main.centerX - 400,
      this.scene.cameras.main.centerY - 300,
      800,
      600
    );
    this.container.add([panelElements.panel, panelElements.glow]);

    // Title with modern styling
    this.title = this.uiStyle.createStyledText(
      this.scene.cameras.main.centerX,
      this.scene.cameras.main.centerY - 270,
      'Choose Specialization',
      'h1',
      { 
        color: this.uiStyle.colors.text.primary,
        glow: this.uiStyle.colors.primary.main
      }
    ).setOrigin(0.5);
    this.container.add(this.title);

    // Close button with modern styling
    this.closeButton = this.uiStyle.createModernButton(
      this.scene.cameras.main.centerX + 370,
      this.scene.cameras.main.centerY - 270,
      40,
      40,
      '✕',
      'danger',
      () => this.hide()
    );
    this.container.add(this.closeButton);
  }

  show(defenseType) {
    this.currentDefenseType = defenseType;
    const specInfo = this.scene.upgradeSystem.getSpecializationInfo(defenseType);
    
    if (!specInfo) {
      console.error(`No specialization info for ${defenseType}`);
      return;
    }

    // Update title
    this.title.setText(`${defenseType.toUpperCase()} Specialization`);

    // Clear existing path cards
    this.clearPathCards();

    if (specInfo.currentPath) {
      // Show upgrade panel for current specialization
      this.showUpgradePanel(specInfo);
    } else {
      // Show path selection
      this.showPathSelection(specInfo);
    }

    this.container.setVisible(true);
    this.isVisible = true;
  }

  showPathSelection(specInfo) {
    const paths = Object.entries(specInfo.availablePaths);
    const startX = this.scene.cameras.main.centerX - 150;
    const startY = this.scene.cameras.main.centerY - 100;

    paths.forEach(([pathKey, pathData], index) => {
      const x = startX + (index * 300);
      const y = startY;

      // Path card with modern glass morphism
      const cardElements = this.uiStyle.createGlassPanel(x - 125, y - 150, 250, 300);
      cardElements.panel.setInteractive({ useHandCursor: true });
      
      // Path icon with modern styling
      const icon = this.uiStyle.createStyledText(x, y - 100, pathData.icon, 'h1', {
        fontSize: '48px'
      }).setOrigin(0.5);
      
      // Path name with modern styling
      const name = this.uiStyle.createStyledText(x, y - 40, pathData.name, 'h3', {
        color: this.uiStyle.colors.text.primary,
        wordWrap: { width: 220 }
      }).setOrigin(0.5);
      
      // Path description with modern styling
      const description = this.uiStyle.createStyledText(x, y + 20, pathData.description, 'body', {
        color: this.uiStyle.colors.text.secondary,
        wordWrap: { width: 220 },
        align: 'center'
      }).setOrigin(0.5);
      
      // Abilities preview with modern styling
      const abilities = Object.keys(pathData.upgrades).join('\n• ');
      const abilityText = this.uiStyle.createStyledText(x, y + 80, `Abilities:\n• ${abilities}`, 'bodySmall', {
        color: this.uiStyle.colors.text.muted,
        wordWrap: { width: 220 },
        align: 'center'
      }).setOrigin(0.5);
      
      // Select button with modern styling
      const selectBtn = this.uiStyle.createModernButton(
        x, y + 130, 120, 35, '✨ SELECT', 'primary',
        () => {
          if (this.scene.upgradeSystem.chooseSpecialization(this.currentDefenseType, pathKey)) {
            this.show(this.currentDefenseType); // Refresh to show upgrade panel
          }
        }
      );
      
      // Card hover effects
      cardElements.panel.on('pointerover', () => {
        cardElements.panel.setAlpha(0.9);
        cardElements.glow.setAlpha(1);
      });
      
      cardElements.panel.on('pointerout', () => {
        cardElements.panel.setAlpha(0.7);
        cardElements.glow.setAlpha(0.3);
      });
      
      cardElements.panel.on('pointerdown', () => {
        if (this.scene.upgradeSystem.chooseSpecialization(this.currentDefenseType, pathKey)) {
          this.show(this.currentDefenseType); // Refresh to show upgrade panel
        }
      });
      
      // Store references for cleanup
      this.pathCards.push(cardElements.panel, cardElements.glow, icon, name, description, abilityText, selectBtn);
    });
  }

  showUpgradePanel(specInfo) {
    const currentPath = specInfo.availablePaths[specInfo.currentPath];
    const centerX = this.scene.cameras.main.centerX;
    const centerY = this.scene.cameras.main.centerY;

    // Path info header with modern styling
    const pathIcon = this.uiStyle.createStyledText(centerX - 200, centerY - 150, currentPath.icon, 'h2', {
      fontSize: '32px'
    }).setOrigin(0.5);
    
    const pathName = this.uiStyle.createStyledText(centerX - 100, centerY - 150, currentPath.name, 'h2', {
      color: this.uiStyle.colors.primary.main,
      glow: this.uiStyle.colors.primary.light
    }).setOrigin(0, 0.5);
    
    this.pathCards.push(pathIcon, pathName);

    // Upgrade abilities
    const abilities = Object.entries(currentPath.upgrades);
    const startY = centerY - 80;
    
    abilities.forEach(([abilityKey, abilityData], index) => {
      const y = startY + (index * 80);
      
      // Ability background with modern glass panel
      const abilityElements = this.uiStyle.createGlassPanel(centerX - 350, y - 30, 700, 60);
      const abilityBg = abilityElements.panel;
      
      // Ability name with modern styling
      const abilityName = this.uiStyle.createStyledText(centerX - 320, y, this.formatAbilityName(abilityKey), 'h4', {
        color: this.uiStyle.colors.text.primary
      }).setOrigin(0, 0.5);
      
      // Level indicator with modern styling
      const levelText = this.uiStyle.createStyledText(centerX - 100, y, `${abilityData.level}/${abilityData.maxLevel}`, 'body', {
        color: this.uiStyle.colors.text.secondary
      }).setOrigin(0.5);
      
      // Progress bar with modern styling
      const progressBar = this.uiStyle.createProgressBar(
        centerX + 50, y, 150, 12,
        abilityData.level / abilityData.maxLevel
      );
      
      // Upgrade button with modern styling
      const canUpgrade = abilityData.level < abilityData.maxLevel;
      const upgradeCost = canUpgrade ? abilityData.cost[abilityData.level] : 0;
      const hasEnoughCoins = this.scene.gameState.farmCoins >= upgradeCost;
      
      const buttonText = canUpgrade ? `💰 ${upgradeCost}` : '✅ MAX';
      const buttonStyle = canUpgrade && hasEnoughCoins ? 'primary' : 'disabled';
      
      const upgradeBtn = this.uiStyle.createModernButton(
        centerX + 250, y, 90, 35, buttonText, buttonStyle,
        canUpgrade && hasEnoughCoins ? () => {
          if (this.scene.upgradeSystem.upgradeAbility(this.currentDefenseType, abilityKey, upgradeCost)) {
            this.show(this.currentDefenseType); // Refresh panel
          }
        } : null
      );
      
      this.pathCards.push(abilityElements.panel, abilityElements.glow, abilityName, levelText, progressBar.container, upgradeBtn);
    });
    
    // Reset button with modern styling
    const resetBtn = this.uiStyle.createModernButton(
      centerX, centerY + 200, 160, 45, '🔄 RESET SPEC', 'danger',
      () => {
        if (this.scene.upgradeSystem.resetSpecialization(this.currentDefenseType)) {
          this.show(this.currentDefenseType); // Refresh to show path selection
        }
      }
    );
    
    this.pathCards.push(resetBtn);
  }

  formatAbilityName(abilityKey) {
    return abilityKey.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  clearPathCards() {
    this.pathCards.forEach(element => {
      if (element && element.destroy) {
        element.destroy();
      }
    });
    this.pathCards = [];
  }

  hide() {
    this.container.setVisible(false);
    this.isVisible = false;
    this.currentDefenseType = null;
    this.clearPathCards();
  }

  destroy() {
    this.clearPathCards();
    if (this.container) {
      this.container.destroy();
    }
  }
}

export default SpecializationUI;