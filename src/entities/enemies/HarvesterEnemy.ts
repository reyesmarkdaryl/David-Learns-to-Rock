import * as Phaser from 'phaser';
import { Enemy } from './Enemy';
import { Hero } from '../player/Hero';

export class HarvesterEnemy extends Enemy {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, {
      hp: 70,
      speed: 100,
      damage: 12,
      attackRange: 60,
      behavior: 'persistent',
      displaySize: { width: 420, height: 344 }
    });
    this.setTexture('enemy_harvester_idle');
    this.body.setCircle(16, 36, 36);
  }

  override handleAnimation(state: 'idle' | 'run') {
    const animKey = state === 'idle' ? 'enemy_harvester_idle_anim' : 'enemy_harvester_run_anim';
    if (this.anims.currentAnim?.key !== animKey) {
      this.play(animKey, true);
    }
  }

  override performAttack(target: Hero, time: number) {
    if (time < this.attackCooldown) {
      this.play('enemy_harvester_idle_anim', true);
      return;
    }

    this.isAttacking = true;
    this.play('enemy_harvester_attack_anim', true);

    if (target && target.takeDamage) {
      target.takeDamage(this.damage);
    }

    this.attackCooldown = time + this.ATTACK_COOLDOWN_MS;
  }
}
