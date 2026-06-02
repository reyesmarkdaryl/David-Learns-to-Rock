import * as Phaser from 'phaser';
import { DEBUG_MODE } from "../../config";
import { Enemy } from '../enemies/Enemy';
import { RhythmSystem } from '../../systems/RhythmSystem';
import { HeroAtlas } from '../../systems/HeroAtlas';

export enum HeroState {
  IDLE = 'IDLE',
  WALK = 'WALK',
  ATTACK = 'ATTACK',
  DASH = 'DASH'
}

export class Hero extends Phaser.Physics.Arcade.Sprite {
  private state: HeroState = HeroState.IDLE;
  private attackCooldown: number = 0;
  private readonly ATTACK_COOLDOWN_MS = 300;
  private dashEndTime: number = 0;
  private dashCooldownTimer: number = 0;
  private readonly DASH_COOLDOWN_MS = 1000;
  private readonly DASH_DURATION_MS = 200;
  private hitEnemies: Set<Enemy> = new Set();

  public stats = {
    hp: 100,
    maxHp: 100,
    moveSpeed: 160,
    attackRange: 60,
    attackDamage: 25,
    dashDistance: 200,
    attackConeAngle: 22.5, // Half-angle in degrees (22.5 = 45 deg total)
  };

  private facingDirection: number = 0;
  private lastAttackDirection: string | undefined = undefined;
  private attackComboIndex: number = 0;
  private rangeVisual!: Phaser.GameObjects.Graphics;
  private sword!: Phaser.GameObjects.Sprite;
  private swordAngle: number = 0;
  private swordDistance: number = 0;
  private isSwordTweening: boolean = false;

  protected baseTextureKey: string = 'hero';

  constructor(scene: Phaser.Scene, x: number, y: number) {
    const idleTexture = HeroAtlas.getInstance(scene).getIdleTexture();
    super(scene, x, y, idleTexture);


    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);

    // Physics body
    this.body.setCircle(16, 104, 48);

    this.setDepth(10);

    // scale
    this.setDisplaySize(240, 128);

    this.handleAnimation('idle');

    this.rangeVisual = scene.add.graphics();
    this.rangeVisual.setDepth(9);

    // Floating Sword Initialization
    this.sword = scene.add.sprite(this.x, this.y, 'floating_sword');
    this.sword.setOrigin(0.5, 1); // Anchor at the handle
    this.sword.setScale(0.4);     // Scale based on hero size
    this.sword.setDepth(this.depth + 1);
  }

  private setSizing(width: number, height: number): void {
    this.setDisplaySize(width, height);
  }

  protected handleAnimation(state: 'idle' | 'run' | 'dash'): void {
    const animKey = `${this.baseTextureKey}_${state}_anim`;
    if (this.anims?.currentAnim?.key !== animKey) {
      this.playAnim(animKey);
    }
  }

  private playAnim(key: string, ignoreIfPlaying: boolean = true): void {
    if (!this.anims) return;

    // Derive texture key from animation key (e.g., 'hero_idle_anim' -> 'hero_idle')
    const targetTextureKey = key.replace('_anim', '');

    if (this.texture?.key !== targetTextureKey) {
      if (this.scene.textures.get(targetTextureKey)) {
        this.setTexture(targetTextureKey);
      } else {
        console.warn(`[Hero] Animation ${key} requires texture ${targetTextureKey}, but it is missing from cache.`);
      }
    }

    if (this.anims.exists(key) || this.scene.anims.exists(key)) {
      this.play(key, ignoreIfPlaying);
    } else {
      console.warn(`[Hero] Animation ${key} not found!`);
    }
  }

  update(cursors: any, time: number): void {
    this.setDepth(this.y + this.height / 2);

    // Update Floating Sword Position and Rotation
    if (this.state !== HeroState.ATTACK) {
      // Gentle "fairy-like" bobbing effect
      const bobAmplitude = 5;
      const bobSpeed = 0.003;
      const bobOffset = Math.sin(time * bobSpeed) * bobAmplitude;

      // Position the sword slightly behind and above the hero
      const behindOffset = this.facingDirection === 0 ? -20 : 20;

      this.sword.x = this.x + behindOffset;
      this.sword.y = this.y - 10 + bobOffset;

      // Sword points slightly upwards while idling
      this.sword.rotation = -0.2;
    } else {
      // During attack, the sword "flies" out to the attack range
      if (!this.isSwordTweening) {
        this.sword.x = this.x + Math.cos(this.swordAngle) * this.swordDistance;
        this.sword.y = this.y + Math.sin(this.swordAngle) * this.swordDistance;
      }

      // Keep the blade pointing away from the hero
      this.sword.rotation = this.swordAngle + Math.PI / 2;
    }

    // SMOOTH RETURN: If we are transitioning back to IDLE/WALK,
    // the sword's position is now governed by the 'if' block above.
    // To avoid a snap, we could tween the sword back to the hover position,
    // but since the 'update' loop sets position every frame,
    // we just need to ensure swordDistance and swordAngle transition smoothly.
    this.sword.setDepth(this.depth + 1);

    if (DEBUG_MODE) {
      this.rangeVisual.clear();
      this.rangeVisual.lineStyle(2, 0xffffff, 0.3);
      this.rangeVisual.strokeCircle(this.x, this.y, this.stats.attackRange);
    }

    if (this.state === HeroState.DASH) {
      if (time >= this.dashEndTime) {
        this.state = HeroState.IDLE;
        this.handleAnimation('idle');
      }
      return;
    }

    if (this.state === HeroState.ATTACK) {
      if (time >= this.attackCooldown) {
        if (this.attackComboIndex === 0 && this.hitEnemies.size > 0) {
          this.attackComboIndex = 1;
        } else {
          this.attackComboIndex = 0;
        }

        this.state = HeroState.IDLE;
        this.handleAnimation('idle');
      }
      return;
    }

    const moveX =
      (cursors.left.isDown ? -1 : 0) +
      (cursors.right.isDown ? 1 : 0);

    const moveY =
      (cursors.up.isDown ? -1 : 0) +
      (cursors.down.isDown ? 1 : 0);

    if (moveX !== 0 || moveY !== 0) {
      if (this.state !== HeroState.WALK) {
        this.state = HeroState.WALK;
        this.handleAnimation('run');
      }

      const angle = Math.atan2(moveY, moveX);

      this.setVelocity(
        Math.cos(angle) * this.stats.moveSpeed,
        Math.sin(angle) * this.stats.moveSpeed
      );

      if (moveX !== 0) {
        this.facingDirection = moveX > 0 ? 0 : 1;
        this.setFlipX(this.facingDirection === 1);
      }
    } else {
      if (this.state !== HeroState.IDLE) {
        this.state = HeroState.IDLE;
        this.handleAnimation('idle');
      }

      this.setVelocity(0);
    }
  }

  dash(time: number): void {
    if (this.state === HeroState.DASH || time < this.dashCooldownTimer) return;

    this.state = HeroState.DASH;
    this.dashEndTime = time + this.DASH_DURATION_MS;

    const dashVelocity =
      this.stats.dashDistance / (this.DASH_DURATION_MS / 1000);

    const vx = this.facingDirection === 0 ? dashVelocity : -dashVelocity;

    this.setVelocity(vx, 0);

    this.handleAnimation('dash');

    this.scene.time.delayedCall(this.DASH_COOLDOWN_MS, () => {
      this.dashCooldownTimer = 0;
    });
  }

  private findBestThrustTarget(): number | null {
    const enemies = (this.scene as any).enemies;
    if (!enemies) return null;

    let bestTargetAngle: number | null = null;
    let minDist = Infinity;

    const forwardAngle = this.facingDirection === 0 ? 0 : Math.PI;
    const snapRange = this.stats.attackRange * 1.5;
    const snapCone = Math.PI / 3; // 60 degree snap window (+/- 30 deg)

    enemies.getChildren().forEach((enemy: Enemy) => {
      if (enemy.team !== 'enemy') return;

      const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
      if (dist > snapRange) return;

      const angleToEnemy = Phaser.Math.Angle.Between(this.x, this.y, enemy.x, enemy.y);
      let diff = angleToEnemy - forwardAngle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;

      if (Math.abs(diff) <= snapCone) {
        if (dist < minDist) {
          minDist = dist;
          bestTargetAngle = angleToEnemy;
        }
      }
    });

    return bestTargetAngle;
  }

  performAttack(time: number, direction?: string): void {
    if (this.state === HeroState.ATTACK) return;

    this.state = HeroState.ATTACK;
    this.lastAttackDirection = direction;

    let attackAnim = '';
    let startAngle = 0;
    let endAngle = 0;
    let duration = 150;

    if (direction === 'UP' || direction === 'DOWN') {
      const forwardAngle = this.facingDirection === 0 ? 0 : Math.PI;
      attackAnim = direction === 'UP' ? 'hero_attack1_anim' : 'hero_attack1_anim';

      const targetAngle = this.findBestThrustTarget();
      startAngle = targetAngle !== null ? targetAngle : forwardAngle;
      endAngle = startAngle;
    } else if (direction === 'LEFT') {
      attackAnim = this.attackComboIndex === 0 ? 'hero_attack1_anim' : 'hero_attack1_anim';
      if (this.facingDirection === 0) {
        startAngle = Phaser.Math.DegToRad(120);
        endAngle = Phaser.Math.DegToRad(-120);
      } else {
        startAngle = Phaser.Math.DegToRad(300);
        endAngle = Phaser.Math.DegToRad(60);
      }
    } else if (direction === 'RIGHT') {
      attackAnim = this.attackComboIndex === 0 ? 'hero_attack1_anim' : 'hero_attack1_anim';
      if (this.facingDirection === 0) {
        startAngle = Phaser.Math.DegToRad(-120);
        endAngle = Phaser.Math.DegToRad(120);
      } else {
        startAngle = Phaser.Math.DegToRad(60);
        endAngle = Phaser.Math.DegToRad(300);
      }
    } else {
      attackAnim = this.attackComboIndex === 0 ? 'hero_attack1_anim' : 'hero_attack1_anim';
      if (this.facingDirection === 0) {
        startAngle = Phaser.Math.DegToRad(-120);
        endAngle = Phaser.Math.DegToRad(120);
      } else {
        startAngle = Phaser.Math.DegToRad(60);
        endAngle = Phaser.Math.DegToRad(300);
      }
    }

    this.playAnim(attackAnim);
    this.setVelocity(0);

    // Procedural Sword Attack Animation
    this.swordAngle = startAngle;

    if (direction === 'UP' || direction === 'DOWN') {
      // Thrust Attack: Tween from current world position to attack range and back
      this.isSwordTweening = true;
      const startX = this.sword.x;
      const startY = this.sword.y;
      const targetX = this.x + Math.cos(this.swordAngle) * this.stats.attackRange;
      const targetY = this.y + Math.sin(this.swordAngle) * this.stats.attackRange;

      this.scene.tweens.add({
        targets: this.sword,
        x: targetX,
        y: targetY,
        duration: duration / 2,
        ease: 'Back.Out',
        onComplete: () => {
          this.scene.tweens.add({
            targets: this.sword,
            x: startX,
            y: startY,
            duration: duration / 2,
            ease: 'Sine.In',
            onComplete: () => {
              this.isSwordTweening = false;
            }
          });
        }
      });
    } else {
      // Slash Attack: Tween angle with a constant distance
      this.swordDistance = this.stats.attackRange * 0.6;

      // MATCH CONE: The animation now swings from -coneWidth to +coneWidth
      // instead of fixed -120 to 120.
      const baseConeRad = this.stats.attackConeAngle * (Math.PI / 180);
      const actualConeRad = baseConeRad * 2; // Scale to horizontal swing wide-arc

      // Adjust start/end angles based on facing
      if (this.facingDirection === 0) {
        // Facing East: swing centered at 0
        startAngle = -actualConeRad;
        endAngle = actualConeRad;
      } else {
        // Facing West: swing centered at PI
        startAngle = Math.PI - actualConeRad;
        endAngle = Math.PI + actualConeRad;
      }

      this.swordAngle = startAngle;
      this.scene.tweens.add({
        targets: this,
        swordAngle: endAngle,
        duration: duration,
        ease: 'Sine.Out',
        onComplete: () => {
          // Smoothly transition swordAngle back to the hover rotation
          this.scene.tweens.add({
            targets: this,
            swordAngle: -0.2 - Math.PI / 2,
            duration: 200,
            ease: 'Sine.In'
          });
        }
      });
    }

    this.attackCooldown = time + this.ATTACK_COOLDOWN_MS;
    this.hitEnemies.clear();
  }

  isEnemyInAttackCone(enemy: Enemy): boolean {
    const hitbox = enemy.getHitbox();

    // 1. Distance Check: Use the closest point on the hitbox to the hero
    const closestX = Phaser.Math.Clamp(this.x, hitbox.x, hitbox.x + hitbox.width);
    const closestY = Phaser.Math.Clamp(this.y, hitbox.y, hitbox.y + hitbox.height);
    const dist = Phaser.Math.Distance.Between(this.x, this.y, closestX, closestY);

    if (dist > this.stats.attackRange) return false;

    // 2. Determine the attack's center angle
    let attackAngle: number;
    if (this.state === HeroState.ATTACK && (this.lastAttackDirection === 'UP' || this.lastAttackDirection === 'DOWN')) {
      attackAngle = this.swordAngle;
    } else {
      attackAngle = this.facingDirection === 0 ? 0 : Math.PI;
    }

    // 3. Check multiple points for the angle to handle large hitboxes better
    // Point A: The closest point on the hitbox
    const angleToClosest = Phaser.Math.Angle.Between(this.x, this.y, closestX, closestY);

    // Point B: The center of the hitbox
    const centerX = hitbox.x + hitbox.width / 2;
    const centerY = hitbox.y + hitbox.height / 2;
    const angleToCenter = Phaser.Math.Angle.Between(this.x, this.y, centerX, centerY);

    const baseConeRad = this.stats.attackConeAngle * (Math.PI / 180);
    let coneWidth = baseConeRad;
    if (this.lastAttackDirection === 'LEFT' || this.lastAttackDirection === 'RIGHT') {
      coneWidth = baseConeRad * 2;
    }

    const isAngleInCone = (angle: number) => {
      let diff = angle - attackAngle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      return Math.abs(diff) <= coneWidth;
    };

    // If either the closest point OR the center is in the cone, it's a hit.
    // This prevents "missing" large enemies when you're hitting their edge.
    if (isAngleInCone(angleToClosest) || isAngleInCone(angleToCenter)) {
      return true;
    }

    // 4. Fallback: If the enemy is huge, they might overlap the cone without the center or closest point being in it.
    // We check if the hitbox contains any point along the center line of the cone within range.
    const lineX = this.x + Math.cos(attackAngle) * this.stats.attackRange;
    const lineY = this.y + Math.sin(attackAngle) * this.stats.attackRange;

    // Simple intersection of the attack center-line segment and the hitbox
    // We can check if the line from (this.x, this.y) to (lineX, lineY) intersects the rectangle
    if (Phaser.Geom.Intersects.LineToRectangle(
      new Phaser.Geom.Line(this.x, this.y, lineX, lineY),
      hitbox
    )) {
      return true;
    }

    return false;
  }

  getHitEnemies(): Set<Enemy> {
    return this.hitEnemies;
  }

  getState(): HeroState {
    return this.state;
  }

  takeDamage(amount: number): void {
    if (this.state === HeroState.DASH) return;

    this.stats.hp -= amount;

    this.setTint(0xff0000);

    this.scene.time.delayedCall(100, () => {
      this.clearTint();
    });
  }

  isDead(): boolean {
    return this.stats.hp <= 0;
  }

  getHurtbox(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(
      this.x - 16,
      this.y - 16,
      32,
      32
    );
  }

  getAttackHitbox(): Phaser.Geom.Rectangle {
    const range = this.stats.attackRange;

    return new Phaser.Geom.Rectangle(
      this.x - range,
      this.y - range,
      range * 2,
      range * 2
    );
  }

  override destroy() {
    if (this.rangeVisual) {
      this.rangeVisual.destroy();
    }
    if (this.sword) {
      this.sword.destroy();
    }
    super.destroy();
  }

  drawDebug(graphics: Phaser.GameObjects.Graphics): void {
    if (!DEBUG_MODE) return;

    // Draw attack cone if attacking
    if (this.state === HeroState.ATTACK) {
      let attackAngle = this.facingDirection === 0 ? 0 : Math.PI;
      if (this.lastAttackDirection === 'UP' || this.lastAttackDirection === 'DOWN') {
        attackAngle = this.swordAngle;
      }

      const baseConeRad = this.stats.attackConeAngle * (Math.PI / 180);
      let coneWidth = baseConeRad;
      if (this.lastAttackDirection === 'LEFT' || this.lastAttackDirection === 'RIGHT') {
        coneWidth = baseConeRad * 2;
      }

      graphics.fillStyle(0x00ff00, 0.2);
      graphics.lineStyle(2, 0x00ff00, 0.5);

      graphics.beginPath();
      graphics.moveTo(this.x, this.y);
      graphics.arc(this.x, this.y, this.stats.attackRange, attackAngle - coneWidth, attackAngle + coneWidth);
      graphics.lineTo(this.x, this.y);
      graphics.closePath();
      graphics.fillPath();
      graphics.strokePath();
    }

    const hitbox = this.getAttackHitbox();
    graphics.fillStyle(0xff0000, 0.3);
    graphics.fillRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);

    graphics.lineStyle(1, 0xff0000);
    graphics.strokeRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);

    const hurtbox = this.getHurtbox();
    graphics.lineStyle(1, 0xffff00);
    graphics.strokeRect(hurtbox.x, hurtbox.y, hurtbox.width, hurtbox.height);
  }
}