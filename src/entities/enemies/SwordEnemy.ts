import * as Phaser from 'phaser';
import { Enemy } from './Enemy';
import { Hero } from '../player/Hero';

export class SwordEnemy extends Enemy {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, {
      hp: 60,
      speed: 110,
      damage: 15,
      attackRange: 50,
      behavior: 'persistent',
      displaySize: { width: 512, height: 256 }
    });
    this.setTexture('enemy_sword_idle');
    this.body.setCircle(16, 20, 20);
  }

  override handleAnimation(state: 'idle' | 'run') {
    const animKey = state === 'idle' ? 'enemy_sword_idle_anim' : 'enemy_sword_run_anim';
    if (this.anims.currentAnim?.key !== animKey) {
      this.play(animKey, true);
    }
  }

  override performAttack(target: Hero, time: number) {
    if (time < this.attackCooldown) {
      this.play('enemy_sword_idle_anim', true);
      return;
    }

    this.isAttacking = true;
    this.play('enemy_sword_attack_anim', true);

    if (target && target.takeDamage) {
      target.takeDamage(this.damage);
    }

    this.attackCooldown = time + this.ATTACK_COOLDOWN_MS;
  }
}
