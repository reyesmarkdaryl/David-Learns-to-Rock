import * as Phaser from 'phaser';
import { Hero } from '../player/Hero';

export type EnemyAIBehavior = 'persistent' | 'limited';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  attackRange: number;
  team: 'hero' | 'enemy';
  behavior: EnemyAIBehavior;
  private healthBar!: Phaser.GameObjects.Rectangle;
  private healthBarBg!: Phaser.GameObjects.Rectangle;
  protected attackCooldown: number = 0;
  protected readonly ATTACK_COOLDOWN_MS = 1000;
  protected isAttacking: boolean = false;

  private __wanderTimer: number = 0;
  private __wanderAngle: number = 0;
  private isWandering: boolean = false;

  private lastKnownPosition: Phaser.Math.Vector2 = new Phaser.Math.Vector2();
  private lastKnownVelocity: Phaser.Math.Vector2 = new Phaser.Math.Vector2();
  private isTrackingLKL: boolean = false;

  private isAggro: boolean = false;
  private aggroRange: number = 300;
  private loseAggroRange: number = 650; // optional (if you want them to calm down)

  constructor(scene: Phaser.Scene, x: number, y: number, stats: any = { hp: 100, speed: 100, damage: 10, attackRange: 60, behavior: 'persistent' }, team: 'hero' | 'enemy' = 'enemy') {
    super(scene, x, y, 'enemy_idle');
    this.hp = stats.hp;
    this.maxHp = stats.hp;
    this.speed = stats.speed;
    this.damage = stats.damage;
    this.attackRange = stats.attackRange;
    this.behavior = stats.behavior || 'limited';
    this.team = team;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setLighting(true);
    this.body.setCircle(32, 64, 64);

    if (stats.displaySize) {
      this.setDisplaySize(stats.displaySize.width, stats.displaySize.height);
    } else {
      this.setDisplaySize(192, 192);
    }

    this.createHealthBar(scene);
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
      if (this.body) this.setVelocity(0);
      this.handleAnimation('idle');
      this.updateHealthBar();
      return;
    }

    // === AGGRO LOGIC ===
    const dist = Phaser.Math.Distance.Between(this.x, this.y, heroOrTarget.x, heroOrTarget.y);
    const hasSight = this.hasLineOfSight(heroOrTarget);

    if (!this.isAggro) {
      // Trigger aggro if in range and seen
      if (dist <= this.aggroRange && hasSight) {
        this.isAggro = true;
      }
    } else {
      // Manage aggro loss
      if (this.behavior === 'limited') {
        if (dist > this.loseAggroRange || !hasSight) {
          this.isAggro = false;
          this.isTrackingLKL = false; // Reset LKL tracking when losing aggro entirely
        }
      }
      // 'persistent' behavior never sets isAggro to false once true
    }

    // Update Last Known Location if we have sight
    if (hasSight) {
      this.lastKnownPosition.set(heroOrTarget.x, heroOrTarget.y);
      if (heroOrTarget.body) {
        this.lastKnownVelocity.set(heroOrTarget.body.velocity.x, heroOrTarget.body.velocity.y);
      }
      this.isTrackingLKL = false; // We have direct sight, no need to track LKL
    } else if (this.isAggro) {
      this.isTrackingLKL = true; // Lose sight but still aggroed -> track LKL
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
    // dist is already declared at line 81

    if (time < this.attackCooldown && dist > this.attackRange) {
      if (this.body) this.setVelocity(0);
      this.handleAnimation('idle');
      this.updateHealthBar();
      return;
    }

    if (dist > this.attackRange) {
      if (!this.isAggro) {
        // Simple Random Walk Wander
        if (this.__wanderTimer <= 0) {
          this.__wanderAngle = Phaser.Math.Between(0, Math.PI * 2);
          this.__wanderTimer = Phaser.Math.Between(1000, 3000);
          this.isWandering = Math.random() < 0.7; // 70% chance to move, 30% to stay idle
        }

        if (this.isWandering) {
          const vx = Math.cos(this.__wanderAngle) * this.speed * 0.35;
          const vy = Math.sin(this.__wanderAngle) * this.speed * 0.35;
          this.setVelocity(vx, vy);
          this.setFlipX(vx < 0);
        } else {
          this.setVelocity(0);
        }

        this.__wanderTimer -= this.scene.game.loop.delta || 16;
        this.handleAnimation(this.isWandering ? 'run' : 'idle');
        this.updateHealthBar();
        return;
      }

      let vx, vy;
      let targetX = target.x;
      let targetY = target.y;

      // === LKL & Extrapolation Logic ===
      if (this.isTrackingLKL) {
        // Predict a point slightly ahead of the last known position based on velocity
        // Prediction factor (0.5s) - adjust for "smarter" enemies
        targetX = this.lastKnownPosition.x + this.lastKnownVelocity.x * 0.5;
        targetY = this.lastKnownPosition.y + this.lastKnownVelocity.y * 0.5;

        const distToLKL = Phaser.Math.Distance.Between(this.x, this.y, targetX, targetY);
        if (distToLKL < 40) { // Increased from 20 to 40 for smoother arrival
          this.isTrackingLKL = false; // Reached LKL point, stop and start wandering/searching
        }
      }

      const angleToTarget = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);

      if (this.hasLineOfSight(target)) {
        vx = Math.cos(angleToTarget) * this.speed;
        vy = Math.sin(angleToTarget) * this.speed;
      } else if (this.isTrackingLKL) {
        // PRIORITIZE LKL pursuit over FlowField when we have a specific last-seen target
        vx = Math.cos(angleToTarget) * this.speed;
        vy = Math.sin(angleToTarget) * this.speed;
      } else if (flowField) {
        const dir = flowField.getDirection(this.x, this.y);
        vx = dir.x * this.speed;
        vy = dir.y * this.speed;
      } else {
        vx = Math.cos(angleToTarget) * this.speed;
        vy = Math.sin(angleToTarget) * this.speed;
      }

      const avoidance = this.calculateWallAvoidance();
      vx += avoidance.x * 0.5;
      vy += avoidance.y * 0.5;

      const separation = this.calculateSeparation();
      vx += separation.x * 0.3;
      vy += separation.y * 0.3;

      this.setVelocity(vx, vy);
    } else {
      if (this.body) this.setVelocity(0);
      this.setFlipX(this.x > target.x);
      this.performAttack(target, time);
    }

    // Determine animation based on ACTUAL velocity
    const actualSpeed = this.body ? Math.hypot(this.body.velocity.x, this.body.velocity.y) : 0;
    if (!this.isAttacking) {
      this.handleAnimation(actualSpeed > 10 ? 'run' : 'idle');
    }

    if (!this.isAttacking && this.body.velocity.x !== 0) {
      this.setFlipX(this.body.velocity.x < 0);
    }
    this.updateHealthBar();
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
        return wall && wall.getBounds && Phaser.Geom.Rectangle.Contains(wall.getBounds(), checkX, checkY);
      });
      if (hit) return false;
    }
    return true;
  }

  private calculateWallAvoidance(): { x: number, y: number } {
    if (!this.scene) return { x: 0, y: 0 };
    const scene = this.scene as any;
    const walls = scene.walls;
    if (!walls) return { x: 0, y: 0 };

    const feelerDist = 40;
    const vel = this.body.velocity;
    const speed = Math.hypot(vel.x, vel.y) || this.speed;
    const normVel = { x: vel.x / speed, y: vel.y / speed };

    const feelers = [
      { x: normVel.x, y: normVel.y },
      { x: normVel.x - normVel.y * 0.5, y: normVel.y + normVel.x * 0.5 },
      { x: normVel.x + normVel.y * 0.5, y: normVel.y - normVel.x * 0.5 }
    ];

    for (const f of feelers) {
      const checkX = this.x + f.x * feelerDist;
      const checkY = this.y + f.y * feelerDist;

      const wall = walls.getChildren().find((w: any) => {
        return w && w.getBounds && Phaser.Geom.Rectangle.Contains(w.getBounds(), checkX, checkY);
      });

      if (wall) {
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

    if (!this.scene) return { x: 0, y: 0 };
    const scene = this.scene as any;
    const enemies = scene.enemies;
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

  protected safePlay(key: string, ignoreIfPlaying: boolean = true) {
    if (!this.anims || !this.anims.exists(key)) {
      console.warn(`[Enemy] Attempted to play missing animation: ${key}. Current texture: ${this.texture?.key}`);
      return;
    }

    // SMART TEXTURE SWAP:
    // Animations in this project follow the pattern: [textureKey]_anim
    // We must ensure the sprite is using the texture the animation was created from.
    const textureKey = key.replace('_anim', '');
    if (this.texture?.key !== textureKey) {
      if (this.textures.get(textureKey)) {
        this.setTexture(textureKey);
      } else {
        console.warn(`[Enemy] Animation ${key} requires texture ${textureKey}, but it is missing from cache.`);
      }
    }

    this.play(key, ignoreIfPlaying);
  }

  protected handleAnimation(state: 'idle' | 'run') {
    const animKey = state === 'idle' ? 'enemy_idle_anim' : 'enemy_run_anim';
    if (this.anims.currentAnim?.key !== animKey) {
      this.safePlay(animKey);
    }
  }

  protected performAttack(hero: Hero, time: number) {
    if (time < this.attackCooldown) {
      this.safePlay('enemy_idle_anim');
      return;
    }

    this.isAttacking = true;
    this.safePlay('enemy_attack_anim');

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
    if (this.scene && this.scene.time) {
      this.scene.time.delayedCall(100, () => {
        this.clearTint();
      });
    }
  }

  isDead(): boolean {
    return this.hp <= 0;
  }

  override destroy() {
    if (this.healthBar) this.healthBar.destroy();
    if (this.healthBarBg) this.healthBarBg.destroy();
    super.destroy();
  }
}
