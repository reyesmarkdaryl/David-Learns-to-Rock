import * as Phaser from 'phaser';
import { AssetPreloader } from './scenes/AssetPreloader';
import { GymScene } from './scenes/GymScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { RoomEditorScene } from './scenes/RoomEditorScene';
import { PlaytestScene } from './scenes/PlaytestScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'playing-field-screen',
  backgroundColor: '#111',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: false,
    width: window.innerWidth,
    height: window.innerHeight
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 }, debug: true }
  },
  input: { keyboard: true },
  scene: [AssetPreloader, MainMenuScene, GymScene, RoomEditorScene, PlaytestScene]
};

export const DEBUG_MODE = true;
export default config;
export const GYM_ENEMY_SPAWNS = [
  { type: 'warrior', count: 1 },
  { type: 'lancer', count: 1 },
  { type: 'archer', count: 1 }
];
