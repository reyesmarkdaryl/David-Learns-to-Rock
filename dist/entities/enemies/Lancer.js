import * as Phaser from 'phaser';
import { Enemy } from './Enemy';
export class Lancer extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, {
            hp: 70,
            speed: 45,
            damage: 15,
            attackRange: 70,
            displaySize: { width: 192, height: 192 }
        });
        this.setTexture('lancer_idle');
    }
    update(target, time) {
        super.update(target, time);
        if (this.isDead())
            return;
        if (this.isAttacking) {
            return;
        }
        const isMoving = Math.abs(this.body.velocity.x) > 0.1 || Math.abs(this.body.velocity.y) > 0.1;
        this.handleAnimation(isMoving ? 'run' : 'idle');
        // Only update flip if moving, to avoid flashing during attack/idle transitions
        if (isMoving) {
            this.setFlipX(this.body.velocity.x < 0);
        }
    }
    handleAnimation(state) {
        const animKey = state === 'idle' ? 'lancer_idle_anim' : 'lancer_run_anim';
        if (this.anims.currentAnim?.key !== animKey) {
            this.play(animKey, true);
        }
    }
    performAttack(target, time) {
        if (time < this.attackCooldown) {
            this.play('lancer_idle_anim', true);
            return;
        }
        const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
        const angleDeg = Phaser.Math.RadToDeg(angle);
        let finalAnim = 'lancer_attack_right_anim';
        let finalFlip = false;
        // Mapping angles to animations
        if (angleDeg >= -22.5 && angleDeg < 22.5) {
            finalAnim = 'lancer_attack_right_anim';
            finalFlip = false;
        }
        else if (angleDeg >= 22.5 && angleDeg < 67.5) {
            finalAnim = 'lancer_attack_downright_anim';
            finalFlip = false;
        }
        else if (angleDeg >= 67.5 && angleDeg < 112.5) {
            finalAnim = 'lancer_attack_down_anim';
            finalFlip = false;
        }
        else if (angleDeg >= 112.5 && angleDeg < 157.5) {
            finalAnim = 'lancer_attack_downright_anim';
            finalFlip = true;
        }
        else if (angleDeg >= 157.5 || angleDeg < -157.5) {
            finalAnim = 'lancer_attack_right_anim';
            finalFlip = true;
        }
        else if (angleDeg >= -112.5 && angleDeg < -67.5) {
            finalAnim = 'lancer_attack_upright_anim';
            finalFlip = true;
        }
        else if (angleDeg >= -67.5 && angleDeg < -22.5) {
            finalAnim = 'lancer_attack_upright_anim';
            finalFlip = false;
        }
        else {
            finalAnim = 'lancer_attack_up_anim';
            finalFlip = false;
        }
        this.isAttacking = true;
        this.setFlipX(finalFlip);
        this.play(finalAnim, true);
        target.takeDamage(this.damage);
        this.attackCooldown = time + 1000;
    }
}
