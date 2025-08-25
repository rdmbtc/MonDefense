export default class EvolutionProgressUI {
  constructor(scene) {
    this.scene = scene;
    this.progressBars = new Map(); // Store progress bars for each defense
    this.isVisible = true;
  }
  
  // Create evolution progress bar for a defense
  createProgressBar(defense) {
    if (!defense || !defense.defenseEvolution) return;
    
    const progress = defense.defenseEvolution.getEvolutionProgress(defense);
    if (!progress) return;
    
    // Remove existing progress bar if it exists
    this.removeProgressBar(defense);
    
    const x = defense.x;
    const y = defense.y + 45; // Position below the defense
    
    // Create container for the progress bar
    const container = this.scene.add.container(x, y);
    container.setDepth(250);
    
    // Background bar
    const bgBar = this.scene.add.rectangle(0, 0, 60, 8, 0x333333, 0.8);
    bgBar.setStrokeStyle(1, 0x555555, 0.9);
    container.add(bgBar);
    
    // Progress fill
    const fillWidth = progress.isMaxLevel ? 60 : 60 * progress.progress;
    const fillColor = progress.isMaxLevel ? 0xFFD700 : // Gold for max level
                     progress.progress >= 0.8 ? 0x00FF00 : // Green when close
                     progress.progress >= 0.5 ? 0xFFFF00 : // Yellow when halfway
                     0xFF6600; // Orange when starting
    
    const progressFill = this.scene.add.rectangle(-30 + fillWidth/2, 0, fillWidth, 6, fillColor, 0.9);
    container.add(progressFill);
    
    // Evolution stage indicator
    if (progress.currentStage > 0) {
      const stageText = this.scene.add.text(0, -15, `★${progress.currentStage}`, {
        fontSize: '12px',
        fontFamily: 'Arial',
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);
      container.add(stageText);
    }
    
    // Progress text
    let progressText;
    if (progress.isMaxLevel) {
      progressText = this.scene.add.text(0, 12, 'MAX', {
        fontSize: '10px',
        fontFamily: 'Arial',
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 1
      }).setOrigin(0.5);
    } else {
      progressText = this.scene.add.text(0, 12, `${progress.current}/${progress.required}`, {
        fontSize: '9px',
        fontFamily: 'Arial',
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 1
      }).setOrigin(0.5);
    }
    container.add(progressText);
    
    // Store the progress bar components
    this.progressBars.set(defense, {
      container,
      bgBar,
      progressFill,
      progressText,
      stageText: progress.currentStage > 0 ? container.list[2] : null,
      defense
    });
    
    // Set initial visibility
    container.setVisible(this.isVisible);
    
    return container;
  }
  
  // Update progress bar for a defense
  updateProgressBar(defense) {
    if (!defense || !defense.defenseEvolution) return;
    
    const progressBarData = this.progressBars.get(defense);
    if (!progressBarData) {
      // Create new progress bar if it doesn't exist
      this.createProgressBar(defense);
      return;
    }
    
    const progress = defense.defenseEvolution.getEvolutionProgress(defense);
    if (!progress) return;
    
    const { container, progressFill, progressText, stageText } = progressBarData;
    
    // Update position
    container.x = defense.x;
    container.y = defense.y + 45;
    
    // Update progress fill
    const fillWidth = progress.isMaxLevel ? 60 : 60 * progress.progress;
    const fillColor = progress.isMaxLevel ? 0xFFD700 : // Gold for max level
                     progress.progress >= 0.8 ? 0x00FF00 : // Green when close
                     progress.progress >= 0.5 ? 0xFFFF00 : // Yellow when halfway
                     0xFF6600; // Orange when starting
    
    progressFill.width = fillWidth;
    progressFill.x = -30 + fillWidth/2;
    progressFill.fillColor = fillColor;
    
    // Update progress text
    if (progress.isMaxLevel) {
      progressText.setText('MAX');
      progressText.setColor('#FFD700');
    } else {
      progressText.setText(`${progress.current}/${progress.required}`);
      progressText.setColor('#FFFFFF');
    }
    
    // Update stage indicator
    if (progress.currentStage > 0) {
      if (!stageText) {
        // Create stage text if it doesn't exist
        const newStageText = this.scene.add.text(0, -15, `★${progress.currentStage}`, {
          fontSize: '12px',
          fontFamily: 'Arial',
          color: '#FFD700',
          stroke: '#000000',
          strokeThickness: 2
        }).setOrigin(0.5);
        container.add(newStageText);
        progressBarData.stageText = newStageText;
      } else {
        stageText.setText(`★${progress.currentStage}`);
      }
    } else if (stageText) {
      stageText.setVisible(false);
    }
  }
  
  // Remove progress bar for a defense
  removeProgressBar(defense) {
    const progressBarData = this.progressBars.get(defense);
    if (progressBarData) {
      progressBarData.container.destroy();
      this.progressBars.delete(defense);
    }
  }
  
  // Update all progress bars
  updateAllProgressBars() {
    if (!this.scene || !this.scene.defenses) return;
    
    // Update existing progress bars
    for (const [defense, progressBarData] of this.progressBars) {
      if (defense.active) {
        this.updateProgressBar(defense);
      } else {
        // Remove progress bar for inactive defenses
        this.removeProgressBar(defense);
      }
    }
    
    // Create progress bars for new defenses
    this.scene.defenses.forEach(defense => {
      if (defense.active && !this.progressBars.has(defense)) {
        this.createProgressBar(defense);
      }
    });
  }
  
  // Toggle visibility of all progress bars
  toggleVisibility() {
    this.isVisible = !this.isVisible;
    
    for (const [defense, progressBarData] of this.progressBars) {
      progressBarData.container.setVisible(this.isVisible);
    }
  }
  
  // Set visibility of all progress bars
  setVisible(visible) {
    this.isVisible = visible;
    
    for (const [defense, progressBarData] of this.progressBars) {
      progressBarData.container.setVisible(this.isVisible);
    }
  }
  
  // Show evolution tooltip when hovering over a defense
  showEvolutionTooltip(defense, x, y) {
    if (!defense || !defense.defenseEvolution) return;
    
    const progress = defense.defenseEvolution.getEvolutionProgress(defense);
    if (!progress) return;
    
    // Remove existing tooltip
    this.hideEvolutionTooltip();
    
    let tooltipText;
    if (progress.isMaxLevel) {
      tooltipText = `${progress.currentStageName}\nMAX LEVEL`;
    } else {
      const killsNeeded = progress.required - progress.current;
      tooltipText = `${progress.currentStageName}\nNext: ${progress.nextStageName}\nKills needed: ${killsNeeded}`;
    }
    
    // Create tooltip background
    const padding = 10;
    const lineHeight = 16;
    const lines = tooltipText.split('\n');
    const maxWidth = Math.max(...lines.map(line => line.length * 8));
    const tooltipHeight = lines.length * lineHeight + padding * 2;
    
    this.tooltipContainer = this.scene.add.container(x, y - 60);
    this.tooltipContainer.setDepth(400);
    
    // Background
    const bg = this.scene.add.rectangle(0, 0, maxWidth + padding * 2, tooltipHeight, 0x000000, 0.9);
    bg.setStrokeStyle(2, 0xFFD700, 0.8);
    this.tooltipContainer.add(bg);
    
    // Text
    const text = this.scene.add.text(0, 0, tooltipText, {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: '#FFFFFF',
      align: 'center',
      lineSpacing: 4
    }).setOrigin(0.5);
    this.tooltipContainer.add(text);
    
    // Animate tooltip appearance
    this.tooltipContainer.setScale(0);
    this.scene.tweens.add({
      targets: this.tooltipContainer,
      scaleX: 1,
      scaleY: 1,
      duration: 200,
      ease: 'Back.easeOut'
    });
  }
  
  // Hide evolution tooltip
  hideEvolutionTooltip() {
    if (this.tooltipContainer) {
      this.tooltipContainer.destroy();
      this.tooltipContainer = null;
    }
  }
  
  // Clean up all progress bars
  destroy() {
    for (const [defense, progressBarData] of this.progressBars) {
      progressBarData.container.destroy();
    }
    this.progressBars.clear();
    
    this.hideEvolutionTooltip();
  }
}