import * as Phaser from 'phaser';
import { Hero } from '../player/Hero';
import { EnemyAtlas } from '../../systems/EnemyAtlas';
import { EnemyConfig } from '../../systems/EnemyAtlas';

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
  protected attackCooldownMs: number = 1000;
  protected isStunnable: boolean = true;
  protected isAttacking: boolean = false;
  protected attackWindupMs: number = 400; // Default windup time before damage is dealt
  protected attackDurationMs: number = 600; // Duration the entity stays in the attacking state
  protected attackTimer?: Phaser.Time.TimerEvent;
  private projectileGroup?: Phaser.Physics.Arcade.Group;


  private __wanderTimer: number = 0;
  private __wanderAngle: number = 0;
  private isWandering: boolean = false;

  private lastKnownPosition: Phaser.Math.Vector2 = new Phaser.Math.Vector2();
  private lastKnownVelocity: Phaser.Math.Vector2 = new Phaser.Math.Vector2();
  private isTrackingLKL: boolean = false;

  private isAggro: boolean = false;
  private aggroRange: number = 300;
  private loseAggroRange: number = 650; // optional (if you want them to calm down)

  private lastKnownConfigKey: string = '';
  public bodyOffset: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0);
  public bodyRadius: number = 0;
  protected baseTextureKey: string = '';


  constructor(scene: Phaser.Scene, x: number, y: number, configKey: string, team: 'hero' | 'enemy' = 'enemy') {
    const atlas = EnemyAtlas.getInstance(scene);
    const config = atlas.getConfig(configKey);

    if (!config) {
      throw new Error(`[Enemy] Configuration not found for key: ${configKey}`);
    }

    super(scene, x, y, `${config.visuals.textureKey}_idle`);

    this.lastKnownConfigKey = configKey;

    this.team = team;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.applyConfig(config);

    const gameScene = scene as any;
    if (gameScene.projectiles) {
      this.projectileGroup = gameScene.projectiles;
    }

    this.setCollideWorldBounds(true);
    this.setLighting(true);

    this.createHealthBar(scene);

    // Listen for atlas updates to provide real-time feedback in editor
    scene.events.on('enemy-atlas-updated', () => {
      const updatedConfig = atlas.getConfig(this.lastKnownConfigKey);
      if (updatedConfig) {
        this.applyConfig(updatedConfig);
      }
    });
  }

  public updateFromConfig(config: EnemyConfig) {
    this.applyConfig(config);
  }

  private applyConfig(config: EnemyConfig) {
    const { stats, physics, visuals } = config;

    this.baseTextureKey = visuals.textureKey;
    this.hp = stats.hp;
    this.maxHp = stats.hp;
    this.speed = stats.speed;
    this.damage = stats.damage;
    this.attackRange = stats.attackRange;
    this.behavior = stats.behavior;
    this.attackWindupMs = stats.attackWindupMs;
    this.attackDurationMs = stats.attackDurationMs ?? this.attackWindupMs + 200;
    this.attackCooldownMs = stats.attackCooldownMs;
    this.isStunnable = stats.isStunnable;
    this.aggroRange = stats.aggroRange;
    this.loseAggroRange = stats.loseAggroRange;

    this.body.setCircle(physics.bodyCircle.radius, physics.bodyCircle.x, physics.bodyCircle.y);
    this.bodyRadius = physics.bodyCircle.radius;
    this.bodyOffset.set(physics.bodyCircle.x, physics.bodyCircle.y);

    if (stats.displaySize) {
      this.setDisplaySize(stats.displaySize.width, stats.displaySize.height);
    }
  }

  getHitbox(): Phaser.Geom.Rectangle {
    const atlas = EnemyAtlas.getInstance(this.scene as Phaser.Scene);
    const config = atlas.getConfig(this.lastKnownConfigKey);
    const hitbox = config?.physics.hitbox || { x: 0, y: 0, w: 10, h: 10 };

    return new Phaser.Geom.Rectangle(
      this.x + hitbox.x,
      this.y + hitbox.y,
      hitbox.w,
      hitbox.h
    );
  }

  private createHealthBar(scene: Phaser.Scene) {
    const width = 60;
    const height = 6;

    this.healthBarBg = scene.add.rectangle(0, 0, width, height, 0x000000);
    this.healthBar = scene.add.rectangle(0, 0, width, height, 0x00ff00);

    this.healthBarBg.setDepth(this.depth + 1);
    this.healthBar.setDepth(this.depth + 2);
  }

  private lastLoggedFrame: number = -1;

  update(heroOrTarget: any, time: number, flowField?: any): void {
    if (this.isDead()) {
      if (this.body) this.setVelocity(0);
      this.handleAnimation('idle');
      this.updateHealthBar();
      return;
    }

    // HEARTBEAT DEBUG: Verify update loop is running
    //console.log(`[Enemy Heartbeat] ${this.lastKnownConfigKey} updating...`);

    // Log frame changes for debugging animation ranges
    if (this.anims && this.anims.currentAnim) {
      const currentAnim = this.anims.currentAnim;
      let currentFrame = -1;

      if (typeof this.frame === 'number') {
        currentFrame = this.frame;
      } else if (this.frame && typeof (this.frame as any).index === 'number') {
        currentFrame = (this.frame as any).index;
      }

      if (currentFrame !== -1 && currentFrame !== this.lastLoggedFrame) {
        console.log(`[Anim Debug] ${this.baseTextureKey} | Anim: ${currentAnim.key} | Frame: ${currentFrame}`);
        this.lastLoggedFrame = currentFrame;
      }
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

  public safePlay(key: string, ignoreIfPlaying: boolean = true) {
    // Use the key directly as the texture key if it ends with _anim
    const targetTextureKey = key.replace('_anim', '');

    if (this.texture?.key !== targetTextureKey) {
      if (this.scene.textures.get(targetTextureKey)) {
        this.setTexture(targetTextureKey);
      } else {
        console.warn(`[Enemy] Animation ${key} requires texture ${targetTextureKey}, but it is missing from cache.`);
      }
    }

    if (!this.anims || !this.anims.exists(key)) {
      // Fallback: try generic enemy animation if type-specific one is missing
      const fallbackKey = key.includes('_') ? 'enemy_idle_anim' : key;
      if (this.anims && this.anims.exists(fallbackKey)) {
        this.play(fallbackKey, ignoreIfPlaying);
        console.log("THIS WAS CALLED");
      } else {
        // If everything fails, we still call play() because the user reported
        // that .play() works even when exists(key) says it doesn't.
        this.play(key, ignoreIfPlaying);
        console.log("THIS WAS CALLED TOO");
        //console.warn(`[Enemy] Animation ${key} not found and no suitable fallback available.`);
      }
      return;
    }

    console.log("THIS WAS CALLED INSTEAD");

    this.play(key, ignoreIfPlaying);
  }

  protected handleAnimation(state: 'idle' | 'run') {
    const animKey = `${this.baseTextureKey}_${state}_anim`;
    if (this.anims.currentAnim?.key !== animKey) {
      this.safePlay(animKey);
    }
  }

  protected getAttackAnimation(): string {
    const atlas = EnemyAtlas.getInstance(this.scene as Phaser.Scene);
    const config = atlas.getConfig(this.lastKnownConfigKey);

    if (!config) {
      return `${this.baseTextureKey}_attack_anim`;
    }

    const attackAnims = Object.keys(config.visuals.animations).filter(key =>
      config.visuals.animations[key].damageType
    );

    if (attackAnims.length === 0) {
      return `${this.baseTextureKey}_attack_anim`;
    }

    const randomAnim = attackAnims[Math.floor(Math.random() * attackAnims.length)];
    return `${this.baseTextureKey}_${randomAnim}_anim`;
  }

  protected performAttack(hero: Hero, time: number) {
    if (time < this.attackCooldown) {
      this.handleAnimation('idle');
      return;
    }

    console.log(`[Combat Debug] performAttack called. Target: ${hero.constructor.name}. Setting isAttacking = true.`);
    this.isAttacking = true;

    const animKey = this.getAttackAnimation();
    console.log(`[Combat Debug] Playing attack animation: ${animKey}`);
    this.play(animKey, true);

    this.attackTimer = this.scene.time.delayedCall(this.attackWindupMs, () => {
      this.executeAttackDamage(hero);
    });

    // Separately handle the end of the attack animation duration
    this.scene.time.delayedCall(this.attackDurationMs, () => {
      this.isAttacking = false;
      const variance = (Math.random() - 0.5) * (this.attackCooldownMs * 0.2);
      this.attackCooldown = time + this.attackCooldownMs + variance;
    });
  }

  protected executeAttackDamage(hero: Hero) {
    const dist = Phaser.Math.Distance.Between(this.x, this.y, hero.x, hero.y);

    // Resolve damage type from the active attack animation
    const atlas = EnemyAtlas.getInstance(this.scene as Phaser.Scene);
    const config = atlas.getConfig(this.lastKnownConfigKey);
    const animKey = this.getAttackAnimation().replace('_anim', '');
    const animConfig = config?.visuals.animations[animKey];
    const currentDamageType = animConfig?.damageType || 'melee';

    let hit = false;

    if (currentDamageType === 'melee') {
      const isInFront = this.flipX ? (hero.x < this.x + 20) : (hero.x > this.x - 20);
      if (dist <= this.attackRange * 1.2 && isInFront) {
        hit = true;
      }
    } else if (currentDamageType === 'aoe') {
      if (dist <= this.attackRange * 1.2) {
        hit = true;
      }
    } else if (currentDamageType === 'projectile') {
      this.fireProjectile(hero);
      hit = true;
    } else if (currentDamageType === 'range_aoe') {
      this.fireRangeAOE(hero);
      hit = true;
    }

    if (hit) {
      if ((currentDamageType === 'melee' || currentDamageType === 'aoe') && hero.takeDamage) {
        hero.takeDamage(this.damage);
        console.log(`[Combat Debug] ${currentDamageType} Attack Hit! Damage: ${this.damage}`);
      } else if (currentDamageType === 'projectile' || currentDamageType === 'range_aoe') {
        console.log(`[Combat Debug] ${currentDamageType} Attack Triggered!`);
      }
    } else {
      console.log(`[Combat Debug] ${currentDamageType} Attack Missed: ${Math.round(dist)}px`);
    }
  }

  private fireProjectile(target: any) {
    if (!this.projectileGroup) return;
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
  }

  private fireRangeAOE(target: any) {
    const effect = this.scene.add.sprite(target.x, target.y, 'glow');
    effect.setScale(0.5);

    this.scene.tweens.add({
      targets: effect,
      scale: 3,
      alpha: 0,
      duration: 500,
      onComplete: () => effect.destroy()
    });

    const aoeRadius = this.attackRange * 0.5;
    (this.scene as any).enemies.getChildren().forEach((member: any) => {
      if (member.team === 'hero') {
        const dist = Phaser.Math.Distance.Between(target.x, target.y, member.x, member.y);
        if (dist <= aoeRadius && member.takeDamage) {
          member.takeDamage(this.damage);
        }
      }
    });
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

    if (this.isStunnable && this.isAttacking) {
      if (this.attackTimer) {
        this.attackTimer.destroy();
        this.attackTimer = undefined;
      }
      this.isAttacking = false;
      console.log(`[Combat Debug] ${this.lastKnownConfigKey} stunned! Attack interrupted.`);
    }

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
