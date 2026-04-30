import * as Phaser from 'phaser';

export class AssetPreloader extends Phaser.Scene {
  constructor() {
    super('AssetPreloader');
  }

  preload() {
    console.log('Preloading assets...');

    // Load the manifest
    this.load.json('tilemap-manifest', 'assets/tilemaps/manifest.json');

    // Since the manifest is JSON and we need it to load other images,
    // we can't easily do it in a single preload() call unless we hardcode
    // the assets or use a two-stage load.

    // Let's load the known assets from the manifest directly for now
    // to ensure they are available in the cache.
    this.load.image('Walls', 'assets/tilemaps/map/walls.png');
    this.load.image('Ground Rocks', 'assets/tilemaps/map/Ground_rocks.png');
    this.load.image('Water Coasts', 'assets/tilemaps/map/water_coasts.png');
    this.load.image('Water Details', 'assets/tilemaps/map/water_detilazation.png');
    this.load.image('Water Details v2', 'assets/tilemaps/map/water_detilazation_v2.png');
    this.load.image('Old Dungeon', 'assets/tilemaps/map/old_dungeon.png');
    this.load.image('Objects', 'assets/tilemaps/clutter/Objects.png');
    this.load.image('Objects Animated', 'assets/tilemaps/clutter/Objects_animated.png');
    this.load.image('Objects Animated 2', 'assets/tilemaps/clutter/Objects_animated2.png');
    this.load.image('Objects Animated 3', 'assets/tilemaps/clutter/Objects_animated3.png');
    this.load.image('Details', 'assets/tilemaps/clutter/details.png');
  }

  create() {
    console.log('Assets preloaded');
    this.scene.start('MainMenuScene');
  }
}
