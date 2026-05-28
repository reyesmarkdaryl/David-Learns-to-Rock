import * as Phaser from 'phaser';
import { Enemy } from './Enemy';
import { Hero } from '../player/Hero';

export class KnightBossEnemy extends Enemy {
  private attackPhase: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'knight_boss');
    this.setTexture('enemy_knight_boss_idle');
  }

  override handleAnimation(state: 'idle' | 'run') {
    const animKey = state === 'idle' ? 'enemy_knight_boss_idle_anim' : 'enemy_knight_boss_run_anim';
    if (this.anims.currentAnim?.key !== animKey) {
      this.play(animKey, true);
    }
  }

  override getAttackAnimation(): string {
    // Randomly pick between a few attacks if available in atlas
    const attacks = ['attack 1', 'attack 2', 'attack 3', 'jump_smash', 'sky_attack'];
    const randomAttack = attacks[Math.floor(Math.random() * attacks.length)];
    return `enemy_knight_boss_${randomAttack}_anim`;
  }

  override takeDamage(amount: number): void {
    super.takeDamage(amount);

    // Chance to block damage
    if (Math.random() < 0.2) {
      console.log('[Combat Debug] Knight Boss Blocked!');
      this.isAttacking = true;
      this.play('enemy_knight_boss_block_anim', true);
      this.scene.time.delayedCall(400, () => {
        this.isAttacking = false;
      });
      return;
    }

    this.isAttacking = true;
    this.play('enemy_knight_boss_hit_anim', true); // If we have a hit animation, otherwise reuse idle

    this.scene.time.delayedCall(300, () => {
      this.isAttacking = false;
    });
  }

  override destroy() {
    super.destroy();
  }
}
