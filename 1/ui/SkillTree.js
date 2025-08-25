/**
 * Skill Tree System for Defense Upgrades
 * Manages individual upgrade paths for each defense type
 */

class SkillTree {
    constructor() {
        this.skillTrees = this.initializeSkillTrees();
        this.playerSkills = {}; // Track player's unlocked skills
        this.skillPoints = 0; // Available skill points
    }

    initializeSkillTrees() {
        return {
            archer: {
                name: 'Archer Tower',
                branches: {
                    damage: {
                        name: 'Damage Path',
                        skills: [
                            { id: 'archer_damage_1', name: 'Sharp Arrows', description: '+20% damage', cost: 1, maxLevel: 3, effect: { damage: 0.2 } },
                            { id: 'archer_damage_2', name: 'Piercing Shot', description: 'Arrows pierce through enemies', cost: 2, maxLevel: 1, effect: { pierce: true } },
                            { id: 'archer_damage_3', name: 'Critical Strike', description: '15% chance for 2x damage', cost: 3, maxLevel: 1, effect: { critChance: 0.15, critMultiplier: 2 } }
                        ]
                    },
                    range: {
                        name: 'Range Path',
                        skills: [
                            { id: 'archer_range_1', name: 'Eagle Eye', description: '+25% range', cost: 1, maxLevel: 3, effect: { range: 0.25 } },
                            { id: 'archer_range_2', name: 'Watchtower', description: 'Reveals invisible enemies', cost: 2, maxLevel: 1, effect: { truesight: true } },
                            { id: 'archer_range_3', name: 'Sniper Shot', description: 'Unlimited range on single target', cost: 3, maxLevel: 1, effect: { sniperMode: true } }
                        ]
                    },
                    speed: {
                        name: 'Speed Path',
                        skills: [
                            { id: 'archer_speed_1', name: 'Quick Draw', description: '+30% attack speed', cost: 1, maxLevel: 3, effect: { attackSpeed: 0.3 } },
                            { id: 'archer_speed_2', name: 'Multi Shot', description: 'Shoots 2 arrows at once', cost: 2, maxLevel: 1, effect: { multiShot: 2 } },
                            { id: 'archer_speed_3', name: 'Arrow Storm', description: 'Chance to shoot 5 arrows', cost: 3, maxLevel: 1, effect: { stormChance: 0.2, stormCount: 5 } }
                        ]
                    },
                    special: {
                        name: 'Special Path',
                        skills: [
                            { id: 'archer_special_1', name: 'Poison Arrows', description: 'Arrows apply poison DoT', cost: 2, maxLevel: 1, effect: { poison: { damage: 10, duration: 3 } } },
                            { id: 'archer_special_2', name: 'Explosive Arrows', description: 'Arrows explode on impact', cost: 3, maxLevel: 1, effect: { explosion: { radius: 50, damage: 0.5 } } },
                            { id: 'archer_special_3', name: 'Homing Arrows', description: 'Arrows track targets', cost: 4, maxLevel: 1, effect: { homing: true } }
                        ]
                    }
                }
            },
            mage: {
                name: 'Mage Tower',
                branches: {
                    damage: {
                        name: 'Damage Path',
                        skills: [
                            { id: 'mage_damage_1', name: 'Arcane Power', description: '+25% spell damage', cost: 1, maxLevel: 3, effect: { damage: 0.25 } },
                            { id: 'mage_damage_2', name: 'Spell Penetration', description: 'Ignores 50% magic resistance', cost: 2, maxLevel: 1, effect: { penetration: 0.5 } },
                            { id: 'mage_damage_3', name: 'Arcane Orb', description: 'Spells bounce between enemies', cost: 3, maxLevel: 1, effect: { bounce: 2 } }
                        ]
                    },
                    range: {
                        name: 'Range Path',
                        skills: [
                            { id: 'mage_range_1', name: 'Extended Reach', description: '+30% spell range', cost: 1, maxLevel: 3, effect: { range: 0.3 } },
                            { id: 'mage_range_2', name: 'Area Mastery', description: '+50% AoE radius', cost: 2, maxLevel: 1, effect: { aoeRadius: 0.5 } },
                            { id: 'mage_range_3', name: 'Global Cast', description: 'Can target anywhere on map', cost: 3, maxLevel: 1, effect: { globalRange: true } }
                        ]
                    },
                    mana: {
                        name: 'Mana Path',
                        skills: [
                            { id: 'mage_mana_1', name: 'Mana Efficiency', description: '-20% mana cost', cost: 1, maxLevel: 3, effect: { manaCost: -0.2 } },
                            { id: 'mage_mana_2', name: 'Mana Shield', description: 'Absorbs damage with mana', cost: 2, maxLevel: 1, effect: { manaShield: true } },
                            { id: 'mage_mana_3', name: 'Infinite Mana', description: 'Spells cost no mana for 10s', cost: 4, maxLevel: 1, effect: { infiniteMana: { duration: 10, cooldown: 60 } } }
                        ]
                    },
                    special: {
                        name: 'Special Path',
                        skills: [
                            { id: 'mage_special_1', name: 'Elemental Mastery', description: 'Spells cycle through elements', cost: 2, maxLevel: 1, effect: { elementalCycle: true } },
                            { id: 'mage_special_2', name: 'Time Warp', description: 'Slows enemies in range', cost: 3, maxLevel: 1, effect: { timeWarp: { slow: 0.5, radius: 100 } } },
                            { id: 'mage_special_3', name: 'Meteor', description: 'Summons devastating meteor', cost: 4, maxLevel: 1, effect: { meteor: { damage: 500, radius: 150, delay: 2 } } }
                        ]
                    }
                }
            },
            cannon: {
                name: 'Cannon Tower',
                branches: {
                    damage: {
                        name: 'Damage Path',
                        skills: [
                            { id: 'cannon_damage_1', name: 'Heavy Shells', description: '+30% damage', cost: 1, maxLevel: 3, effect: { damage: 0.3 } },
                            { id: 'cannon_damage_2', name: 'Armor Piercing', description: 'Ignores armor', cost: 2, maxLevel: 1, effect: { armorPiercing: true } },
                            { id: 'cannon_damage_3', name: 'Devastating Blast', description: 'Double damage to groups', cost: 3, maxLevel: 1, effect: { groupDamage: 2 } }
                        ]
                    },
                    range: {
                        name: 'Range Path',
                        skills: [
                            { id: 'cannon_range_1', name: 'Long Barrel', description: '+35% range', cost: 1, maxLevel: 3, effect: { range: 0.35 } },
                            { id: 'cannon_range_2', name: 'Siege Mode', description: 'Massive range, slower attack', cost: 2, maxLevel: 1, effect: { siegeMode: { rangeMultiplier: 2, speedMultiplier: 0.5 } } },
                            { id: 'cannon_range_3', name: 'Artillery Strike', description: 'Can target off-screen', cost: 3, maxLevel: 1, effect: { artillery: true } }
                        ]
                    },
                    aoe: {
                        name: 'AoE Path',
                        skills: [
                            { id: 'cannon_aoe_1', name: 'Explosive Shells', description: '+40% explosion radius', cost: 1, maxLevel: 3, effect: { explosionRadius: 0.4 } },
                            { id: 'cannon_aoe_2', name: 'Cluster Bomb', description: 'Splits into smaller explosions', cost: 2, maxLevel: 1, effect: { clusterBomb: { count: 4, radius: 30 } } },
                            { id: 'cannon_aoe_3', name: 'Nuclear Shell', description: 'Massive explosion with fallout', cost: 4, maxLevel: 1, effect: { nuclear: { radius: 200, falloutDuration: 10 } } }
                        ]
                    },
                    special: {
                        name: 'Special Path',
                        skills: [
                            { id: 'cannon_special_1', name: 'Incendiary Rounds', description: 'Shells leave fire patches', cost: 2, maxLevel: 1, effect: { incendiary: { duration: 5, damage: 20 } } },
                            { id: 'cannon_special_2', name: 'Shrapnel Burst', description: 'Explosion creates projectiles', cost: 3, maxLevel: 1, effect: { shrapnel: { count: 8, damage: 0.3 } } },
                            { id: 'cannon_special_3', name: 'Orbital Strike', description: 'Calls down satellite laser', cost: 4, maxLevel: 1, effect: { orbital: { damage: 1000, chargeTime: 3 } } }
                        ]
                    }
                }
            }
        };
    }

    // Initialize player skills for a defense type
    initializePlayerSkills(defenseType) {
        if (!this.playerSkills[defenseType]) {
            this.playerSkills[defenseType] = {};
            const tree = this.skillTrees[defenseType];
            if (tree) {
                Object.keys(tree.branches).forEach(branchKey => {
                    tree.branches[branchKey].skills.forEach(skill => {
                        this.playerSkills[defenseType][skill.id] = {
                            level: 0,
                            unlocked: false
                        };
                    });
                });
            }
        }
    }

    // Check if a skill can be unlocked
    canUnlockSkill(defenseType, skillId) {
        const skill = this.getSkill(defenseType, skillId);
        if (!skill) return false;

        const playerSkill = this.playerSkills[defenseType]?.[skillId];
        if (!playerSkill) return false;

        // Check if already at max level
        if (playerSkill.level >= skill.maxLevel) return false;

        // Check if player has enough skill points
        if (this.skillPoints < skill.cost) return false;

        // Check prerequisites (previous skills in the same branch)
        const branch = this.findSkillBranch(defenseType, skillId);
        if (branch) {
            const skillIndex = branch.skills.findIndex(s => s.id === skillId);
            if (skillIndex > 0) {
                const previousSkill = branch.skills[skillIndex - 1];
                const previousPlayerSkill = this.playerSkills[defenseType][previousSkill.id];
                if (!previousPlayerSkill.unlocked) return false;
            }
        }

        return true;
    }

    // Unlock a skill
    unlockSkill(defenseType, skillId) {
        if (!this.canUnlockSkill(defenseType, skillId)) return false;

        const skill = this.getSkill(defenseType, skillId);
        const playerSkill = this.playerSkills[defenseType][skillId];

        this.skillPoints -= skill.cost;
        playerSkill.level++;
        playerSkill.unlocked = true;

        return true;
    }

    // Get skill definition
    getSkill(defenseType, skillId) {
        const tree = this.skillTrees[defenseType];
        if (!tree) return null;

        for (const branchKey of Object.keys(tree.branches)) {
            const skill = tree.branches[branchKey].skills.find(s => s.id === skillId);
            if (skill) return skill;
        }
        return null;
    }

    // Find which branch a skill belongs to
    findSkillBranch(defenseType, skillId) {
        const tree = this.skillTrees[defenseType];
        if (!tree) return null;

        for (const branchKey of Object.keys(tree.branches)) {
            const branch = tree.branches[branchKey];
            if (branch.skills.find(s => s.id === skillId)) {
                return branch;
            }
        }
        return null;
    }

    // Get all effects for a defense type
    getDefenseEffects(defenseType) {
        const effects = {};
        const playerSkills = this.playerSkills[defenseType];
        if (!playerSkills) return effects;

        Object.keys(playerSkills).forEach(skillId => {
            const playerSkill = playerSkills[skillId];
            if (playerSkill.unlocked) {
                const skill = this.getSkill(defenseType, skillId);
                if (skill && skill.effect) {
                    // Apply skill effects based on level
                    Object.keys(skill.effect).forEach(effectKey => {
                        const effectValue = skill.effect[effectKey];
                        if (typeof effectValue === 'number') {
                            // Multiply numeric effects by skill level
                            effects[effectKey] = (effects[effectKey] || 0) + (effectValue * playerSkill.level);
                        } else {
                            // Non-numeric effects (booleans, objects) are applied once
                            effects[effectKey] = effectValue;
                        }
                    });
                }
            }
        });

        return effects;
    }

    // Award skill points
    awardSkillPoints(points) {
        this.skillPoints += points;
    }

    // Get available skill points
    getSkillPoints() {
        return this.skillPoints;
    }

    // Get skill tree for UI display
    getSkillTreeForDisplay(defenseType) {
        const tree = this.skillTrees[defenseType];
        if (!tree) return null;

        const playerSkills = this.playerSkills[defenseType] || {};
        
        return {
            name: tree.name,
            branches: Object.keys(tree.branches).map(branchKey => {
                const branch = tree.branches[branchKey];
                return {
                    key: branchKey,
                    name: branch.name,
                    skills: branch.skills.map(skill => {
                        const playerSkill = playerSkills[skill.id] || { level: 0, unlocked: false };
                        return {
                            ...skill,
                            currentLevel: playerSkill.level,
                            unlocked: playerSkill.unlocked,
                            canUnlock: this.canUnlockSkill(defenseType, skill.id)
                        };
                    })
                };
            })
        };
    }

    // Reset skills for a defense type
    resetSkills(defenseType) {
        const playerSkills = this.playerSkills[defenseType];
        if (!playerSkills) return 0;

        let refundedPoints = 0;
        Object.keys(playerSkills).forEach(skillId => {
            const playerSkill = playerSkills[skillId];
            if (playerSkill.unlocked) {
                const skill = this.getSkill(defenseType, skillId);
                if (skill) {
                    refundedPoints += skill.cost * playerSkill.level;
                }
            }
            playerSkill.level = 0;
            playerSkill.unlocked = false;
        });

        this.skillPoints += refundedPoints;
        return refundedPoints;
    }

    // Save/Load system
    saveToStorage() {
        const saveData = {
            playerSkills: this.playerSkills,
            skillPoints: this.skillPoints
        };
        localStorage.setItem('mondefense_skills', JSON.stringify(saveData));
    }

    loadFromStorage() {
        try {
            const saveData = localStorage.getItem('mondefense_skills');
            if (saveData) {
                const data = JSON.parse(saveData);
                this.playerSkills = data.playerSkills || {};
                this.skillPoints = data.skillPoints || 0;
            }
        } catch (error) {
            console.warn('Failed to load skill data:', error);
        }
    }
}

export default SkillTree;