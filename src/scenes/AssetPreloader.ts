import * as Phaser from 'phaser';
import MusicManager from '../systems/MusicManager';

export class AssetPreloader extends Phaser.Scene {
  constructor() {
    super('AssetPreloader');
  }

  preload() {
    console.log('Preloading assets...');

    // Load the manifests
    this.load.json('tilemap-manifest', 'assets/tilemaps/manifest.json');
    this.load.json('room-manifest', 'assets/manifest.json');

    // Preload all rooms from the manifest.
    // Note: In a real game, we'd load the manifest first, then the rooms.
    // For now, we'll preload the known rooms to ensure they are in cache.
    this.load.json('gym_room', 'assets/rooms/gym_room.json');
    this.load.json('easy_mountain_room', 'assets/rooms/easy_mountain_room.json');
    this.load.json('medium_mountain2_room', 'assets/rooms/medium_mountain2_room.json');
    this.load.json('hard_mountain3_room', 'assets/rooms/hard_mountain3_room.json');
    this.load.json('music-manifest', 'assets/music-manifest.json');
    this.load.audio('menu-music', 'assets/music/battle-hymn/full-hymn.wav');
    this.load.audio('stem-drums', 'assets/music/heavy-hymn/drums.wav');
    this.load.audio('stem-guitar', 'assets/music/heavy-hymn/guitar.wav');
    this.load.audio('stem-bass', 'assets/music/heavy-hymn/bass.wav');

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

  async create() {
    console.log('Assets preloaded, loading music instruments...');

    try {
        const musicManifest = this.cache.json.get('music-manifest');
        if (musicManifest) {
            await MusicManager.loadStems(musicManifest);
        } else {
            console.error('Music manifest not found in cache!');
        }
    } catch (e) {
        console.error('Error loading music instruments:', e);
    }

    console.log('All assets and instruments ready');
    this.scene.start('MainMenuScene');
  }
}
