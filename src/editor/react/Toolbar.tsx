import React from 'react';
import styles from './Toolbar.module.css';

interface Tool {
  id: string;
  label: string;
  hk: string;
  icon: string;
}

const TOOLS: Tool[] = [
  { id: 'paint',   label: 'Paint',  hk: 'B', icon: '✏' },
  { id: 'eraser',  label: 'Erase',  hk: 'E', icon: '◻' },
  { id: 'fill',    label: 'Fill',   hk: 'F', icon: '▨' },
  { id: 'select',  label: 'Select', hk: 'S', icon: '▣' },
  { id: 'eyedrop', label: 'Pick',   hk: 'I', icon: '✦' },
];

interface ToolbarProps {
  activeTool: string;
  showGrid: boolean;
  showBorders: boolean;
  onTool: (tool: string) => void;
  onToggleGrid: () => void;
  onToggleBorders: () => void;
  onFit: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onImport: () => void;
  onExport: () => void;
  onSaveStorage: () => void;
  onLoadMap: () => void;
  onLoadStorage: () => void;
  onPlaytest: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  activeTool, showGrid, showBorders,
  onTool, onToggleGrid, onToggleBorders, onFit,
  onUndo, onRedo,
  onImport, onExport, onSaveStorage, onLoadMap, onLoadStorage, onPlaytest,
}) => (
  <div className={styles.bar}>
    <div className={styles.group}>
      <button className={styles.btn} onClick={onImport}>
        <span className={styles.icon}>⬆</span> Import Tileset
      </button>
    </div>

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
      <button
        className={`${styles.btn} ${showBorders ? styles.active : ''}`}
        onClick={onToggleBorders}
        title="Toggle borders"
      >
        <span className={styles.icon}>▢</span> Borders
      </button>
    </div>

    <div className={styles.group}>
      <button className={styles.btn} onClick={onUndo} title="Undo [Z]">
        <span className={styles.icon}>↩</span> Undo <span className={styles.hk}>Z</span>
      </button>
      <button className={styles.btn} onClick={onRedo} title="Redo [Y]">
        <span className={styles.icon}>↪</span> Redo <span className={styles.hk}>Y</span>
      </button>
    </div>

    <div className={`${styles.group} ${styles.groupRight}`}>
      <button
        className={`${styles.btn} ${styles.playtestBtn}`}
        onClick={onPlaytest}
        title="Playtest room [P]"
      >
        <span className={styles.icon}>▶</span> Playtest <span className={styles.hk}>P</span>
      </button>
      <button className={`${styles.btn} ${styles.saveBtn}`} onClick={onExport} title="Export map [Ctrl+S]">
        <span className={styles.icon}>⬇</span> Export <span className={styles.hk}>^S</span>
      </button>
      <button className={styles.btn} onClick={onSaveStorage} title="Save to local storage">
        <span className={styles.icon}>💾</span> Save
      </button>
      <button className={styles.btn} onClick={onLoadMap} title="Load map file">
        <span className={styles.icon}>⬆</span> Import Map
      </button>
      <button className={styles.btn} onClick={onLoadStorage} title="Load from local storage">
        <span className={styles.icon}>📂</span> Load
      </button>
    </div>
  </div>
);

export default Toolbar;
