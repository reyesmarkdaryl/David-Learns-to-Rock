import * as Phaser from 'phaser';

export interface LightSource {
    x: number;
    y: number;
    radius?: number;
    intensity?: number;
    id: string | number;
}

export class LightingSystem {
    private scene: Phaser.Scene;
    private darknessSprite!: Phaser.GameObjects.Rectangle;
    private glowTextureKey: string = 'glow';
    private darknessColor: number = 0x000000;
    private darknessAlpha: number = 0.92;
    private glowSprites: Map<string | number, Phaser.GameObjects.Sprite> = new Map();

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.initLighting();
    }

    private initLighting() {
        const { width, height } = this.scene.scale.canvas;
        console.log(`[LightingSystem] Initializing additive lighting system: ${width}x${height}`);

        // Create the darkness overlay
        this.darknessSprite = this.scene.add.rectangle(0, 0, width, height, this.darknessColor, this.darknessAlpha);
        this.darknessSprite.setOrigin(0, 0);
        this.darknessSprite.setScrollFactor(0);
        this.darknessSprite.setDepth(10000);
        this.darknessSprite.setVisible(true);
    }

    /**
     * Updates the light sources. Instead of masking, we use additive sprites
     * positioned over the darkness layer.
     */
    public update(lightSources: LightSource[]) {
        const currentIds = new Set(lightSources.map(s => s.id));

        // 1. Remove sprites for sources that no longer exist
        for (const [id, sprite] of this.glowSprites.entries()) {
            if (!currentIds.has(id)) {
                sprite.destroy();
                this.glowSprites.delete(id);
            }
        }

        // 2. Update or create glow sprites
        lightSources.forEach(source => {
            let glow = this.glowSprites.get(source.id);

            if (!glow) {
                glow = this.scene.add.sprite(source.x, source.y, this.glowTextureKey);
                glow.setBlendMode(Phaser.BlendModes.ADD);
                glow.setDepth(10001); // Above the darkness
                glow.setScale(1.0);
                glow.setAlpha(0.6);
                this.glowSprites.set(source.id, glow);
            }

            glow.setPosition(source.x, source.y);
        });
    }

    public setDarknessAlpha(alpha: number) {
        this.darknessAlpha = alpha;
        this.darknessSprite.setAlpha(this.darknessAlpha);
    }

    public destroy() {
        this.darknessSprite.destroy();
        this.glowSprites.forEach(sprite => sprite.destroy());
        this.glowSprites.clear();
    }
}
