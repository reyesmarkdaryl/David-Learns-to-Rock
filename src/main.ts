import * as Phaser from 'phaser';
import config from './config';

export function bootGame() {
  new Phaser.Game(config);
  console.log('Horde Survivor Game Initialized');
}
