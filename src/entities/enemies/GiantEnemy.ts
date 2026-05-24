import * as Phaser from 'phaser';
import { Enemy } from './Enemy';
import { Hero } from '../player/Hero';

export class GiantEnemy extends Enemy {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, {
      hp: 300,
      speed: 60,
      damage: 20,
      attackRange: 80,
      behavior: 'persistent',
      displaySize: { width: 512, height: 512 }
    });
    this.setTexture('enemy_giant_idle');
    this.body.setCircle(96, 64, 64);
  }

  override handleAnimation(state: 'idle' | 'run') {
    const animKey = state === 'idle' ? 'enemy_giant_idle_anim' : 'enemy_giant_run_anim';
    if (this.anims.currentAnim?.key !== animKey) {
      this.play(animKey, true);
    }
  }

  override performAttack(target: Hero, time: number) {
    if (time < this.attackCooldown) {
      this.play('enemy_giant_idle_anim', true);
      return;
    }

    this.isAttacking = true;
    this.play('enemy_giant_attack_anim', true);

    if (target && target.takeDamage) {
      target.takeDamage(this.damage);
    }

    this.attackCooldown = time + (this.ATTACK_COOLDOWN_MS * 1.5);
  }
}
