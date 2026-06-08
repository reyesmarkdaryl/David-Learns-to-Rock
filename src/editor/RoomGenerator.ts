/**
 * Simple seedable random number generator for reproducibility.
 */
class SeededRandom {
  private seed: number;
  constructor(seed: number) { this.seed = seed; }
  next() {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}

import { RoomData } from '../room/RoomData';
import { PreselectorGrid, TileRef } from './useEditorState';

export class RoomGenerator {
  private grid: ('floor' | 'wall')[][];
  private rng: SeededRandom;

  /**
   * Generates a room layout based on chosen type and preselector palettes.
   */
  generate(
    width: number,
    height: number,
    preselector: {
      floorA: PreselectorGrid;
      floorB: PreselectorGrid;
      wallA: PreselectorGrid;
      wallB: PreselectorGrid;
    },
    roomType: 'cave' | 'arena' | 'circle',
    seed?: number
  ): RoomData {
    this.rng = new SeededRandom(seed ?? Date.now());

    // 1. Shape Generation
    if (roomType === 'cave') {
      this.generateCave(width, height);
    } else if (roomType === 'arena') {
      this.generateArena(width, height);
    } else if (roomType === 'circle') {
      this.generateCircle(width, height);
    }

    // 2. Connectivity Guard
    // We identify the largest contiguous floor region and turn everything else into walls
    // This guarantees that the room is not split into disconnected islands.
    this.ensureConnectivity();

    // 3. Spawning
    const playerSpawn = this.findSafeSpawn(this.grid);

    // 4. Map to Tiles using Bitmasking and Preselector
    const tiles = this.assignTiles(preselector);

    return {
      id: 'gen_' + Date.now(),
      biome: 'default',
      width,
      height,
      tiles,
      doors: [],
      enemySpawns: [],
      playerSpawn: playerSpawn || { x: Math.floor(width / 2), y: Math.floor(height / 2) },
      decorSockets: [],
    };
  }

  private generateCave(width: number, height: number) {
    this.grid = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => (this.rng.next() < 0.45 ? 'wall' : 'floor'))
    );

    for (let x = 0; x < width; x++) { this.grid[0][x] = 'wall'; this.grid[height - 1][x] = 'wall'; }
    for (let y = 0; y < height; y++) { this.grid[y][0] = 'wall'; this.grid[y][width - 1] = 'wall'; }

    for (let i = 0; i < 5; i++) {
      this.grid = this.caStep(this.grid);
    }
  }

  private generateArena(width: number, height: number) {
    this.grid = Array.from({ length: height }, () => Array(width).fill('floor'));
    for (let x = 0; x < width; x++) { this.grid[0][x] = 'wall'; this.grid[height - 1][x] = 'wall'; }
    for (let y = 0; y < height; y++) { this.grid[y][0] = 'wall'; this.grid[y][width - 1] = 'wall'; }

    const pillars = 3 + Math.floor(this.rng.next() * 5);
    for (let i = 0; i < pillars; i++) {
      const px = 2 + Math.floor(this.rng.next() * (width - 4));
      const py = 2 + Math.floor(this.rng.next() * (height - 4));
      this.grid[py][px] = 'wall';
      if (this.rng.next() > 0.5) this.grid[py][px + 1] = 'wall';
      if (this.rng.next() > 0.5) this.grid[py + 1][px] = 'wall';
    }
  }

  private generateCircle(width: number, height: number) {
    this.grid = Array.from({ length: height }, () => Array(width).fill('wall'));
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2.5;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
        if (dist < radius) {
          this.grid[y][x] = 'floor';
        }
      }
    }
  }

  private caStep(oldGrid: ('floor' | 'wall')[][]): ('floor' | 'wall')[][] {
    const height = oldGrid.length;
    const width = oldGrid[0].length;
    const newGrid = Array.from({ length: height }, () => Array(width).fill('floor'));

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
          newGrid[y][x] = 'wall';
          continue;
        }
        const walls = this.countNeighborWalls(oldGrid, x, y);
        if (walls > 4) newGrid[y][x] = 'wall';
        else if (walls < 4) newGrid[y][x] = 'floor';
        else newGrid[y][x] = oldGrid[y][x];
      }
    }
    return newGrid;
  }

  private countNeighborWalls(grid: ('floor' | 'wall')[][], x: number, y: number): number {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= grid[0].length || ny < 0 || ny >= grid.length || grid[ny][nx] === 'wall') {
          count++;
        }
      }
    }
    return count;
  }

  private ensureConnectivity() {
    const height = this.grid.length;
    const width = this.grid[0].length;
    const visited = Array.from({ length: height }, () => Array(width).fill(false));
    const regions: any[] = [];

    // Find all contiguous floor regions
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (this.grid[y][x] === 'floor' && !visited[y][x]) {
          const region: { x: number, y: number }[] = [];
          const stack = [{ x, y }];
          visited[y][x] = true;

          while (stack.length) {
            const { x: cx, y: cy } = stack.pop()!;
            region.push({ x: cx, y: cy });
            for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
              const nx = cx + dx, ny = cy + dy;
              if (nx >= 0 && nx < width && ny >= 0 && ny < height && this.grid[ny][nx] === 'floor' && !visited[ny][nx]) {
                visited[ny][nx] = true;
                stack.push({ x: nx, y: ny });
              }
            }
          }
          regions.push(region);
        }
      }
    }

    if (regions.length <= 1) return;

    // Keep only the largest region, turn everything else into walls
    regions.sort((a, b) => b.length - a.length);
    const largest = regions[0];
    const largestSet = new Set(largest.map((p: { x: number, y: number }) => `${p.x},${p.y}`));

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (this.grid[y][x] === 'floor' && !largestSet.has(`${x},${y}`)) {
          this.grid[y][x] = 'wall';
        }
      }
    }
  }

  private assignTiles(preselector: { floorA: PreselectorGrid, floorB: PreselectorGrid, wallA: PreselectorGrid, wallB: PreselectorGrid }): any[] {
    const tiles: any[] = [];
    const height = this.grid.length;
    const width = this.grid[0].length;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const type = this.grid[y][x];

        if (type === 'floor') {
          const floorTile = this.getRandomTileFromGrid(preselector.floorA);
          if (floorTile) {
            tiles.push({ x, y, tileId: floorTile.sheetId, col: floorTile.col, row: floorTile.row, type: 'floor' });
          }
        } else {
          // SMART BITMASKING
          // N/S/E/W = true if that neighbour is floor (i.e. this wall tile borders floor in that direction)
          const N = (y > 0)          ? this.grid[y - 1][x] === 'floor' : false;
          const S = (y < height - 1) ? this.grid[y + 1][x] === 'floor' : false;
          const E = (x < width - 1)  ? this.grid[y][x + 1] === 'floor' : false;
          const W = (x > 0)          ? this.grid[y][x - 1] === 'floor' : false;

          // Palette layout (col, row):
          //
          //  (0,0) top-left-corner   | (1,0) north-flat x3      | (4,0) top-right-corner
          //  (0,1) west-flat         | (1,1) inner-TL  (2,1) inner-N  (3,1) inner-TR | (4,1) east-flat
          //  (0,2) west-flat         | (1,2) inner-W   (2,2) center   (3,2) inner-E  | (4,2) east-flat
          //  (0,3) west-flat         | (1,3) inner-BL  (2,3) inner-S  (3,3) inner-BR | (4,3) east-flat
          //  (0,4) bottom-left-corner| (1,4) south-flat x3      | (4,4) bottom-right-corner

          let slotCol = 2;
          let slotRow = 2;
          let foundMatch = false;

          // 1. Outer corners — wall sits at the outer corner of the floor region
          // A wall with floor to its North and West is visually the bottom-right corner tile, etc.
          if      (N && W && !S && !E) { slotCol = 0; slotRow = 0; foundMatch = true; } // Top-Left corner tile    (floor N, W)
          else if (N && E && !S && !W) { slotCol = 4; slotRow = 0; foundMatch = true; } // Top-Right corner tile   (floor N, E)
          else if (S && W && !N && !E) { slotCol = 0; slotRow = 4; foundMatch = true; } // Bottom-Left corner tile (floor S, W)
          else if (S && E && !N && !W) { slotCol = 4; slotRow = 4; foundMatch = true; } // Bottom-Right corner tile(floor S, E)

          // 2. Outer edges — wall borders floor on exactly one cardinal side
          else if (N && !S && !E && !W) { slotCol = 1; slotRow = 0; foundMatch = true; } // Top edge tile    (floor above)
          else if (S && !N && !E && !W) { slotCol = 1; slotRow = 4; foundMatch = true; } // Bottom edge tile (floor below)
          else if (W && !N && !S && !E) { slotCol = 0; slotRow = 1; foundMatch = true; } // Left edge tile   (floor to left)
          else if (E && !N && !S && !W) { slotCol = 4; slotRow = 1; foundMatch = true; } // Right edge tile  (floor to right)

          // 3. Inner corners — wall is surrounded by floor on three sides (concave notch)
          else if (S && E && W && !N)  { slotCol = 1; slotRow = 1; foundMatch = true; } // Inner Top-Left
          else if (S && W && E && !N)  { slotCol = 3; slotRow = 1; foundMatch = true; } // Inner Top-Right
          else if (N && E && W && !S)  { slotCol = 1; slotRow = 3; foundMatch = true; } // Inner Bottom-Left
          else if (N && S && E && !W)  { slotCol = 3; slotRow = 3; foundMatch = true; } // Inner Bottom-Right

          // 4. T-junctions / strips
          else if (E && W && !N && !S) { slotCol = 2; slotRow = 1; foundMatch = true; } // Inner North strip
          else if (N && S && !E && !W) { slotCol = 1; slotRow = 2; foundMatch = true; } // Inner West strip

          // 5. Fully surrounded by floor — center tile
          else if (N && S && E && W)   { slotCol = 2; slotRow = 2; foundMatch = true; } // Center

          if (!foundMatch) {
            // Inner wall cell (no floor neighbors): use the center tile of the palette
            slotCol = 2;
            slotRow = 2;
          }

          const wallTile = this.getTileFromGrid(preselector.wallA, slotCol, slotRow);
          if (wallTile) {
            tiles.push({ x, y, tileId: wallTile.sheetId, col: wallTile.col, row: wallTile.row, type: 'wall' });
          } else {
            const fallback = this.getRandomTileFromGrid(preselector.wallA);
            if (fallback) tiles.push({ x, y, tileId: fallback.sheetId, col: fallback.col, row: fallback.row, type: 'wall' });
          }
        }
      }
    }
    return tiles;
  }

  private getTileFromGrid(grid: PreselectorGrid, col: number, row: number): TileRef | null {
    return grid.tiles[`${col},${row}`] || null;
  }

  private getRandomTileFromGrid(grid: PreselectorGrid): TileRef | null {
    const keys = Object.keys(grid.tiles);
    if (keys.length === 0) return null;
    const randomKey = keys[Math.floor(this.rng.next() * keys.length)];
    return grid.tiles[randomKey];
  }

  private findSafeSpawn(grid: ('floor' | 'wall')[][]): { x: number, y: number } | null {
    const height = grid.length;
    const width = grid[0].length;
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (grid[y][x] === 'floor') return { x, y };
      }
    }
    return null;
  }
}