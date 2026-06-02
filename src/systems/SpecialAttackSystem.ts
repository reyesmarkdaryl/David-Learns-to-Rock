import * as Phaser from 'phaser';
import { Hero } from '../entities/player/Hero';
import { Enemy } from '../entities/enemies/Enemy';

export enum SpecialAttackType {
    SLASH,
    NOVA,
    BOLT
}

export interface SpecialAttackConfig {
    type: SpecialAttackType;
    animationKey: string;
    damage: number;
    radius?: number;
    range?: number;
    duration: number;
}

export class SpecialAttackSystem {
    private static instance: SpecialAttackSystem;
    private attackConfigs: Map<string, Map<number, SpecialAttackConfig>> = new Map();

    private constructor() {
        this.initDefaultConfigs();
    }

    public static getInstance(): SpecialAttackSystem {
        if (!SpecialAttackSystem.instance) {
            SpecialAttackSystem.instance = new SpecialAttackSystem();
        }
        return SpecialAttackSystem.instance;
    }

    private initDefaultConfigs() {
        // Warrior -> Slash
        const warriorAttacks = new Map<number, SpecialAttackConfig>();
        warriorAttacks.set(1, {
            type: SpecialAttackType.SLASH,
            animationKey: 'special_slash_anim',
            damage: 100,
            radius: 200,
            duration: 1000
        });
        this.attackConfigs.set('warrior', warriorAttacks);

        // Lancer -> Nova
        const lancerAttacks = new Map<number, SpecialAttackConfig>();
        lancerAttacks.set(1, {
            type: SpecialAttackType.NOVA,
            animationKey: 'special_nova_anim',
            damage: 150,
            radius: 250,
            duration: 1000
        });
        this.attackConfigs.set('lancer', lancerAttacks);

        // Archer -> Bolt
        const archerAttacks = new Map<number, SpecialAttackConfig>();
        archerAttacks.set(1, {
            type: SpecialAttackType.BOLT,
            animationKey: 'special_bolt_anim',
            damage: 200,
            range: 400,
            duration: 1000
        });
        this.attackConfigs.set('archer', archerAttacks);
    }

    public getConfig(minionType: string, level: number = 1): SpecialAttackConfig | undefined {
        const levels = this.attackConfigs.get(minionType);
        return levels ? levels.get(level) : undefined;
    }

    public executeAttack(scene: Phaser.Scene, hero: Hero, enemies: Phaser.Physics.Arcade.Group, minionType: string, level: number = 1) {
        const config = this.getConfig(minionType, level);
        if (!config) return;

        switch (config.type) {
            case SpecialAttackType.SLASH:
                this.executeSlash(scene, hero, enemies, config);
                break;
            case SpecialAttackType.NOVA:
                this.executeNova(scene, hero, enemies, config);
                break;
            case SpecialAttackType.BOLT:
                this.executeBolt(scene, hero, enemies, config);
                break;
        }
    }

    private executeSlash(scene: Phaser.Scene, hero: Hero, enemies: Phaser.Physics.Arcade.Group, config: SpecialAttackConfig) {
        const facing = (hero as any).facingDirection;
        const offset = facing === 0 ? 80 : -80;
        const effect = scene.add.sprite(hero.x + offset, hero.y - 20, config.animationKey.replace('_anim', ''));
        effect.setOrigin(0.5, 0.5);
        effect.setScale(2);
        effect.setDepth(100);
        effect.setFlipX(facing === 1);

        if (scene.anims.exists(config.animationKey)) {
            effect.play(config.animationKey);
        }

        const attackRadius = config.radius || 200;
        enemies.getChildren().forEach((enemy: any) => {
            if (enemy.team === 'enemy') {
                const dist = Phaser.Math.Distance.Between(hero.x, hero.y, enemy.x, enemy.y);
                if (dist <= attackRadius) {
                    enemy.takeDamage(config.damage);
                }
            }
        });

        scene.time.delayedCall(config.duration, () => effect.destroy());
    }

    private executeNova(scene: Phaser.Scene, hero: Hero, enemies: Phaser.Physics.Arcade.Group, config: SpecialAttackConfig) {
        const effect = scene.add.sprite(hero.x, hero.y, config.animationKey.replace('_anim', ''));
        effect.setOrigin(0.5, 0.5);
        effect.setScale(2);
        effect.setDepth(100);

        if (scene.anims.exists(config.animationKey)) {
            effect.play(config.animationKey);
        }

        const attackRadius = config.radius || 250;
        enemies.getChildren().forEach((enemy: any) => {
            if (enemy.team === 'enemy') {
                const dist = Phaser.Math.Distance.Between(hero.x, hero.y, enemy.x, enemy.y);
                if (dist <= attackRadius) {
                    enemy.takeDamage(config.damage);
                }
            }
        });

        scene.time.delayedCall(config.duration, () => effect.destroy());
    }

    private executeBolt(scene: Phaser.Scene, hero: Hero, enemies: Phaser.Physics.Arcade.Group, config: SpecialAttackConfig) {
        let nearestEnemy: any = null;
        let minDist = Infinity;

        enemies.getChildren().forEach((enemy: any) => {
            if (enemy.team === 'enemy') {
                const dist = Phaser.Math.Distance.Between(hero.x, hero.y, enemy.x, enemy.y);
                if (dist < minDist && dist <= (config.range || 400)) {
                    minDist = dist;
                    nearestEnemy = enemy;
                }
            }
        });

        if (!nearestEnemy) return;

        // Use physics sprite instead of simple sprite to handle collisions
        const effect = scene.physics.add.sprite(hero.x, hero.y, config.animationKey.replace('_anim', ''));
        effect.setOrigin(0.5, 0.5);
        effect.setScale(2);
        effect.setDepth(100);

        const angle = Phaser.Math.Angle.Between(hero.x, hero.y, nearestEnemy.x, nearestEnemy.y);
        effect.setRotation(angle);

        if (scene.anims.exists(config.animationKey)) {
            effect.play(config.animationKey);
        }

        // Bolt physics
        const speed = 800;
        effect.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

        // Wall collision: destroy bolt on hit
        const walls = (scene as any).walls;
        if (walls) {
            scene.physics.add.collider(effect, walls, () => {
                effect.destroy();
            });
        }

        // Enemy collision: damage and destroy
        scene.physics.add.overlap(effect, enemies, (bolt: any, enemy: any) => {
            if (enemy.team === 'enemy') {
                enemy.takeDamage(config.damage);
                bolt.destroy();
            }
        });

        // Cleanup if it flies off-screen (failsafe)
        scene.time.delayedCall(config.duration, () => {
            if (effect.active) {
                effect.destroy();
            }
        });
    }
}

export default SpecialAttackSystem.getInstance();
