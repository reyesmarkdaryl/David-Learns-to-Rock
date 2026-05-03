import { RoomData, TileData, DoorData, SpawnData, DecorSocketData } from '../room/RoomData';
import { EditorState } from './react/useEditorState';

export class RoomDataConverter {
  /**
   * Converts the React Editor JSON format into the game's RoomData format.
   * This ensures that as the editor evolves, the game's building logic remains stable.
   */
  public static convert(editorState: EditorState, roomId: string = 'converted_room'): RoomData {
    const roomData: RoomData = {
      id: roomId,
      biome: 'default',
      width: editorState.mapW,
      height: editorState.mapH,
      tiles: [],
      doors: [],
      enemySpawns: [],
      playerSpawn: null,
      decorSockets: [],
    };

    editorState.layers.forEach(layer => {
      Object.entries(layer.tiles).forEach(([key, tile]) => {
        if (!tile) return;

        const [x, y] = key.split(',').map(Number);

        // Determine tile type based on layer type
        let type: 'floor' | 'wall' = 'floor';
        if (layer.type === 'wall') {
          type = 'wall';
        }

        roomData.tiles.push({
          x, y,
          tileId: tile.sheetId,
          type,
          col: tile.col || 0,
          row: tile.row || 0,
        });

        // Handle object flags
        if (tile.isPlayerSpawn) {
          roomData.playerSpawn = { x, y };
        }
        if (tile.isEnemySpawn) {
          roomData.enemySpawns.push({ x, y });
        }
        if (tile.isDoor) {
          roomData.doors.push({ x, y, dir: 'north' });
        }
        if (tile.isDecorSocket) {
          roomData.decorSockets.push({ x, y, type: 'generic' });
        }
      });
    });

    return roomData;
  }

  /**
   * Converts the raw JSON export from the editor into the game's RoomData format.
   */
  public static convertFromJson(json: any): RoomData {
    if (!json || !json.layers) {
      throw new Error('Invalid room JSON format');
    }

    const roomData: RoomData = {
      id: json.meta?.id || 'imported_room',
      biome: json.meta?.biome || 'default',
      width: json.meta?.w || 0,
      height: json.meta?.h || 0,
      tiles: [],
      doors: [],
      enemySpawns: [],
      playerSpawn: null,
      decorSockets: [],
    };

    json.layers.forEach((layer: any) => {
      Object.entries(layer.tiles).forEach(([key, tile]: [string, any]) => {
        if (!tile) return;

        const [x, y] = key.split(',').map(Number);
        let type: 'floor' | 'wall' = layer.type === 'wall' ? 'wall' : 'floor';

        roomData.tiles.push({
          x, y,
          tileId: tile.sheetId,
          type,
          col: tile.col || 0,
          row: tile.row || 0,
        });

        if (tile.isPlayerSpawn) roomData.playerSpawn = { x, y };
        if (tile.isEnemySpawn) roomData.enemySpawns.push({ x, y });
        if (tile.isDoor) roomData.doors.push({ x, y, dir: 'north' });
        if (tile.isDecorSocket) roomData.decorSockets.push({ x, y, type: 'generic' });
      });
    });

    return roomData;
  }

  /**
   * Converts RoomData (game format) back to EditorState (editor format).
   * This allows loading saved rooms back into the editor.
   */
  public static convertToEditorState(roomData: RoomData): Partial<EditorState> {
    const layers: any[] = [
      { id: 'l_ground', name: 'Ground', type: 'ground', visible: true, tiles: {} },
      { id: 'l_wall', name: 'Wall', type: 'wall', visible: true, tiles: {} },
      { id: 'l_object', name: 'Objects', type: 'object', visible: true, tiles: {} },
      { id: 'l_clutter', name: 'Clutter', type: 'clutter', visible: true, tiles: {} },
    ];

    roomData.tiles.forEach(tile => {
      const layer = layers.find(l => l.type === tile.type) || layers[0];
      layer.tiles[`${tile.x},${tile.y}`] = {
        sheetId: tile.tileId,
        col: 0, // Defaults to 0 as RoomData doesn't store specific col/row in tiles
        row: 0,
      };
    });

    if (roomData.playerSpawn) {
      const { x, y } = roomData.playerSpawn;
      const objLayer = layers.find(l => l.type === 'object');
      if (objLayer) {
        objLayer.tiles[`${x},${y}`] = { sheetId: 'obj_sheet', col: 0, row: 0, isPlayerSpawn: true };
      }
    }

    roomData.enemySpawns.forEach(spawn => {
      const { x, y } = spawn;
      const objLayer = layers.find(l => l.type === 'object');
      if (objLayer) {
        objLayer.tiles[`${x},${y}`] = { sheetId: 'obj_sheet', col: 0, row: 0, isEnemySpawn: true };
      }
    });

    roomData.doors.forEach(door => {
      const { x, y } = door;
      const objLayer = layers.find(l => l.type === 'object');
      if (objLayer) {
        objLayer.tiles[`${x},${y}`] = { sheetId: 'obj_sheet', col: 0, row: 0, isDoor: true };
      }
    });

    roomData.decorSockets.forEach(socket => {
      const { x, y } = socket;
      const objLayer = layers.find(l => l.type === 'object');
      if (objLayer) {
        objLayer.tiles[`${x},${y}`] = { sheetId: 'obj_sheet', col: 0, row: 0, isDecorSocket: true };
      }
    });

    return {
      mapW: roomData.width,
      mapH: roomData.height,
      layers,
    };
  }
}
