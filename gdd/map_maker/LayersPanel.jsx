import React, { useState } from 'react';
import styles from './LayersPanel.module.css';

const LAYER_COLORS = {
  ground:  '#5a9a3a',
  wall:    '#9a5a3a',
  object:  '#3a6a9a',
  clutter: '#7a6a3a',
  spawn:   '#9a3a9a',
  decor:   '#3a8a8a',
};

const LAYER_TYPES = ['ground', 'wall', 'object', 'clutter', 'spawn', 'decor'];

const LayersPanel = ({
  layers, activeLayerId,
  mapW, mapH, tileSize, zoom,
  onSelectLayer, onToggleVisibility, onAddLayer, onDeleteLayer, onResize,
}) => {
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('ground');
  const [wVal, setWVal] = useState(mapW);
  const [hVal, setHVal] = useState(mapH);

  const handleAdd = () => {
    const name = newName.trim() || `Layer ${layers.length + 1}`;
    onAddLayer(name, newType);
    setNewName('');
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>Layers</span>
      </div>

      {/* Layer list — reversed so top layer renders on top of the list */}
      <div className={styles.list}>
        {[...layers].reverse().map((layer, i) => (
          <div
            key={layer.id}
            className={`${styles.row} ${layer.id === activeLayerId ? styles.active : ''}`}
            onClick={() => onSelectLayer(layer.id)}
          >
            <button
              className={`${styles.visBtn} ${layer.visible ? styles.visOn : styles.visOff}`}
              onClick={e => { e.stopPropagation(); onToggleVisibility(layer.id); }}
              title="Toggle visibility"
            >
              {layer.visible ? '●' : '○'}
            </button>

            <div
              className={styles.dot}
              style={{ background: LAYER_COLORS[layer.type] || '#555' }}
            />

            <span className={styles.name}>{layer.name}</span>
            <span className={styles.tag}>{layer.type}</span>

            <button
              className={styles.delBtn}
              onClick={e => { e.stopPropagation(); onDeleteLayer(layer.id); }}
              title="Delete layer"
            >×</button>
          </div>
        ))}
      </div>

      {/* Add layer */}
      <div className={styles.addBar}>
        <input
          className={styles.nameInp}
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="layer name…"
          maxLength={20}
        />
        <select
          className={styles.typeSelect}
          value={newType}
          onChange={e => setNewType(e.target.value)}
        >
          {LAYER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button className={styles.addBtn} onClick={handleAdd} title="Add layer">+</button>
      </div>

      {/* Map settings */}
      <div className={styles.mapInfo}>
        <div className={styles.infoRow}>
          <span>Width</span>
          <input
            className={styles.numInp}
            type="number" value={wVal} min={4} max={128}
            onChange={e => setWVal(parseInt(e.target.value) || mapW)}
          />
        </div>
        <div className={styles.infoRow}>
          <span>Height</span>
          <input
            className={styles.numInp}
            type="number" value={hVal} min={4} max={128}
            onChange={e => setHVal(parseInt(e.target.value) || mapH)}
          />
        </div>
        <div className={styles.infoRow}>
          <span>Tile px</span>
          <span className={styles.infoVal}>{tileSize}</span>
        </div>
        <div className={styles.infoRow}>
          <span>Zoom</span>
          <span className={styles.infoVal}>{Math.round(zoom * 100)}%</span>
        </div>
        <button
          className={styles.applyBtn}
          onClick={() => onResize(wVal, hVal)}
        >
          Apply size
        </button>
      </div>

      {/* Hotkey legend */}
      <div className={styles.hotkeys}>
        <div className={styles.hkRow}><kbd>B</kbd> Paint  <kbd>E</kbd> Erase  <kbd>F</kbd> Fill</div>
        <div className={styles.hkRow}><kbd>I</kbd> Pick  <kbd>S</kbd> Select</div>
        <div className={styles.hkRow}><kbd>Z</kbd> Undo  <kbd>Y</kbd> Redo</div>
        <div className={styles.hkRow}><kbd>G</kbd> Grid  <kbd>0</kbd> Fit  <kbd>1-9</kbd> Layer</div>
        <div className={styles.hkRow}><kbd>Alt+drag</kbd> or <kbd>MMB</kbd> Pan</div>
        <div className={styles.hkRow}><kbd>RMB</kbd> Erase  <kbd>Scroll</kbd> Zoom</div>
        <div className={styles.hkRow}><kbd>Del</kbd> Clear selection</div>
      </div>
    </div>
  );
};

export default LayersPanel;
