import * as Phaser from 'phaser';
import { Enemy } from './Enemy';

export class SickleEnemy extends Enemy {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'sickle');
    this.setTexture('enemy_sickle_idle');
  }
}
