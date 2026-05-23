import * as Phaser from 'phaser';
import { Enemy } from './Enemy';
import { Hero } from '../player/Hero';

export class ShadowBossEnemy extends Enemy {
  private attackPhase: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, {
      hp: 1000,
      speed: 80,
      damage: 30,
      attackRange: 120,
      behavior: 'persistent',
      displaySize: { width: 768, height: 768 }
    });
    this.setTexture('enemy_shadow_boss_idle');
    this.body.setCircle(128, 64, 64);
  }

  override handleAnimation(state: 'idle' | 'run') {
    const animKey = state === 'idle' ? 'enemy_shadow_boss_idle_anim' : 'enemy_shadow_boss_run_anim';
    if (this.anims.currentAnim?.key !== animKey) {
      this.play(animKey, true);
    }
  }

  override performAttack(target: Hero, time: number) {
    if (time < this.attackCooldown) {
      this.play('enemy_shadow_boss_idle_anim', true);
      return;
    }

    this.isAttacking = true;

    // Rotate through 3 different attack animations
    this.attackPhase = (this.attackPhase + 1) % 3;
    const currentAttackAnim = `enemy_shadow_boss_attack${this.attackPhase + 1}_anim`;
    this.play(currentAttackAnim, true);

    // Shadow Boss is a heavy hitter; delay damage to match the animation "strike"
    this.scene.time.delayedCall(600, () => {
      if (target && target.takeDamage) {
        target.takeDamage(this.damage);
      }
      this.isAttacking = false;
    });

    this.attackCooldown = time + (this.ATTACK_COOLDOWN_MS * 2);
  }

  override takeDamage(amount: number): void {
    super.takeDamage(amount);

    // Play hit animation
    this.isAttacking = true; // Interrupt other actions
    this.play('enemy_shadow_boss_hit_anim', true);

    this.scene.time.delayedCall(300, () => {
      this.isAttacking = false;
    });
  }

  // Override death logic if necessary, otherwise base Enemy death is fine
  // But since we have a death animation in index.json:
  override destroy() {
    // In a real scenario, we'd trigger a death animation before actually calling destroy
    // For now, we'll just rely on the base destroy.
    super.destroy();
  }
}
