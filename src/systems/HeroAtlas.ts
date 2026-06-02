import * as Phaser from 'phaser';

export interface HeroAnimation {
  file: string;
  startFrame: number;
  endFrame: number;
  frameRate: number;
  repeat: number;
}

export interface HeroAtlasData {
  basePath: string;
  hero: {
    path: string;
    animations: Record<string, HeroAnimation>;
  };
  special_attacks: {
    basePath: string;
    animations: Record<string, HeroAnimation>;
  };
}

export class HeroAtlas {
  private static instance: HeroAtlas;
  private data: HeroAtlasData | null = null;
  private scene: Phaser.Scene;

  private static SPECIAL_ATTACK_MAP: Record<string, string> = {
    'HolySlash_A_spritesheet.png': 'slash',
    'HolySlash_B_spritesheet.png': 'slash',
    'HolySlash_C_spritesheet.png': 'slash',
    'Holy Nova.png': 'nova',
    'Holy Bolt.png': 'bolt',
  };

  private constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public static getInstance(scene: Phaser.Scene): HeroAtlas {
    if (!HeroAtlas.instance) {
      HeroAtlas.instance = new HeroAtlas(scene);
    }
    return HeroAtlas.instance;
  }

  public loadFromCache(scene: Phaser.Scene) {
    try {
      const data = scene.cache.json.get('hero-atlas');
      if (!data) {
        console.error('[HeroAtlas] hero-atlas.json not found in cache');
        return;
      }
      this.data = data;
      console.log('[HeroAtlas] Atlas loaded from cache successfully');
    } catch (error) {
      console.error('[HeroAtlas] Failed to load atlas from cache:', error);
    }
  }

  public loadTextures(scene: Phaser.Scene) {
    if (!this.data) return;
    const { basePath, hero } = this.data;
    const animations = hero.animations;

    Object.entries(animations).forEach(([animKey, animConfig]) => {
      const fileName = animConfig.file;
      if (!fileName) return;

      const textureKey = `hero_${fileName.split('.')[0].replace(/\s+/g, '_').toLowerCase()}`;
      const path = `${basePath}${hero.path}${fileName}`;

      // Prevent double loading if multiple animations use the same file
      if (!scene.textures.get(textureKey)) {
        console.log(`[HeroAtlas] Queuing texture: ${textureKey} from path: ${path}`);
        scene.load.spritesheet(textureKey, path, {
          frameWidth: 240,
          frameHeight: 128,
        });
      }
    });

    // Load special attacks if needed
    if (this.data.special_attacks) {
      const specials = this.data.special_attacks.animations;
      Object.entries(specials).forEach(([attackName, animConfig]) => {
        const fileName = animConfig.file;
        if (!fileName) return;

        const textureKey = `special_${attackName}`;
        const path = `${this.data!.special_attacks.basePath}${fileName}`;
        console.log(`[HeroAtlas] Queuing special texture: ${textureKey} from path: ${path}`);
        scene.load.spritesheet(textureKey, path, {
          frameWidth: 64,
          frameHeight: 64,
        });
      });
    }
  }

  public createAnimations(scene: Phaser.Scene) {
    if (!this.data) {
      console.error('[HeroAtlas] No data loaded. Cannot create animations.');
      return;
    }
    const { hero, special_attacks } = this.data;
    const animations = hero.animations;

    console.log(`[HeroAtlas] Creating animations for ${Object.keys(animations).length} entries...`);

    Object.entries(animations).forEach(([animKey, animConfig]) => {
      const fileName = animConfig.file;
      if (!fileName) return;

      const textureKey = `hero_${fileName.split('.')[0].replace(/\s+/g, '_').toLowerCase()}`;
      const fullAnimKey = `hero_${animKey}_anim`;

      const texture = scene.textures.get(textureKey);
      if (!texture) {
        console.warn(`[HeroAtlas] Texture ${textureKey} NOT FOUND. Skipping animation ${fullAnimKey}`);
        return;
      }

      if (scene.anims.exists(fullAnimKey)) {
        scene.anims.remove(fullAnimKey);
      }

      scene.anims.create({
        key: fullAnimKey,
        frames: scene.anims.generateFrameNumbers(textureKey, animConfig.startFrame ?? 0, animConfig.endFrame ?? 0),
        frameRate: animConfig.frameRate ?? 8,
        repeat: animConfig.repeat ?? 0,
      });
      console.log(`[HeroAtlas] Created animation: ${fullAnimKey} using texture: ${textureKey}`);
    });

    // Create Special Attack animations
    if (special_attacks) {
      console.log(`[HeroAtlas] Creating special attack animations for ${Object.keys(special_attacks.animations).length} entries...`);
      Object.entries(special_attacks.animations).forEach(([attackName, animConfig]) => {
        const textureKey = `special_${attackName}`;
        const animKey = `${textureKey}_anim`;

        const texture = scene.textures.get(textureKey);
        if (texture) {
          if (scene.anims.exists(animKey)) scene.anims.remove(animKey);

          const maxFrame = texture.frameCount > 0 ? texture.frameCount - 1 : 0;
          const finalStart = Math.max(0, animConfig.startFrame ?? 0);
          const finalEnd = Math.min(maxFrame, animConfig.endFrame ?? 0);

          if (finalStart > maxFrame) {
            console.error(`[HeroAtlas] Animation ${animKey} startFrame ${finalStart} is out of bounds (max ${maxFrame})`);
            return;
          }

          scene.anims.create({
            key: animKey,
            frames: scene.anims.generateFrameNumbers(textureKey, finalStart, finalEnd),
            frameRate: animConfig.frameRate ?? 6,
            repeat: animConfig.repeat ?? 0,
          });
          console.log(`[HeroAtlas] Created special animation: ${animKey} using texture: ${textureKey} [${finalStart}-${finalEnd}] (Total frames: ${texture.frameCount})`);
        } else {
          console.warn(`[HeroAtlas] Special texture ${textureKey} NOT FOUND for animation ${animKey}`);
        }
      });
    }
  }

  public getIdleTexture(): string {
    if (!this.data) return 'hero_tex_0';
    const idleFile = this.data.hero.animations.idle?.file || 'Idle.png';
    return `hero_${idleFile.split('.')[0].replace(/\s+/g, '_').toLowerCase()}`;
  }
}
