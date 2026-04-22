import * as Phaser from 'phaser';
import { Hero, HeroState } from '../entities/player/Hero';
import { Enemy } from '../entities/enemies/Enemy';
import { Lancer } from '../entities/enemies/Lancer';
import { Archer } from '../entities/enemies/Archer';
import { WarriorMinion } from '../entities/player/WarriorMinion';
import { LancerMinion } from '../entities/player/LancerMinion';
import { ArcherMinion } from '../entities/player/ArcherMinion';
import { DEBUG_MODE, GYM_ENEMY_SPAWNS } from '../config';
import { SummonSystem } from '../systems/SummonSystem';

export class GymScene extends Phaser.Scene {
  private hero!: Hero;
  private enemies!: Phaser.Physics.Arcade.Group;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private debugText!: Phaser.GameObjects.Text;
  private debugGraphics!: Phaser.GameObjects.Graphics;
  private heroHealthBarBg!: Phaser.GameObjects.Rectangle;
  private heroHealthBar!: Phaser.GameObjects.Rectangle;
  private heroHealthText!: Phaser.GameObjects.Text;
  private assetIndex: any = null;
  private isGameOver: boolean = false;
  private summonSystem!: SummonSystem;
  private summonUIText!: Phaser.GameObjects.Text;

  constructor() {
    super('GymScene');
  }

  preload() {
    this.load.json('asset-index', '/assets/index.json');

    const team = 'Blue';
    const warriorSprites = [
      "Warrior_Idle.png",
      "Warrior_Run.png",
      "Warrior_Attack1.png",
      "Warrior_Attack2.png",
      "Warrior_Guard.png"
    ];
    const basePath = `/assets/tinysword/Units/${team} Units/Warrior/`;

    warriorSprites.forEach((sprite: string) => {
      const key = sprite.replace('Warrior_', 'hero_').replace('.png', '').toLowerCase();
      this.load.spritesheet(key, `${basePath}${sprite}`, {
        frameWidth: 192,
        frameHeight: 192,
        startFrame: 0,
        endFrame: 7
      });
    });

    const lancerSprites = [
      { file: "Lancer_Idle.png", key: "lancer_idle_blue" },
      { file: "Lancer_Run.png", key: "lancer_run_blue" },
      { file: "Lancer_Right_Attack.png", key: "lancer_attack_right_blue" },
      { file: "Lancer_Down_Attack.png", key: "lancer_attack_down_blue" },
      { file: "Lancer_DownRight_Attack.png", key: "lancer_attack_downright_blue" },
      { file: "Lancer_UpRight_Attack.png", key: "lancer_attack_upright_blue" },
      { file: "Lancer_Up_Attack.png", key: "lancer_attack_up_blue" },
    ];
    const lancerBasePath = `/assets/tinysword/Units/${team} Units/Lancer/`;

    lancerSprites.forEach((sprite) => {
      this.load.spritesheet(sprite.key, `${lancerBasePath}${sprite.file}`, {
        frameWidth: 320,
        frameHeight: 320,
        startFrame: 0,
        endFrame: 5
      });
    });

    const archerSprites = [
      { file: "Archer_Idle.png", key: "archer_idle_blue" },
      { file: "Archer_Run.png", key: "archer_run_blue" },
      { file: "Archer_Shoot.png", key: "archer_attack_blue" },
    ];
    const archerBasePath = `/assets/tinysword/Units/${team} Units/Archer/`;

    archerSprites.forEach((sprite) => {
      this.load.spritesheet(sprite.key, `${archerBasePath}${sprite.file}`, {
        frameWidth: 192,
        frameHeight: 192,
        startFrame: 0,
        endFrame: 7
      });
    });

    const enemyTeam = 'Red';
    const enemyWarriorSprites = [
      "Warrior_Idle.png",
      "Warrior_Run.png",
      "Warrior_Attack1.png",
      "Warrior_Attack2.png",
      "Warrior_Guard.png"
    ];
    const enemyBasePath = `/assets/tinysword/Units/${enemyTeam} Units/Warrior/`;

    enemyWarriorSprites.forEach((sprite: string) => {
      const key = sprite.replace('Warrior_', 'enemy_').replace('.png', '').toLowerCase();
      this.load.spritesheet(key, `${enemyBasePath}${sprite}`, {
        frameWidth: 192,
        frameHeight: 192,
        startFrame: 0,
        endFrame: 7
      });
    });

    const enemyArcherSprites = [
      { file: "Archer_Idle.png", key: "archer_idle" },
      { file: "Archer_Run.png", key: "archer_run" },
      { file: "Archer_Shoot.png", key: "archer_attack" },
    ];
    const enemyArcherBasePath = `/assets/tinysword/Units/${enemyTeam} Units/Archer/`;

    enemyArcherSprites.forEach((sprite) => {
      this.load.spritesheet(sprite.key, `${enemyArcherBasePath}${sprite.file}`, {
        frameWidth: 192,
        frameHeight: 192,
        startFrame: 0,
        endFrame: 7
      });
    });

    this.load.image('projectile_arrow', `${enemyArcherBasePath}Arrow.png`);

    const enemyLancerSprites = [
      { file: "Lancer_Idle.png", key: "lancer_idle" },
      { file: "Lancer_Run.png", key: "lancer_run" },
      { file: "Lancer_Right_Attack.png", key: "lancer_attack_right" },
      { file: "Lancer_Down_Attack.png", key: "lancer_attack_down" },
      { file: "Lancer_DownRight_Attack.png", key: "lancer_attack_downright" },
      { file: "Lancer_UpRight_Attack.png", key: "lancer_attack_upright" },
      { file: "Lancer_Up_Attack.png", key: "lancer_attack_up" },
    ];
    const enemyLancerBasePath = `/assets/tinysword/Units/${enemyTeam} Units/Lancer/`;

    enemyLancerSprites.forEach((sprite) => {
      this.load.spritesheet(sprite.key, `${enemyLancerBasePath}${sprite.file}`, {
        frameWidth: 320,
        frameHeight: 320,
        startFrame: 0,
        endFrame: 5
      });
    });

    this.load.spritesheet('dust_particle', `/assets/tinysword/Particle FX/Dust_02.png`, {
      frameWidth: 64,
      frameHeight: 64,
    });
  }

  create() {
    this.isGameOver = false;
    this.assetIndex = this.cache.json.get('asset-index');

    // The hero is now created after animations are defined below



    this.cursors = this.input.keyboard.createCursorKeys();

    // Create animations
    const createAnim = (key: string, framesKey: string, frameRate: number, repeat: number) => {
      if (!this.anims.exists(key)) {
        this.anims.create({
          key,
          frames: this.anims.generateFrameNumbers(framesKey),
          frameRate,
          repeat
        });
      }
    };

    createAnim('dust_anim', 'dust_particle', 12, 0);
    createAnim('hero_idle_anim', 'hero_idle', 8, -1);
    createAnim('hero_run_anim', 'hero_run', 10, -1);
    createAnim('hero_attack1_anim', 'hero_attack1', 12, 0);
    createAnim('hero_attack2_anim', 'hero_attack2', 12, 0);
    createAnim('minion_warrior_attack_anim', 'hero_attack1', 12, 0);
    createAnim('enemy_run_anim', 'enemy_run', 10, -1);
    createAnim('enemy_idle_anim', 'enemy_idle', 8, -1);
    createAnim('enemy_attack_anim', 'enemy_attack1', 12, 0);
    createAnim('lancer_idle_anim', 'lancer_idle_blue', 8, -1);
    createAnim('lancer_run_anim', 'lancer_run_blue', 10, -1);
    createAnim('archer_idle_anim', 'archer_idle_blue', 8, -1);
    createAnim('archer_run_anim', 'archer_run_blue', 10, -1);
    createAnim('archer_attack_anim', 'archer_attack_blue', 8, 0);

    createAnim('enemy_archer_idle_anim', 'archer_idle', 8, -1);
    createAnim('enemy_archer_run_anim', 'archer_run', 10, -1);
    createAnim('enemy_archer_attack_anim', 'archer_attack', 8, 0);

    const lancerAttackDirs = ['right', 'down', 'downright', 'upright', 'up'];
    createAnim('enemy_lancer_idle_anim', 'lancer_idle', 8, -1);
    createAnim('enemy_lancer_run_anim', 'lancer_run', 10, -1);

    lancerAttackDirs.forEach(dir => {
      createAnim(`lancer_attack_${dir}_anim`, `lancer_attack_${dir}`, 12, 0);
    });

    this.hero = new Hero(this, 400, 300);
    this.hero.setTexture('hero_idle');
    this.hero.play('hero_idle_anim', true);

    // Create Hero Health Bar at top of screen
    const barWidth = 300;
    const barHeight = 20;
    const x = (this.cameras.main.width - barWidth) / 2;
    const y = 40;

    this.heroHealthBarBg = this.add.rectangle(x, y, barWidth, barHeight, 0x000000);
    this.heroHealthBar = this.add.rectangle(x, y, barWidth, barHeight, 0x00ff00);
    this.heroHealthBar.setDepth(100);
    this.heroHealthBarBg.setDepth(99);

    this.heroHealthText = this.add.text(x, y, `${this.hero.stats.hp}/${this.hero.stats.maxHp}`, {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5).setDepth(101);

    // Rhythm Summoning System
    this.summonSystem = new SummonSystem();
    this.summonUIText = this.add.text(this.cameras.main.centerX, y + 40, '', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontWeight: 'bold',
      align: 'center'
    }).setOrigin(0.5).setDepth(102);
    this.updateSummonUI();

    // Create enemies group
    this.enemies = this.physics.add.group();
    this.projectiles = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite
    });


    // Spawn test enemies with a slight delay to ensure animations are ready
    this.time.delayedCall(100, () => {
      GYM_ENEMY_SPAWNS.forEach(spawn => {
        for (let i = 0; i < spawn.count; i++) {
          const x = Phaser.Math.Between(600, 1200);
          const y = Phaser.Math.Between(100, 700);
          const enemy = spawn.type === 'lancer' ? new Lancer(this, x, y) :
                           spawn.type === 'archer' ? new Archer(this, x, y) :
                           new Enemy(this, x, y);
          this.enemies.add(enemy);
          this.spawnDustEffect(x, y);
        }
      });
    });

    if (DEBUG_MODE) {
      this.debugText = this.add.text(10, 10, '', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#00ff00'
      });
      this.debugGraphics = this.add.graphics();
    }

    // JUICE: Handle minion attacks via events
    this.events.on('minion:attack', ({ target }) => {
      this.applyHitStop(30);
      this.cameras.main.shake(50, 0.002);
      if (target.isDead()) {
        this.cameras.main.shake(100, 0.005);
      }
    });
  }

  private findNearestEnemy(minion: Enemy): any {
    let nearest = this.hero;
    let minDist = Phaser.Math.Distance.Between(minion.x, minion.y, this.hero.x, this.hero.y);

    this.enemies.getChildren().forEach(enemy => {
      if (enemy.team === 'enemy') {
        const dist = Phaser.Math.Distance.Between(minion.x, minion.y, enemy.x, enemy.y);
        if (dist < minDist) {
          minDist = dist;
          nearest = enemy;
        }
      }
    });
    return nearest;
  }

  private spawnFriendlyMinion(type: string) {
    const x = this.hero.x + Phaser.Math.Between(-50, 50);
    const y = this.hero.y + Phaser.Math.Between(-50, 50);

    if (type === 'warrior') {
      // Spawn a Warrior minion using the WarriorMinion class with hero_idle texture
      const minion = new WarriorMinion(this, x, y, 'hero_idle');
      this.enemies.add(minion);
      this.spawnDustEffect(x, y);
    } else if (type === 'lancer') {
      // Spawn a Lancer minion using the LancerMinion class with lancer_idle_blue texture
      const minion = new LancerMinion(this, x, y, 'lancer_idle_blue');
      this.enemies.add(minion);
      this.spawnDustEffect(x, y);
    } else if (type === 'archer') {
      // Spawn an Archer minion using the ArcherMinion class with archer_idle_blue texture
      const minion = new ArcherMinion(this, x, y, 'archer_idle_blue');
      this.enemies.add(minion);
      this.spawnDustEffect(x, y);
    } else {
      // Other minions not implemented yet
      console.log(`Summon sequence for ${type} completed, but entity not yet implemented.`);
    }
  }

  private applyHitStop(duration: number) {
    this.isHitStopped = true;
    this.time.delayedCall(duration, () => {
      this.isHitStopped = false;
    });
  }

  private updateSummonUI() {
    const tracks = this.summonSystem.getTracksState();

    const rows = tracks.map(track => {
      const sequence = track.targetSequence;
      const progress = track.currentIndex;
      const name = track.name.charAt(0).toUpperCase() + track.name.slice(1);

      const display = sequence.map((dir, i) => {
        return i < progress ? `[${dir}]` : dir;
      }).join(' ');

      return `${name}: ${display}`;
    }).join('\n');

    this.summonUIText.setText(rows);
  }

  update(time: number, delta: number) {
    if (!this.hero || this.isGameOver) return;

    if (this.isHitStopped) return; // Skip update during hit-stop

    // Custom WASD mapping for the Hero update
    const customCursors = {
      left: { isDown: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A).isDown },
      right: { isDown: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D).isDown },
      up: { isDown: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W).isDown },
      down: { isDown: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S).isDown },
    } as any;

    this.hero.update(customCursors, time);

    // Handle Rhythm Summoning Input
    const keys = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
    keys.forEach(key => {
      if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes[key]))) {
        const completed = this.summonSystem.checkInput(key);
        completed.forEach(type => {
          this.spawnFriendlyMinion(type);
        });
        this.updateSummonUI();
      }
    });

    // Update enemies
    this.enemies.getChildren().forEach((enemy: any) => {
      if (enemy.team === 'enemy') {
        // Find nearest hero-team member (Hero or Minions)
        let target = this.hero;
        let minDist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.hero.x, this.hero.y);

        this.enemies.getChildren().forEach((member: any) => {
          if (member.team === 'hero') {
            const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, member.x, member.y);
            if (dist < minDist) {
              minDist = dist;
              target = member;
            }
          }
        });
        enemy.update(target, time);
      } else if (enemy.team === 'hero') {
        enemy.update(this.enemies, time);
      }
    });

    // Combat: Check hero attack hitbox against enemies
    const hitbox = this.hero.getAttackHitbox();
    this.enemies.getChildren().forEach((enemy: any) => {
      if (Phaser.Geom.Intersects.RectangleToRectangle(hitbox, enemy.getHitbox())) {
        // Only damage if the hero is actually in the attack state and hasn't hit this enemy yet
        if (this.hero.getState() === HeroState.ATTACK && !this.hero.getHitEnemies().has(enemy)) {
          enemy.takeDamage(this.hero.stats.attackDamage);
          this.hero.getHitEnemies().add(enemy);

          // JUICE: Hit-stop and Screen Shake
          this.applyHitStop(60);
          this.cameras.main.shake(100, 0.005);

          if (enemy.isDead()) {
            // Extra juice for killing an enemy
            this.cameras.main.shake(200, 0.01);
            this.applyHitStop(100);
          }
        }
      }
    });

    // Cleanup dead enemies
    this.enemies.getChildren().forEach((enemy: any) => {
      if (enemy.isDead()) {
        enemy.destroy();
      }
    });

    // Projectile handling: manual hurtbox check against all valid targets
    this.projectiles.getChildren().forEach((projectile: any) => {
      if (!projectile.active) return;

      const projX = projectile.x;
      const projY = projectile.y;
      const damage = projectile.damage || 10;

      // Enemy projectiles (no team or team === 'enemy') hit the hero and hero-team minions
      if (!projectile.team || projectile.team === 'enemy') {
        // Check hero
        const heroHurtbox = this.hero.getHurtbox();
        if (projX >= heroHurtbox.x && projX <= heroHurtbox.x + heroHurtbox.width &&
            projY >= heroHurtbox.y && projY <= heroHurtbox.y + heroHurtbox.height) {
          this.hero.takeDamage(damage);
          projectile.setActive(false).setVisible(false);
          return;
        }

        // Check hero-team minions
        for (const member of this.enemies.getChildren() as any[]) {
          if (member.team !== 'hero' || !member.active) continue;
          const hurtbox = member.getHitbox();
          if (projX >= hurtbox.x && projX <= hurtbox.x + hurtbox.width &&
              projY >= hurtbox.y && projY <= hurtbox.y + hurtbox.height) {
            member.takeDamage(damage);
            projectile.setActive(false).setVisible(false);
            return;
          }
        }
      }

      // Hero projectiles (team === 'hero') hit enemy-team members
      if (projectile.team === 'hero') {
        for (const enemy of this.enemies.getChildren() as any[]) {
          if (enemy.team !== 'enemy' || !enemy.active) continue;
          const hurtbox = enemy.getHitbox();
          if (projX >= hurtbox.x && projX <= hurtbox.x + hurtbox.width &&
              projY >= hurtbox.y && projY <= hurtbox.y + hurtbox.height) {
            enemy.takeDamage(damage);
            projectile.setActive(false).setVisible(false);
            return;
          }
        }
      }

      // Despawn projectiles that fly off-screen
      const bounds = this.cameras.main.worldView;
      if (projX < bounds.x - 100 || projX > bounds.right + 100 ||
          projY < bounds.y - 100 || projY > bounds.bottom + 100) {
        projectile.setActive(false).setVisible(false);
      }
    });

    if (this.input.keyboard.checkDown(Phaser.Input.Keyboard.KeyCodes.SPACE as any) || this.input.activePointer.isDown) {
      this.hero.performAttack(time);
    }

    if (DEBUG_MODE) {
      this.updateDebug();
    } else {
      // Update Hero Health Bar when not in debug mode
      const healthPercent = Math.max(0, this.hero.stats.hp / this.hero.stats.maxHp);
      this.heroHealthBar.setDisplaySize(300 * healthPercent, 20);
      this.heroHealthText.setText(`${Math.ceil(this.hero.stats.hp)}/${this.hero.stats.maxHp}`);
    }

    if (this.hero.isDead()) {
      this.hero.setVisible(false);
      this.hero.body?.stop();
      this.handleGameOver();
      return;
    }
  }

  private handleGameOver() {
    this.isGameOver = true;
    this.physics.pause();

    // Stop all enemy and hero updates to prevent logic from running in background
    this.enemies.getChildren().forEach(enemy => {
      (enemy.body as any)?.stop();
    });

    const gameOverText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, 'GAME OVER\nClick to Restart', {
      fontSize: '64px',
      color: '#ff0000',
      align: 'center'
    }).setOrigin(0.5);

    this.input.once('pointerdown', () => {
      this.scene.restart();
    });
  }

  private spawnDustEffect(x: number, y: number) {
    const dust = this.add.sprite(x, y, 'dust_particle');
    dust.setScale(1.5);

    // Play the animation and ensure it's not looping
    dust.play('dust_anim');

    // The animation needs to finish before the sprite is destroyed.
    // We use a delayed call or a tween to clean up after the animation duration.
    this.time.delayedCall(600, () => {
      dust.destroy();
    });

    // Still fade out the alpha for a smoother transition
    this.tweens.add({
      targets: dust,
      alpha: 0,
      duration: 600
    });
  }

  private updateDebug() {
    const stateStr = this.hero.getState();
    this.debugText.setText(
      `State: ${stateStr}\n` +
      `Frame: ${this.hero.anims.currentAnim ? (this.hero.anims.currentFrame ?? 'N/A') : 'N/A'}\n` +
      `Enemies: ${this.enemies.countActive()}\n` +
      `Pos: ${Math.round(this.hero.x)}, ${Math.round(this.hero.y)}\n` +
      `Vel: ${Math.round(this.hero.body?.velocity.x ?? 0)}, ${Math.round(this.hero.body?.velocity.y ?? 0)}`
    );


    this.hero.drawDebug(this.debugGraphics);

    // Draw hero attack range
    this.debugGraphics.lineStyle(1, 0x0000ff, 0.5);
    this.debugGraphics.strokeCircle(this.hero.x, this.hero.y, this.hero.stats.attackRange);

    // Update Hero Health Bar
    const healthPercent = Math.max(0, this.hero.stats.hp / this.hero.stats.maxHp);
    this.heroHealthBar.setDisplaySize(300 * healthPercent, 20);
    this.heroHealthText.setText(`${Math.ceil(this.hero.stats.hp)}/${this.hero.stats.maxHp}`);

    // Draw enemy hitboxes
    this.enemies.getChildren().forEach((enemy: any) => {
      const bounds = enemy.getHitbox();
      this.debugGraphics.lineStyle(1, 0x00ff00, 1);
      this.debugGraphics.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);

      // Draw attack range
      this.debugGraphics.lineStyle(1, 0x0000ff, 0.5);
      this.debugGraphics.strokeCircle(enemy.x, enemy.y, enemy.attackRange);
    });
  }
}