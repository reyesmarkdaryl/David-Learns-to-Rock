import React from 'react';
import { EditorState } from './useEditorState';
import { Tileset } from './useEditorState';
import styles from './PreselectorPanel.module.css';

interface PreselectorPanelProps {
  state: EditorState;
  dispatch: React.Dispatch<any>;
  tilesets: Tileset[];
}

const Grid = ({
  title,
  gridId,
  state,
  dispatch,
  tilesets
}: {
  title: string;
  gridId: 'floorA' | 'floorB' | 'wallA' | 'wallB';
  state: EditorState;
  dispatch: React.Dispatch<any>;
  tilesets: Tileset[];
}) => {
  const currentGrid = state.preselector[gridId];
  const activeTs = tilesets[state.activeTsIdx];

  const handleSlotClick = (col: number, row: number) => {
    if (!state.tsSel || !activeTs) {
      alert('Please select a tile from the tileset first!');
      return;
    }

    // The current tileset selection (tsSel) defines the tile to be placed
    // Since tsSel can be a region, we use the top-left corner of the selection
    dispatch({
      type: 'SET_PRESELECTOR_TILE',
      gridId,
      col,
      row,
      tile: {
        sheetId: activeTs.id,
        col: state.tsSel.col,
        row: state.tsSel.row,
      }
    });
  };

  const renderTile = (col: number, row: number) => {
    const tile = currentGrid.tiles[`${col},${row}`];
    if (!tile) return <div className={styles.slotEmpty} />;

    const ts = tilesets.find(t => t.id === tile.sheetId);
    if (!ts) return <div className={styles.slotError} />;

    const scale = 32 / state.tileSize;

    return (
      <div
        className={styles.slotTile}
        style={{
          backgroundImage: `url(${ts.img.src})`,
          backgroundPosition: `-${tile.col * state.tileSize * scale}px -${tile.row * state.tileSize * scale}px`,
          backgroundSize: `${ts.img.width * scale}px ${ts.img.height * scale}px`
        }}
      />
    );
  };

  return (
    <div className={styles.gridContainer}>
      <div className={styles.gridTitle}>{title}</div>
      <div className={styles.grid}>
        {Array.from({ length: 25 }).map((_, i) => {
          const col = i % 5;
          const row = Math.floor(i / 5);
          return (
            <div
              key={`${col},${row}`}
              className={styles.slot}
              onClick={() => handleSlotClick(col, row)}
            >
              {renderTile(col, row)}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const PreselectorPanel: React.FC<PreselectorPanelProps> = ({ state, dispatch, tilesets }) => {
  return (
    <div className={styles.root}>
      <div className={styles.header}>Palette Preselector</div>

      <div className={styles.typeSelector}>
        <label className={styles.label}>Room Type:</label>
        <select
          className={styles.select}
          value={state.roomType}
          onChange={(e) => dispatch({ type: 'SET_ROOM_TYPE', roomType: e.target.value })}
        >
          <option value="cave">Cave (Organic)</option>
          <option value="arena">Arena (Rectangular)</option>
          <option value="circle">Circle/Oblique</option>
        </select>
      </div>

      <div className={styles.gridsWrapper}>
        <Grid title="Floor A" gridId="floorA" state={state} dispatch={dispatch} tilesets={tilesets} />
        <Grid title="Floor B" gridId="floorB" state={state} dispatch={dispatch} tilesets={tilesets} />
        <Grid title="Wall A" gridId="wallA" state={state} dispatch={dispatch} tilesets={tilesets} />
        <Grid title="Wall B" gridId="wallB" state={state} dispatch={dispatch} tilesets={tilesets} />
      </div>
    </div>
  );
};

export default PreselectorPanel;
