import * as Phaser from 'phaser';
import { Enemy } from './Enemy';
import { Hero } from '../player/Hero';

export class Archer extends Enemy {
  private projectileGroup!: Phaser.Physics.Arcade.Group;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, {
      hp: 40,
      speed: 50,
      damage: 12,
      attackRange: 300, // Ranged attack
      displaySize: { width: 192, height: 192 }
    });
    this.setTexture('archer_idle');

    // We need to access the projectile group from the scene
    // In GymScene, we should define this group. For now, we'll assume it's available on the scene
    const gameScene = scene as any;
    if (gameScene.projectiles) {
        this.projectileGroup = gameScene.projectiles;
    }
  }

  override update(hero: Hero, time: number): void {
    const dist = Phaser.Math.Distance.Between(this.x, this.y, hero.x, hero.y);

    // Archer behavior: Keep distance from hero
    if (dist < this.attackRange * 0.5) {
      // Move away from hero if too close
      const angle = Phaser.Math.Angle.Between(hero.x, hero.y, this.x, this.y);
      this.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
      this.handleAnimation('run');
    } else if (dist > this.attackRange) {
      // Move toward hero if too far
      super.update(hero, time);
    } else {
      // Stay in range and attack
      this.setVelocity(0);
      if (!this.isAttacking) {
        this.handleAnimation('idle');
      }
      this.performAttack(hero, time);
    }

    // Always face the hero when attacking or moving towards/away
    this.setFlipX(this.x > hero.x);

    if (!this.isAttacking && this.body.velocity.x !== 0) {
      this.setFlipX(this.body.velocity.x < 0);
    }

    // Ensure health bar is updated every frame
    (this as any).updateHealthBar();
  }

  override handleAnimation(state: 'idle' | 'run') {
    const animKey = state === 'idle' ? 'enemy_archer_idle_anim' : 'enemy_archer_run_anim';
    if (this.anims.currentAnim?.key !== animKey) {
      this.play(animKey, true);
    }
  }

  override performAttack(target: any, time: number) {
    if (time < this.attackCooldown) {
      return;
    }

    this.isAttacking = true;
    this.play('enemy_archer_attack_anim', true);

    // Adjust delay to match the "full draw" of the bow
    // At 8fps, 8 frames take 1s. Release at ~0.7s (frame 5-6)
    this.scene.time.delayedCall(700, () => {
      this.fireProjectile(target);
      this.isAttacking = false;
    });

    this.attackCooldown = time + 2000; // Slower attack speed for ranged
  }

  private fireProjectile(target: any) {
    if (this.projectileGroup) {
      const projectile = this.projectileGroup.get();
      if (projectile) {
        if ((projectile as any).reset) {
            projectile.reset();
        } else {
            projectile.setTexture('projectile_arrow');
            projectile.setActive(true).setVisible(true);
        }
        projectile.setPosition(this.x, this.y);

        const body = projectile.body as Phaser.Physics.Arcade.Body;
        if (body) {
            const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
            body.setVelocity(Math.cos(angle) * 300, Math.sin(angle) * 300);
            projectile.setRotation(angle);
        }

        (projectile as any).damage = this.damage;
        (projectile as any).team = 'enemy';
      }
    } else {
      target.takeDamage(this.damage);
    }
  }
}