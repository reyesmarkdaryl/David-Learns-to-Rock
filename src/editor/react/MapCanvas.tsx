import React, { useEffect, useRef, useCallback } from 'react';
import styles from './MapCanvas.module.css';

interface MapCanvasProps {
  state: any;
  dispatch: React.Dispatch<any>;
}

const MapCanvas: React.FC<MapCanvasProps> = ({ state, dispatch }) => {
  const areaRef = useRef<HTMLDivElement>(null);
  const mapCanvRef = useRef<HTMLCanvasElement>(null);
  const gridCanvRef = useRef<HTMLCanvasElement>(null);
  const curCanvRef = useRef<HTMLCanvasElement>(null);

  const isPainting = useRef(false);
  const lastCell = useRef<{ tx: number, ty: number } | null>(null);
  const selStart = useRef<{ tx: number, ty: number } | null>(null);
  const panDrag = useRef(false);
  const panStart = useRef<{ x: number, y: number } | null>(null);
  const panOrigin = useRef<{ x: number, y: number } | null>(null);
  const undoPushed = useRef(false);

  const tw2s = useCallback((tx: number, ty: number) => ({
    x: state.panX + tx * state.tileSize * state.zoom,
    y: state.panY + ty * state.tileSize * state.zoom,
  }), [state.panX, state.panY, state.tileSize, state.zoom]);

  const ts2w = useCallback((sx: number, sy: number) => ({
    tx: Math.floor((sx - state.panX) / (state.tileSize * state.zoom)),
    ty: Math.floor((sy - state.panY) / (state.tileSize * state.zoom)),
  }), [state.panX, state.panY, state.tileSize, state.zoom]);

  const inMap = useCallback((tx: number, ty: number) =>
    tx >= 0 && ty >= 0 && tx < state.mapW && ty < state.mapH,
    [state.mapW, state.mapH]);

  const resizeCanvases = useCallback(() => {
    const el = areaRef.current;
    if (!el) return;
    const w = el.clientWidth, h = el.clientHeight;
    [mapCanvRef, gridCanvRef, curCanvRef].forEach(r => {
      if (r.current) { r.current.width = w; r.current.height = h; }
    });
  }, []);

  useEffect(() => {
    const ro = new ResizeObserver(() => { resizeCanvases(); drawAll(); });
    if (areaRef.current) ro.observe(areaRef.current);
    return () => ro.disconnect();
  }, []);

  const drawMap = useCallback(() => {
    const canv = mapCanvRef.current; if (!canv) return;
    const ctx = canv.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canv.width, canv.height);
    const ts = state.tileSize, z = state.zoom;

    state.layers.forEach((layer: any) => {
      if (!layer.visible) return;
      Object.entries(layer.tiles).forEach(([key, tileRef]: [string, any]) => {
        if (!tileRef) return;
        const [tx, ty] = key.split(',').map(Number);
        const { x, y } = tw2s(tx, ty);
        const sheet = state.tilesets.find((s: any) => s.id === tileRef.sheetId);
        if (!sheet?.img) return;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(sheet.img, tileRef.col * ts, tileRef.row * ts, ts, ts, x, y, ts * z, ts * z);
      });
    });

    if (state.selection) {
      const { x1, y1, x2, y2 } = state.selection;
      const { x, y } = tw2s(x1, y1);
      const w = (x2 - x1 + 1) * ts * z, h = (y2 - y1 + 1) * ts * z;
      ctx.strokeStyle = 'rgba(90,171,245,0.9)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 3]);
      ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = 'rgba(90,171,245,0.07)';
      ctx.fillRect(x, y, w, h);
      ctx.setLineDash([]);
    }
  }, [state.layers, state.tilesets, state.tileSize, state.zoom, state.selection, tw2s]);

  const drawGrid = useCallback(() => {
    const canv = gridCanvRef.current; if (!canv) return;
    const ctx = canv.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canv.width, canv.height);
    if (!state.showGrid) return;
    const ts = state.tileSize * state.zoom;

    ctx.strokeStyle = 'rgba(255,255,255,0.045)';
    ctx.lineWidth = 0.5;
    for (let tx = 0; tx <= state.mapW; tx++) {
      const { x } = tw2s(tx, 0);
      ctx.beginPath(); ctx.moveTo(x, state.panY); ctx.lineTo(x, state.panY + state.mapH * ts); ctx.stroke();
    }
    for (let ty = 0; ty <= state.mapH; ty++) {
      const { y } = tw2s(0, ty);
      ctx.beginPath(); ctx.moveTo(state.panX, y); ctx.lineTo(state.panX + state.mapW * ts, y); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1;
    const a = tw2s(0, 0), b = tw2s(state.mapW, state.mapH);
    ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
  }, [state.showGrid, state.tileSize, state.zoom, state.mapW, state.mapH, state.panX, state.panY, tw2s]);

  const drawCursor = useCallback((tx: number | null, ty: number | null) => {
    const canv = curCanvRef.current; if (!canv) return;
    const ctx = canv.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canv.width, canv.height);
    if (tx === null || !inMap(tx, ty)) return;
    const ts = state.tileSize * state.zoom;
    const { x, y } = tw2s(tx, ty);

    if (state.activeTool === 'select' && selStart.current) {
      const x1 = Math.min(selStart.current.tx, tx), y1 = Math.min(selStart.current.ty, ty);
      const x2 = Math.max(selStart.current.tx, tx), y2 = Math.max(selStart.current.ty, ty);
      const { x: sx, y: sy } = tw2s(x1, y1);
      ctx.strokeStyle = 'rgba(90,171,245,0.8)';
      ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
      ctx.strokeRect(sx, sy, (x2 - x1 + 1) * ts, (y2 - y1 + 1) * ts);
      ctx.setLineDash([]);
      return;
    }

    const sel = state.tsSel;
    if (state.activeTool === 'paint' && sel) {
      const sheet = state.tilesets[state.activeTsIdx];
      if (sheet?.img) {
        ctx.globalAlpha = 0.65;
        ctx.imageSmoothingEnabled = false;
        for (let dr = 0; dr < sel.rows; dr++) {
          for (let dc = 0; dc < sel.cols; dc++) {
            const dtx = tx + dc, dty = ty + dr;
            if (!inMap(dtx, dty)) continue;
            const { x: dx, y: dy } = tw2s(dtx, dty);
            ctx.drawImage(sheet.img,
              (sel.col + dc) * state.tileSize, (sel.row + dr) * state.tileSize,
              state.tileSize, state.tileSize,
              dx, dy, ts, ts);
          }
        }
        ctx.globalAlpha = 1;
      }
      ctx.strokeStyle = 'rgba(90,171,245,0.9)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 0.5, y + 0.5, ts * sel.cols - 1, ts * sel.rows - 1);
      return;
    }

    ctx.strokeStyle = state.activeTool === 'eraser'
      ? 'rgba(245,90,90,0.9)'
      : 'rgba(90,171,245,0.9)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 0.5, y + 0.5, ts - 0.5, ts - 0.5);
  }, [state.activeTool, state.tsSel, state.tilesets, state.activeTsIdx, state.tileSize, state.zoom, inMap, tw2s]);

  const drawAll = useCallback(() => { drawMap(); drawGrid(); }, [drawMap, drawGrid]);

  useEffect(() => { drawAll(); }, [state._redrawSig, drawAll]);
  useEffect(() => { drawGrid(); }, [drawGrid]);
  useEffect(() => { drawMap(); }, [drawMap]);

  useEffect(() => {
    if (!areaRef.current || state._fitSig === 0) return;
    const el = areaRef.current;
    const w = el.clientWidth, h = el.clientHeight;
    const zx = (w - 60) / (state.mapW * state.tileSize);
    const zy = (h - 60) / (state.mapH * state.tileSize);
    const zoom = Math.min(zx, zy, 8);
    const panX = Math.round((w - state.mapW * state.tileSize * zoom) / 2);
    const panY = Math.round((h - state.mapW * state.tileSize * zoom) / 2);
    dispatch({ type: 'APPLY_FIT', zoom, panX, panY });
  }, [state._fitSig]);

  const doPaint = useCallback((tx: number, ty: number) => {
    const sel = state.tsSel;
    const sheet = state.tilesets[state.activeTsIdx];
    if (!sel || !sheet) return;
    dispatch({
      type: 'PAINT_TILE',
      tx, ty,
      sheetId: sheet.id,
      col: sel.col,
      row: sel.row,
    });
  }, [state.tsSel, state.tilesets, state.activeTsIdx, dispatch]);

  const doErase = useCallback((tx: number, ty: number) => {
    dispatch({ type: 'ERASE_TILE', tx, ty });
  }, [dispatch]);

  const doFloodFill = useCallback((tx: number, ty: number) => {
    const sel = state.tsSel;
    const sheet = state.tilesets[state.activeTsIdx];
    if (!sel || !sheet) return;
    dispatch({ type: 'FLOOD_FILL', tx, ty, sheetId: sheet.id, col: sel.col, row: sel.row });
  }, [state.tsSel, state.tilesets, state.activeTsIdx, dispatch]);

  const doEyedrop = useCallback((tx: number, ty: number) => {
    if (!inMap(tx, ty)) return;
    const key = `${tx},${ty}`;
    for (let i = state.layers.length - 1; i >= 0; i--) {
      const tile = state.layers[i].tiles[key];
      if (tile && state.layers[i].visible) {
        const tsIdx = state.tilesets.findIndex((s: any) => s.id === tile.sheetId);
        if (tsIdx >= 0) {
          dispatch({ type: 'SET_ACTIVE_TILESET', idx: tsIdx });
          dispatch({ type: 'SET_TS_SELECTION', sel: { col: tile.col, row: tile.row, cols: 1, rows: 1 } });
          dispatch({ type: 'SET_TOOL', tool: 'paint' });
          return;
        }
      }
    }
  }, [state.layers, state.tilesets, inMap, dispatch]);

  const getCanvasPos = (e: React.MouseEvent) => {
    const r = areaRef.current?.getBoundingClientRect();
    if (!r) return { sx: 0, sy: 0 };
    return { sx: e.clientX - r.left, sy: e.clientY - r.top };
  };

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      panDrag.current = true;
      panStart.current = { x: e.clientX, y: e.clientY };
      panOrigin.current = { x: state.panX, y: state.panY };
      areaRef.current!.style.cursor = 'grabbing';
      return;
    }
    const { sx, sy } = getCanvasPos(e);
    const { tx, ty } = ts2w(sx, sy);

    if (e.button === 2) {
      if (inMap(tx, ty)) {
        dispatch({ type: 'ERASE_TILE_WITH_UNDO', tx, ty });
      }
      return;
    }

    if (e.button === 0) {
      if (state.activeTool === 'fill') { doFloodFill(tx, ty); return; }
      if (state.activeTool === 'eyedrop') { doEyedrop(tx, ty); return; }
      if (state.activeTool === 'select') {
        selStart.current = { tx, ty };
        dispatch({ type: 'CLEAR_SELECTION' });
        isPainting.current = true;
        return;
      }
      if (state.activeTool === 'paint' || state.activeTool === 'eraser') {
        if (!inMap(tx, ty)) return;
        undoPushed.current = false;
        isPainting.current = true;
        lastCell.current = null;
        if (state.activeTool === 'paint') {
          dispatch({ type: 'PAINT_TILE_WITH_UNDO', tx, ty, sheetId: state.tilesets[state.activeTsIdx]?.id, col: state.tsSel?.col, row: state.tsSel?.row });
          undoPushed.current = true;
        } else {
          dispatch({ type: 'ERASE_TILE_WITH_UNDO', tx, ty });
          undoPushed.current = true;
        }
        lastCell.current = { tx, ty };
      }
    }
  }, [state, ts2w, inMap, dispatch, doFloodFill, doEyedrop]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (panDrag.current) {
      const dx = e.clientX - panStart.current!.x;
      const dy = e.clientY - panStart.current!.y;
      dispatch({ type: 'SET_PAN', panX: panOrigin.current!.x + dx, panY: panOrigin.current!.y + dy });
      return;
    }
    const { sx, sy } = getCanvasPos(e);
    const { tx, ty } = ts2w(sx, sy);
    const coords = document.getElementById('map-coords');
    if (coords) coords.textContent = inMap(tx, ty) ? `${tx}, ${ty}` : '–';
    drawCursor(tx, ty);

    if (!isPainting.current) return;
    if (state.activeTool === 'select' && selStart.current) { drawCursor(tx, ty); return; }
    if (!inMap(tx, ty)) return;
    if (lastCell.current?.tx === tx && lastCell.current?.ty === ty) return;
    if (state.activeTool === 'paint') doPaint(tx, ty);
    else if (state.activeTool === 'eraser') doErase(tx, ty);
    lastCell.current = { tx, ty };
  }, [state, ts2w, inMap, drawCursor, doPaint, doErase, dispatch]);

  const onMouseUp = useCallback((e: React.MouseEvent) => {
    if (panDrag.current) {
      panDrag.current = false;
      if (areaRef.current) areaRef.current.style.cursor = '';
      return;
    }
    if (isPainting.current && state.activeTool === 'select' && selStart.current) {
      const { sx, sy } = getCanvasPos(e);
      const { tx, ty } = ts2w(sx, sy);
      const x1 = Math.max(0, Math.min(selStart.current.tx, tx));
      const y1 = Math.max(0, Math.min(selStart.current.ty, ty));
      const x2 = Math.min(state.mapW - 1, Math.max(selStart.current.tx, tx));
      const y2 = Math.min(state.mapH - 1, Math.max(selStart.current.ty, ty));
      dispatch({ type: 'SET_SELECTION', selection: { x1, y1, x2, y2 } });
      selStart.current = null;
    }
    isPainting.current = false;
    lastCell.current = null;
    undoPushed.current = false;
  }, [state, ts2w, dispatch]);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const { sx, sy } = getCanvasPos(e);
    const old = state.zoom;
    const zoom = Math.max(0.25, Math.min(8, state.zoom * (e.deltaY < 0 ? 1.12 : 0.89)));
    const panX = sx - (sx - state.panX) * (zoom / old);
    const panY = sy - (sy - state.panY) * (zoom / old);
    dispatch({ type: 'SET_ZOOM_PAN', zoom, panX, panY });
  }, [state.zoom, state.panX, state.panY, dispatch]);

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  useEffect(() => {
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    return () => {
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [onMouseUp, onMouseMove]);

  const hasContent = state.tilesets.length > 0;

  return (
    <div
      ref={areaRef}
      className={styles.area}
      onMouseDown={onMouseDown}
      onContextMenu={e => e.preventDefault()}
    >
      <canvas ref={mapCanvRef} className={styles.canvas} />
      <canvas ref={gridCanvRef} className={styles.canvas} style={{ pointerEvents: 'none' }} />
      <canvas ref={curCanvRef} className={styles.canvas} style={{ pointerEvents: 'none' }} />

      {!hasContent && (
        <div className={styles.emptyMsg}>
          <div className={styles.emptyBig}>Import a tileset to begin</div>
          <div className={styles.emptySub}>Click "Import Tileset" in the top bar</div>
        </div>
      )}

      <div id="map-coords" className={styles.coords}>–</div>
    </div>
  );
};

export default MapCanvas;
