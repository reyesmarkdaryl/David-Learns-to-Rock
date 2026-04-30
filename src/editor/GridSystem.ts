import * as Phaser from 'phaser';

export const TILE_SIZE = 64;

export class GridSystem {
  public static worldToGrid(x: number, y: number) {
    return {
      x: Math.floor(x / TILE_SIZE),
      y: Math.floor(y / TILE_SIZE),
    };
  }

  public static gridToWorld(tx: number, ty: number) {
    return {
      x: tx * TILE_SIZE,
      y: ty * TILE_SIZE,
    };
  }

  public static snap(x: number, y: number) {
    const grid = this.worldToGrid(x, y);
    return this.gridToWorld(grid.x, grid.y);
  }

  public static drawGrid(scene: Phaser.Scene, width: number, height: number) {
    const graphics = scene.add.graphics();
    graphics.lineStyle(1, 0x444444, 1);

    // Vertical lines
    for (let x = 0; x <= width; x += TILE_SIZE) {
      graphics.lineBetween(x, 0, x, height);
    }

    // Horizontal lines
    for (let y = 0; y <= height; y += TILE_SIZE) {
      graphics.lineBetween(0, y, width, y);
    }
  }
}
