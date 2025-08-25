/**
 * Dynamic Difficulty System
 * Adjusts enemy spawn rates and health based on player performance
 */
class DynamicDifficulty {
  constructor() {
    this.difficultyLevel = 1.0; // Base difficulty multiplier
    this.performanceHistory = [];
    this.maxHistoryLength = 10; // Track last 10 waves
    
    // Performance thresholds
    this.thresholds = {
      excellent: 0.9,  // 90%+ enemies defeated
      good: 0.7,       // 70%+ enemies defeated
      average: 0.5,    // 50%+ enemies defeated
      poor: 0.3        // 30%+ enemies defeated
    };
    
    // Difficulty adjustment rates
    this.adjustmentRates = {
      increase: 0.15,   // Increase difficulty by 15%
      decrease: 0.1,    // Decrease difficulty by 10%
      maxDifficulty: 3.0,
      minDifficulty: 0.5
    };
    
    // Performance tracking
    this.currentWaveStats = {
      enemiesSpawned: 0,
      enemiesDefeated: 0,
      livesLost: 0,
      waveStartTime: 0,
      waveEndTime: 0
    };
  }
  
  /**
   * Start tracking a new wave
   */
  startWave(waveNumber) {
    this.currentWaveStats = {
      enemiesSpawned: 0,
      enemiesDefeated: 0,
      livesLost: 0,
      waveStartTime: Date.now(),
      waveEndTime: 0,
      waveNumber: waveNumber
    };
  }
  
  /**
   * Record enemy spawn
   */
  recordEnemySpawn() {
    this.currentWaveStats.enemiesSpawned++;
  }
  
  /**
   * Record enemy defeat
   */
  recordEnemyDefeat() {
    this.currentWaveStats.enemiesDefeated++;
  }
  
  /**
   * Record life lost
   */
  recordLifeLost() {
    this.currentWaveStats.livesLost++;
  }
  
  /**
   * Complete wave and analyze performance
   */
  completeWave() {
    this.currentWaveStats.waveEndTime = Date.now();
    
    // Calculate performance metrics
    const performance = this.calculateWavePerformance();
    
    // Add to history
    this.performanceHistory.push(performance);
    if (this.performanceHistory.length > this.maxHistoryLength) {
      this.performanceHistory.shift();
    }
    
    // Adjust difficulty based on recent performance
    this.adjustDifficulty();
    
    return performance;
  }
  
  /**
   * Calculate wave performance score
   */
  calculateWavePerformance() {
    const stats = this.currentWaveStats;
    
    // Base performance: enemies defeated ratio
    let defeatRatio = stats.enemiesSpawned > 0 ? 
      stats.enemiesDefeated / stats.enemiesSpawned : 0;
    
    // Penalty for lives lost
    const lifePenalty = stats.livesLost * 0.1;
    defeatRatio = Math.max(0, defeatRatio - lifePenalty);
    
    // Time bonus (faster completion = better performance)
    const waveDuration = stats.waveEndTime - stats.waveStartTime;
    const expectedDuration = 60000; // 60 seconds expected
    const timeBonus = waveDuration < expectedDuration ? 
      (expectedDuration - waveDuration) / expectedDuration * 0.1 : 0;
    
    const finalScore = Math.min(1.0, defeatRatio + timeBonus);
    
    return {
      score: finalScore,
      defeatRatio: stats.enemiesDefeated / stats.enemiesSpawned,
      livesLost: stats.livesLost,
      duration: waveDuration,
      waveNumber: stats.waveNumber,
      timestamp: Date.now()
    };
  }
  
  /**
   * Adjust difficulty based on recent performance
   */
  adjustDifficulty() {
    if (this.performanceHistory.length < 3) {
      return; // Need at least 3 waves of data
    }
    
    // Calculate average performance over recent waves
    const recentPerformance = this.performanceHistory
      .slice(-5) // Last 5 waves
      .reduce((sum, perf) => sum + perf.score, 0) / 
      Math.min(5, this.performanceHistory.length);
    
    const oldDifficulty = this.difficultyLevel;
    
    // Adjust difficulty based on performance
    if (recentPerformance >= this.thresholds.excellent) {
      // Player is doing too well, increase difficulty
      this.difficultyLevel = Math.min(
        this.adjustmentRates.maxDifficulty,
        this.difficultyLevel * (1 + this.adjustmentRates.increase)
      );
    } else if (recentPerformance >= this.thresholds.good) {
      // Player is doing well, slight increase
      this.difficultyLevel = Math.min(
        this.adjustmentRates.maxDifficulty,
        this.difficultyLevel * (1 + this.adjustmentRates.increase * 0.5)
      );
    } else if (recentPerformance <= this.thresholds.poor) {
      // Player is struggling, decrease difficulty
      this.difficultyLevel = Math.max(
        this.adjustmentRates.minDifficulty,
        this.difficultyLevel * (1 - this.adjustmentRates.decrease)
      );
    }
    // Average performance: no change
    
    // Log difficulty changes
    if (Math.abs(this.difficultyLevel - oldDifficulty) > 0.01) {
      console.log(`Difficulty adjusted: ${oldDifficulty.toFixed(2)} → ${this.difficultyLevel.toFixed(2)} (Performance: ${(recentPerformance * 100).toFixed(1)}%)`);
    }
  }
  
  /**
   * Get enemy health multiplier based on current difficulty
   */
  getHealthMultiplier() {
    return this.difficultyLevel;
  }
  
  /**
   * Get enemy spawn rate multiplier based on current difficulty
   */
  getSpawnRateMultiplier() {
    // Spawn rate increases more gradually than health
    return 1 + (this.difficultyLevel - 1) * 0.7;
  }
  
  /**
   * Get enemy speed multiplier based on current difficulty
   */
  getSpeedMultiplier() {
    // Speed increases slightly with difficulty
    return 1 + (this.difficultyLevel - 1) * 0.3;
  }
  
  /**
   * Get current difficulty level
   */
  getDifficultyLevel() {
    return this.difficultyLevel;
  }
  
  /**
   * Get difficulty description
   */
  getDifficultyDescription() {
    if (this.difficultyLevel >= 2.5) return 'Nightmare';
    if (this.difficultyLevel >= 2.0) return 'Hard';
    if (this.difficultyLevel >= 1.5) return 'Medium';
    if (this.difficultyLevel >= 1.0) return 'Normal';
    return 'Easy';
  }
  
  /**
   * Get recent performance summary
   */
  getPerformanceSummary() {
    if (this.performanceHistory.length === 0) {
      return {
        averageScore: 0,
        trend: 'neutral',
        recentWaves: 0
      };
    }
    
    const recent = this.performanceHistory.slice(-5);
    const averageScore = recent.reduce((sum, perf) => sum + perf.score, 0) / recent.length;
    
    // Calculate trend
    let trend = 'neutral';
    if (recent.length >= 3) {
      const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
      const secondHalf = recent.slice(Math.floor(recent.length / 2));
      
      const firstAvg = firstHalf.reduce((sum, perf) => sum + perf.score, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, perf) => sum + perf.score, 0) / secondHalf.length;
      
      if (secondAvg > firstAvg + 0.1) trend = 'improving';
      else if (secondAvg < firstAvg - 0.1) trend = 'declining';
    }
    
    return {
      averageScore,
      trend,
      recentWaves: recent.length,
      difficultyLevel: this.difficultyLevel,
      difficultyDescription: this.getDifficultyDescription()
    };
  }
  
  /**
   * Reset difficulty system
   */
  reset() {
    this.difficultyLevel = 1.0;
    this.performanceHistory = [];
    this.currentWaveStats = {
      enemiesSpawned: 0,
      enemiesDefeated: 0,
      livesLost: 0,
      waveStartTime: 0,
      waveEndTime: 0
    };
  }
  
  /**
   * Save difficulty data
   */
  save() {
    return {
      difficultyLevel: this.difficultyLevel,
      performanceHistory: this.performanceHistory
    };
  }
  
  /**
   * Load difficulty data
   */
  load(data) {
    if (data) {
      this.difficultyLevel = data.difficultyLevel || 1.0;
      this.performanceHistory = data.performanceHistory || [];
    }
  }
}

export default DynamicDifficulty;