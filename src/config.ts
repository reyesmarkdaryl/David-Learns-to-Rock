import * as Phaser from 'phaser';
import { GymScene } from './scenes/GymScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { RoomEditorScene } from './scenes/RoomEditorScene';
import { PlaytestScene } from './scenes/PlaytestScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'phaser-container',
  backgroundColor: '#111',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 }, debug: false }
  },
  input: { keyboard: true },
  scene: [MainMenuScene, GymScene, RoomEditorScene, PlaytestScene]
};

export const DEBUG_MODE = false;
export default config;
export const GYM_ENEMY_SPAWNS = [
  { type: 'warrior', count: 0 },
  { type: 'lancer', count: 0 },
  { type: 'archer', count: 0 }
];
