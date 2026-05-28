import * as Phaser from 'phaser';

export interface EnemyAnimation {
  file: string;
  startFrame: number;
  endFrame: number;
  frameRate: number;
  repeat: number;
  yoyo: boolean;
}

export interface EnemyVisuals {
  textureKey: string;
  frameWidth: number;
  frameHeight: number;
  animations: Record<string, EnemyAnimation>;
}

export interface EnemyPhysics {
  hitbox: { x: number; y: number; w: number; h: number };
  bodyCircle: { radius: number; x: number; y: number };
  attackRangeCircle: { radius: number };
}

export interface EnemyStats {
  hp: number;
  speed: number;
  damage: number;
  attackRange: number;
  behavior: 'persistent' | 'limited';
  displaySize: { width: number; height: number };
  attackWindupMs: number;
  aggroRange: number;
  loseAggroRange: number;
  knockbackResist: number;
  xp: number;
  score: number;
}

export interface EnemyConfig {
  name: string;
  stats: EnemyStats;
  physics: EnemyPhysics;
  visuals: EnemyVisuals;
}

export interface EnemyAtlasData {
  basePath: string;
  enemies: {
    types: Record<string, EnemyConfig>;
  };
}

export class EnemyAtlas {
  private static instance: EnemyAtlas;
  private data: EnemyAtlasData = {
    basePath: '',
    enemies: { types: {} }
  };
  private scene: Phaser.Scene;

  private constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public static getInstance(scene: Phaser.Scene): EnemyAtlas {
    if (!EnemyAtlas.instance) {
      EnemyAtlas.instance = new EnemyAtlas(scene);
    }
    return EnemyAtlas.instance;
  }

  public async load() {
    try {
      const response = await fetch('assets/enemies_atlas.json');
      this.data = await response.json();
      console.log('[EnemyAtlas] Atlas loaded successfully');
    } catch (error) {
      console.error('[EnemyAtlas] Failed to load atlas:', error);
    }
  }

  public loadTextures(scene: Phaser.Scene) {
    const { basePath, enemies } = this.data;
    const types = enemies.types;

    if (!types) {
      console.error('[EnemyAtlas] No enemy types found to load textures');
      return;
    }

    Object.entries(types).forEach(([typeKey, config]) => {
      const visuals = config.visuals;
      if (!visuals) return;

      Object.entries(visuals.animations).forEach(([animKey, animConfig]: [string, any]) => {
        const textureKey = `${visuals.textureKey}_${animKey}`;
        const fileName = typeof animConfig === 'string' ? animConfig : animConfig.file;

        if (!fileName) return;

        const path = `${basePath}${config.path}${fileName}`;

        scene.load.spritesheet(textureKey, path, {
          frameWidth: visuals.frameWidth,
          frameHeight: visuals.frameHeight
        });
      });
    });

    console.log('[EnemyAtlas] All enemy textures queued for loading');
  }

  public createAnimations(scene: Phaser.Scene) {
    const { enemies } = this.data;
    const types = enemies.types;

    if (!types) return;

    Object.entries(types).forEach(([typeKey, config]) => {
      const visuals = config.visuals;
      if (!visuals) return;

      Object.entries(visuals.animations).forEach(([animKey, animConfig]: [string, any]) => {
        const textureKey = `${visuals.textureKey}_${animKey}`;
        const fullAnimKey = `${visuals.textureKey}_${animKey}_anim`;

        // CRITICAL: Only create the animation if the texture was actually loaded.
        if (!scene.textures.get(textureKey)) {
          return;
        }

        if (!scene.anims.exists(fullAnimKey)) {
          let frames: any;
          if (animConfig.frames && Array.isArray(animConfig.frames)) {
            // Fallback for multi-file paths: convert to index 0 to avoid crash
            frames = animConfig.frames.map((f: any) => typeof f === 'number' ? f : 0);
          } else {
            const start = animConfig.startFrame ?? 0;
            const end = animConfig.endFrame ?? 0;
            frames = scene.anims.generateFrameNumbers(textureKey, start, end);
          }

          scene.anims.create({
            key: fullAnimKey,
            frames: frames,
            frameRate: animConfig.frameRate ?? 8,
            repeat: animConfig.repeat ?? 0,
            yoyo: animConfig.yoyo ?? false,
          });
        }
      });
    });
    console.log('[EnemyAtlas] All enemy animations created using generateFrameNumbers');
  }

  public getConfig(key: string): EnemyConfig | undefined {
    return this.data.enemies.types[key];
  }

  public getAllConfigs(): Record<string, EnemyConfig> {
    return this.data.enemies.types;
  }

  public setConfig(key: string, config: EnemyConfig) {
    this.data.enemies.types[key] = config;
    this.emitUpdate();
  }

  private emitUpdate() {
    this.scene.events.emit('enemy-atlas-updated');
  }
}
