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
    this.body.setCircle(16, 16, 0, 0);

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

  update(heroOrTarget: any, time: number): void {
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
      this.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
      this.handleAnimation('run');
    } else {
      this.setVelocity(0);
      this.setFlipX(this.x > target.x);
      this.performAttack(target, time);
    }

    if (!this.isAttacking && this.body.velocity.x !== 0) {
      this.setFlipX(this.body.velocity.x < 0);
    }
    this.updateHealthBar();
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
    hero.takeDamage(this.damage);

    this.attackCooldown = time + this.ATTACK_COOLDOWN_MS;
  }

  private updateHealthBar() {
    const x = this.x;
    const y = this.y - 110;

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
