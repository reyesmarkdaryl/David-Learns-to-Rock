import * as Phaser from 'phaser';
import { Enemy } from './Enemy';

export class Lancer extends Enemy {
  private currentAttackTarget: any = null;

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

  override getAttackAnimation(): string {
    if (!this.currentAttackTarget) return super.getAttackAnimation();

    const angle = Phaser.Math.Angle.Between(this.x, this.y, this.currentAttackTarget.x, this.currentAttackTarget.y);
    const angleDeg = Phaser.Math.RadToDeg(angle);

    if (angleDeg >= -22.5 && angleDeg < 22.5) return 'enemy_lancer_attack_right_anim';
    if (angleDeg >= 22.5 && angleDeg < 67.5) return 'enemy_lancer_attack_downright_anim';
    if (angleDeg >= 67.5 && angleDeg < 112.5) return 'enemy_lancer_attack_down_anim';
    if (angleDeg >= 112.5 && angleDeg < 157.5) return 'enemy_lancer_attack_downright_anim';
    if (angleDeg >= 157.5 || angleDeg < -157.5) return 'enemy_lancer_attack_right_anim';
    if (angleDeg >= -112.5 && angleDeg < -67.5) return 'enemy_lancer_attack_upright_anim';
    if (angleDeg >= -67.5 && angleDeg < -22.5) return 'enemy_lancer_attack_upright_anim';
    return 'enemy_lancer_attack_up_anim';
  }

  override performAttack(target: any, time: number) {
    this.currentAttackTarget = target;

    const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
    const angleDeg = Phaser.Math.RadToDeg(angle);
    let finalFlip = false;

    if (angleDeg >= 112.5 && angleDeg < 157.5) finalFlip = true;
    else if (angleDeg >= 157.5 || angleDeg < -157.5) finalFlip = true;
    else if (angleDeg >= -112.5 && angleDeg < -67.5) finalFlip = true;

    this.setFlipX(finalFlip);
    super.performAttack(target, time);
    this.currentAttackTarget = null;
  }
}
