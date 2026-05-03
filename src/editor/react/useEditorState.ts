import { useReducer, useEffect } from 'react';
import { EventBus } from '../EventBus';
import { ValidationSystem, ValidationResult } from '../ValidationSystem';
import { RoomData } from '../room/RoomData';
import { RoomRegistry } from '../../room/RoomRegistry';
import { RoomStorage } from '../../room/RoomStorage';
import { RoomDataConverter } from '../RoomDataConverter';

export interface Layer {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  tiles: Record<string, TileRef>;
}

export interface TileRef {
  sheetId: string;
  col: number;
  row: number;
  isPlayerSpawn?: boolean;
  isEnemySpawn?: boolean;
  isDoor?: boolean;
}

export interface Tileset {
  id: string;
  name: string;
  img: HTMLImageElement;
  path: string;
}

export interface TileSelection {
  col: number;
  row: number;
  cols: number;
  rows: number;
}

export interface EditorState {
  mapW: number;
  mapH: number;
  tileSize: number;
  layers: Layer[];
  activeLayerId: string;
  tilesets: Tileset[];
  activeTsIdx: number;
  tsSel: TileSelection | null;
  zoom: number;
  panX: number;
  panY: number;
  showGrid: boolean;
  activeTool: string;
  selection: { x1: number, y1: number, x2: number, y2: number } | null;
  undoStack: any[];
  redoStack: any[];
  _redrawSig: number;
  _fitSig: number;
  _toast: string | null;
}

const DEFAULT_LAYERS: Layer[] = [
  { id: 'l_ground',  name: 'Ground',  type: 'ground',  visible: true, tiles: {} },
  { id: 'l_wall',    name: 'Wall',    type: 'wall',    visible: true, tiles: {} },
  { id: 'l_object',  name: 'Objects', type: 'object',  visible: true, tiles: {} },
  { id: 'l_clutter', name: 'Clutter', type: 'clutter', visible: true, tiles: {} },
];

const INITIAL_STATE: EditorState = {
  mapW: 20,
  mapH: 15,
  tileSize: 16,
  layers: DEFAULT_LAYERS,
  activeLayerId: 'l_ground',
  tilesets: [],
  activeTsIdx: -1,
  tsSel: null,
  zoom: 2,
  panX: 40,
  panY: 40,
  showGrid: true,
  activeTool: 'paint',
  selection: null,
  undoStack: [],
  redoStack: [],
  _redrawSig: 0,
  _fitSig: 0,
  _toast: null,
};

function uid() {
  return 'l_' + Math.random().toString(36).slice(2, 8);
}

function snapshotTiles(layers: Layer[]) {
  const s: Record<string, any> = {};
  layers.forEach(l => { s[l.id] = { ...l.tiles }; });
  return s;
}

function restoreSnapshot(layers: Layer[], snap: any) {
  return layers.map(l => ({ ...l, tiles: snap[l.id] || {} }));
}

function pushUndo(state: EditorState) {
  const stack = [...state.undoStack, snapshotTiles(state.layers)];
  if (stack.length > 80) stack.shift();
  return { undoStack: stack, redoStack: [] };
}

function inMap(tx: number, ty: number, mapW: number, mapH: number) {
  return tx >= 0 && ty >= 0 && tx < mapW && ty < mapH;
}

type EditorAction =
  | { type: 'SET_TOOL'; tool: string }
  | { type: 'TOGGLE_GRID' }
  | { type: 'FIT_VIEW' }
  | { type: 'ZOOM_IN' }
  | { type: 'ZOOM_OUT' }
  | { type: 'SET_PAN'; panX: number; panY: number }
  | { type: 'SET_ZOOM_PAN'; zoom: number; panX: number; panY: number }
  | { type: 'APPLY_FIT'; zoom: number; panX: number; panY: number }
  | { type: 'SET_ACTIVE_LAYER'; id: string }
  | { type: 'SET_ACTIVE_LAYER_BY_INDEX'; index: number }
  | { type: 'TOGGLE_LAYER_VISIBILITY'; id: string }
  | { type: 'ADD_LAYER'; name: string; type: string }
  | { type: 'DELETE_LAYER'; id: string }
  | { type: 'RESIZE_MAP'; w: number; h: number }
  | { type: 'ADD_TILESET'; img: HTMLImageElement; name: string; tileSize: number; path: string; id?: string }
  | { type: 'REMOVE_TILESET'; idx: number }
  | { type: 'SET_ACTIVE_TILESET'; idx: number }
  | { type: 'SET_TS_SELECTION'; sel: TileSelection }
  | { type: 'PAINT_TILE'; tx: number; ty: number; sheetId: string; col: number; row: number }
  | { type: 'PAINT_TILE_WITH_UNDO'; tx: number; ty: number; sheetId: string; col: number; row: number }
  | { type: 'ERASE_TILE'; tx: number; ty: number }
  | { type: 'ERASE_TILE_WITH_UNDO'; tx: number; ty: number }
  | { type: 'FLOOD_FILL'; tx: number; ty: number; sheetId: string; col: number; row: number }
  | { type: 'EYEDROP' }
  | { type: 'SET_SELECTION'; selection: any }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'DELETE_SELECTION' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'EXPORT' }
  | { type: 'SAVE_TO_STORAGE'; roomId: string }
  | { type: 'LOAD_MAP' }
  | { type: 'LOAD_FROM_STORAGE'; roomId: string }
  | { type: 'APPLY_LOADED_MAP'; data: any }
  | { type: 'VALIDATE' }
  | { type: 'CLEAR_TOAST' }
  | { type: 'PLACE_OBJECT'; tx: number; ty: number; objType: 'playerSpawn' | 'enemySpawn' | 'door' | 'decorSocket'; extra?: any }
  | { type: 'PLAYTEST' };

export function convertToRoomData(state: EditorState): RoomData {
  const roomData: RoomData = {
    id: 'temp_room',
    biome: 'default',
    width: state.mapW,
    height: state.mapH,
    tiles: [],
    doors: [],
    enemySpawns: [],
    playerSpawn: null,
    decorSockets: [],
  };

  state.layers.forEach(layer => {
    Object.entries(layer.tiles).forEach(([key, tile]) => {
      const [x, y] = key.split(',').map(Number);

      // Map layer type to TileData type
      let type: 'floor' | 'wall' = 'floor';
      if (layer.type === 'wall') type = 'wall';

      roomData.tiles.push({
        x, y,
        tileId: tile.sheetId,
        type,
      });

      // Handle Object metadata stored in tiles
      if (tile.isPlayerSpawn) roomData.playerSpawn = { x, y };
      if (tile.isEnemySpawn) roomData.enemySpawns.push({ x, y });
      if (tile.isDoor) {
        roomData.doors.push({ x, y, dir: 'north' }); // Default direction
      }
      if (tile.isDecorSocket) {
        roomData.decorSockets.push({ x, y, type: 'generic' });
      }
    });
  });

  return roomData;
}

function reducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SET_TOOL':
      return { ...state, activeTool: action.tool };
    case 'TOGGLE_GRID':
      return { ...state, showGrid: !state.showGrid, _redrawSig: state._redrawSig + 1 };
    case 'FIT_VIEW':
      return { ...state, _fitSig: state._fitSig + 1 };
    case 'ZOOM_IN':
      return { ...state, zoom: Math.min(8, state.zoom * 1.25), _redrawSig: state._redrawSig + 1 };
    case 'ZOOM_OUT':
      return { ...state, zoom: Math.max(0.25, state.zoom * 0.8), _redrawSig: state._redrawSig + 1 };
    case 'SET_PAN':
      return { ...state, panX: action.panX, panY: action.panY };
    case 'SET_ZOOM_PAN':
      return { ...state, zoom: action.zoom, panX: action.panX, panY: action.panY, _redrawSig: state._redrawSig + 1 };
    case 'APPLY_FIT':
      return { ...state, zoom: action.zoom, panX: action.panX, panY: action.panY, _redrawSig: state._redrawSig + 1 };
    case 'SET_ACTIVE_LAYER':
      return { ...state, activeLayerId: action.id };
    case 'SET_ACTIVE_LAYER_BY_INDEX': {
      const layer = state.layers[action.index];
      if (!layer) return state;
      return { ...state, activeLayerId: layer.id };
    }
    case 'TOGGLE_LAYER_VISIBILITY': {
      const layers = state.layers.map(l =>
        l.id === action.id ? { ...l, visible: !l.visible } : l
      );
      return { ...state, layers, _redrawSig: state._redrawSig + 1 };
    }
    case 'ADD_LAYER': {
      const newLayer = {
        id: uid(),
        name: action.layerName || `Layer ${state.layers.length + 1}`,
        type: action.layerType || 'ground',
        visible: true,
        tiles: {},
      };
      const layers = [...state.layers, newLayer];
      return { ...state, layers, activeLayerId: newLayer.id };
    }
    case 'DELETE_LAYER': {
      if (state.layers.length <= 1) return { ...state, _toast: 'Need at least one layer' };
      const layers = state.layers.filter(l => l.id !== action.id);
      const activeLayerId = state.activeLayerId === action.id ? layers[0].id : state.activeLayerId;
      return { ...state, layers, activeLayerId };
    }
    case 'RESIZE_MAP': {
      const mapW = Math.min(128, Math.max(4, action.w));
      const mapH = Math.min(128, Math.max(4, action.h));
      return { ...state, mapW, mapH, _fitSig: state._fitSig + 1 };
    }
    case 'ADD_TILESET': {
      const id = action.id || 'ts_' + Date.now();
      const ts = { id, name: action.name, img: action.img, path: action.path };
      const tilesets = [...state.tilesets, ts];
      const activeTsIdx = tilesets.length - 1;
      const tileSize = action.tileSize || state.tileSize;
      return { ...state, tilesets, activeTsIdx, tileSize, tsSel: null };
    }
    case 'REMOVE_TILESET': {
      const tilesets = state.tilesets.filter((_, i) => i !== action.idx);
      const activeTsIdx = Math.min(state.activeTsIdx, tilesets.length - 1);
      return { ...state, tilesets, activeTsIdx, tsSel: null };
    }
    case 'SET_ACTIVE_TILESET':
      return { ...state, activeTsIdx: action.idx, tsSel: null };
    case 'SET_TS_SELECTION':
      return { ...state, tsSel: action.sel };
    case 'PAINT_TILE': {
      const { tx, ty, sheetId, col, row } = action;
      if (!inMap(tx, ty, state.mapW, state.mapH)) return state;
      const sel = state.tsSel;
      if (!sel) return state;
      const layers = state.layers.map(l => {
        if (l.id !== state.activeLayerId) return l;
        const tiles = { ...l.tiles };
        for (let dr = 0; dr < sel.rows; dr++) {
          for (let dc = 0; dc < sel.cols; dc++) {
            const dtx = tx + dc, dty = ty + dr;
            if (!inMap(dtx, dty, state.mapW, state.mapH)) continue;
            tiles[`${dtx},${dty}`] = { sheetId, col: col + dc, row: row + dr };
          }
        }
        return { ...l, tiles };
      });
      return { ...state, layers, _redrawSig: state._redrawSig + 1 };
    }
    case 'PAINT_TILE_WITH_UNDO': {
      const undo = pushUndo(state);
      const next = reducer({ ...state, ...undo }, { ...action, type: 'PAINT_TILE' });
      return next;
    }
    case 'ERASE_TILE': {
      const { tx, ty } = action;
      if (!inMap(tx, ty, state.mapW, state.mapH)) return state;
      const layers = state.layers.map(l => {
        const tiles = { ...l.tiles };
        delete tiles[`${tx},${ty}`];
        return { ...l, tiles };
      });
      return { ...state, layers, _redrawSig: state._redrawSig + 1 };
    }
    case 'ERASE_TILE_WITH_UNDO': {
      const undo = pushUndo(state);
      const next = reducer({ ...state, ...undo }, { ...action, type: 'ERASE_TILE' });
      return next;
    }
    case 'FLOOD_FILL': {
      const { tx, ty, sheetId, col, row } = { ...action as any };
      if (!inMap(tx, ty, state.mapW, state.mapH)) return state;
      const layer = state.layers.find(l => l.id === state.activeLayerId);
      if (!layer) return state;
      const key = `${tx},${ty}`;
      const target = JSON.stringify(layer.tiles[key] || null);
      const incoming = JSON.stringify({ sheetId, col, row });
      if (target === incoming) return state;

      const undoData = pushUndo(state);
      const newTiles = { ...layer.tiles };
      const stack = [[tx, ty]];
      const visited = new Set();
      while (stack.length) {
        const [cx, cy] = stack.pop();
        if (!cx || !cy) continue;
        const ck = `${cx},${cy}`;
        if (visited.has(ck) || !inMap(cx, cy, state.mapW, state.mapH)) continue;
        if (JSON.stringify(newTiles[ck] || null) !== target) continue;
        visited.add(ck);
        newTiles[ck] = { sheetId, col, row };
        stack.push([cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1]);
      }
      const layers = state.layers.map(l =>
        l.id === state.activeLayerId ? { ...l, tiles: newTiles } : l
      );
      return { ...state, ...undoData, layers, _redrawSig: state._redrawSig + 1 };
    }
    case 'EYEDROP':
      return state;
    case 'SET_SELECTION':
      return { ...state, selection: action.selection, _redrawSig: state._redrawSig + 1 };
    case 'CLEAR_SELECTION':
      return { ...state, selection: null, _redrawSig: state._redrawSig + 1 };
    case 'DELETE_SELECTION': {
      if (!state.selection) return state;
      const { x1, y1, x2, y2 } = state.selection;
      const undo = pushUndo(state);
      const layers = state.layers.map(l => {
        const tiles = { ...l.tiles };
        for (let tx = x1; tx <= x2; tx++) {
          for (let ty = y1; ty <= y2; ty++) {
            delete tiles[`${tx},${ty}`];
          }
        }
        return { ...l, tiles };
      });
      return { ...state, ...undo, layers, selection: null, _redrawSig: state._redrawSig + 1 };
    }
    case 'UNDO': {
      if (!state.undoStack.length) return { ...state, _toast: 'Nothing to undo' };
      const cur = snapshotTiles(state.layers);
      const snap = state.undoStack[state.undoStack.length - 1];
      const undoStack = state.undoStack.slice(0, -1);
      const redoStack = [...state.redoStack, cur];
      const layers = restoreSnapshot(state.layers, snap);
      return { ...state, undoStack, redoStack, layers, _redrawSig: state._redrawSig + 1, _toast: 'Undo' };
    }
    case 'REDO': {
      if (!state.redoStack.length) return { ...state, _toast: 'Nothing to redo' };
      const cur = snapshotTiles(state.layers);
      const snap = state.undoStack[state.undoStack.length - 1];
      const undoStack = [...state.undoStack, cur];
      const redoStack = [...state.redoStack, snap];
      const layers = restoreSnapshot(state.layers, snap);
      return { ...state, undoStack, redoStack, layers, _redrawSig: state._redrawSig + 1, _toast: 'Redo' };
    }
    case 'EXPORT': {
      const out = {
        meta: { w: state.mapW, h: state.mapH, tileSize: state.tileSize },
        tilesets: state.tilesets.map(s => ({ id: s.id, name: s.name, path: s.path })),
        layers: state.layers.map(l => ({
          id: l.id, name: l.name, type: l.type, visible: l.visible, tiles: l.tiles,
        })),
      };
      const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'room.json';
      a.click();
      try { EventBus.emit('EDITOR_SAVE_REQUESTED', out); } catch (e) {}
      return { ...state, _toast: 'Exported room.json' };
    }
    case 'SAVE_TO_STORAGE': {
      const roomId = action.roomId || 'unnamed_room';
      const roomData = RoomDataConverter.convert(state, roomId);
      RoomStorage.saveRoom(roomData);
      return { ...state, _toast: `Saved as ${roomId}` };
    }
    case 'LOAD_MAP': {
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = '.json';
      inp.onchange = (e) => {
        const f = (e.target as HTMLInputElement).files[0]; if (!f) return;
        const r = new FileReader();
        r.onload = (ev) => {
          try {
            const d = JSON.parse((ev.target as FileReaderReadCallBackEvent).result as string);
            (window as any).__editorLoadData = d;
            window.dispatchEvent(new Event('editor-load-map'));
          } catch { alert('Failed to parse map file'); }
        };
        r.readAsText(f);
      };
      inp.click();
      return state;
    }
    case 'LOAD_FROM_STORAGE': {
      const roomData = RoomStorage.loadRoom(action.roomId);
      if (!roomData) return { ...state, _toast: 'Room not found' };

      const editorUpdates = RoomDataConverter.convertToEditorState(roomData);
      return { ...state, ...editorUpdates, _toast: `Loaded ${action.roomId}` };
    }
    case 'APPLY_LOADED_MAP': {
      const d = action.data;
      const layers = (d.layers || []).map((l: any) => ({ ...l, tiles: l.tiles || {} }));

      // We can't load images directly in the reducer, but we can return the tilesets
      // in the state and let a useEffect handle the actual Image loading,
      // or we can pass them through a separate process.
      // For now, we update the basic dimensions and layers.
      return {
        ...state,
        mapW: d.meta.w,
        mapH: d.meta.h,
        tileSize: d.meta.tileSize || 16,
        layers: layers.length ? layers : state.layers,
        activeLayerId: layers[0]?.id || state.activeLayerId,
        _fitSig: state._fitSig + 1,
        _toast: 'Map loaded',
      };
    }
    case 'VALIDATE': {
      const roomData = convertToRoomData(state);
      const result: ValidationResult = ValidationSystem.validate(roomData);
      if (!result.isValid) {
        return { ...state, _toast: `Invalid: ${result.errors[0]}` };
      }
      return { ...state, _toast: `Map OK — ${result.warnings.length} warnings` };
    }
    case 'CLEAR_TOAST':
      return { ...state, _toast: null };
    case 'PLAYTEST': {
      const roomData = convertToRoomData(state);
      RoomRegistry.setCurrentRoom(roomData);
      EventBus.emit('EDITOR_PLAYTEST_REQUESTED');
      return state;
    }
    case 'PLACE_OBJECT': {
      const { tx, ty, objType, extra } = action;
      if (!inMap(tx, ty, state.mapW, state.mapH)) return state;

      const layers = state.layers.map(l => {
        if (l.type !== 'object') return l;
        const tiles = { ...l.tiles };

        // Clear other objects at this position first
        Object.entries(tiles).forEach(([key, tile]) => {
          const [x, y] = key.split(',').map(Number);
          if (x === tx && y === ty) delete tiles[key];
        });

        const tileRef: TileRef = {
          sheetId: 'obj_sheet',
          col: 0, row: 0,
          isPlayerSpawn: objType === 'playerSpawn',
          isEnemySpawn: objType === 'enemySpawn',
          isDoor: objType === 'door',
          isDecorSocket: objType === 'decorSocket',
        };

        // If it's a player spawn, we must remove any other player spawn in the map
        if (objType === 'playerSpawn') {
          Object.keys(tiles).forEach(k => {
            const t = tiles[k];
            if (t && t.isPlayerSpawn) delete tiles[k];
          });
        }

        tiles[`${tx},${ty}`] = tileRef;
        return { ...l, tiles };
      });

      return { ...state, layers, _redrawSig: state._redrawSig + 1 };
    }
    default:
      return state;
  }
}

export function useEditorState() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  useEffect(() => {
    const handler = async () => {
      const d = (window as any).__editorLoadData;
      if (!d) return;

      // 1. Load required tilesets
      if (d.tilesets && Array.isArray(d.tilesets)) {
        for (const ts of d.tilesets) {
          try {
            const img = await new Promise<HTMLImageElement>((resolve, reject) => {
              const i = new Image();
              i.onload = () => resolve(i);
              i.onerror = reject;
              const path = ts.path || '';
              i.src = path.startsWith('/') ? path : `/${path}`;
            });
            dispatch({
              type: 'ADD_TILESET',
              img,
              name: ts.name,
              tileSize: d.meta?.tileSize || 16,
              path: ts.path,
              id: ts.id
            });
          } catch (e) {
            console.error(`Failed to load tileset ${ts.name}:`, e);
          }
        }
      }

      // 2. Apply map data
      dispatch({ type: 'APPLY_LOADED_MAP', data: d });
      (window as any).__editorLoadData = null;
    };
    window.addEventListener('editor-load-map', handler);
    return () => window.removeEventListener('editor-load-map', handler);
  }, [dispatch]);

  return { state, dispatch };
}
