import Phaser from 'phaser';

interface TilesetConfig {
  key: string;
  path: string;
}

export default class RoomAssetManager {
  private scene: Phaser.Scene;
  private tilesetConfigs: TilesetConfig[];
  private loading: boolean = false;

  // ✅ FIXED TYPE
  private queue: Array<() => Promise<void>> = [];

  constructor(scene: Phaser.Scene, tilesetConfigs: TilesetConfig[]) {
    this.scene = scene;
    this.tilesetConfigs = tilesetConfigs;
  }

  /**
   * Extract tileset dependencies from room data
   */
  private getRequiredAssets(roomData: any): { key: string; path: string }[] {
    if (!roomData.tilesets || !Array.isArray(roomData.tilesets)) {
      return [];
    }

    return roomData.tilesets.map((ts: any) => ({
      key: ts.id,
      path: ts.path
    }));
  }

  /**
   * Check which required assets are missing
   */
  private getMissingAssets(required: { key: string; path: string }[]): { key: string; path: string }[] {
    return required.filter(asset => !this.scene.textures.exists(asset.key));
  }

  /**
   * Load missing assets
   */
  private async loadAssets(assetKeys: { key: string; path: string }[]): Promise<void> {
    if (assetKeys.length === 0) return;

    // Queue if already loading
    if (this.loading) {
      return new Promise(resolve => {
        this.queue.push(async () => {
          await this.loadAssets(assetKeys);
          resolve();
        });
      });
    }

    this.loading = true;

    return new Promise(resolve => {
      assetKeys.forEach(asset => {
        if (!this.scene.textures.exists(asset.key)) {
          this.scene.load.spritesheet(asset.key, asset.path, {
            frameWidth: 16,
            frameHeight: 16
          });
        }
      });

      this.scene.load.once('complete', async () => {
        this.loading = false;

        // Process queue
        while (this.queue.length > 0) {
          const next = this.queue.shift();
          if (next) await next();
        }

        resolve();
      });

      this.scene.load.start();
    });
  }

  /**
   * Prepare assets before entering room
   */
  async prepareRoom(roomData: any): Promise<void> {
    const required = this.getRequiredAssets(roomData);
    const missing = this.getMissingAssets(required);
    await this.loadAssets(missing);
  }

  /**
   * Background preload
   */
  preloadRoom(roomData: any): void {
    const required = this.getRequiredAssets(roomData);
    const missing = this.getMissingAssets(required);

    if (missing.length > 0) {
      this.loadAssets(missing).catch(err =>
        console.error('[RoomAssetManager] Background preload failed:', err)
      );
    }
  }
}