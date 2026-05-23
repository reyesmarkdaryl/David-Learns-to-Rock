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
  pixelArt: true,
  roundPixels: true,
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

export interface WaveDefinition {
  waveNumber: number;
  enemies: { type: string; count: number }[];
  interval: number;
  cooldown: number;
}

export const GYM_WAVES: WaveDefinition[] = [
  {
    waveNumber: 1,
    enemies: [{ type: 'harvester', count: 1 }],
    interval: 1000,
    cooldown: 3000
  },
  {
    waveNumber: 2,
    enemies: [{ type: 'warrior', count: 8 }, { type: 'lancer', count: 2 }],
    interval: 1500,
    cooldown: 3000
  },
  {
    waveNumber: 3,
    enemies: [{ type: 'warrior', count: 8 }, { type: 'archer', count: 2 }, { type: 'lancer', count: 4 }],
    interval: 2000,
    cooldown: 3000
  }
];

export const GYM_ENEMY_SPAWNS = [
  { type: 'warrior', count: 1, behavior: 'persistent' },
  { type: 'lancer', count: 0, behavior: 'persistent' },
  { type: 'archer', count: 1, behavior: 'limited' }
];
