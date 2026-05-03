import * as Phaser from 'phaser';

export class Pathfinder {
  /**
   * Finds the next step towards a target using BFS.
   * @param scene The Phaser scene for accessing walls
   * @param start The starting position {x, y}
   * @param target The target position {x, y}
   * @param tileSize The size of the grid tiles (e.g., 64)
   * @returns The direction vector to the next tile {x, y} or {x: 0, y: 0} if no path is found
   */
  static getNextStep(scene: any, start: { x: number, y: number }, target: { x: number, y: number }, tileSize: number = 64): { x: number, y: number } {
    if (!scene) return { x: 0, y: 0 };
    const walls = scene.walls;
    if (!walls) return { x: 0, y: 0 };

    const startX = Math.floor(start.x / tileSize);
    const startY = Math.floor(start.y / tileSize);
    const targetX = Math.floor(target.x / tileSize);
    const targetY = Math.floor(target.y / tileSize);

    if (startX === targetX && startY === targetY) return { x: 0, y: 0 };

    const queue: [number, number, [number, number][]][] = [[startX, startY, []]];
    const visited = new Set([`${startX},${startY}`]);
    const directions = [
      [0, -1], [0, 1], [-1, 0], [1, 0], // Cardinal
      [-1, -1], [-1, 1], [1, -1], [1, 1] // Diagonal
    ];

    let iterations = 0;
    const MAX_ITERATIONS = 400;

    while (queue.length > 0 && iterations < MAX_ITERATIONS) {
      iterations++;
      const [cx, cy, path] = queue.shift()!;

      if (cx === targetX && cy === targetY) {
        if (path.length === 0) return { x: 0, y: 0 };
        const [nextX, nextY] = path[0];
        const dx = nextX - startX;
        const dy = nextY - startY;
        const len = Math.hypot(dx, dy);
        return { x: dx / len, y: dy / len };
      }

      for (const [dx, dy] of directions) {
        const nx = cx + dx;
        const ny = cy + dy;
        const key = `${nx},${ny}`;

        if (!visited.has(key)) {
          // Check if the tile is a wall
          const centerX = nx * tileSize + tileSize / 2;
          const centerY = ny * tileSize + tileSize / 2;

          const isWall = walls.getChildren().some((wall: any) =>
            Phaser.Geom.Rectangle.Contains(wall.getBounds(), centerX, centerY)
          );

          if (!isWall) {
            visited.add(key);
            queue.push([nx, ny, [...path, [nx, ny]]]);
          }
        }
      }
    }

    return { x: 0, y: 0 };
  }
}
