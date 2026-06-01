import * as Phaser from 'phaser';
import { Enemy } from './Enemy';
import { Hero } from '../player/Hero';

export class KnightBossEnemy extends Enemy {
  private attackPhase: number = 0;
  private dashCooldown: number = 0;
  private isDashing: boolean = false;
  private comboCooldown: number = 0;

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

  override performAttack(hero: Hero, time: number) {
    if (time < this.attackCooldown) {
      super.performAttack(hero, time);
      return;
    }

    // 25% chance to trigger a combo attack if cooldown is over
    if (time > this.comboCooldown && Math.random() < 0.25) {
      const comboHits = Math.random() < 0.7 ? 2 : 3; // 70% chance for 2 hits, 30% for 3
      console.log(`[Combat Debug] Knight Boss initiating ${comboHits}-hit combo!`);
      this.executeCombo(hero, time, comboHits);
      return;
    }

    super.performAttack(hero, time);
  }

  private executeCombo(hero: Hero, startTime: number, totalHits: number) {
    this.isAttacking = true;
    this.doComboHit(hero, startTime, 1, totalHits);
  }

  private doComboHit(hero: Hero, startTime: number, currentHit: number, totalHits: number) {
    const animKey = this.getAttackAnimation();
    this.play(animKey, true);

    // Damage timing (windup)
    this.scene.time.delayedCall(this.attackWindupMs, () => {
      this.executeAttackDamage(hero);
    });

    // Recovery/Next Hit timing
    this.scene.time.delayedCall(this.attackDurationMs, () => {
      if (currentHit < totalHits) {
        // Chain to next hit
        this.doComboHit(hero, startTime, currentHit + 1, totalHits);
      } else {
        // Combo finished
        this.isAttacking = false;
        const currentTime = (this.scene as any).game?.loop?.time || startTime + (this.attackDurationMs * totalHits);
        this.comboCooldown = currentTime + 8000; // 8s cooldown for combos

        // Still apply the standard attack cooldown so they can't immediately start another attack
        const variance = (Math.random() - 0.5) * (this.attackCooldownMs * 0.2);
        this.attackCooldown = currentTime + this.attackCooldownMs + variance;
      }
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
