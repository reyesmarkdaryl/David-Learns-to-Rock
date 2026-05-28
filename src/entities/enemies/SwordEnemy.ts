import * as Phaser from 'phaser';
import { Enemy } from './Enemy';

export class SwordEnemy extends Enemy {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'sword');
  }

  override handleAnimation(state: 'idle' | 'run') {
    const animKey = state === 'idle' ? 'enemy_sword_idle_anim' : 'enemy_sword_run_anim';
    if (this.anims.currentAnim?.key !== animKey) {
      this.play(animKey, true);
    }
  }

  override getAttackAnimation(): string {
    return 'enemy_sword_attack_anim';
  }
}
