import React, { useState, useRef } from 'react';
import styles from './ImportModal.module.css';

const ImportModal = ({ onConfirm, onCancel }) => {
  const [pendingImg, setPendingImg] = useState(null);
  const [pendingName, setPendingName] = useState('');
  const [tileSize, setTileSize] = useState(16);
  const [pathVal, setPathVal] = useState('');
  const [hint, setHint] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileInpRef = useRef(null);

  const loadFromFile = (file) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      setPendingImg(img);
      setPendingName(file.name);
      setHint('✓ Image ready — ' + img.naturalWidth + '×' + img.naturalHeight + 'px');
    };
    img.onerror = () => setHint('✗ Could not read image');
    img.src = url;
  };

  const loadFromPath = () => {
    if (!pathVal.trim()) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setPendingImg(img);
      setPendingName(pathVal.split('/').pop());
      setHint('✓ Loaded — ' + img.naturalWidth + '×' + img.naturalHeight + 'px');
    };
    img.onerror = () => setHint('✗ Could not load (check path or CORS)');
    img.src = pathVal.trim();
  };

  const handleConfirm = () => {
    if (!pendingImg) { setHint('Drop or load an image first'); return; }
    onConfirm(pendingImg, pendingName, tileSize);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) loadFromFile(f);
  };

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className={styles.modal}>
        <div className={styles.title}>Import Tileset</div>
        <div className={styles.sub}>
          PNG from your <code className={styles.code}>public/assets/tilemaps/</code> folder
        </div>

        {/* Drop zone */}
        <div
          className={`${styles.dropZone} ${dragging ? styles.dragOver : ''}`}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInpRef.current?.click()}
        >
          <input
            ref={fileInpRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files[0]; if (f) loadFromFile(f); }}
          />
          <div className={styles.dropIcon}>⬆</div>
          <div>Drop image here or <u>browse</u></div>
          <div className={styles.dropSub}>PNG, JPG, GIF</div>
        </div>

        {/* Path input */}
        <div className={styles.pathRow}>
          <input
            className={styles.pathInp}
            value={pathVal}
            onChange={e => setPathVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && loadFromPath()}
            placeholder="public/assets/tilemaps/map/walls.png"
          />
          <button className={styles.pathBtn} onClick={loadFromPath}>Load</button>
        </div>

        {hint && <div className={styles.hint}>{hint}</div>}

        {/* Tile size */}
        <div className={styles.tsRow}>
          <label className={styles.tsLabel}>Tile size (px)</label>
          <input
            className={styles.tsInp}
            type="number"
            value={tileSize}
            min={4} max={128} step={1}
            onChange={e => setTileSize(parseInt(e.target.value) || 16)}
          />
          <span className={styles.tsSub}>Common: 16, 32, 48</span>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
          <button className={styles.confirmBtn} onClick={handleConfirm}>Add Tileset</button>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
