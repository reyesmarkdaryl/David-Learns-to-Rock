import * as Phaser from 'phaser';
import { EventBus } from '../editor/EventBus';
import { Enemy } from '../entities/enemies/Enemy';
import { EnemyAtlas, EnemyConfig } from '../systems/EnemyAtlas';

export class EnemyEditorScene extends Phaser.Scene {
  private previewEnemy?: Enemy;
  private debugGraphics!: Phaser.GameObjects.Graphics;

  constructor() {
    super('EnemyEditorScene');
  }

  create() {
    EventBus.emit('SCENE_CHANGE', 'EnemyEditorScene');
    (window as any).gameScene = this;

    const atlas = EnemyAtlas.getInstance(this);
    atlas.createAnimations(this);

    this.debugGraphics = this.add.graphics();
    this.debugGraphics.setDepth(1000);

    this.add.text(20, 20, 'Enemy Editor Active - Phaser Rendering', {
      fontSize: '18px',
      color: '#555',
      fontFamily: 'Arial'
    });

    // Disable lighting for the editor to ensure full brightness
    this.lights.disable();
  }

  updatePreview(config: EnemyConfig) {
    const atlas = (window as any).EnemyAtlasInstance ||
                  EnemyAtlas.getInstance(this);

    let configKey = '';
    const allConfigs = atlas.getAllConfigs();
    for (const [key, cfg] of Object.entries(allConfigs)) {
      if (cfg === config) {
        configKey = key;
        break;
      }
    }

    if (!configKey) {
      const keys = Object.keys(allConfigs);
      configKey = keys[0];
    }

    if (this.previewEnemy) {
      if (this.previewEnemy.lastKnownConfigKey !== configKey) {
        this.previewEnemy.destroy();
        this.previewEnemy = undefined;
      }
    }

    if (!this.previewEnemy) {
      const x = this.scale.width / 2;
      const y = this.scale.height / 2;
      this.previewEnemy = new Enemy(this, x, y, configKey);

      // Center camera on the enemy
      this.cameras.main.centerOn(x, y);
    }

    if ((this.previewEnemy as any).updateFromConfig) {
      (this.previewEnemy as any).updateFromConfig(config);
    }
  }

  updatePreviewAnimation(animKey: string) {
    if (this.previewEnemy) {
      const fullKey = `${this.previewEnemy.baseTextureKey}_${animKey}_anim`;
      this.previewEnemy.safePlay(fullKey, true);
    }
  }

  setDebugVisibility(hitbox: boolean, body: boolean, attack: boolean) {
    // We can't easily 'hide' the graphics, but we can just use these flags in the update loop
    (window as any).enemyEditorDebug = { hitbox, body, attack };
  }

  update(time: number, delta: number) {
    if (!this.previewEnemy) return;

    this.debugGraphics.clear();
    const debug = (window as any).enemyEditorDebug || { hitbox: true, body: true, attack: true };

    if (debug.hitbox) {
      const bounds = this.previewEnemy.getHitbox();
      this.debugGraphics.lineStyle(1, 0xff4444, 1);
      this.debugGraphics.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
    }

    if (debug.body) {
      const anchorX = this.previewEnemy.x + (this.previewEnemy.bodyOffset?.x || 0);
      const anchorY = this.previewEnemy.y + (this.previewEnemy.bodyOffset?.y || 0);
      this.debugGraphics.lineStyle(2, 0xB03060, 1);
      this.debugGraphics.strokeCircle(anchorX, anchorY, this.previewEnemy.bodyRadius || 0);
    }

    if (debug.attack) {
      this.debugGraphics.lineStyle(4, 0xffff44, 0.6);
      this.debugGraphics.strokeCircle(this.previewEnemy.x, this.previewEnemy.y, this.previewEnemy.attackRange);
    }
  }
}
