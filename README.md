# MonDefense - Tower Defense Game

A Phaser.js tower defense game built with Vite.

## Game Description

MonDefense is a tower defense game where you:
- Plant crops to earn coins
- Place Monad defenders to protect your crops
- Fight waves of enemies
- Upgrade your defenses and farming capabilities

## How to Run

### Development
```bash
npm install
npm run dev
```
Then open your browser to `http://localhost:5173`

### Production Build
```bash
npm run build
npm run preview
```

## Game Controls

- **P** - Enter planting mode
- **1** - Place CHOG Defender (25 coins)
- **2** - Place MOLANDAK Guardian (50 coins)
- **3** - Place MOYAKI Warrior (80 coins)
- **4** - Place KEON Champion (150 coins)
- **Click on enemies** - Attack them directly
- **Click on crops** - Harvest when ready

## Game Features

- **Farm System**: Plant crops to earn coins over time
- **Defense System**: Place magical defenders with unique abilities
- **Wave Progression**: Face increasingly difficult waves of enemies
- **Upgrade System**: Improve your defenses and farming efficiency
- **Sound System**: Immersive audio experience with volume controls

## File Structure

- `src/main.js` - Main entry point that initializes the Phaser game
- `scenes/GameScene.js` - Main game scene with all gameplay logic
- `entities/` - Game entities (Enemy, Crop, Defense classes)
- `utils/` - Utility classes (SoundManager, VolumeControls)
- `public/` - Game assets (images, sounds, sprites)

## Assets

The game includes:
- Character sprites for defenders and enemies
- Environment tiles and objects
- Sound effects and background music
- UI elements and effects

