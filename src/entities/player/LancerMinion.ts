import * as Phaser from 'phaser';
import { Pathfinder } from '../../utils/Pathfinder';

export class LancerMinion extends Phaser.Physics.Arcade.Sprite {
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
  attackRange: number;
  aggroRange: number = 600;
  team: 'hero' | 'enemy' = 'hero';
  attackCooldown: number = 1000;
  lastAttackTime: number = 0;
  protected isAttacking: boolean = false;
  private healthBar!: Phaser.GameObjects.Rectangle;
  private healthBarBg!: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, initialHp?: number) {
    super(scene, x, y, texture);

    // Stats for Lancer (guided by Lancer enemy)
    this.maxHp = 70;
    this.hp = initialHp !== undefined ? initialHp : this.maxHp;
    this.damage = 15;
    this.speed = 220;
    this.attackRange = 70;
    this.team = 'hero';

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setCircle(32, 128, 128);
    this.setDepth(10002); // Above the darkness and the glow

    this.createHealthBar(scene);

    if (this.anims) {
      this.play('lancer_idle_anim');
    }
  }

  update(enemies: any, time: number, flowField?: any, hero?: any): void {
    const nearestEnemy = this.findNearestEnemy(enemies);
    const distToNearest = nearestEnemy ? Phaser.Math.Distance.Between(this.x, this.y, nearestEnemy.x, nearestEnemy.y) : Infinity;

    if (this.isAttacking) {
      if (this.anims && !this.anims.isPlaying) {
        this.isAttacking = false;
        this.play('lancer_idle_anim');
      }
      if (this.body) this.setVelocity(0);
      this.updateHealthBar();
      return;
    }

    if (nearestEnemy && distToNearest <= this.aggroRange && this.hasLineOfSight(nearestEnemy)) {
      const distance = distToNearest;

      if (distance <= this.attackRange) {
        this.attack(nearestEnemy, time);
        if (this.body) this.setVelocity(0);
      } else {
        this.moveToward(nearestEnemy);

        const avoidance = this.calculateWallAvoidance();
        const separation = this.calculateSeparation();
        if (this.body) {
          this.body.velocity.x += avoidance.x * 0.5 + separation.x * 0.3;
          this.body.velocity.y += avoidance.y * 0.5 + separation.y * 0.3;
        }
        if (this.anims) this.play('lancer_run_anim', true);
      }
    } else if (hero) {
      const distToHero = Phaser.Math.Distance.Between(this.x, this.y, hero.x, hero.y);
      if (distToHero > 64) {
        const angle = Phaser.Math.Angle.Between(this.x, this.y, hero.x, hero.y);
        if (this.body) {
          this.setVelocity(Math.cos(angle) * this.speed * 0.7, Math.sin(angle) * this.speed * 0.7);
        }
        if (this.anims) this.play('lancer_run_anim', true);
      } else {
        if (this.body) this.setVelocity(0);
        if (this.anims) this.play('lancer_idle_anim', true);
      }
    } else {
      if (this.body) this.setVelocity(0);
      if (this.anims) this.play('lancer_idle_anim', true);
    }

    const actualSpeed = this.body ? Math.hypot(this.body.velocity.x, this.body.velocity.y) : 0;
    if (!this.isAttacking) {
      const anim = actualSpeed > 10 ? 'lancer_run_anim' : 'lancer_idle_anim';
      if (this.anims) this.play(anim, true);
      if (actualSpeed > 10 && this.body) {
        this.setFlipX(this.body.velocity.x < 0);
      }
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
      if (walls.getChildren().some((wall: any) => Phaser.Geom.Rectangle.Contains(wall.getBounds(), checkX, checkY))) return false;
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
      const wall = walls.getChildren().find((w: any) => Phaser.Geom.Rectangle.Contains(w.getBounds(), checkX, checkY));
      if (wall) {
        const b = wall.getBounds();
        const diffX = this.x - (b.x + b.width / 2);
        const diffY = this.y - (b.y + b.height / 2);
        const dist = Math.hypot(diffX, diffY);
        return { x: (diffX / dist) * this.speed * 1.2, y: (diffY / dist) * this.speed * 1.2 };
      }
    }
    return { x: 0, y: 0 };
  }

  private calculateSeparation(): { x: number, y: number } {
    let pushX = 0, pushY = 0;
    if (!this.scene) return { x: 0, y: 0 };
    const enemies = (this.scene as any).enemies;
    if (!enemies) return { x: 0, y: 0 };
    enemies.getChildren().forEach((other: any) => {
      if (other === this) return;
      const dx = this.x - other.x, dy = this.y - other.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < 40 * 40 && distSq > 0) {
        const dist = Math.sqrt(distSq);
        pushX += dx / dist; pushY += dy / dist;
      }
    });
    return { x: pushX * this.speed * 0.2, y: pushY * this.speed * 0.2 };
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

      const angle = Phaser.Math.Angle.Between(this.x, this.y, enemy.x, enemy.y);
      const angleDeg = Phaser.Math.RadToDeg(angle);

      let finalAnim = 'lancer_attack_right_anim';
      let finalFlip = false;

      if (angleDeg >= -22.5 && angleDeg < 22.5) {
        finalAnim = 'lancer_attack_right_anim';
        finalFlip = false;
      } else if (angleDeg >= 22.5 && angleDeg < 67.5) {
        finalAnim = 'lancer_attack_downright_anim';
        finalFlip = false;
      } else if (angleDeg >= 67.5 && angleDeg < 112.5) {
        finalAnim = 'lancer_attack_down_anim';
        finalFlip = false;
      } else if (angleDeg >= 112.5 && angleDeg < 157.5) {
        finalAnim = 'lancer_attack_downright_anim';
        finalFlip = true;
      } else if (angleDeg >= 157.5 || angleDeg < -157.5) {
        finalAnim = 'lancer_attack_right_anim';
        finalFlip = true;
      } else if (angleDeg >= -112.5 && angleDeg < -67.5) {
        finalAnim = 'lancer_attack_upright_anim';
        finalFlip = true;
      } else if (angleDeg >= -67.5 && angleDeg < -22.5) {
        finalAnim = 'lancer_attack_upright_anim';
        finalFlip = false;
      } else {
        finalAnim = 'lancer_attack_up_anim';
        finalFlip = false;
      }

      this.setFlipX(finalFlip);
      if (this.anims) {
        this.play(finalAnim, true);
      }

      if (this.scene && this.scene.time) {
        this.scene.time.delayedCall(250, () => {
          if (!this.isDead()) {
            if (enemy && enemy.takeDamage) {
              enemy.takeDamage(this.damage);
            }
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
    const y = this.y - 64;
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
  }

  override destroy() {
    if (this.healthBar) this.healthBar.destroy();
    if (this.healthBarBg) this.healthBarBg.destroy();
    super.destroy();
  }

  isDead(): boolean {
    return this.hp <= 0;
  }
}
