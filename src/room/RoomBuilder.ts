import Phaser from 'phaser';
import { RoomData, TileData } from '../room/RoomData';
import { GridSystem } from '../editor/GridSystem';

export class RoomBuilder {
  public static build(scene: Phaser.Scene, roomData: RoomData) {
    console.log(`Building room: ${roomData.id}`);

    // Create a static group for walls to enable physics collisions
    const walls = scene.physics.add.staticGroup();

    roomData.tiles.forEach((tile: TileData) => {
      const world = GridSystem.gridToWorld(tile.x, tile.y);

      const color = tile.type === 'wall' ? 0x888888 : 0x44aa44;
      const rect = scene.add.rectangle(
        world.x + 32,
        world.y + 32,
        64,
        64,
        color
      );

      if (tile.type === 'wall') {
        walls.add(rect);
      }
    });

    return { walls };
  }
}
