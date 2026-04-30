import * as Phaser from 'phaser';
import { RoomData, TileData } from '../room/RoomData';
import { GridSystem } from '../editor/GridSystem';
import { RoomDataConverter } from '../editor/RoomDataConverter';

export class RoomBuilder {
  public static build(scene: Phaser.Scene, roomDataInput: any) {
    // Ensure we are working with a standardized RoomData object
    const roomData: RoomData = (roomDataInput && roomDataInput.meta)
      ? RoomDataConverter.convertFromJson(roomDataInput)
      : roomDataInput;

    console.log(`Building room: ${roomData.id}`);

    // Create a static group for walls to enable physics collisions
    const walls = scene.physics.add.staticGroup();

    roomData.tiles.forEach((tile: TileData) => {
      const world = GridSystem.gridToWorld(tile.x, tile.y);

      // Use actual textures based on tileId
      // Assuming tileId is the name of the tileset as defined in manifest.json
      // For now, we use a fallback to 'Old Dungeon' if the texture isn't found
      const texture = tile.tileId || (tile.type === 'wall' ? 'Walls' : 'Old Dungeon');

      const tileImage = scene.add.image(
        world.x + 32,
        world.y + 32,
        texture
      ).setDisplaySize(64, 64);

      if (tile.type === 'wall') {
        walls.add(tileImage);
      }
    });

    // Build Objects
    const objects = scene.add.group();

    // Player Spawn
    if (roomData.playerSpawn) {
      const world = GridSystem.gridToWorld(roomData.playerSpawn.x, roomData.playerSpawn.y);
      const pSpawn = scene.add.image(world.x + 32, world.y + 32, 'Objects', 0);
      pSpawn.setDisplaySize(32, 32);
      objects.add(pSpawn);
    }

    // Enemy Spawns
    roomData.enemySpawns.forEach(spawn => {
      const world = GridSystem.gridToWorld(spawn.x, spawn.y);
      const eSpawn = scene.add.image(world.x + 32, world.y + 32, 'Objects', 1);
      eSpawn.setDisplaySize(32, 32);
      objects.add(eSpawn);
    });

    // Doors
    roomData.doors.forEach(door => {
      const world = GridSystem.gridToWorld(door.x, door.y);
      const dObj = scene.add.image(world.x + 32, world.y + 32, 'Objects', 2);
      dObj.setDisplaySize(40, 40);
      objects.add(dObj);
    });

    // Decor Sockets
    roomData.decorSockets.forEach(socket => {
      const world = GridSystem.gridToWorld(socket.x, socket.y);
      const sObj = scene.add.image(world.x + 32, world.y + 32, 'Objects', 3);
      sObj.setDisplaySize(32, 32);
      objects.add(sObj);
    });

    return { walls, objects };
  }
}
