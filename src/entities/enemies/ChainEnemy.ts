import * as Phaser from 'phaser';
import { Enemy } from './Enemy';
import { Hero } from '../player/Hero';

export class ChainEnemy extends Enemy {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, {
      hp: 60,
      speed: 140,
      damage: 5,
      attackRange: 50,
      behavior: 'persistent',
      displaySize: { width: 480, height: 480 }
    });
    this.setTexture('enemy_chain_idle');
    this.body.setCircle(16, 90, 90);
  }

  override handleAnimation(state: 'idle' | 'run') {
    const animKey = state === 'idle' ? 'enemy_chain_idle_anim' : 'enemy_chain_run_anim';
    if (this.anims.currentAnim?.key !== animKey) {
      this.play(animKey, true);
    }
  }

  override performAttack(target: Hero, time: number) {
    if (time < this.attackCooldown) {
      this.play('enemy_chain_idle_anim', true);
      return;
    }

    this.isAttacking = true;
    this.play('enemy_chain_attack_anim', true);

    if (target && target.takeDamage) {
      target.takeDamage(this.damage);
    }

    this.attackCooldown = time + this.ATTACK_COOLDOWN_MS;
  }
}
