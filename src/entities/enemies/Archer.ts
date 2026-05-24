import * as Phaser from 'phaser';
import { Enemy } from './Enemy';
import { Hero } from '../player/Hero';

export class Archer extends Enemy {
  private projectileGroup!: Phaser.Physics.Arcade.Group;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, {
      hp: 80,
      speed: 50,
      damage: 12,
      attackRange: 300, // Ranged attack
      displaySize: { width: 192, height: 192 }
    });
    this.setTexture('archer_idle');
    this.body.setCircle(32, 64, 64);

    // We need to access the projectile group from the scene
    // In GymScene, we should define this group. For now, we'll assume it's available on the scene
    const gameScene = scene as any;
    if (gameScene.projectiles) {
        this.projectileGroup = gameScene.projectiles;
    }
  }

  override update(target: any, time: number, flowField?: any): void {
    const dist = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);

    // Archer behavior: Keep distance from target
    if (dist < this.attackRange * 0.5) {
      // Move away from target if too close
      const angle = Phaser.Math.Angle.Between(target.x, target.y, this.x, this.y);
      this.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
      this.handleAnimation('run');
    } else {
      // Use standard Enemy pathfinding (including FlowField, Wall Avoidance, and Attack logic)
      super.update(target, time, flowField);
    }

    if (this.isDead()) return;

    if (this.isAttacking) return;

    const isMoving = Math.abs(this.body.velocity.x) > 0.1 || Math.abs(this.body.velocity.y) > 0.1;
    this.handleAnimation(isMoving ? 'run' : 'idle');

    if (isMoving) {
      this.setFlipX(this.body.velocity.x < 0);
    }
  }

  override handleAnimation(state: 'idle' | 'run') {
    const animKey = state === 'idle' ? 'enemy_archer_idle_anim' : 'enemy_archer_run_anim';
    if (this.anims.currentAnim?.key !== animKey) {
      this.play(animKey, true);
    }
  }

  override performAttack(target: any, time: number) {
      if (!this.hasLineOfSight(target)) {                                                                                       return;
      }                                                                                                                 
      if (time < this.attackCooldown) {
        return;
      }

      this.isAttacking = true;
      this.play('enemy_archer_attack_anim', true);

      // Adjust delay to match the "full draw" of the bow
      // At 8fps, 8 frames take 1s. Release at ~0.7s (frame 5-6)
      this.scene.time.delayedCall(700, () => {
        if (this.scene) {
          this.fireProjectile(target);
        }
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

  private hasLineOfSight(target: any): boolean {
    if (!this.scene) return true;
    const scene = this.scene as any;
    const walls = scene.walls;
    if (!walls) return true;

    const steps = 10;
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const checkX = this.x + (target.x - this.x) * t;
      const checkY = this.y + (target.y - this.y) * t;

      const hit = walls.getChildren().some((wall: any) => {
        return Phaser.Geom.Rectangle.Contains(wall.getBounds(), checkX, checkY);
      });
      if (hit) return false;
    }
    return true;
  }
}