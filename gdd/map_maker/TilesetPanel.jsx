import React, { useRef, useEffect, useCallback, useState } from 'react';
import styles from './TilesetPanel.module.css';

const TilesetPanel = ({
  tilesets, activeTsIdx, tsSel, tileSize,
  activeLayerName,
  onSelectTs, onRemoveTs, onSelectTile, onImport,
}) => {
  const [tsZoom, setTsZoom] = useState(3);
  const imgCanvRef = useRef(null);
  const selCanvRef = useRef(null);
  const wrapRef = useRef(null);
  const dragging = useRef(false);
  const dragStart = useRef(null);

  const activeSheet = tilesets[activeTsIdx] || null;

  // ── Draw spritesheet + grid
  const drawSheet = useCallback(() => {
    const canv = imgCanvRef.current;
    if (!canv || !activeSheet?.img) return;
    const img = activeSheet.img;
    const z = tsZoom;
    const W = img.naturalWidth, H = img.naturalHeight;
    canv.width = W * z;
    canv.height = H * z;
    if (wrapRef.current) {
      wrapRef.current.style.width = W * z + 'px';
      wrapRef.current.style.height = H * z + 'px';
    }
    const ctx = canv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, W * z, H * z);
    // Grid lines
    const ts = tileSize * z;
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 0.5;
    for (let c = 0; c <= Math.floor(W / tileSize); c++) {
      ctx.beginPath(); ctx.moveTo(c * ts, 0); ctx.lineTo(c * ts, H * z); ctx.stroke();
    }
    for (let r = 0; r <= Math.floor(H / tileSize); r++) {
      ctx.beginPath(); ctx.moveTo(0, r * ts); ctx.lineTo(W * z, r * ts); ctx.stroke();
    }
  }, [activeSheet, tsZoom, tileSize]);

  // ── Draw selection overlay
  const drawSel = useCallback(() => {
    const canv = selCanvRef.current;
    if (!canv || !activeSheet?.img) return;
    const img = activeSheet.img;
    const z = tsZoom;
    canv.width = img.naturalWidth * z;
    canv.height = img.naturalHeight * z;
    const ctx = canv.getContext('2d');
    ctx.clearRect(0, 0, canv.width, canv.height);
    if (!tsSel) return;
    const ts = tileSize * z;
    const { col, row, cols, rows } = tsSel;
    ctx.fillStyle = 'rgba(90,171,245,0.18)';
    ctx.fillRect(col * ts, row * ts, cols * ts, rows * ts);
    ctx.strokeStyle = 'rgba(90,171,245,1)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(col * ts + 0.5, row * ts + 0.5, cols * ts - 1, rows * ts - 1);
  }, [activeSheet, tsZoom, tileSize, tsSel]);

  useEffect(() => { drawSheet(); drawSel(); }, [drawSheet, drawSel]);

  // ── Tile picking mouse events
  const getTileCoord = (e) => {
    const r = imgCanvRef.current.getBoundingClientRect();
    const ts = tileSize * tsZoom;
    return {
      col: Math.floor((e.clientX - r.left) / ts),
      row: Math.floor((e.clientY - r.top) / ts),
    };
  };

  const onTsMouseDown = (e) => {
    if (!activeSheet?.img) return;
    e.preventDefault();
    const img = activeSheet.img;
    const maxCols = Math.floor(img.naturalWidth / tileSize) - 1;
    const maxRows = Math.floor(img.naturalHeight / tileSize) - 1;
    const { col, row } = getTileCoord(e);
    if (col < 0 || row < 0 || col > maxCols || row > maxRows) return;
    dragging.current = true;
    dragStart.current = { col, row };
    onSelectTile({ col, row, cols: 1, rows: 1 });
  };

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current || !activeSheet?.img) return;
      const img = activeSheet.img;
      const maxCols = Math.floor(img.naturalWidth / tileSize) - 1;
      const maxRows = Math.floor(img.naturalHeight / tileSize) - 1;
      const ts = tileSize * tsZoom;
      const r = imgCanvRef.current?.getBoundingClientRect();
      if (!r) return;
      const col = Math.max(0, Math.min(maxCols, Math.floor((e.clientX - r.left) / ts)));
      const row = Math.max(0, Math.min(maxRows, Math.floor((e.clientY - r.top) / ts)));
      const c1 = Math.min(dragStart.current.col, col);
      const r1 = Math.min(dragStart.current.row, row);
      const c2 = Math.max(dragStart.current.col, col);
      const r2 = Math.max(dragStart.current.row, row);
      onSelectTile({ col: c1, row: r1, cols: c2 - c1 + 1, rows: r2 - r1 + 1 });
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [activeSheet, tileSize, tsZoom, onSelectTile]);

  // ── Preview tile
  const prevCanvRef = useRef(null);
  useEffect(() => {
    const canv = prevCanvRef.current;
    if (!canv) return;
    const ctx = canv.getContext('2d');
    ctx.clearRect(0, 0, 64, 64);
    if (!tsSel || !activeSheet?.img) return;
    ctx.imageSmoothingEnabled = false;
    const pw = Math.min(64, tsSel.cols * 16);
    const ph = Math.min(64, tsSel.rows * 16);
    ctx.drawImage(activeSheet.img,
      tsSel.col * tileSize, tsSel.row * tileSize,
      tsSel.cols * tileSize, tsSel.rows * tileSize,
      0, 0, pw, ph);
  }, [tsSel, activeSheet, tileSize]);

  const W = activeSheet?.img?.naturalWidth || 0;
  const H = activeSheet?.img?.naturalHeight || 0;
  const cols = Math.floor(W / tileSize);
  const rows = Math.floor(H / tileSize);

  return (
    <div className={styles.panel}>
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.headerTitle}>Tileset</span>

        {/* Tileset file tabs */}
        <div className={styles.tabs}>
          {tilesets.map((ts, i) => (
            <div
              key={ts.id}
              className={`${styles.tab} ${i === activeTsIdx ? styles.tabActive : ''}`}
              onClick={() => onSelectTs(i)}
            >
              <span>{ts.name.length > 16 ? ts.name.slice(0, 15) + '…' : ts.name}</span>
              <span
                className={styles.tabDel}
                onClick={e => { e.stopPropagation(); onRemoveTs(i); }}
              >×</span>
            </div>
          ))}
          <button className={styles.importBtn} onClick={onImport}>+ Import</button>
        </div>

        {/* Zoom */}
        <div className={styles.zoomRow}>
          <label className={styles.zoomLabel}>Zoom</label>
          <input
            type="range" min="1" max="6" step="1" value={tsZoom}
            onChange={e => setTsZoom(parseInt(e.target.value))}
            className={styles.zoomSlider}
          />
          <span className={styles.zoomVal}>{tsZoom}×</span>
        </div>
      </div>

      {/* Body */}
      <div className={styles.body}>
        {/* Scrollable sheet */}
        <div className={styles.scroll}>
          {activeSheet ? (
            <div ref={wrapRef} className={styles.canvasWrap}>
              <canvas
                ref={imgCanvRef}
                className={styles.imgCanv}
                onMouseDown={onTsMouseDown}
              />
              <canvas
                ref={selCanvRef}
                className={styles.selCanv}
                style={{ pointerEvents: 'none' }}
              />
            </div>
          ) : (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>⬆</div>
              <span>Import a tileset PNG</span>
            </div>
          )}
        </div>

        {/* Info sidebar */}
        <div className={styles.info}>
          <canvas ref={prevCanvRef} width="64" height="64" className={styles.preview} />
          <div className={styles.infoRow}><span>File</span><span>{activeSheet?.name?.split('/').pop() || '—'}</span></div>
          <div className={styles.infoRow}><span>Tile px</span><span>{activeSheet ? `${tileSize}×${tileSize}` : '—'}</span></div>
          <div className={styles.infoRow}><span>Cols×Rows</span><span>{activeSheet ? `${cols}×${rows}` : '—'}</span></div>
          <div className={styles.infoRow}><span>Selected</span><span>{tsSel ? `${tsSel.cols}×${tsSel.rows}` : 'none'}</span></div>
          <div className={styles.infoRow}><span>Layer</span><span>{activeLayerName}</span></div>
        </div>
      </div>
    </div>
  );
};

export default TilesetPanel;
