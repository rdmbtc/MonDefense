/**
 * Specialization UI for MonDefense
 * Allows players to choose and upgrade defense specialization paths
 */

class SpecializationUI {
  constructor(scene) {
    this.scene = scene;
    this.isVisible = false;
    this.currentDefenseType = null;
    this.container = null;
    this.pathCards = [];
    this.upgradePanel = null;
    
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

    // Main panel
    this.panel = this.scene.add.rectangle(
      this.scene.cameras.main.centerX,
      this.scene.cameras.main.centerY,
      800,
      600,
      0x2a2a2a
    );
    this.panel.setStrokeStyle(3, 0x4a90e2);
    this.container.add(this.panel);

    // Title
    this.title = this.scene.add.text(
      this.scene.cameras.main.centerX,
      this.scene.cameras.main.centerY - 270,
      'Choose Specialization',
      {
        fontSize: '32px',
        fontFamily: 'Arial',
        fill: '#ffffff',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);
    this.container.add(this.title);

    // Close button
    this.closeButton = this.scene.add.text(
      this.scene.cameras.main.centerX + 370,
      this.scene.cameras.main.centerY - 270,
      '✕',
      {
        fontSize: '24px',
        fontFamily: 'Arial',
        fill: '#ff6b6b',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);
    this.closeButton.setInteractive({ useHandCursor: true });
    this.closeButton.on('pointerdown', () => this.hide());
    this.closeButton.on('pointerover', () => this.closeButton.setScale(1.2));
    this.closeButton.on('pointerout', () => this.closeButton.setScale(1));
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

      // Path card background
      const cardBg = this.scene.add.rectangle(x, y, 250, 300, 0x3a3a3a);
      cardBg.setStrokeStyle(2, 0x5a5a5a);
      cardBg.setInteractive({ useHandCursor: true });
      
      // Path icon
      const icon = this.scene.add.text(x, y - 100, pathData.icon, {
        fontSize: '48px'
      }).setOrigin(0.5);
      
      // Path name
      const name = this.scene.add.text(x, y - 40, pathData.name, {
        fontSize: '18px',
        fontFamily: 'Arial',
        fill: '#ffffff',
        fontStyle: 'bold',
        wordWrap: { width: 220 }
      }).setOrigin(0.5);
      
      // Path description
      const description = this.scene.add.text(x, y + 20, pathData.description, {
        fontSize: '14px',
        fontFamily: 'Arial',
        fill: '#cccccc',
        wordWrap: { width: 220 },
        align: 'center'
      }).setOrigin(0.5);
      
      // Abilities preview
      const abilities = Object.keys(pathData.upgrades).join('\n• ');
      const abilityText = this.scene.add.text(x, y + 80, `Abilities:\n• ${abilities}`, {
        fontSize: '12px',
        fontFamily: 'Arial',
        fill: '#aaaaaa',
        wordWrap: { width: 220 },
        align: 'center'
      }).setOrigin(0.5);
      
      // Select button
      const selectBtn = this.scene.add.rectangle(x, y + 130, 120, 30, 0x4a90e2);
      selectBtn.setStrokeStyle(1, 0x6ab7ff);
      selectBtn.setInteractive({ useHandCursor: true });
      
      const selectText = this.scene.add.text(x, y + 130, 'SELECT', {
        fontSize: '14px',
        fontFamily: 'Arial',
        fill: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      
      // Hover effects
      cardBg.on('pointerover', () => {
        cardBg.setStrokeStyle(3, 0x4a90e2);
        selectBtn.setFillStyle(0x6ab7ff);
      });
      
      cardBg.on('pointerout', () => {
        cardBg.setStrokeStyle(2, 0x5a5a5a);
        selectBtn.setFillStyle(0x4a90e2);
      });
      
      // Selection handler
      const selectHandler = () => {
        if (this.scene.upgradeSystem.chooseSpecialization(this.currentDefenseType, pathKey)) {
          this.show(this.currentDefenseType); // Refresh to show upgrade panel
        }
      };
      
      cardBg.on('pointerdown', selectHandler);
      selectBtn.on('pointerdown', selectHandler);
      
      // Store references for cleanup
      this.pathCards.push(cardBg, icon, name, description, abilityText, selectBtn, selectText);
    });
  }

  showUpgradePanel(specInfo) {
    const currentPath = specInfo.availablePaths[specInfo.currentPath];
    const centerX = this.scene.cameras.main.centerX;
    const centerY = this.scene.cameras.main.centerY;

    // Path info header
    const pathIcon = this.scene.add.text(centerX - 200, centerY - 150, currentPath.icon, {
      fontSize: '32px'
    }).setOrigin(0.5);
    
    const pathName = this.scene.add.text(centerX - 100, centerY - 150, currentPath.name, {
      fontSize: '24px',
      fontFamily: 'Arial',
      fill: '#4a90e2',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);
    
    this.pathCards.push(pathIcon, pathName);

    // Upgrade abilities
    const abilities = Object.entries(currentPath.upgrades);
    const startY = centerY - 80;
    
    abilities.forEach(([abilityKey, abilityData], index) => {
      const y = startY + (index * 80);
      
      // Ability background
      const abilityBg = this.scene.add.rectangle(centerX, y, 700, 60, 0x3a3a3a);
      abilityBg.setStrokeStyle(1, 0x5a5a5a);
      
      // Ability name
      const abilityName = this.scene.add.text(centerX - 320, y, this.formatAbilityName(abilityKey), {
        fontSize: '16px',
        fontFamily: 'Arial',
        fill: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5);
      
      // Level indicator
      const levelText = this.scene.add.text(centerX - 100, y, `${abilityData.level}/${abilityData.maxLevel}`, {
        fontSize: '14px',
        fontFamily: 'Arial',
        fill: '#cccccc'
      }).setOrigin(0.5);
      
      // Progress bar
      const progressBg = this.scene.add.rectangle(centerX + 50, y, 150, 10, 0x2a2a2a);
      const progressFill = this.scene.add.rectangle(
        centerX + 50 - 75 + (150 * abilityData.level / abilityData.maxLevel) / 2,
        y,
        150 * abilityData.level / abilityData.maxLevel,
        10,
        0x4a90e2
      );
      
      // Upgrade button
      const canUpgrade = abilityData.level < abilityData.maxLevel;
      const upgradeCost = canUpgrade ? abilityData.cost[abilityData.level] : 0;
      const hasEnoughCoins = this.scene.gameState.farmCoins >= upgradeCost;
      
      const upgradeBtn = this.scene.add.rectangle(centerX + 250, y, 80, 30, 
        canUpgrade && hasEnoughCoins ? 0x4a90e2 : 0x666666);
      upgradeBtn.setStrokeStyle(1, canUpgrade && hasEnoughCoins ? 0x6ab7ff : 0x888888);
      
      const upgradeBtnText = this.scene.add.text(centerX + 250, y, 
        canUpgrade ? `${upgradeCost}` : 'MAX', {
        fontSize: '12px',
        fontFamily: 'Arial',
        fill: canUpgrade && hasEnoughCoins ? '#ffffff' : '#aaaaaa',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      
      if (canUpgrade && hasEnoughCoins) {
        upgradeBtn.setInteractive({ useHandCursor: true });
        upgradeBtn.on('pointerdown', () => {
          if (this.scene.upgradeSystem.upgradeAbility(this.currentDefenseType, abilityKey, upgradeCost)) {
            this.show(this.currentDefenseType); // Refresh panel
          }
        });
        
        upgradeBtn.on('pointerover', () => upgradeBtn.setFillStyle(0x6ab7ff));
        upgradeBtn.on('pointerout', () => upgradeBtn.setFillStyle(0x4a90e2));
      }
      
      this.pathCards.push(abilityBg, abilityName, levelText, progressBg, progressFill, upgradeBtn, upgradeBtnText);
    });
    
    // Reset button
    const resetBtn = this.scene.add.rectangle(centerX, centerY + 200, 150, 40, 0xff6b6b);
    resetBtn.setStrokeStyle(2, 0xff8e8e);
    resetBtn.setInteractive({ useHandCursor: true });
    
    const resetText = this.scene.add.text(centerX, centerY + 200, 'RESET SPEC', {
      fontSize: '14px',
      fontFamily: 'Arial',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    resetBtn.on('pointerdown', () => {
      if (this.scene.upgradeSystem.resetSpecialization(this.currentDefenseType)) {
        this.show(this.currentDefenseType); // Refresh to show path selection
      }
    });
    
    resetBtn.on('pointerover', () => resetBtn.setFillStyle(0xff8e8e));
    resetBtn.on('pointerout', () => resetBtn.setFillStyle(0xff6b6b));
    
    this.pathCards.push(resetBtn, resetText);
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