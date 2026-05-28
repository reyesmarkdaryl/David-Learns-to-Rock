import * as Phaser from 'phaser';
import { Enemy } from './Enemy';

export class HarvesterEnemy extends Enemy {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'harvester');
    this.setTexture('enemy_harvester_idle');
  }

  override handleAnimation(state: 'idle' | 'run') {
    const animKey = state === 'idle' ? 'enemy_harvester_idle_anim' : 'enemy_harvester_run_anim';
    if (this.anims.currentAnim?.key !== animKey) {
      this.play(animKey, true);
    }
  }

  override getAttackAnimation(): string {
    return 'enemy_harvester_attack_anim';
  }
}
