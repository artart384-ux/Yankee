import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { CharacterSelectScene } from './scenes/CharacterSelectScene';
import { WorldScene } from './scenes/WorldScene';
import { UIScene } from './scenes/UIScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'game-container',
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  backgroundColor: '#0a0c14',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scene: [BootScene, CharacterSelectScene, WorldScene, UIScene]
};

window.addEventListener('DOMContentLoaded', () => {
  new Phaser.Game(config);
});

