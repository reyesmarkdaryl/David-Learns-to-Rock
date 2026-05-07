import * as Phaser from 'phaser';
import { RoomData, TileData } from '../room/RoomData';
import { GridSystem } from '../editor/GridSystem';
import { RoomDataConverter } from '../editor/RoomDataConverter';
import { DEBUG_MODE } from '../config';

export class RoomBuilder {
  public static build(scene: Phaser.Scene, roomDataInput: any) {
    // Ensure we are working with a standardized RoomData object
    const roomData: RoomData = (roomDataInput && roomDataInput.meta)
      ? RoomDataConverter.convertFromJson(roomDataInput)
      : roomDataInput;

    console.log(`Building room: ${roomData.id}`);

    // Create a static group for walls to enable physics collisions
    const walls = scene.physics.add.staticGroup();
    const doors = scene.physics.add.staticGroup();

    roomData.tiles.forEach((tile: TileData) => {
      const world = GridSystem.gridToWorld(tile.x, tile.y);

      // Use the sheetId (tileId) directly as the texture key
      const texture = tile.tileId || (tile.type === 'wall' ? 'Walls' : 'Old Dungeon');

      // Convert (col, row) to frame index
      // frame = row * tilesPerRow + col
      const textureObj = scene.textures.get(texture);
      if (!textureObj) {
        console.warn(`Texture ${texture} not found!`);
        return;
      }
      const image = textureObj.getSourceImage();
      const tileSize = 16; // This should ideally come from roomData.meta.tileSize
      const tilesPerRow = Math.floor(image.width / tileSize);
      const frame = tile.row * tilesPerRow + tile.col;

      const tileImage = scene.add.image(
        world.x + 16,
        world.y + 16,
        texture,
        frame
      ).setDisplaySize(32, 32);

      if (tile.type === 'wall') {
        walls.add(tileImage);
      }
    });

    // Build Objects
    const objects = scene.add.group();

    // Doors
    roomData.doors.forEach(door => {
      const world = GridSystem.gridToWorld(door.x, door.y);
      const dObj = scene.add.image(world.x + 32, world.y + 32, 'Objects', 2);
      dObj.setDisplaySize(40, 40);
      doors.add(dObj);
    });

    // Decor Sockets
    roomData.decorSockets.forEach(socket => {
      const world = GridSystem.gridToWorld(socket.x, socket.y);
      const sObj = scene.add.image(world.x + 32, world.y + 32, 'Objects', 3);
      sObj.setDisplaySize(32, 32);
      objects.add(sObj);
    });

    return { walls, doors, objects };
  }
}
