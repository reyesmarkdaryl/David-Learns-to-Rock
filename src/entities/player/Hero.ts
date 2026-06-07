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
  private readonly THRUST_HILT_OFFSET = 32;
  private hitEnemies: Set<Enemy> = new Set();

  public stats = {
    hp: 100,
    maxHp: 100,
    moveSpeed: 160,
    attackRange: 60,
    attackDamage: 25,
    dashDistance: 200,
    attackConeAngle: 22.5,
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
    this.body.setCircle(8, 112, 64);
    this.setDepth(10);
    this.setDisplaySize(240, 128);

    this.handleAnimation('idle');

    this.rangeVisual = scene.add.graphics();
    this.rangeVisual.setDepth(9);

    this.sword = scene.add.sprite(this.x, this.y, 'floating_sword');
    this.sword.setOrigin(0.5, 1);
    this.sword.setScale(0.4);
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

    if (this.state !== HeroState.ATTACK) {
      // Gentle "fairy-like" bobbing effect
      const bobAmplitude = 5;
      const bobSpeed = 0.003;
      const bobOffset = Math.sin(time * bobSpeed) * bobAmplitude;

      const behindOffset = this.facingDirection === 0 ? -20 : 20;
      this.sword.x = this.x + behindOffset;
      this.sword.y = this.y - 10 + bobOffset;
      this.sword.rotation = -0.2;
    } else {
      // During attack, position is driven by tweens (isSwordTweening)
      // or by swordAngle/swordDistance for arc-based slashes
      if (!this.isSwordTweening) {
        this.sword.x = this.x + Math.cos(this.swordAngle) * this.swordDistance;
        this.sword.y = this.y + Math.sin(this.swordAngle) * this.swordDistance;
      }
      this.sword.rotation = this.swordAngle + Math.PI / 2;
    }

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
    const snapCone = Math.PI / 3;

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

  // ─── helpers ────────────────────────────────────────────────────────────────

  /** Brief white flash on the sword — signals impact visually */
  private swordFlash(delay = 0): void {
    this.scene.time.delayedCall(delay, () => {
      this.sword.setTint(0xffffff);
      this.scene.time.delayedCall(60, () => this.sword.clearTint());
    });
  }

  // ─── ATTACK ENTRY POINT ─────────────────────────────────────────────────────

  performAttack(time: number, direction?: string): void {
    if (this.state === HeroState.ATTACK) return;

    this.state = HeroState.ATTACK;
    this.lastAttackDirection = direction;
    this.isSwordTweening = false;

    this.playAnim('hero_attack1_anim');
    this.setVelocity(0);
    this.spawnAttackVFX(direction);

    this.attackCooldown = time + this.ATTACK_COOLDOWN_MS;
    this.hitEnemies.clear();

    if (direction === 'UP' || direction === 'DOWN') {
      this._doThrustAttack(direction);
    } else if (direction === 'LEFT' || direction === 'RIGHT') {
      this._doSlashAttack(direction);
    } else {
      this._doSpinSlash();
    }
  }

  // ─── ATTACK 1 — THRUST (UP / DOWN) ─────────────────────────────────────────
  //
  // Phases:
  //   1. Pull-back + squash  (instant snap)
  //   2. 40 ms anticipation pause
  //   3. Rocket forward with horizontal stretch
  //   4. Micro-vibration on impact + camera shake + flash
  //   5. Graceful arc back to hover
  //
  private _doThrustAttack(direction: 'UP' | 'DOWN'): void {
    const forwardAngle = this.facingDirection === 0 ? 0 : Math.PI;
    const thrustAngle  = this.findBestThrustTarget() ?? forwardAngle;
    const range        = this.stats.attackRange;

    // Record for hit-detection in isEnemyInAttackCone
    this.swordAngle    = thrustAngle;
    this.swordDistance = range;

    // Pull-back position (opposite of thrust direction)
    const pullX = this.x - Math.cos(thrustAngle) * 18;
    const pullY = this.y - Math.sin(thrustAngle) * 18;

    // Target position at full range (adjusted for blade length)
    const thrustX = this.x + Math.cos(thrustAngle) * (range - this.THRUST_HILT_OFFSET);
    const thrustY = this.y + Math.sin(thrustAngle) * (range - this.THRUST_HILT_OFFSET);

    // Phase 1 — snap to pull-back with squash
    this.isSwordTweening = true;
    this.sword.x = pullX;
    this.sword.y = pullY;
    this.sword.setScale(0.75, 1.3);

    // Phase 2 — anticipation pause, then fire
    this.scene.time.delayedCall(40, () => {

      // Phase 3 — rocket forward, stretch along travel axis
      this.scene.tweens.add({
        targets: this.sword,
        x: thrustX,
        y: thrustY,
        scaleX: 1.25,
        scaleY: 0.75,
        duration: 65,
        ease: 'Sine.In',
        onComplete: () => {

          // Phase 4 — impact: flash + shake + squash
          this.swordFlash();
          this.scene.cameras.main.shake(80, 0.006);
          this.sword.setScale(0.65, 1);

          // Micro-vibration in place
          this.scene.tweens.add({
            targets: this.sword,
            x: thrustX + 4,
            duration: 22,
            ease: 'Sine.InOut',
            yoyo: true,
            repeat: 2,
            onComplete: () => {

              // Phase 5 — arc back to hover position
              this.scene.tweens.add({
                targets: this.sword,
                x: this.x + Math.cos(thrustAngle) * 22,
                y: this.y + Math.sin(thrustAngle) * 22 - 10,
                scaleX: 0.4,
                scaleY: 0.4,
                duration: 140,
                ease: 'Back.In',
                onComplete: () => {
                  this.sword.setScale(0.4);
                  this.isSwordTweening = false;
                }
              });
            }
          });
        }
      });
    });
  }

  // ─── ATTACK 2 — SLASH (LEFT / RIGHT) ───────────────────────────────────────
  //
  // Phases:
  //   1. Wind-up snap to opposite extreme (30 ms pause for anticipation)
  //   2. Strike across full arc — sword stretches along travel during swing
  //   3. Impact flash + mild camera shake
  //   4. Follow-through overshoot → ease back to settle angle
  //
  private _doSlashAttack(direction: 'LEFT' | 'RIGHT'): void {
    const baseConeRad = this.stats.attackConeAngle * (Math.PI / 180);
    const halfArc     = baseConeRad * 2;
    const centre      = this.facingDirection === 0 ? 0 : Math.PI;

    // Sign determines which way the slash travels
    const isRight = direction === 'RIGHT';
    const sign    = (isRight && this.facingDirection === 0) ||
                    (!isRight && this.facingDirection === 1) ? 1 : -1;

    const windUpAngle  = centre - sign * halfArc * 1.15;  // past start
    const strikeAngle  = centre + sign * halfArc * 1.2;   // past end (overshoot)
    const settleAngle  = centre + sign * halfArc * 0.55;  // final rest

    this.swordDistance = this.stats.attackRange * 0.65;
    this.swordAngle    = windUpAngle; // hit-detection tracks this

    // Phase 1 — wind-up snap
    this.isSwordTweening = false; // let update() position via swordAngle
    this.sword.setScale(0.4 * 1.1, 0.4 * 0.85);

    this.scene.time.delayedCall(30, () => {

      // Phase 2 — strike sweep
      this.scene.tweens.add({
        targets: this,
        swordAngle: strikeAngle,
        duration: 90,
        ease: 'Cubic.Out',
        onUpdate: () => {
          // Stretch sword along travel during the swing arc
          const progress = Math.abs(this.swordAngle - windUpAngle)
                         / Math.abs(strikeAngle - windUpAngle);
          const stretch  = 1 + Math.sin(progress * Math.PI) * 0.55;
          const squash   = 1 - Math.sin(progress * Math.PI) * 0.3;
          this.sword.setScale(0.4 * stretch, 0.4 * squash);
        },
        onComplete: () => {

          // Phase 3 — impact
          this.swordFlash();
          this.scene.cameras.main.shake(50, 0.004);

          // Phase 4 — follow-through settle
          this.scene.tweens.add({
            targets: this,
            swordAngle: settleAngle,
            duration: 170,
            ease: 'Back.Out',
            onUpdate: () => {
              // Smoothly return scale to normal
              this.sword.setScale(0.4);
            },
            onComplete: () => {
              this.sword.setScale(0.4);
            }
          });
        }
      });
    });
  }

  // ─── ATTACK 3 — SPIN SLASH (no direction = special/charged) ────────────────
  //
  // Phases:
  //   1. Full 360° + 45° orbit with Quad.In acceleration (slow → fast)
  //   2. Scale pulses rhythmically during spin to show momentum
  //   3. Release lunge: sword flies outward at exit angle (Expo.Out)
  //   4. Strong camera shake + flash at release
  //
  private _doSpinSlash(): void {
    const range      = this.stats.attackRange * 0.7;
    const startAngle = this.facingDirection === 0 ? -Math.PI * 0.9 : Math.PI * 0.1;
    const endAngle   = startAngle + Math.PI * 2.25; // full rotation + 45° overshoot

    this.swordDistance = range;
    this.swordAngle    = startAngle;
    this.isSwordTweening = false; // update() drives position via swordAngle

    // Anticipation squash before spin
    this.sword.setScale(0.4 * 0.8, 0.4 * 1.25);

    // Phase 1 & 2 — accelerating orbit with momentum pulses
    this.scene.tweens.add({
      targets: this,
      swordAngle: endAngle,
      duration: 460,
      ease: 'Quad.In',
      onUpdate: () => {
        const t      = (this.swordAngle - startAngle) / (endAngle - startAngle);
        const pulse  = 1 + Math.sin(t * Math.PI * 4) * 0.18;
        this.sword.setScale(0.4 * pulse, 0.4 * (2 - pulse));
      },
      onComplete: () => {

        // Phase 3 — flash + strong shake at release
        this.swordFlash();
        this.scene.cameras.main.shake(130, 0.010);

        // Phase 4 — outward lunge
        const releaseAngle = this.swordAngle;
        const releaseX     = this.x + Math.cos(releaseAngle) * (this.stats.attackRange - this.THRUST_HILT_OFFSET);
        const releaseY     = this.y + Math.sin(releaseAngle) * (this.stats.attackRange - this.THRUST_HILT_OFFSET);

        this.isSwordTweening = true;
        this.sword.setScale(0.4 * 1.5, 0.4 * 0.6);

        this.scene.tweens.add({
          targets: this.sword,
          x: releaseX,
          y: releaseY,
          scaleX: 0.4,
          scaleY: 0.4,
          duration: 95,
          ease: 'Expo.Out',
          onComplete: () => {
            this.isSwordTweening = false;
          }
        });
      }
    });
  }

  isEnemyInAttackCone(enemy: Enemy): boolean {
    const hitbox = enemy.getHitbox();

    const closestX = Phaser.Math.Clamp(this.x, hitbox.x, hitbox.x + hitbox.width);
    const closestY = Phaser.Math.Clamp(this.y, hitbox.y, hitbox.y + hitbox.height);
    const dist = Phaser.Math.Distance.Between(this.x, this.y, closestX, closestY);

    if (dist > this.stats.attackRange) return false;

    let attackAngle: number;
    if (this.state === HeroState.ATTACK && (this.lastAttackDirection === 'UP' || this.lastAttackDirection === 'DOWN')) {
      attackAngle = this.swordAngle;
    } else {
      attackAngle = this.facingDirection === 0 ? 0 : Math.PI;
    }

    const angleToClosest = Phaser.Math.Angle.Between(this.x, this.y, closestX, closestY);

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

    if (isAngleInCone(angleToClosest) || isAngleInCone(angleToCenter)) {
      return true;
    }

    const lineX = this.x + Math.cos(attackAngle) * this.stats.attackRange;
    const lineY = this.y + Math.sin(attackAngle) * this.stats.attackRange;

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

  private getAttackCenterAngle(): number {
    if (this.state === HeroState.ATTACK && (this.lastAttackDirection === 'UP' || this.lastAttackDirection === 'DOWN')) {
      return this.swordAngle;
    }
    return this.facingDirection === 0 ? 0 : Math.PI;
  }

  private spawnAttackVFX(direction?: string): void {
    const angle = this.getAttackCenterAngle();

    const isThrust = direction === 'UP' || direction === 'DOWN';
    const textureKey = isThrust ? 'special_bolt' : 'special_slash';
    const animKey = isThrust ? 'special_bolt_anim' : 'special_slash_anim';

    const vfx = this.scene.add.sprite(this.x, this.y, textureKey);
    vfx.setDepth(this.depth + 1);
    vfx.setRotation(angle);

    if (isThrust) {
      vfx.setOrigin(-1, 0.5);
    } else {
      vfx.setOrigin(0.1, 0.5);
      const scaleY = (this.stats.attackRange * 1.5) / 64;
      const angleFactor = this.stats.attackConeAngle / 22.5;
      const scaleX = scaleY * angleFactor;
      vfx.setScale(scaleX, scaleY);
    }

    if (vfx.scene.anims.exists(animKey)) {
      const state = vfx.play(animKey);
      if (isThrust && state) {
        state.timeScale = 4.0;
      }
    } else {
      console.warn(`[Hero] VFX animation ${animKey} not found!`);
    }

    vfx.on('animationcomplete', () => vfx.destroy());
    this.scene.time.delayedCall(500, () => { if (vfx.active) vfx.destroy(); });
  }

  getState(): HeroState {
    return this.state;
  }

  takeDamage(amount: number): void {
    if (this.state === HeroState.DASH) return;

    this.stats.hp -= amount;
    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => this.clearTint());
  }

  isDead(): boolean {
    return this.stats.hp <= 0;
  }

  getHurtbox(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(this.x - 16, this.y - 16, 32, 32);
  }

  getAttackHitbox(): Phaser.Geom.Rectangle {
    const range = this.stats.attackRange;
    return new Phaser.Geom.Rectangle(this.x - range, this.y - range, range * 2, range * 2);
  }

  override destroy() {
    if (this.rangeVisual) this.rangeVisual.destroy();
    if (this.sword) this.sword.destroy();
    super.destroy();
  }

  drawDebug(graphics: Phaser.GameObjects.Graphics): void {
    if (!DEBUG_MODE) return;

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