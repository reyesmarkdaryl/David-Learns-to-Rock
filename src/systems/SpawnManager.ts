import * as Phaser from 'phaser';
import { RoomData, SpawnData } from '../room/RoomData';
import { Enemy } from '../entities/enemies/Enemy';
import { Lancer } from '../entities/enemies/Lancer';
import { Archer } from '../entities/enemies/Archer';

export class SpawnManager {
  constructor(
    private scene: Phaser.Scene,
    private enemiesGroup: Phaser.Physics.Arcade.Group
  ) {}

  /**
   * Spawns enemies based on the RoomData spawn points.
   */
  public spawnRoomEnemies(roomData: RoomData, enemyType: 'warrior' | 'lancer' | 'archer', count: number = 1) {
    if (roomData.enemySpawns.length === 0) return;

    for (let i = 0; i < count; i++) {
      // Pick a random spawn point from the room's defined spawns
      const spawnPoint = roomData.enemySpawns[Math.floor(Math.random() * roomData.enemySpawns.length)];

      // Convert grid coordinates to world coordinates
      const x = spawnPoint.x * 32 + 16;
      const y = spawnPoint.y * 32 + 16;

      let enemy;
      switch (enemyType) {
        case 'lancer':
          enemy = new Lancer(this.scene, x, y);
          break;
        case 'archer':
          enemy = new Archer(this.scene, x, y);
          break;
        default:
          enemy = new Enemy(this.scene, x, y);
      }

      if (this.enemiesGroup) {
        this.enemiesGroup.add(enemy);
      } else {
        console.error('SpawnManager: enemiesGroup is undefined');
      }
    }
  }

  /**
   * Clears all current enemies from the room.
   */
  public clearEnemies() {
    this.enemiesGroup.clear(true, true);
  }
}
