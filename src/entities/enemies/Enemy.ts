import * as Phaser from 'phaser';
import { Hero } from '../player/Hero';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  attackRange: number;
  team: 'hero' | 'enemy';
  private healthBar!: Phaser.GameObjects.Rectangle;
  private healthBarBg!: Phaser.GameObjects.Rectangle;
  protected attackCooldown: number = 0;
  protected readonly ATTACK_COOLDOWN_MS = 1000;
  protected isAttacking: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, stats: any = { hp: 50, speed: 60, damage: 10, attackRange: 60 }, team: 'hero' | 'enemy' = 'enemy') {
    super(scene, x, y, 'enemy_idle');
    this.hp = stats.hp;
    this.maxHp = stats.hp;
    this.speed = stats.speed;
    this.damage = stats.damage;
    this.attackRange = stats.attackRange;
    this.team = team;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.body.setCircle(32, 64, 64);

    if (stats.displaySize) {
      this.setDisplaySize(stats.displaySize.width, stats.displaySize.height);
    } else {
      this.setDisplaySize(192, 192);
    }

    this.createHealthBar(scene);
    // Start with idle instead of forcing run immediately
    this.play('enemy_idle_anim');
  }

  getHitbox(): Phaser.Geom.Rectangle {
    const width = this.width * 0.25;
    const height = this.height * 0.25;
    return new Phaser.Geom.Rectangle(this.x - width / 2, this.y - height / 2, width, height);
  }

  private createHealthBar(scene: Phaser.Scene) {
    const width = 60;
    const height = 6;

    this.healthBarBg = scene.add.rectangle(0, 0, width, height, 0x000000);
    this.healthBar = scene.add.rectangle(0, 0, width, height, 0x00ff00);

    this.healthBarBg.setDepth(this.depth + 1);
    this.healthBar.setDepth(this.depth + 2);
  }

  update(heroOrTarget: any, time: number, flowField?: any): void {
    if (this.isDead()) {
      this.setVelocity(0);
      this.handleAnimation('idle');
      this.updateHealthBar();
      return;
    }

    if (this.isAttacking) {
      this.setVelocity(0);

      if (!this.anims.isPlaying) {
        this.isAttacking = false;
        this.attackCooldown = time + 500;
      }

      this.updateHealthBar();
      return;
    }

    const target = heroOrTarget;
    const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
    const dist = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);

    if (time < this.attackCooldown && dist > this.attackRange) {
      this.setVelocity(0);
      this.handleAnimation('idle');
      this.updateHealthBar();
      return;
    }

    if (dist > this.attackRange) {
      let vx, vy;

      // Use LOS shortcut: if we can see the target, charge directly
      if (this.hasLineOfSight(target)) {
        vx = Math.cos(angle) * this.speed;
        vy = Math.sin(angle) * this.speed;
      } else if (flowField) {
        // Otherwise, follow the flow field
        const dir = flowField.getDirection(this.x, this.y);
        vx = dir.x * this.speed;
        vy = dir.y * this.speed;
      } else {
        vx = Math.cos(angle) * this.speed;
        vy = Math.sin(angle) * this.speed;
      }

      // Add Wall Avoidance (Steering)
      const avoidance = this.calculateWallAvoidance();
      vx += avoidance.x * 0.5;
      vy += avoidance.y * 0.5;

      // Add Separation (Avoid clumping)
      const separation = this.calculateSeparation();
      vx += separation.x * 0.3;
      vy += separation.y * 0.3;

      this.setVelocity(vx, vy);
    } else {
      this.setVelocity(0);
      this.setFlipX(this.x > target.x);
      this.performAttack(target, time);
    }

    // Determine animation based on ACTUAL velocity
    const actualSpeed = Math.hypot(this.body.velocity.x, this.body.velocity.y);
    if (!this.isAttacking) {
      this.handleAnimation(actualSpeed > 10 ? 'run' : 'idle');
    }

    if (!this.isAttacking && this.body.velocity.x !== 0) {
      this.setFlipX(this.body.velocity.x < 0);
    }
    this.updateHealthBar();
  }

  private hasLineOfSight(target: any): boolean {
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

  private calculateWallAvoidance(): { x: number, y: number } {
    const scene = this.scene as any;
    const walls = scene.walls;
    if (!walls) return { x: 0, y: 0 };

    const feelerDist = 40;
    const vel = this.body.velocity;
    const speed = Math.hypot(vel.x, vel.y) || this.speed;
    const normVel = { x: vel.x / speed, y: vel.y / speed };

    // Check 3 points: center, slightly left, slightly right
    const feelers = [
      { x: normVel.x, y: normVel.y },
      { x: normVel.x - normVel.y * 0.5, y: normVel.y + normVel.x * 0.5 },
      { x: normVel.x + normVel.y * 0.5, y: normVel.y - normVel.x * 0.5 }
    ];

    for (const f of feelers) {
      const checkX = this.x + f.x * feelerDist;
      const checkY = this.y + f.y * feelerDist;

      const wall = walls.getChildren().find((w: any) => {
        return Phaser.Geom.Rectangle.Contains(w.getBounds(), checkX, checkY);
      });

      if (wall) {
        // Push away from the center of the wall we hit
        const wallBounds = wall.getBounds();
        const wallCenterX = wallBounds.x + wallBounds.width / 2;
        const wallCenterY = wallBounds.y + wallBounds.height / 2;

        const diffX = this.x - wallCenterX;
        const diffY = this.y - wallCenterY;
        const dist = Math.hypot(diffX, diffY);

        return {
          x: (diffX / dist) * this.speed * 1.2,
          y: (diffY / dist) * this.speed * 1.2
        };
      }
    }

    return { x: 0, y: 0 };
  }

  private calculateSeparation(): { x: number, y: number } {
    let pushX = 0;
    let pushY = 0;

    // We need a way to get nearby enemies. Since we are in a group, we can iterate the group.
    const enemies = (this.scene as any).enemies;
    if (!enemies) return { x: 0, y: 0 };

    enemies.getChildren().forEach((other: any) => {
      if (other === this) return;

      const dx = this.x - other.x;
      const dy = this.y - other.y;
      const distSq = dx * dx + dy * dy;

      if (distSq < 40 * 40 && distSq > 0) {
        const dist = Math.sqrt(distSq);
        pushX += dx / dist;
        pushY += dy / dist;
      }
    });

    return { x: pushX * this.speed * 0.2, y: pushY * this.speed * 0.2 };
  }

  protected handleAnimation(state: 'idle' | 'run') {
    const animKey = state === 'idle' ? 'enemy_idle_anim' : 'enemy_run_anim';
    if (this.anims.currentAnim?.key !== animKey) {
      this.play(animKey, true);
    }
  }

  protected performAttack(hero: Hero, time: number) {
    if (time < this.attackCooldown) {
      this.play('enemy_idle_anim', true);
      return;
    }

    this.isAttacking = true;
    this.play('enemy_attack_anim', true);

    // Damage the hero
    if (hero && hero.takeDamage) {
      hero.takeDamage(this.damage);
    }

    this.attackCooldown = time + this.ATTACK_COOLDOWN_MS;
  }

  private updateHealthBar() {
    const x = this.x;
    const y = this.y - 64;

    this.healthBarBg.setPosition(x, y);
    this.healthBar.setPosition(x, y);

    const healthPercent = Math.max(0, this.hp / this.maxHp);
    this.healthBar.setDisplaySize(60 * healthPercent, 6);
  }

  takeDamage(amount: number): void {
    this.hp -= amount;
    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      this.clearTint();
    });
  }

  isDead(): boolean {
    return this.hp <= 0;
  }

  destroy() {
    if (this.healthBar) this.healthBar.destroy();
    if (this.healthBarBg) this.healthBarBg.destroy();
    super.destroy();
  }
}
