import { RoomData } from '../room/RoomData';
import { TileData } from '../room/RoomData';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class ValidationSystem {
  public static validate(roomData: RoomData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Check for Player Spawn
    if (!roomData.playerSpawn) {
      errors.push('Missing player spawn point.');
    }

    // 2. Check if spawns are inside walls
    const wallCoords = new Set(
      roomData.tiles
        .filter(t => t.type === 'wall')
        .map(t => `${t.x},${t.y}`)
    );

    if (roomData.playerSpawn) {
      if (wallCoords.has(`${roomData.playerSpawn.x},${roomData.playerSpawn.y}`)) {
        errors.push('Player spawn is located inside a wall.');
      }
    }

    roomData.enemySpawns.forEach((spawn, index) => {
      if (wallCoords.has(`${spawn.x},${spawn.y}`)) {
        warnings.push(`Enemy spawn #${index + 1} is located inside a wall.`);
      }
    });

    // 3. Check for Doors on map boundaries
    roomData.doors.forEach((door, index) => {
      const isOnEdge =
        door.x === 0 ||
        door.x === roomData.width - 1 ||
        door.y === 0 ||
        door.y === roomData.height - 1;

      if (!isOnEdge) {
        warnings.push(`Door #${index + 1} is not on the map boundary.`);
      }
    });

    // 4. Reachability Check (Simple Flood Fill from Player Spawn)
    if (roomData.playerSpawn) {
      const reachable = this.calculateReachableTiles(roomData);

      roomData.doors.forEach((door, index) => {
        if (!reachable.has(`${door.x},${door.y}`)) {
          warnings.push(`Door #${index + 1} is unreachable from the player spawn.`);
        }
      });

      roomData.enemySpawns.forEach((spawn, index) => {
        if (!reachable.has(`${spawn.x},${spawn.y}`)) {
          warnings.push(`Enemy spawn #${index + 1} is unreachable from the player spawn.`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private static calculateReachableTiles(roomData: RoomData): Set<string> {
    const reachable = new Set<string>();
    if (!roomData.playerSpawn) return reachable;

    const start = `${roomData.playerSpawn.x},${roomData.playerSpawn.y}`;
    const queue = [roomData.playerSpawn];
    const visited = new Set<string>();

    const wallCoords = new Set(
      roomData.tiles
        .filter(t => t.type === 'wall')
        .map(t => `${t.x},${t.y}`)
    );

    visited.add(start);

    while (queue.length > 0) {
      const current = queue.shift()!;
      reachable.add(`${current.x},${current.y}`);

      const neighbors = [
        { x: current.x + 1, y: current.y },
        { x: current.x - 1, y: current.y },
        { x: current.x, y: current.y + 1 },
        { x: current.x, y: current.y - 1 },
      ];

      for (const next of neighbors) {
        const key = `${next.x},${next.y}`;
        if (
          next.x >= 0 && next.x < roomData.width &&
          next.y >= 0 && next.y < roomData.height &&
          !wallCoords.has(key) &&
          !visited.has(key)
        ) {
          visited.add(key);
          queue.push(next);
        }
      }
    }

    return reachable;
  }
}
