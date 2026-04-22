import * as Phaser from 'phaser';
import config from './config';

let game: Phaser.Game | null = null;

export function bootGame() {
  if (game) return game;
  game = new Phaser.Game(config);
  return game;
}

export function destroyGame() {
  if (game) {
    game.destroy(true);
    game = null;
  }
}