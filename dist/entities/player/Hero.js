import * as Phaser from 'phaser';
import { DEBUG_MODE } from "../../config";
export var HeroState;
(function (HeroState) {
    HeroState["IDLE"] = "IDLE";
    HeroState["WALK"] = "WALK";
    HeroState["ATTACK"] = "ATTACK";
})(HeroState || (HeroState = {}));
export class Hero extends Phaser.Physics.Arcade.Sprite {
    state = HeroState.IDLE;
    attackCooldown = 0;
    ATTACK_COOLDOWN_MS = 500;
    hitEnemies = new Set();
    // stats that can be modified
    stats = {
        hp: 100,
        maxHp: 100,
        moveSpeed: 160,
        attackRange: 60,
        attackDamage: 25,
    };
    facingDirection = 0; // 0: Right, 1: Left
    attackComboIndex = 0;
    constructor(scene, x, y) {
        super(scene, x, y, 'hero_idle');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setCollideWorldBounds(true);
        this.body.setCircle(16, 16, 0, 0);
        // Set the hero to exactly 92px height and width
        this.setDisplaySize(192, 192);
    }
    setSizing(width, height) {
        this.setDisplaySize(width, height);
    }
    update(cursors, time) {
        if (this.state === HeroState.ATTACK) {
            if (time >= this.attackCooldown) {
                // Update combo index based on whether the attack hit anything
                if (this.attackComboIndex === 0 && this.hitEnemies.size > 0) {
                    this.attackComboIndex = 1;
                }
                else {
                    this.attackComboIndex = 0;
                }
                this.state = HeroState.IDLE;
                this.setTexture('hero_idle');
                this.play('hero_idle_anim');
            }
            return;
        }
        const moveX = cursors.left.isDown ? -1 : cursors.right.isDown ? 1 : 0;
        const moveY = cursors.up.isDown ? -1 : cursors.down.isDown ? 1 : 0;
        if (moveX !== 0 || moveY !== 0) {
            if (this.state !== HeroState.WALK) {
                this.state = HeroState.WALK;
                this.setTexture('hero_run');
                this.play('hero_run_anim', true);
            }
            const angle = Math.atan2(moveY, moveX);
            this.setVelocity(Math.cos(angle) * this.stats.moveSpeed, Math.sin(angle) * this.stats.moveSpeed);
            if (moveX !== 0) {
                this.facingDirection = moveX > 0 ? 0 : 1;
                this.setFlipX(this.facingDirection === 1);
            }
        }
        else {
            if (this.state !== HeroState.IDLE) {
                this.state = HeroState.IDLE;
                this.setTexture('hero_idle');
                this.play('hero_idle_anim', true);
            }
            this.setVelocity(0);
        }
    }
    performAttack(time) {
        if (this.state === HeroState.ATTACK)
            return;
        this.state = HeroState.ATTACK;
        const attackAnim = this.attackComboIndex === 0 ? 'hero_attack1_anim' : 'hero_attack2_anim';
        this.play(attackAnim);
        this.setVelocity(0);
        this.attackCooldown = time + this.ATTACK_COOLDOWN_MS;
        this.hitEnemies.clear();
        this.attackComboIndex = this.attackComboIndex; // Maintain current index for the attack animation
        if (DEBUG_MODE) {
            console.log(`Hero attacked with ${attackAnim} facing ${this.facingDirection === 0 ? 'Right' : 'Left'}`);
        }
    }
    getHitEnemies() {
        return this.hitEnemies;
    }
    getState() {
        return this.state;
    }
    takeDamage(amount) {
        this.stats.hp -= amount;
        this.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => {
            this.clearTint();
        });
    }
    isDead() {
        return this.stats.hp <= 0;
    }
    getAttackHitbox() {
        const width = this.stats.attackRange;
        const height = 32;
        const x = this.facingDirection === 0 ? this.x : this.x - width;
        const y = this.y - height / 2;
        return new Phaser.Geom.Rectangle(x, y, width, height);
    }
    getHurtbox() {
        const width = 32;
        const height = 32;
        return new Phaser.Geom.Rectangle(this.x - width / 2, this.y - height / 2, width, height);
    }
    drawDebug(graphics) {
        if (!DEBUG_MODE)
            return;
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
