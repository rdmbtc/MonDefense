/**
 * Upgrade System for MonDefense
 * Handles defense specializations with branching upgrade paths
 * Allows players to choose between different enhancement directions
 */

class UpgradeSystem {
  constructor(scene) {
    this.scene = scene;
    this.upgrades = {};
    this.specializations = {};
    
    // Initialize base upgrade values
    this.initializeBaseUpgrades();
    
    // Initialize specialization trees
    this.initializeSpecializationTrees();
  }

  initializeBaseUpgrades() {
    // Base power upgrades for each defense type
    this.upgrades = {
      chogPower: 1.0,
      molandakPower: 1.0,
      moyakiPower: 1.0,
      keonPower: 1.0,
      cropYield: 1.0,
      cropGrowth: 1.0
    };
  }

  initializeSpecializationTrees() {
    this.specializations = {
      chog: {
        currentPath: null,
        availablePaths: {
          nature_guardian: {
            name: "Nature Guardian",
            description: "Focus on area control and healing",
            icon: "🌿",
            upgrades: {
              aoe_mastery: { level: 0, maxLevel: 5, cost: [10, 20, 40, 80, 160] },
              healing_aura: { level: 0, maxLevel: 3, cost: [25, 50, 100] },
              root_entangle: { level: 0, maxLevel: 4, cost: [15, 30, 60, 120] }
            }
          },
          storm_caller: {
            name: "Storm Caller",
            description: "High damage single-target specialist",
            icon: "⚡",
            upgrades: {
              lightning_strike: { level: 0, maxLevel: 5, cost: [12, 24, 48, 96, 192] },
              chain_lightning: { level: 0, maxLevel: 3, cost: [30, 60, 120] },
              storm_focus: { level: 0, maxLevel: 4, cost: [18, 36, 72, 144] }
            }
          }
        }
      },
      molandak: {
        currentPath: null,
        availablePaths: {
          frost_fortress: {
            name: "Frost Fortress",
            description: "Defensive specialist with slowing effects",
            icon: "🧊",
            upgrades: {
              ice_wall: { level: 0, maxLevel: 4, cost: [15, 30, 60, 120] },
              permafrost: { level: 0, maxLevel: 5, cost: [12, 24, 48, 96, 192] },
              blizzard: { level: 0, maxLevel: 3, cost: [35, 70, 140] }
            }
          },
          arctic_sniper: {
            name: "Arctic Sniper",
            description: "Long-range precision attacks",
            icon: "🎯",
            upgrades: {
              extended_range: { level: 0, maxLevel: 5, cost: [10, 20, 40, 80, 160] },
              piercing_shot: { level: 0, maxLevel: 4, cost: [20, 40, 80, 160] },
              critical_freeze: { level: 0, maxLevel: 3, cost: [25, 50, 100] }
            }
          }
        }
      },
      moyaki: {
        currentPath: null,
        availablePaths: {
          inferno_lord: {
            name: "Inferno Lord",
            description: "Massive area damage and burn effects",
            icon: "🔥",
            upgrades: {
              fire_storm: { level: 0, maxLevel: 5, cost: [14, 28, 56, 112, 224] },
              burning_ground: { level: 0, maxLevel: 4, cost: [18, 36, 72, 144] },
              phoenix_rebirth: { level: 0, maxLevel: 2, cost: [50, 100] }
            }
          },
          flame_assassin: {
            name: "Flame Assassin",
            description: "Fast attacks with high critical chance",
            icon: "🗡️",
            upgrades: {
              rapid_fire: { level: 0, maxLevel: 5, cost: [12, 24, 48, 96, 192] },
              flame_dash: { level: 0, maxLevel: 3, cost: [20, 40, 80] },
              critical_burn: { level: 0, maxLevel: 4, cost: [16, 32, 64, 128] }
            }
          }
        }
      },
      keon: {
        currentPath: null,
        availablePaths: {
          divine_champion: {
            name: "Divine Champion",
            description: "Balanced offense and support abilities",
            icon: "⚔️",
            upgrades: {
              divine_blessing: { level: 0, maxLevel: 4, cost: [20, 40, 80, 160] },
              holy_strike: { level: 0, maxLevel: 5, cost: [15, 30, 60, 120, 240] },
              sanctuary: { level: 0, maxLevel: 3, cost: [30, 60, 120] }
            }
          },
          void_destroyer: {
            name: "Void Destroyer",
            description: "Ultimate damage dealer with energy manipulation",
            icon: "🌌",
            upgrades: {
              void_blast: { level: 0, maxLevel: 5, cost: [18, 36, 72, 144, 288] },
              energy_drain: { level: 0, maxLevel: 4, cost: [22, 44, 88, 176] },
              reality_tear: { level: 0, maxLevel: 2, cost: [60, 120] }
            }
          }
        }
      }
    };
  }

  // Get current upgrade value
  getUpgradeValue(upgradeKey) {
    return this.upgrades[upgradeKey] || 1.0;
  }

  // Choose specialization path for a defense type
  chooseSpecialization(defenseType, pathKey) {
    if (!this.specializations[defenseType]) {
      console.error(`Invalid defense type: ${defenseType}`);
      return false;
    }

    if (!this.specializations[defenseType].availablePaths[pathKey]) {
      console.error(`Invalid path: ${pathKey} for ${defenseType}`);
      return false;
    }

    // Check if already specialized
    if (this.specializations[defenseType].currentPath) {
      console.warn(`${defenseType} already specialized as ${this.specializations[defenseType].currentPath}`);
      return false;
    }

    this.specializations[defenseType].currentPath = pathKey;
    console.log(`${defenseType} specialized as ${pathKey}`);
    
    // Apply initial specialization bonuses
    this.applySpecializationBonuses(defenseType);
    
    return true;
  }

  // Upgrade specific ability within a specialization
  upgradeAbility(defenseType, abilityKey, cost) {
    const spec = this.specializations[defenseType];
    if (!spec || !spec.currentPath) {
      console.error(`${defenseType} not specialized`);
      return false;
    }

    const path = spec.availablePaths[spec.currentPath];
    const ability = path.upgrades[abilityKey];
    
    if (!ability) {
      console.error(`Invalid ability: ${abilityKey}`);
      return false;
    }

    if (ability.level >= ability.maxLevel) {
      console.warn(`${abilityKey} already at max level`);
      return false;
    }

    const upgradeCost = ability.cost[ability.level];
    if (this.scene.gameState.farmCoins < upgradeCost) {
      console.warn(`Not enough coins. Need ${upgradeCost}, have ${this.scene.gameState.farmCoins}`);
      return false;
    }

    // Deduct cost and upgrade
    this.scene.gameState.farmCoins -= upgradeCost;
    ability.level++;
    
    // Apply upgrade effects
    this.applySpecializationBonuses(defenseType);
    
    console.log(`Upgraded ${abilityKey} to level ${ability.level}`);
    return true;
  }

  // Apply specialization bonuses to defense stats
  applySpecializationBonuses(defenseType) {
    const spec = this.specializations[defenseType];
    if (!spec || !spec.currentPath) return;

    const path = spec.availablePaths[spec.currentPath];
    let bonusMultiplier = 1.0;

    // Calculate bonuses based on upgrade levels
    Object.entries(path.upgrades).forEach(([abilityKey, ability]) => {
      const level = ability.level;
      if (level > 0) {
        bonusMultiplier += this.getAbilityBonus(defenseType, spec.currentPath, abilityKey, level);
      }
    });

    // Update the base power upgrade
    this.upgrades[`${defenseType}Power`] = bonusMultiplier;
  }

  // Get specific ability bonus
  getAbilityBonus(defenseType, pathKey, abilityKey, level) {
    const bonusMap = {
      chog: {
        nature_guardian: {
          aoe_mastery: level * 0.15,      // +15% per level
          healing_aura: level * 0.1,      // +10% per level
          root_entangle: level * 0.12     // +12% per level
        },
        storm_caller: {
          lightning_strike: level * 0.2,  // +20% per level
          chain_lightning: level * 0.15,  // +15% per level
          storm_focus: level * 0.18       // +18% per level
        }
      },
      molandak: {
        frost_fortress: {
          ice_wall: level * 0.12,
          permafrost: level * 0.14,
          blizzard: level * 0.16
        },
        arctic_sniper: {
          extended_range: level * 0.1,
          piercing_shot: level * 0.18,
          critical_freeze: level * 0.15
        }
      },
      moyaki: {
        inferno_lord: {
          fire_storm: level * 0.18,
          burning_ground: level * 0.14,
          phoenix_rebirth: level * 0.25
        },
        flame_assassin: {
          rapid_fire: level * 0.16,
          flame_dash: level * 0.12,
          critical_burn: level * 0.2
        }
      },
      keon: {
        divine_champion: {
          divine_blessing: level * 0.15,
          holy_strike: level * 0.17,
          sanctuary: level * 0.13
        },
        void_destroyer: {
          void_blast: level * 0.22,
          energy_drain: level * 0.16,
          reality_tear: level * 0.3
        }
      }
    };

    return bonusMap[defenseType]?.[pathKey]?.[abilityKey] || 0;
  }

  // Get specialization info for UI
  getSpecializationInfo(defenseType) {
    return this.specializations[defenseType] || null;
  }

  // Check if defense can be specialized
  canSpecialize(defenseType) {
    const spec = this.specializations[defenseType];
    return spec && !spec.currentPath;
  }

  // Get upgrade cost for next level
  getUpgradeCost(defenseType, abilityKey) {
    const spec = this.specializations[defenseType];
    if (!spec || !spec.currentPath) return null;

    const path = spec.availablePaths[spec.currentPath];
    const ability = path.upgrades[abilityKey];
    
    if (!ability || ability.level >= ability.maxLevel) return null;
    
    return ability.cost[ability.level];
  }

  // Reset specialization (for testing or respec)
  resetSpecialization(defenseType) {
    const spec = this.specializations[defenseType];
    if (!spec) return false;

    if (spec.currentPath) {
      const path = spec.availablePaths[spec.currentPath];
      Object.values(path.upgrades).forEach(ability => {
        ability.level = 0;
      });
      spec.currentPath = null;
      this.upgrades[`${defenseType}Power`] = 1.0;
      console.log(`Reset specialization for ${defenseType}`);
      return true;
    }
    return false;
  }
}

export default UpgradeSystem;