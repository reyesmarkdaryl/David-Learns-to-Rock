import * as Phaser from 'phaser';

export class WarriorMinion extends Phaser.Physics.Arcade.Sprite {
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
  attackRange: number;
  team: 'hero' | 'enemy' = 'hero';
  attackCooldown: number = 1000;
  lastAttackTime: number = 0;
  protected isAttacking: boolean = false;
  private healthBar!: Phaser.GameObjects.Rectangle;
  private healthBarBg!: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);

    // Default stats for Skeleton Warrior from minions.json
    this.hp = 60;
    this.maxHp = 60;
    this.damage = 12;
    this.speed = 70;
    this.attackRange = 40;
    this.team = 'hero'; // Assign to player/hero team

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.createHealthBar(scene);

    // Only play animation if anims is defined
    if (this.anims) {
      this.play('hero_idle_anim');
    }
  }

  update(enemies: any, time: number): void {
    const nearestEnemy = this.findNearestEnemy(enemies);

    if (this.isAttacking) {
      if (this.anims && !this.anims.isPlaying) {
        this.isAttacking = false;
        this.play('hero_idle_anim');
      }
      if (this.body) this.setVelocity(0);
      this.updateHealthBar();
      return;
    }

    if (nearestEnemy) {
      const distance = Phaser.Math.Distance.Between(this.x, this.y, nearestEnemy.x, nearestEnemy.y);

      if (distance <= this.attackRange) {
        this.attack(nearestEnemy, time);
        if (this.body) this.setVelocity(0);
      } else {
        this.moveToward(nearestEnemy);
        if (this.anims) this.play('hero_run_anim', true);
      }
    } else {
      if (this.body) this.setVelocity(0);
      if (this.anims) this.play('hero_idle_anim', true);
    }
    this.updateHealthBar();
  }

  private findNearestEnemy(enemies: any): Phaser.Physics.Arcade.Sprite | null {
    let nearest: Phaser.Physics.Arcade.Sprite | null = null;
    let minDist = Infinity;

    const children = enemies.getChildren ? enemies.getChildren() : (Array.isArray(enemies) ? enemies : []);

    if (!Array.isArray(children)) return null;

    children.forEach((enemy: any) => {
      // Only target enemies from the 'enemy' team, not other minions or the hero
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

    // Flip sprite based on movement direction
    this.setFlipX(target.x < this.x);

    if (this.body) {
      this.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
    }
  }

  private attack(enemy: any, time: number): void {
    if (time > this.lastAttackTime + this.attackCooldown) {
      this.lastAttackTime = time;
      this.isAttacking = true;

      // Play attack animation
      if (this.anims) {
        this.play('minion_warrior_attack_anim', true);
      }

      // Delay damage and juice to match the animation impact frame
      // Most attack animations hit around frame 3-4 (approx 200-300ms in)
      this.scene.time.delayedCall(250, () => {
        if (!this.isDead()) {
          // Apply damage directly to the enemy
          if (enemy && enemy.takeDamage) {
            enemy.takeDamage(this.damage);
          }

          // Emit combat event for the CombatSystem to handle (Screen Shake/Hit-stop)
          if (this.scene && this.scene.events) {
            this.scene.events.emit('minion:attack', {
              attacker: this,
              target: enemy,
              damage: this.damage
            });
          }
        }
      });
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
      this.scene.events.emit('minion:died', { type: 'skeleton_warrior' });
    }
    if (this.healthBar) this.healthBar.destroy();
    if (this.healthBarBg) this.healthBarBg.destroy();
    this.destroy();
  }

  isDead(): boolean {
    return this.hp <= 0;
  }
}
