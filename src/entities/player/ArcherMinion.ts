import * as Phaser from 'phaser';

export class ArcherMinion extends Phaser.Physics.Arcade.Sprite {
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
  attackRange: number;
  team: 'hero' | 'enemy' = 'hero';
  attackCooldown: number = 2000;
  lastAttackTime: number = 0;
  protected isAttacking: boolean = false;
  private healthBar!: Phaser.GameObjects.Rectangle;
  private healthBarBg!: Phaser.GameObjects.Rectangle;
  private projectileGroup!: Phaser.Physics.Arcade.Group;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);

    // Stats for Archer
    this.hp = 35;
    this.maxHp = 35;
    this.damage = 18;
    this.speed = 65;
    this.attackRange = 300;
    this.team = 'hero';

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const gameScene = scene as any;
    if (gameScene.projectiles) {
        this.projectileGroup = gameScene.projectiles;
    }

    this.createHealthBar(scene);

    if (this.anims) {
      this.play('archer_idle_anim');
    }
  }

  update(enemies: any, time: number): void {
    const nearestEnemy = this.findNearestEnemy(enemies);

    if (this.isAttacking) {
      if (this.body) this.setVelocity(0);
      this.updateHealthBar();
      return;
    }

    if (nearestEnemy) {
      const distance = Phaser.Math.Distance.Between(this.x, this.y, nearestEnemy.x, nearestEnemy.y);

      if (distance <= this.attackRange) {
        if (distance < this.attackRange * 0.5) {
          // Move away from enemy if too close
          const angle = Phaser.Math.Angle.Between(nearestEnemy.x, nearestEnemy.y, this.x, this.y);
          if (this.body) {
            this.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
          }
          if (this.anims) this.play('archer_run_anim', true);
        } else {
          // Stay in range and attack
          if (this.body) this.setVelocity(0);
          this.attack(nearestEnemy, time);
          // Don't override anim here — attack() sets it, and isAttacking guards the next frames
        }
      } else {
        // Move toward enemy if too far
        this.moveToward(nearestEnemy);
        if (this.anims) this.play('archer_run_anim', true);
      }
    } else {
      if (this.body) this.setVelocity(0);
      if (this.anims) this.play('archer_idle_anim', true);
    }

    // Face the target
    if (nearestEnemy) {
        this.setFlipX(this.x > nearestEnemy.x);
    }

    this.updateHealthBar();
  }

  private findNearestEnemy(enemies: any): Phaser.Physics.Arcade.Sprite | null {
    let nearest: Phaser.Physics.Arcade.Sprite | null = null;
    let minDist = Infinity;

    const children = enemies.getChildren ? enemies.getChildren() : (Array.isArray(enemies) ? enemies : []);

    if (!Array.isArray(children)) return null;

    children.forEach((enemy: any) => {
      if (enemy.team === 'enemy') {
        const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
        if (dist < minDist) {
          minDist = dist;
          nearest = enemy;
        }
      }
    });

    return nearest;
  }

  private moveToward(target: Phaser.Physics.Arcade.Sprite): void {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
    this.setFlipX(target.x < this.x);
    if (this.body) {
      this.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
    }
  }

  private attack(enemy: any, time: number): void {
    if (time > this.lastAttackTime + this.attackCooldown) {
      this.lastAttackTime = time;
      this.isAttacking = true;

      if (this.anims) {
        this.play('archer_attack_anim', true);
      }

      // Delay to match the bow release
      this.scene.time.delayedCall(700, () => {
        if (!this.isDead()) {
          this.fireProjectile(enemy);
        }
        this.isAttacking = false;
        if (this.anims) this.play('archer_idle_anim', true);
      });
    }
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
        (projectile as any).team = 'hero';
      }
    } else {
      target.takeDamage(this.damage);
    }
  }

  private createHealthBar(scene: Phaser.Scene) {
    const width = 60;
    const height = 6;
    this.healthBarBg = scene.add.rectangle(0, 0, width, height, 0x000000);
    this.healthBar = scene.add.rectangle(0, 0, width, height, 0x00ff00);
    this.healthBarBg.setDepth(this.depth + 1);
    this.healthBar.setDepth(this.depth + 2);
  }

  private updateHealthBar() {
    const x = this.x;
    const y = this.y - 110;
    this.healthBarBg.setPosition(x, y);
    this.healthBar.setPosition(x, y);
    const healthPercent = Math.max(0, this.hp / this.maxHp);
    this.healthBar.setDisplaySize(60 * healthPercent, 6);
  }

  getHitbox(): Phaser.Geom.Rectangle {
    const width = this.width * 0.25;
    const height = this.height * 0.25;
    return new Phaser.Geom.Rectangle(this.x - width / 2, this.y - height / 2, width, height);
  }

  takeDamage(amount: number): void {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.die();
    }
  }

  private die(): void {
    if (this.scene && this.scene.events) {
      this.scene.events.emit('minion:died', { type: 'archer' });
    }
    if (this.healthBar) this.healthBar.destroy();
    if (this.healthBarBg) this.healthBarBg.destroy();
    this.destroy();
  }

  isDead(): boolean {
    return this.hp <= 0;
  }
}