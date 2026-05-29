import * as Phaser from 'phaser';
import { Enemy } from './Enemy';
import { Hero } from '../player/Hero';

export class KnightBossEnemy extends Enemy {
  private attackPhase: number = 0;
  private dashCooldown: number = 0;
  private isDashing: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'knight_boss');
    this.setTexture('enemy_knight_boss_idle');
  }

  override update(heroOrTarget: any, time: number, flowField?: any): void {
    if (this.isDashing) return;

    // Randomly trigger a dash attack if the target is within a certain range
    const dist = Phaser.Math.Distance.Between(this.x, this.y, heroOrTarget.x, heroOrTarget.y);
    if (time > this.dashCooldown && dist > this.attackRange && dist < 600 && Math.random() < 0.01) {
      this.startDashAttack(heroOrTarget, time);
      return;
    }

    super.update(heroOrTarget, time, flowField);
  }

  private startDashAttack(target: any, time: number) {
    this.isDashing = true;
    this.isAttacking = true; // Stop normal AI movement

    const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
    const dashSpeed = this.speed * 3;
    this.setVelocity(Math.cos(angle) * dashSpeed, Math.sin(angle) * dashSpeed);
    this.setFlipX(Math.cos(angle) < 0);
    this.handleAnimation('run');

    // Dash for 500ms then execute a heavy attack
    this.scene.time.delayedCall(500, () => {
      this.setVelocity(0);
      this.isDashing = false;

      // We need the current game time for performAttack
      const currentTime = (this.scene as any).game?.loop?.time || time + 500;
      this.performAttack(target, currentTime);

      this.dashCooldown = currentTime + 6000; // 6 second cooldown between dashes
    });
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
