import { useReducer, useCallback, useRef } from 'react';

// ─── LAYER COLORS ───────────────────────────────────────────────────────────
export const LAYER_COLORS = {
  ground:  '#5a9a3a',
  wall:    '#9a5a3a',
  object:  '#3a6a9a',
  clutter: '#7a6a3a',
  spawn:   '#9a3a9a',
  decor:   '#3a8a8a',
};

// ─── INITIAL STATE ───────────────────────────────────────────────────────────
const DEFAULT_LAYERS = [
  { id: 'l_ground',  name: 'Ground',  type: 'ground',  visible: true, tiles: {} },
  { id: 'l_wall',    name: 'Wall',    type: 'wall',    visible: true, tiles: {} },
  { id: 'l_object',  name: 'Objects', type: 'object',  visible: true, tiles: {} },
  { id: 'l_clutter', name: 'Clutter', type: 'clutter', visible: true, tiles: {} },
];

const INITIAL_STATE = {
  // Map
  mapW: 20,
  mapH: 15,
  tileSize: 16,

  // Layers
  layers: DEFAULT_LAYERS,
  activeLayerId: 'l_ground',

  // Tilesets
  tilesets: [],     // [{ id, name, img }]
  activeTsIdx: -1,
  tsSel: null,      // { col, row, cols, rows }

  // Viewport
  zoom: 2,
  panX: 40,
  panY: 40,
  showGrid: true,

  // Tools
  activeTool: 'paint',

  // Selection
  selection: null,  // { x1, y1, x2, y2 }

  // Undo/redo (stored as snapshots of layer tiles)
  undoStack: [],
  redoStack: [],

  // Internal signal for canvas redraws
  _redrawSig: 0,
  _fitSig: 0,
  _toast: null,
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function uid() {
  return 'l_' + Math.random().toString(36).slice(2, 8);
}

function snapshotTiles(layers) {
  const s = {};
  layers.forEach(l => { s[l.id] = { ...l.tiles }; });
  return s;
}

function restoreSnapshot(layers, snap) {
  return layers.map(l => ({ ...l, tiles: snap[l.id] || {} }));
}

function pushUndo(state) {
  const stack = [...state.undoStack, snapshotTiles(state.layers)];
  if (stack.length > 80) stack.shift();
  return { undoStack: stack, redoStack: [] };
}

function inMap(tx, ty, mapW, mapH) {
  return tx >= 0 && ty >= 0 && tx < mapW && ty < mapH;
}

// ─── REDUCER ─────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {

    // Tools & viewport
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

    // Layers
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
        name: action.name || `Layer ${state.layers.length + 1}`,
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

    // Tilesets
    case 'ADD_TILESET': {
      const id = 'ts_' + Date.now();
      const ts = { id, name: action.name, img: action.img };
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

    // Painting
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
      const { tx, ty, sheetId, col, row } = action;
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

    case 'EYEDROP': {
      // Canvas handles the lookup and dispatches SET_TS_SELECTION
      return state;
    }

    // Selection
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

    // Undo / Redo
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
      const snap = state.redoStack[state.redoStack.length - 1];
      const redoStack = state.redoStack.slice(0, -1);
      const undoStack = [...state.undoStack, cur];
      const layers = restoreSnapshot(state.layers, snap);
      return { ...state, undoStack, redoStack, layers, _redrawSig: state._redrawSig + 1, _toast: 'Redo' };
    }

    // Save / Load
    case 'EXPORT': {
      const out = {
        meta: { w: state.mapW, h: state.mapH, tileSize: state.tileSize },
        tilesets: state.tilesets.map(s => ({ id: s.id, name: s.name })),
        layers: state.layers.map(l => ({
          id: l.id, name: l.name, type: l.type, visible: l.visible, tiles: l.tiles,
        })),
      };
      const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'room.json';
      a.click();
      try { window.EventBus?.emit('EDITOR_SAVE_REQUESTED', out); } catch (e) {}
      return { ...state, _toast: 'Exported room.json' };
    }

    case 'LOAD_MAP': {
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = '.json';
      inp.onchange = (e) => {
        const f = e.target.files[0]; if (!f) return;
        const r = new FileReader();
        r.onload = (ev) => {
          try {
            const d = JSON.parse(ev.target.result);
            // Dispatch a synchronous action with the parsed data
            window.__editorLoadData = d;
            window.dispatchEvent(new Event('editor-load-map'));
          } catch { alert('Failed to parse map file'); }
        };
        r.readAsText(f);
      };
      inp.click();
      return state;
    }

    case 'APPLY_LOADED_MAP': {
      const d = action.data;
      const layers = (d.layers || []).map(l => ({ ...l, tiles: l.tiles || {} }));
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
      const spawnLayer = state.layers.find(l => l.type === 'spawn');
      const hasPlayerSpawn = spawnLayer && Object.values(spawnLayer.tiles).some(t => t?.isPlayerSpawn);
      const tileCount = state.layers.reduce((acc, l) => acc + Object.keys(l.tiles).length, 0);
      const msg = tileCount === 0
        ? 'Map is empty!'
        : `Map OK — ${tileCount} tiles across ${state.layers.length} layers`;
      return { ...state, _toast: msg };
    }

    case 'CLEAR_TOAST':
      return { ...state, _toast: null };

    default:
      return state;
  }
}

// ─── HOOK ────────────────────────────────────────────────────────────────────
export function useEditorState() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  // Handle file load (bridge from file picker callback → reducer)
  useEffect(() => {
    const handler = () => {
      const d = window.__editorLoadData;
      if (d) {
        dispatch({ type: 'APPLY_LOADED_MAP', data: d });
        window.__editorLoadData = null;
      }
    };
    window.addEventListener('editor-load-map', handler);
    return () => window.removeEventListener('editor-load-map', handler);
  }, []);

  return { state, dispatch };
}
