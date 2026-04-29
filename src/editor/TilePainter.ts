import { TileData } from '../room/RoomData';

export type BrushType = 'floor' | 'wall' | 'eraser';

export class TilePainter {
  private tiles: Map<string, TileData> = new Map();
  private currentBrush: BrushType = 'floor';
  private currentTileId: string = 'default_floor';

  public setBrush(brush: BrushType) {
    this.currentBrush = brush;
  }

  public setTileId(id: string) {
    this.currentTileId = id;
  }

  public getBrush() {
    return this.currentBrush;
  }

  public paint(gridX: number, gridY: number) {
    const key = `${gridX},${gridY}`;

    if (this.currentBrush === 'eraser') {
      this.tiles.delete(key);
    } else {
      const tile: TileData = {
        x: gridX,
        y: gridY,
        tileId: this.currentTileId,
        type: this.currentBrush,
      };
      this.tiles.set(key, tile);
    }
  }

  public getTileAt(gridX: number, gridY: number): TileData | undefined {
    return this.tiles.get(`${gridX},${gridY}`);
  }

  public getAllTiles(): TileData[] {
    return Array.from(this.tiles.values());
  }

  public clear() {
    this.tiles.clear();
  }
}
