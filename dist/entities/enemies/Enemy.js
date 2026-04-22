import * as Phaser from 'phaser';
export class Enemy extends Phaser.Physics.Arcade.Sprite {
    hp;
    maxHp;
    speed;
    damage;
    attackRange;
    team;
    healthBar;
    healthBarBg;
    attackCooldown = 0;
    ATTACK_COOLDOWN_MS = 1000;
    isAttacking = false;
    constructor(scene, x, y, stats = { hp: 50, speed: 60, damage: 10, attackRange: 60 }, team = 'enemy') {
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
        }
        else {
            this.setDisplaySize(192, 192);
        }
        this.createHealthBar(scene);
        // Start with idle instead of forcing run immediately
        this.play('enemy_idle_anim');
    }
    getHitbox() {
        const width = this.width * 0.25;
        const height = this.height * 0.25;
        return new Phaser.Geom.Rectangle(this.x - width / 2, this.y - height / 2, width, height);
    }
    createHealthBar(scene) {
        const width = 60;
        const height = 6;
        this.healthBarBg = scene.add.rectangle(0, 0, width, height, 0x000000);
        this.healthBar = scene.add.rectangle(0, 0, width, height, 0x00ff00);
        this.healthBarBg.setDepth(this.depth + 1);
        this.healthBar.setDepth(this.depth + 2);
    }
    update(hero, time) {
        if (hero.isDead()) {
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
        const angle = Phaser.Math.Angle.Between(this.x, this.y, hero.x, hero.y);
        const dist = Phaser.Math.Distance.Between(this.x, this.y, hero.x, hero.y);
        if (time < this.attackCooldown && dist > this.attackRange) {
            this.setVelocity(0);
            this.handleAnimation('idle');
            this.updateHealthBar();
            return;
        }
        if (dist > this.attackRange) {
            this.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
            this.handleAnimation('run');
        }
        else {
            this.setVelocity(0);
            this.setFlipX(this.x > hero.x);
            this.performAttack(hero, time);
        }
        if (!this.isAttacking && this.body.velocity.x !== 0) {
            this.setFlipX(this.body.velocity.x < 0);
        }
        this.updateHealthBar();
    }
    handleAnimation(state) {
        const animKey = state === 'idle' ? 'enemy_idle_anim' : 'enemy_run_anim';
        if (this.anims.currentAnim?.key !== animKey) {
            this.play(animKey, true);
        }
    }
    performAttack(hero, time) {
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
    updateHealthBar() {
        const x = this.x;
        const y = this.y - 110;
        this.healthBarBg.setPosition(x, y);
        this.healthBar.setPosition(x, y);
        const healthPercent = Math.max(0, this.hp / this.maxHp);
        this.healthBar.setDisplaySize(60 * healthPercent, 6);
    }
    takeDamage(amount) {
        this.hp -= amount;
        this.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => {
            this.clearTint();
        });
    }
    isDead() {
        return this.hp <= 0;
    }
    destroy() {
        if (this.healthBar)
            this.healthBar.destroy();
        if (this.healthBarBg)
            this.healthBarBg.destroy();
        super.destroy();
    }
}
