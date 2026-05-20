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

  // stats that can be modified
  public stats = {
    hp: 100,
    maxHp: 100,
    moveSpeed: 160,
    attackRange: 90,
    attackDamage: 25,
    dashDistance: 200, // Distance in pixels to travel during the dash
  };

  private facingDirection: number = 0; // 0: Right, 1: Left
  private attackComboIndex: number = 0;
  private rangeVisual!: Phaser.GameObjects.Graphics;
  private glowSprite!: Phaser.GameObjects.Sprite;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'hero_tex_0');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    // Set the body to be a circle with a radius of 16px, centered on the sprite (assuming the original sprite is 192x192)

    this.body.setCircle(16, 104, 48);

    // Set depth to ensure we are above the floor
    this.setDepth(10002); // Above the darkness and the glow


    // Set the hero to a larger size
    this.setDisplaySize(480, 256);

    if (this.anims && this.anims.exists('hero_idle_anim')) {
      this.play('hero_idle_anim');
    }

    // Luminous Glow effect
    this.glowSprite = this.scene.add.sprite(this.x, this.y, 'glow');
    this.glowSprite.setBlendMode(Phaser.BlendModes.ADD);
    this.glowSprite.setDepth(9); // Behind the hero, under the darkness
    this.glowSprite.setScale(1.0);
    this.glowSprite.setAlpha(0.8);

    // Visual attack range
    this.rangeVisual = scene.add.graphics();
    this.rangeVisual.setDepth(9); // Just below the hero
  }


  private setSizing(width: number, height: number): void {
    this.setDisplaySize(width, height);
  }


  update(cursors: any, time: number): void {
    // Update glow sprite position
    this.glowSprite.setPosition(this.x, this.y);

    // Update range visual position
    this.rangeVisual.clear();
    this.rangeVisual.lineStyle(2, 0xffffff, 0.3);
    this.rangeVisual.strokeCircle(this.x, this.y, this.stats.attackRange);

    // Handle Dash state
    if (this.state === HeroState.DASH) {
      if (time >= this.dashEndTime) {
        this.state = HeroState.IDLE;
        if (this.anims) {
          this.play('hero_idle_anim');
        }
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
        if (this.anims) {
          this.play('hero_idle_anim');
        }
      }
      return;
    }

    const moveX = (cursors.left.isDown ? -1 : 0) + (cursors.right.isDown ? 1 : 0);
    const moveY = (cursors.up.isDown ? -1 : 0) + (cursors.down.isDown ? 1 : 0);

    if (moveX !== 0 || moveY !== 0) {
      if (this.state !== HeroState.WALK) {
        this.state = HeroState.WALK;
        if (this.anims) {
          console.log(`[Hero] Switching to WALK. Playing: hero_run_anim. CurrentAnim:
          ${this.anims.currentAnim?.key}`);
          this.play('hero_run_anim');
        }
      }

      const angle = Math.atan2(moveY, moveX);
      if (this.body) {
        this.setVelocity(
          Math.cos(angle) * this.stats.moveSpeed,
          Math.sin(angle) * this.stats.moveSpeed
        );
      }

      if (moveX !== 0) {
        this.facingDirection = moveX > 0 ? 0 : 1;
        this.setFlipX(this.facingDirection === 1);
      }
    } else {
      if (this.state !== HeroState.IDLE) {
        this.state = HeroState.IDLE;
        if (this.anims) {
          console.log(`[Hero] Switching to IDLE. Playing: hero_idle_anim. CurrentAnim:
          ${this.anims.currentAnim?.key}`);
          this.play('hero_idle_anim');
        }
      }
      if (this.body) this.setVelocity(0);
    }
  }

  dash(time: number): void {
    if (this.state === HeroState.DASH || time < this.dashCooldownTimer) return;

    this.state = HeroState.DASH;
    this.dashEndTime = time + this.DASH_DURATION_MS;

    // Calculate required velocity to cover dashDistance in DASH_DURATION_MS
    // Velocity = Distance / Time (Time in seconds)
    const dashVelocity = this.stats.dashDistance / (this.DASH_DURATION_MS / 1000);
    const vx = this.facingDirection === 0 ? dashVelocity : -dashVelocity;

    if (this.body) {
      this.setVelocity(vx, 0);
    }

    if (this.anims) {
      this.play('hero_dash_simple_anim');
    }

    // Reset cooldown after duration
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
      attackAnim = this.attackComboIndex === 0 ? 'hero_attack1_anim' : 'hero_attack2_anim';
      // Only flip if we are attacking left/right
      if (direction === 'LEFT') this.setFlipX(true);
      if (direction === 'RIGHT') this.setFlipX(false);
    }

    if (this.anims) {
      this.play(attackAnim);
    }

    if (this.body) {
      this.setVelocity(0);
    }
    this.attackCooldown = time + this.ATTACK_COOLDOWN_MS;
    this.hitEnemies.clear();

    this.attackComboIndex = this.attackComboIndex; // Maintain current index for the attack animation

    if (DEBUG_MODE) {
      console.log(`Hero attacked with ${attackAnim} facing ${this.facingDirection === 0 ? 'Right' : 'Left'} [Dir: ${direction}]`);
    }
  }

  getHitEnemies(): Set<Enemy> {
    return this.hitEnemies;
  }

  getState(): HeroState {
    return this.state;
  }

  takeDamage(amount: number): void {
    if (this.state === HeroState.DASH) return; // Invulnerable during dash

    this.stats.hp -= amount;
    this.setTint(0xff0000);
    if (this.scene && this.scene.time) {
      this.scene.time.delayedCall(100, () => {
        this.clearTint();
      });
    }
  }

  isDead(): boolean {
    return this.stats.hp <= 0;
  }

  getHurtbox(): Phaser.Geom.Rectangle {
    const width = 32;
    const height = 32;
    return new Phaser.Geom.Rectangle(this.x - width / 2, this.y - height / 2, width, height);
  }

  getAttackHitbox(): Phaser.Geom.Rectangle {
    const range = this.stats.attackRange;
    return new Phaser.Geom.Rectangle(this.x - range, this.y - range, range * 2, range * 2);
  }

  drawDebug(graphics: Phaser.GameObjects.Graphics): void {
    if (!DEBUG_MODE) return;

    graphics.clear();

    const hitbox = this.getAttackHitbox();
    graphics.fillStyle(0xff0000, 0.3);
    graphics.fillRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
    graphics.lineStyle(1, 0xff0000, 1);
    graphics.strokeRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);

    const hurtbox = this.getHurtbox();
    graphics.lineStyle(1, 0xffff00, 1);
    graphics.strokeRect(hurtbox.x, hurtbox.y, hurtbox.width, hurtbox.height);
  }
}
