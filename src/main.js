import './style.css'
import Phaser from 'phaser'
import LoadingScene from '../scenes/LoadingScene.js'
import GameScene from '../scenes/GameScene.js'

// Initialize the game
let game = null;
let isMobile = false;

// Check mobile device
function checkMobile() {
  isMobile = window.innerWidth < 768;
}

// Initialize game
function initGame() {
  checkMobile();
  
  // Create game container full-viewport
  const gameContainer = document.createElement('div');
  gameContainer.className = 'game-container desktop-game-container';
  gameContainer.id = 'game-container';
  gameContainer.style.width = '100vw';
  gameContainer.style.height = '100vh';
  
  // Add game container to app
  document.querySelector('#app').appendChild(gameContainer);
  
  // Game configuration - Full HD
  const config = {
    type: Phaser.AUTO,
    width: 1920,
    height: 1080,
    parent: 'game-container',
    scene: [LoadingScene, GameScene],
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 },
        debug: false
      }
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 1920,
      height: 1080
    },
    render: {
      pixelArt: false,
      antialias: true,
      roundPixels: true
    },
    fps: {
      target: 60,
      forceSetTimeOut: true,
      min: 30,
      deltaHistory: 10
    },
    disableContextMenu: true,
    banner: false,
    autoFocus: true
  };

  // Create the game
  game = new Phaser.Game(config);
  
  // Add global helper for movement normalization
  window.normalizeMovement = (baseSpeed, delta) => {
    const targetFrameTime = 16.67; // 60 FPS
    const factor = delta / targetFrameTime;
    return baseSpeed * Math.min(factor, 2.0); // Cap at 2x to prevent teleporting
  };

  // Handle initial resize for consistent sizing
  handleResize();
  
  // Expose game globally for debugging
  window.game = game;
}

// Handle resize - maintain Full HD
function handleResize() {
  const container = document.getElementById('game-container');
  if (container) {
    // Keep container full viewport but game stays 1920x1080
    container.style.width = '100vw';
    container.style.height = '100vh';
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.alignItems = 'center';
    container.style.backgroundColor = '#000';
  }
  // Don't resize the game - keep it at Full HD
}

// Add event listeners
window.addEventListener('resize', handleResize);

// Start the game when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
