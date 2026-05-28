import { Hero } from '../entities/player/Hero';

export interface UpgradeOption {
    id: string;
    name: string;
    lore: string;
    glyph: string;
    color: string;
    rarity: 'Common' | 'Rare' | 'Legendary';
    type: 'stat' | 'special_attack';
    value: any; // For stats: { stat: 'damage', amount: 10 }
    description: string;
}

export class UpgradeSystem {
    private static instance: UpgradeSystem;
    private appliedUpgrades: UpgradeOption[] = [];
    private allUpgrades: UpgradeOption[] = [
        {
            id: 'blood_wrath',
            name: 'Blood Wrath',
            lore: 'Your strikes carry the weight of fallen kings.',
            glyph: '⚔',
            color: '#c0282c',
            rarity: 'Rare',
            type: 'stat',
            value: { stat: 'attackDamage', amount: 0.25 }, // +25%
            description: '+25% Damage'
        },
        {
            id: 'titan_covenant',
            name: "Titan's Covenant",
            lore: 'The old god stirs within your marrow.',
            glyph: '☽',
            color: '#9b3fc0',
            rarity: 'Legendary',
            type: 'stat',
            value: { stat: 'maxHp', amount: 40 }, // +40 HP
            description: '+40 Max HP'
        },
        {
            id: 'wraith_grace',
            name: "Wraith's Grace",
            lore: 'You are shadow given hunger and motion.',
            glyph: '👁',
            color: '#2e80c8',
            rarity: 'Rare',
            type: 'stat',
            value: { stat: 'dashSpeed', amount: 0.5 }, // +50%
            description: '+50% Dash Speed'
        }
    ];

    private constructor() {}

    public static getInstance(): UpgradeSystem {
        if (!UpgradeSystem.instance) {
            UpgradeSystem.instance = new UpgradeSystem();
        }
        return UpgradeSystem.instance;
    }

    public getRandomUpgrades(count: number = 3): UpgradeOption[] {
        const shuffled = [...this.allUpgrades].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    public applyUpgrade(hero: Hero, upgrade: UpgradeOption) {
        this.appliedUpgrades.push(upgrade);
        this.executeUpgradeLogic(hero, upgrade);
    }

    public applyAllUpgrades(hero: Hero) {
        this.appliedUpgrades.forEach(upgrade => this.executeUpgradeLogic(hero, upgrade));
    }

    private executeUpgradeLogic(hero: Hero, upgrade: UpgradeOption) {
        if (upgrade.type === 'stat') {
            const { stat, amount } = upgrade.value;

            if (stat === 'maxHp') {
                hero.stats.maxHp += amount;
                hero.stats.hp += amount; // Heal for the amount added
            } else if (stat === 'attackDamage') {
                hero.stats.attackDamage *= (1 + amount);
            } else if (stat === 'dashSpeed') {
                // Assuming dash speed is handled in the Hero class logic
                // We'll add a modifier if it doesn't exist
                (hero as any).dashSpeedMultiplier = ((hero as any).dashSpeedMultiplier || 1) * (1 + amount);
            }
        }
        // Special attacks will be implemented later
    }
}

export default UpgradeSystem.getInstance();
