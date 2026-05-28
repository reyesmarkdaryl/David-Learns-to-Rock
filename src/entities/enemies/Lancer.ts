import * as Phaser from 'phaser';
import { Enemy } from './Enemy';

export class Lancer extends Enemy {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'lancer');
  }

  override update(target: any, time: number, flowField?: any): void {
    super.update(target, time, flowField);

    if (this.isDead()) return;

    if (this.isAttacking) {
      return;
    }

    const isMoving = Math.abs(this.body.velocity.x) > 0.1 || Math.abs(this.body.velocity.y) > 0.1;
    this.handleAnimation(isMoving ? 'run' : 'idle');

    if (isMoving) {
      this.setFlipX(this.body.velocity.x < 0);
    }
  }

  override handleAnimation(state: 'idle' | 'run') {
    const animKey = state === 'idle' ? 'enemy_lancer_idle_anim' : 'enemy_lancer_run_anim';
    if (this.anims.currentAnim?.key !== animKey) {
      this.play(animKey, true);
    }
  }

  override performAttack(target: any, time: number) {
    if (time < this.attackCooldown) {
      this.play('enemy_lancer_idle_anim', true);
      return;
    }

    const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
    const angleDeg = Phaser.Math.RadToDeg(angle);

    let finalAnim = 'enemy_lancer_attack_right_anim';
    let finalFlip = false;

    if (angleDeg >= -22.5 && angleDeg < 22.5) {
      finalAnim = 'enemy_lancer_attack_right_anim';
      finalFlip = false;
    } else if (angleDeg >= 22.5 && angleDeg < 67.5) {
      finalAnim = 'enemy_lancer_attack_downright_anim';
      finalFlip = false;
    } else if (angleDeg >= 67.5 && angleDeg < 112.5) {
      finalAnim = 'enemy_lancer_attack_down_anim';
      finalFlip = false;
    } else if (angleDeg >= 112.5 && angleDeg < 157.5) {
      finalAnim = 'enemy_lancer_attack_downright_anim';
      finalFlip = true;
    } else if (angleDeg >= 157.5 || angleDeg < -157.5) {
      finalAnim = 'enemy_lancer_attack_right_anim';
      finalFlip = true;
    } else if (angleDeg >= -112.5 && angleDeg < -67.5) {
      finalAnim = 'enemy_lancer_attack_upright_anim';
      finalFlip = true;
    } else if (angleDeg >= -67.5 && angleDeg < -22.5) {
      finalAnim = 'enemy_lancer_attack_upright_anim';
      finalFlip = false;
    } else {
      finalAnim = 'enemy_lancer_attack_up_anim';
      finalFlip = false;
    }

    this.isAttacking = true;
    this.setFlipX(finalFlip);
    this.safePlay(finalAnim);

    this.pendingDamageTarget = target;
    this.attackCooldown = time + 1000;
  }
}
