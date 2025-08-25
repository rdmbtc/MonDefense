/**
 * ElementalSystem.js
 * Implements rock-paper-scissors elemental weakness system
 * Each defense element is strong/weak against certain enemy elements
 */

export default class ElementalSystem {
  constructor() {
    // Define elemental types for defenses
    this.defenseElements = {
      'chog': 'nature',     // Nature magic - green
      'molandak': 'ice',    // Ice magic - blue
      'moyaki': 'fire',     // Fire magic - red
      'keon': 'divine'      // Divine magic - gold
    };

    // Define elemental types for enemies
    this.enemyElements = {
      'rabbit': 'earth',    // Earth creatures
      'bird': 'air',        // Air creatures
      'deer': 'nature',     // Nature creatures
      'bear': 'fire',       // Fire creatures
      'fox': 'shadow',      // Shadow creatures
      'wolf': 'ice'         // Ice creatures
    };

    // Rock-paper-scissors effectiveness matrix
    // 1.5 = strong against, 0.75 = weak against, 1.0 = neutral
    this.effectiveness = {
      'nature': {
        'earth': 1.5,    // Nature strong vs Earth
        'shadow': 1.5,   // Nature strong vs Shadow
        'air': 0.75,     // Nature weak vs Air
        'fire': 0.75,    // Nature weak vs Fire
        'ice': 1.0,      // Nature neutral vs Ice
        'nature': 1.0    // Nature neutral vs Nature
      },
      'ice': {
        'fire': 1.5,     // Ice strong vs Fire
        'air': 1.5,      // Ice strong vs Air
        'earth': 0.75,   // Ice weak vs Earth
        'nature': 0.75,  // Ice weak vs Nature
        'shadow': 1.0,   // Ice neutral vs Shadow
        'ice': 1.0       // Ice neutral vs Ice
      },
      'fire': {
        'ice': 1.5,      // Fire strong vs Ice
        'nature': 1.5,   // Fire strong vs Nature
        'air': 0.75,     // Fire weak vs Air
        'shadow': 0.75,  // Fire weak vs Shadow
        'earth': 1.0,    // Fire neutral vs Earth
        'fire': 1.0      // Fire neutral vs Fire
      },
      'divine': {
        'shadow': 2.0,   // Divine very strong vs Shadow
        'fire': 1.25,    // Divine moderately strong vs Fire
        'ice': 1.25,     // Divine moderately strong vs Ice
        'earth': 1.0,    // Divine neutral vs Earth
        'air': 1.0,      // Divine neutral vs Air
        'nature': 1.0    // Divine neutral vs Nature
      }
    };

    // Visual effects for elemental interactions
    this.elementColors = {
      'nature': 0x00AA00,  // Green
      'ice': 0x66CCFF,     // Light blue
      'fire': 0xFF4400,    // Red-orange
      'divine': 0xFFD700,  // Gold
      'earth': 0x8B4513,   // Brown
      'air': 0x87CEEB,     // Sky blue
      'shadow': 0x4B0082   // Indigo
    };

    // Particle effects for different elements
    this.elementParticles = {
      'nature': '🌿',
      'ice': '❄️',
      'fire': '🔥',
      'divine': '✨',
      'earth': '🪨',
      'air': '💨',
      'shadow': '🌑'
    };
  }

  /**
   * Get the element type for a defense
   * @param {string} defenseType - The defense type (chog, molandak, etc.)
   * @returns {string} The element type
   */
  getDefenseElement(defenseType) {
    return this.defenseElements[defenseType] || 'nature';
  }

  /**
   * Get the element type for an enemy
   * @param {string} enemyType - The enemy type (rabbit, bird, etc.)
   * @returns {string} The element type
   */
  getEnemyElement(enemyType) {
    return this.enemyElements[enemyType] || 'earth';
  }

  /**
   * Calculate damage multiplier based on elemental effectiveness
   * @param {string} defenseType - The attacking defense type
   * @param {string} enemyType - The target enemy type
   * @returns {number} Damage multiplier (0.75 to 2.0)
   */
  getDamageMultiplier(defenseType, enemyType) {
    const defenseElement = this.getDefenseElement(defenseType);
    const enemyElement = this.getEnemyElement(enemyType);
    
    return this.effectiveness[defenseElement]?.[enemyElement] || 1.0;
  }

  /**
   * Get effectiveness description for UI display
   * @param {string} defenseType - The defense type
   * @param {string} enemyType - The enemy type
   * @returns {object} Object with effectiveness level and description
   */
  getEffectivenessInfo(defenseType, enemyType) {
    const multiplier = this.getDamageMultiplier(defenseType, enemyType);
    const defenseElement = this.getDefenseElement(defenseType);
    const enemyElement = this.getEnemyElement(enemyType);
    
    let level, description, color;
    
    if (multiplier >= 1.75) {
      level = 'very_effective';
      description = 'Very Effective!';
      color = 0x00FF00; // Bright green
    } else if (multiplier >= 1.25) {
      level = 'effective';
      description = 'Effective';
      color = 0x90EE90; // Light green
    } else if (multiplier <= 0.8) {
      level = 'not_effective';
      description = 'Not Very Effective';
      color = 0xFF6B6B; // Light red
    } else {
      level = 'neutral';
      description = 'Normal Damage';
      color = 0xFFFFFF; // White
    }
    
    return {
      level,
      description,
      color,
      multiplier,
      defenseElement,
      enemyElement,
      defenseParticle: this.elementParticles[defenseElement],
      enemyParticle: this.elementParticles[enemyElement]
    };
  }

  /**
   * Get color for an element
   * @param {string} element - The element type
   * @returns {number} Hex color value
   */
  getElementColor(element) {
    return this.elementColors[element] || 0xFFFFFF;
  }

  /**
   * Get particle emoji for an element
   * @param {string} element - The element type
   * @returns {string} Emoji representing the element
   */
  getElementParticle(element) {
    return this.elementParticles[element] || '⚡';
  }

  /**
   * Create visual effect for elemental interaction
   * @param {object} scene - Phaser scene
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {string} defenseType - Defense type
   * @param {string} enemyType - Enemy type
   */
  createElementalEffect(scene, x, y, defenseType, enemyType) {
    const info = this.getEffectivenessInfo(defenseType, enemyType);
    const defenseElement = this.getDefenseElement(defenseType);
    
    // Create particle burst based on effectiveness
    const particleCount = info.level === 'very_effective' ? 12 : 
                         info.level === 'effective' ? 8 : 
                         info.level === 'not_effective' ? 4 : 6;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const distance = 20 + Math.random() * 30;
      const particleX = x + Math.cos(angle) * distance;
      const particleY = y + Math.sin(angle) * distance;
      
      const particle = scene.add.circle(particleX, particleY, 3 + Math.random() * 2, info.color, 0.8);
      particle.setDepth(200);
      
      scene.tweens.add({
        targets: particle,
        alpha: 0,
        scale: { from: 1.0, to: 0.2 },
        x: particleX + (Math.random() * 40 - 20),
        y: particleY + (Math.random() * 40 - 20),
        duration: 500 + Math.random() * 300,
        onComplete: () => particle.destroy()
      });
    }
    
    // Show effectiveness text
    if (info.level !== 'neutral') {
      const effectText = scene.add.text(x, y - 30, info.description, {
        fontSize: '14px',
        fill: `#${info.color.toString(16).padStart(6, '0')}`,
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);
      
      effectText.setDepth(201);
      
      scene.tweens.add({
        targets: effectText,
        y: y - 60,
        alpha: 0,
        duration: 1000,
        onComplete: () => effectText.destroy()
      });
    }
  }

  /**
   * Get all enemies that a defense is strong against
   * @param {string} defenseType - The defense type
   * @returns {Array} Array of enemy types this defense is strong against
   */
  getStrongAgainst(defenseType) {
    const defenseElement = this.getDefenseElement(defenseType);
    const strongAgainst = [];
    
    for (const [enemyType, enemyElement] of Object.entries(this.enemyElements)) {
      if (this.effectiveness[defenseElement]?.[enemyElement] > 1.0) {
        strongAgainst.push(enemyType);
      }
    }
    
    return strongAgainst;
  }

  /**
   * Get all enemies that a defense is weak against
   * @param {string} defenseType - The defense type
   * @returns {Array} Array of enemy types this defense is weak against
   */
  getWeakAgainst(defenseType) {
    const defenseElement = this.getDefenseElement(defenseType);
    const weakAgainst = [];
    
    for (const [enemyType, enemyElement] of Object.entries(this.enemyElements)) {
      if (this.effectiveness[defenseElement]?.[enemyElement] < 1.0) {
        weakAgainst.push(enemyType);
      }
    }
    
    return weakAgainst;
  }
}