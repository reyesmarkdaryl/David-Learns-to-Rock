import * as Phaser from 'phaser';
import { DEBUG_MODE } from "../../config";
import { Enemy } from '../enemies/Enemy';
import { RhythmSystem } from '../../systems/RhythmSystem';

export enum HeroState {
  IDLE = 'IDLE',
  WALK = 'WALK',
  ATTACK = 'ATTACK'
}

export class Hero extends Phaser.Physics.Arcade.Sprite {
  private state: HeroState = HeroState.IDLE;
  private attackCooldown: number = 0;
  private readonly ATTACK_COOLDOWN_MS = 300;
  private hitEnemies: Set<Enemy> = new Set();

  // stats that can be modified
  public stats = {
    hp: 100,
    maxHp: 100,
    moveSpeed: 160,
    attackRange: 60,
    attackDamage: 25,
  };

  private facingDirection: number = 0; // 0: Right, 1: Left
  private attackComboIndex: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'hero_idle');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    // Set the body to be a circle with a radius of 16px, centered on the sprite (assuming the original sprite is 192x192)

    this.body.setCircle(32, 64, 64);

    // Set depth to ensure we are above the floor
    this.setDepth(10);

    // Set the hero to exactly 92px height and width
    this.setDisplaySize(192, 192);
  }


  private setSizing(width: number, height: number): void {
    this.setDisplaySize(width, height);
  }


  update(cursors: any, time: number): void {
    if (this.state === HeroState.ATTACK) {
      if (time >= this.attackCooldown) {
        // Update combo index based on whether the attack hit anything
        if (this.attackComboIndex === 0 && this.hitEnemies.size > 0) {
          this.attackComboIndex = 1;
        } else {
          this.attackComboIndex = 0;
        }

        this.state = HeroState.IDLE;
        this.setTexture('hero_idle');
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
        this.setTexture('hero_run');
        if (this.anims) {
          this.play('hero_run_anim', true);
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
        this.setTexture('hero_idle');
        if (this.anims) {
          this.play('hero_idle_anim', true);
        }
      }
      if (this.body) this.setVelocity(0);
    }
  }

  performAttack(time: number): void {
    if (this.state === HeroState.ATTACK) return;

    this.state = HeroState.ATTACK;

    const attackAnim = this.attackComboIndex === 0 ? 'hero_attack1_anim' : 'hero_attack2_anim';
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
      console.log(`Hero attacked with ${attackAnim} facing ${this.facingDirection === 0 ? 'Right' : 'Left'}`);
    }
  }

  getHitEnemies(): Set<Enemy> {
    return this.hitEnemies;
  }

  getState(): HeroState {
    return this.state;
  }

  takeDamage(amount: number): void {
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
