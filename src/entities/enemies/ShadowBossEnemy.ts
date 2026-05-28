import * as Phaser from 'phaser';
import { Enemy } from './Enemy';
import { Hero } from '../player/Hero';

export class ShadowBossEnemy extends Enemy {
  private attackPhase: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'shadow_boss');
    this.setTexture('enemy_shadow_boss_idle');
  }

  override handleAnimation(state: 'idle' | 'run') {
    const animKey = state === 'idle' ? 'enemy_shadow_boss_idle_anim' : 'enemy_shadow_boss_run_anim';
    if (this.anims.currentAnim?.key !== animKey) {
      this.play(animKey, true);
    }
  }

  override getAttackAnimation(): string {
    return 'enemy_shadow_boss_attack1_anim';
  }

  override takeDamage(amount: number): void {
    super.takeDamage(amount);

    this.isAttacking = true;
    this.play('enemy_shadow_boss_hit_anim', true);

    this.scene.time.delayedCall(300, () => {
      this.isAttacking = false;
    });
  }

  override destroy() {
    super.destroy();
  }
}
