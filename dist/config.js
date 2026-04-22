import * as Phaser from 'phaser';
import { GymScene } from './scenes/GymScene';
const config = {
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
    { type: 'warrior', count: 4 },
    { type: 'lancer', count: 0 },
    { type: 'archer', count: 0 }
];
export default config;
