import * as Phaser from 'phaser';
import { DEBUG_MODE } from "../../config";
import { Enemy } from '../enemies/Enemy';
import { RhythmSystem } from '../../systems/RhythmSystem';

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
    attackRange: 90,
    attackDamage: 25,
    dashDistance: 200,
  };

  private facingDirection: number = 0;
  private attackComboIndex: number = 0;
  private rangeVisual!: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'hero_tex_0');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);

    // Physics body
    this.body.setCircle(32, 90, 32);

    this.setDepth(10);

    // scale
    this.setDisplaySize(192, 128);

    if (this.anims && this.anims.exists('hero_idle_anim')) {
      this.play('hero_idle_anim');
    }

    this.rangeVisual = scene.add.graphics();
    this.rangeVisual.setDepth(9);
  }

  private setSizing(width: number, height: number): void {
    this.setDisplaySize(width, height);
  }

  update(cursors: any, time: number): void {
    this.rangeVisual.clear();
    this.rangeVisual.lineStyle(2, 0xffffff, 0.3);
    this.rangeVisual.strokeCircle(this.x, this.y, this.stats.attackRange);

    if (this.state === HeroState.DASH) {
      if (time >= this.dashEndTime) {
        this.state = HeroState.IDLE;
        this.play('hero_idle_anim');
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
        this.play('hero_idle_anim');
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
        this.play('hero_run_anim');
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
        this.play('hero_idle_anim');
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

    this.play('hero_dash_simple_anim');

    this.scene.time.delayedCall(this.DASH_COOLDOWN_MS, () => {
      this.dashCooldownTimer = 0;
    });
  }

  performAttack(time: number, direction?: string): void {
    if (this.state === HeroState.ATTACK) return;

    this.state = HeroState.ATTACK;

    let attackAnim = '';

    if (direction === 'UP') {
      attackAnim = 'hero_idle_up_attack_anim';
    } else if (direction === 'DOWN') {
      attackAnim = 'hero_jump_attack_down_anim';
    } else {
      attackAnim =
        this.attackComboIndex === 0
          ? 'hero_attack1_anim'
          : 'hero_attack2_anim';

      if (direction === 'LEFT') this.setFlipX(true);
      if (direction === 'RIGHT') this.setFlipX(false);
    }

    this.play(attackAnim);
    this.setVelocity(0);

    this.attackCooldown = time + this.ATTACK_COOLDOWN_MS;
    this.hitEnemies.clear();
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

  drawDebug(graphics: Phaser.GameObjects.Graphics): void {
    if (!DEBUG_MODE) return;

    graphics.clear();

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