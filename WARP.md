# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

MonDefense is a browser-based tower defense game built with Phaser.js 3.90 and Vite. Players plant crops to earn coins and place Monad-themed defenders to protect their farm from waves of enemies. The game features a farming economy system, multiple defender types with unique abilities, enemy waves with progressive difficulty, and comprehensive sound/visual effects.

## Development Commands

### Essential Commands
- `npm install` - Install dependencies
- `npm run dev` - Start development server (localhost:5173)
- `npm run build` - Build production version
- `npm run preview` - Preview production build locally

### Testing Commands
No automated tests are currently configured. The game relies on manual browser testing and the built-in Sound Test Panel (Ctrl+Shift+S).

## Architecture Overview

### Game Structure
The game follows a modular Phaser.js architecture with clear separation of concerns:

**Core Framework:**
- **Phaser.js 3.90** - Game engine handling rendering, physics, and audio
- **Vite** - Modern build tool for fast development and optimized production builds
- **ES6 Modules** - Clean import/export structure throughout codebase

**Scene Management:**
- `MainMenuScene.js` - Main menu with graphics settings and instructions
- `GameScene.js` - Primary gameplay scene containing all game logic
- Scene transitions handled via Phaser's scene manager

**Entity System:**
All game entities are modular classes in the `/entities` directory:
- `Enemy.js` - Handles enemy behavior, movement, health, damage, and defeat mechanics
- `Defense.js` - Tower defense units (CHOG, MOLANDAK, MOYAKI, KEON) with attack patterns, mana systems, and special abilities
- `Crop.js` - Farming system with growth cycles, harvesting, and yield calculations
- `Upgrade.js` - Enhancement system for defenders and farming efficiency

### Key Game Systems

**Farming Economy:**
- Players plant crops on left side of screen using 'P' key
- Crops go through growth cycles (seedling → growing → mature)
- Harvesting mature crops generates coins used to purchase defenders
- Growth rates and yields can be upgraded

**Tower Defense Mechanics:**
- Four defender types with distinct roles and upgrade paths:
  - **CHOG Defender** (25 coins) - Basic nature magic, good against birds
  - **MOLANDAK Guardian** (50 coins) - Ice magic with freeze effects, targets rabbits/birds
  - **MOYAKI Warrior** (80 coins) - Fire magic with burn effects and fast attacks
  - **KEON Champion** (150 coins) - Premium divine magic with massive damage and range
- Each defender has mana system, cooldowns, and special attacks unlocked by defeating enemies
- Area of effect (AOE) damage and elemental status effects

**Enemy Wave System:**
- Progressive difficulty scaling with wave number
- Enemy types: birds, rabbits, deer with different stats and weaknesses
- Boss waves every 5 rounds with enhanced enemies
- Enemies pathfind toward farm (left side) and deal damage when reaching crops

**Audio System:**
- Comprehensive sound management in `/utils/SoundManager.js`
- Sound effects for all game actions (attacks, harvests, defeats)
- Background music with volume controls
- Sound Test Panel available via Ctrl+Shift+S for debugging

## Asset Management

**Sprite System:**
- Character sprites stored in `/public/characters/` 
- Attack and idle animations for each defender type
- Enemy sprites with fallback systems for missing textures
- Effect sprites (fireballs, particles) in `/public/effects/`

**Audio Assets:**
- Sound effects in `/public/SFX/` as MP3 files
- Comprehensive sound mapping in SoundManager
- Volume controls and mute functionality built-in

**Texture Loading:**
- Phaser handles all asset preloading
- Fallback systems create colored circles when sprites missing
- Debug logging for missing textures to aid development

## Development Workflow

**Hot Reload Development:**
- Vite provides instant hot module replacement
- Game state persists across most code changes
- Browser console shows detailed game state logging

**Code Organization:**
- Modular entity classes with clear responsibilities
- Game state managed in `GameScene.js`
- Utility functions separated into `/utils` directory
- Sound system abstracted for easy maintenance

**Debugging Tools:**
- Extensive console logging for game events
- Visual range indicators for defenders
- Health bars and status displays
- Sound Test Panel for audio debugging

## Common Development Tasks

**Adding New Defender Types:**
1. Add case in `Defense.js` constructor with stats and abilities
2. Create sprite assets and add to preload
3. Implement attack animations and effects
4. Add to upgrade system if needed

**Adding New Enemy Types:**
1. Add case in `Enemy.js` constructor with health/speed scaling
2. Create enemy sprite and add to asset loading
3. Define weaknesses and special behaviors
4. Update wave spawn logic in GameScene

**Modifying Game Balance:**
- Enemy stats scaled by wave number with configurable multipliers
- Defender damage, range, and costs easily adjustable in constructors
- Crop yield and growth rates controlled by upgrade multipliers
- Wave difficulty progression configurable in enemy creation

**Sound Integration:**
- Add audio files to `/public/SFX/`
- Register in SoundManager preload and sound configs
- Call via `this.soundManager.play('sound_key')` in game code
- Test with Sound Test Panel (Ctrl+Shift+S)

## Performance Considerations

**Memory Management:**
- Entity cleanup handled through proper destroy methods
- Tweens killed before object destruction to prevent memory leaks
- Asset loading optimized with texture atlases where possible

**Rendering Optimization:**
- Depth management ensures proper layer rendering
- Particle effects have limited lifespans to prevent accumulation
- Object pooling could be implemented for frequently created/destroyed objects

**Physics Performance:**
- Arcade physics used for lightweight collision detection
- Enemy movement uses velocity-based physics rather than manual position updates
- Collision detection optimized with proper body sizing

## Mobile Support

The game includes responsive design features:
- Mobile-specific UI layouts and controls
- Touch-friendly interaction areas
- Responsive scaling via Phaser's Scale Manager
- Mobile detection and adaptive interface elements

This architecture provides a solid foundation for expanding the tower defense gameplay while maintaining clean, maintainable code structure.
