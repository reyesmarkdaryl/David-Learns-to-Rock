import * as Phaser from 'phaser';
import { Enemy } from './Enemy';

export class ChainEnemy extends Enemy {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'chain');
  }

  override handleAnimation(state: 'idle' | 'run') {
    const animKey = state === 'idle' ? 'enemy_chain_idle_anim' : 'enemy_chain_run_anim';
    if (this.anims.currentAnim?.key !== animKey) {
      this.play(animKey, true);
    }
  }

  override getAttackAnimation(): string {
    return 'enemy_chain_attack_anim';
  }
}
