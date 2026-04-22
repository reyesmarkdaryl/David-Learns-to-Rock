import * as Phaser from 'phaser';
import { GymScene } from './scenes/GymScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: 'game-container',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scene: [GymScene]
};

export const DEBUG_MODE = false;
export const GYM_ENEMY_SPAWNS = [
  { type: 'warrior', count: 0 },
  { type: 'lancer', count: 1 },
  { type: 'archer', count: 1 }
];

export default config;
