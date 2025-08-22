class Crop2 {
    constructor(scene, x, y) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.currentStage = 1; // Start at seedling stage
        this.maxStage = 4; // Harvestable stage
        this.isGrowing = true;
        this.isHarvestable = false;
        
        // Growth timing (in milliseconds)
        this.stageGrowthTime = 3000; // 3 seconds per stage
        this.stageCooldown = 1000; // 1 second cooldown between stages
        
        // Create the initial sprite
        this.sprite = scene.add.image(x, y, `plant${this.currentStage}`);
        this.sprite.setScale(1.2);
        this.sprite.setDepth(10);
        this.sprite.setInteractive();
        
        // Add click handler for manual harvest (only when harvestable)
        this.sprite.on('pointerdown', () => {
            if (this.isHarvestable) {
                this.harvest();
            }
        });
        
        // Start growth animation with entrance effect
        this.playEntranceAnimation();
        
        // Start the growth cycle
        this.startGrowthCycle();
    }
    
    playEntranceAnimation() {
        // Start small and fade in
        this.sprite.setScale(0.1);
        this.sprite.setAlpha(0);
        
        this.scene.tweens.add({
            targets: this.sprite,
            scaleX: 1.2,
            scaleY: 1.2,
            alpha: 1,
            duration: 500,
            ease: 'Back.easeOut'
        });
    }
    
    startGrowthCycle() {
        if (!this.isGrowing || this.currentStage >= this.maxStage) {
            if (this.currentStage >= this.maxStage) {
                this.isHarvestable = true;
                this.addHarvestGlow();
            }
            return;
        }
        
        // Wait for stage growth time, then advance to next stage
        this.scene.time.delayedCall(this.stageGrowthTime, () => {
            this.advanceStage();
        });
    }
    
    advanceStage() {
        if (this.currentStage >= this.maxStage) {
            return;
        }
        
        // Advance to next stage
        this.currentStage++;
        
        // Play growth animation
        this.playGrowthAnimation(() => {
            // After growth animation, wait for cooldown then continue cycle
            this.scene.time.delayedCall(this.stageCooldown, () => {
                this.startGrowthCycle();
            });
        });
    }
    
    playGrowthAnimation(onComplete) {
        // Create growth effect
        const growthEffect = this.scene.add.circle(this.x, this.y, 30, 0x00ff00, 0.3);
        growthEffect.setDepth(9);
        
        // Animate growth effect
        this.scene.tweens.add({
            targets: growthEffect,
            scale: 2,
            alpha: 0,
            duration: 400,
            onComplete: () => growthEffect.destroy()
        });
        
        // Scale down current sprite
        this.scene.tweens.add({
            targets: this.sprite,
            scaleX: 0.8,
            scaleY: 0.8,
            duration: 200,
            onComplete: () => {
                // Change to next stage texture
                this.sprite.setTexture(`plant${this.currentStage}`);
                
                // Scale back up with bounce
                this.scene.tweens.add({
                    targets: this.sprite,
                    scaleX: 1.2,
                    scaleY: 1.2,
                    duration: 300,
                    ease: 'Back.easeOut',
                    onComplete: onComplete
                });
            }
        });
    }
    
    addHarvestGlow() {
        // Add a subtle glow to indicate harvestable state
        this.harvestGlow = this.scene.add.circle(this.x, this.y, 35, 0xffff00, 0.2);
        this.harvestGlow.setDepth(9);
        
        // Pulsing glow animation
        this.scene.tweens.add({
            targets: this.harvestGlow,
            alpha: 0.4,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
    
    harvest() {
        if (!this.isHarvestable) {
            return;
        }
        
        // Find the plot key for this crop
        let plotKey = null;
        for (let key in this.scene.crops) {
            if (this.scene.crops[key].crop === this) {
                plotKey = key;
                break;
            }
        }
        
        if (plotKey) {
            this.scene.harvestCrop(this, plotKey);
        }
    }
    
    destroy() {
        // Clean up all visual elements
        if (this.sprite && this.sprite.active) {
            this.sprite.destroy();
        }
        if (this.harvestGlow && this.harvestGlow.active) {
            this.harvestGlow.destroy();
        }
        
        // Stop growth
        this.isGrowing = false;
    }
}

// Export the Crop2 class
export default Crop2;