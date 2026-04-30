import React from 'react';
import styles from './Toolbar.module.css';

const TOOLS = [
  { id: 'paint',   label: 'Paint',  hk: 'B', icon: '✏' },
  { id: 'eraser',  label: 'Erase',  hk: 'E', icon: '◻' },
  { id: 'fill',    label: 'Fill',   hk: 'F', icon: '▨' },
  { id: 'select',  label: 'Select', hk: 'S', icon: '▣' },
  { id: 'eyedrop', label: 'Pick',   hk: 'I', icon: '✦' },
];

const Toolbar = ({
  activeTool, showGrid,
  onTool, onToggleGrid, onFit,
  onUndo, onRedo,
  onImport, onExport, onLoadMap,
}) => (
  <div className={styles.bar}>
    {/* Import tileset */}
    <div className={styles.group}>
      <button className={styles.btn} onClick={onImport}>
        <span className={styles.icon}>⬆</span> Import Tileset
      </button>
    </div>

    {/* Tools */}
    <div className={styles.group}>
      {TOOLS.map(t => (
        <button
          key={t.id}
          className={`${styles.btn} ${activeTool === t.id ? styles.active : ''}`}
          onClick={() => onTool(t.id)}
          title={`${t.label} [${t.hk}]`}
        >
          <span className={styles.icon}>{t.icon}</span>
          {t.label}
          <span className={styles.hk}>{t.hk}</span>
        </button>
      ))}
    </div>

    {/* View */}
    <div className={styles.group}>
      <button
        className={`${styles.btn} ${showGrid ? styles.active : ''}`}
        onClick={onToggleGrid}
        title="Toggle grid [G]"
      >
        <span className={styles.icon}>⊞</span> Grid <span className={styles.hk}>G</span>
      </button>
      <button className={styles.btn} onClick={onFit} title="Fit view [0]">
        <span className={styles.icon}>⊡</span> Fit <span className={styles.hk}>0</span>
      </button>
    </div>

    {/* Edit */}
    <div className={styles.group}>
      <button className={styles.btn} onClick={onUndo} title="Undo [Z]">
        <span className={styles.icon}>↩</span> Undo <span className={styles.hk}>Z</span>
      </button>
      <button className={styles.btn} onClick={onRedo} title="Redo [Y]">
        <span className={styles.icon}>↪</span> Redo <span className={styles.hk}>Y</span>
      </button>
    </div>

    {/* File */}
    <div className={`${styles.group} ${styles.groupRight}`}>
      <button className={`${styles.btn} ${styles.saveBtn}`} onClick={onExport} title="Export map [Ctrl+S]">
        <span className={styles.icon}>⬇</span> Export <span className={styles.hk}>^S</span>
      </button>
      <button className={styles.btn} onClick={onLoadMap} title="Load map file">
        <span className={styles.icon}>⬆</span> Import Map
      </button>
    </div>
  </div>
);

export default Toolbar;
