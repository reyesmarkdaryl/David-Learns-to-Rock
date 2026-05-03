import * as Phaser from 'phaser';
import { RoomRegistry } from '../room/RoomRegistry';
import { RoomBuilder } from '../room/RoomBuilder';
import { EventBus } from '../editor/EventBus';
import { SpawnManager } from '../systems/SpawnManager';
import { Enemy } from '../entities/enemies/Enemy';
import { Hero } from '../entities/player/Hero';

export class PlaytestScene extends Phaser.Scene {
  private enemies!: Phaser.Physics.Arcade.Group;
  private spawnManager!: SpawnManager;

  constructor() {
    super('PlaytestScene');
  }

  create() {
    EventBus.emit('SCENE_CHANGE', 'PlaytestScene');
    console.log('PlaytestScene created');

    const roomData = RoomRegistry.getCurrentRoom();
    if (roomData) {
      console.log(`Playtesting room: ${roomData.id}`);

      // 1. Build the room (walls, visuals)
      const { walls, doors } = RoomBuilder.build(this, roomData);

      // 2. Setup Physics Group for enemies
      this.enemies = this.physics.add.group();

      // 3. Setup Spawn Manager
      this.spawnManager = new SpawnManager(this, this.enemies);

      // 4. Setup collisions
      this.physics.add.collider(this.enemies, walls);

      // Add Hero to scene and setup collisions
      const hero = new Hero(this, roomData.playerSpawn ?
        (roomData.playerSpawn.x * 64 + 32) : 400,
        roomData.playerSpawn ?
        (roomData.playerSpawn.y * 64 + 32) : 300
      );
      this.physics.add.collider(hero, walls);
      this.physics.add.collider(hero, doors, () => {
        console.log('Door reached! Room transition triggered.');
        this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, 'ROOM CLEAR!', {
          fontSize: '64px',
          color: '#ffff00',
          align: 'center'
        }).setOrigin(0.5);
      });

      // 5. Initial Spawn: Spawn some enemies at the room's spawn points
      this.time.delayedCall(500, () => {
        this.spawnManager.spawnRoomEnemies(roomData, 'warrior', 3);
        this.spawnManager.spawnRoomEnemies(roomData, 'lancer', 2);
      });

      // Setup basic camera and bounds
      const worldWidth = roomData.width * 64;
      const worldHeight = roomData.height * 64;
      this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
      this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    } else {
      console.error('No room data found in registry for playtest!');
    }

    this.add.text(20, 20, 'Playtest Mode: Press ESC to return to Editor', {
      color: '#ffffff',
      backgroundColor: '#000000'
    });

    this.input.keyboard.on('keydown-ESC', () => {
      this.scene.start('RoomEditorScene');
    });
  }
}
