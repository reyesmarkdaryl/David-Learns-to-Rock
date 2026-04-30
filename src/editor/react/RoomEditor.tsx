import React, { useEffect, useRef, useState } from 'react';
import { EventBus } from '../EventBus';
import Toolbar from './Toolbar';
import LayersPanel from './LayersPanel';
import TilesetPanel from './TilesetPanel';
import MapCanvas from './MapCanvas';
import TilesetBrowser from './TilesetBrowser';
import RoomLibrary from './RoomLibrary';
import { useEditorState } from './useEditorState';
import { RoomStorage } from '../../room/RoomStorage';
import styles from './RoomEditor.module.css';

const RoomEditor: React.FC = () => {
  const { state, dispatch } = useEditorState();
  const [showImportModal, setShowImportModal] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      const k = e.key.toLowerCase();

      if (k === 'b') dispatch({ type: 'SET_TOOL', tool: 'paint' });
      else if (k === 'e') dispatch({ type: 'SET_TOOL', tool: 'eraser' });
      else if (k === 'f') dispatch({ type: 'SET_TOOL', tool: 'fill' });
      else if (k === 'i') dispatch({ type: 'SET_TOOL', tool: 'eyedrop' });
      else if (k === 's' && !e.ctrlKey && !e.metaKey) dispatch({ type: 'SET_TOOL', tool: 'select' });
      else if (k === 'g') dispatch({ type: 'TOGGLE_GRID' });
      else if (k === '0') dispatch({ type: 'FIT_VIEW' });
      else if (k === 'z') { e.preventDefault(); dispatch({ type: 'UNDO' }); }
      else if (k === 'y') { e.preventDefault(); dispatch({ type: 'REDO' }); }
      else if (k === 's' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); dispatch({ type: 'EXPORT' }); }
      else if (k === 'p') { e.preventDefault(); dispatch({ type: 'PLAYTEST' }); }
      else if (k === 'escape') dispatch({ type: 'CLEAR_SELECTION' });
      else if ((k === 'delete' || k === 'backspace') && state.selection) {
        dispatch({ type: 'DELETE_SELECTION' });
      }
      else if (k === '+' || k === '=') dispatch({ type: 'ZOOM_IN' });
      else if (k === '-' || k === '_') dispatch({ type: 'ZOOM_OUT' });
      else if (e.key >= '1' && e.key <= '9') {
        dispatch({ type: 'SET_ACTIVE_LAYER_BY_INDEX', index: parseInt(e.key) - 1 });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch, state.selection]);

  useEffect(() => {
    const handleValidate = () => dispatch({ type: 'VALIDATE' });
    EventBus.on('EDITOR_VALIDATE_REQUESTED', handleValidate);
    return () => EventBus.off('EDITOR_VALIDATE_REQUESTED', handleValidate);
  }, [dispatch]);

  return (
    <div className={styles.root}>
      <Toolbar
        activeTool={state.activeTool}
        showGrid={state.showGrid}
        onTool={(tool) => dispatch({ type: 'SET_TOOL', tool })}
        onToggleGrid={() => dispatch({ type: 'TOGGLE_GRID' })}
        onFit={() => dispatch({ type: 'FIT_VIEW' })}
        onUndo={() => dispatch({ type: 'UNDO' })}
        onRedo={() => dispatch({ type: 'REDO' })}
        onImport={() => setShowImportModal(true)}
        onExport={() => dispatch({ type: 'EXPORT' })}
        onSaveStorage={() => setShowLibrary(true)}
        onLoadMap={() => dispatch({ type: 'LOAD_MAP' })}
        onLoadStorage={() => setShowLibrary(true)}
        onPlaytest={() => dispatch({ type: 'PLAYTEST' })}
      />

      <div className={styles.body}>
        <LayersPanel
          layers={state.layers}
          activeLayerId={state.activeLayerId}
          mapW={state.mapW}
          mapH={state.mapH}
          tileSize={state.tileSize}
          zoom={state.zoom}
          onSelectLayer={(id) => dispatch({ type: 'SET_ACTIVE_LAYER', id })}
          onToggleVisibility={(id) => dispatch({ type: 'TOGGLE_LAYER_VISIBILITY', id })}
          onAddLayer={(name, type) => dispatch({ type: 'ADD_LAYER', layerName: name, layerType: type })}
          onDeleteLayer={(id) => dispatch({ type: 'DELETE_LAYER', id })}
          onResize={(w, h) => dispatch({ type: 'RESIZE_MAP', w, h })}
        />

        <MapCanvas state={state} dispatch={dispatch} />

        <TilesetPanel
          tilesets={state.tilesets}
          activeTsIdx={state.activeTsIdx}
          tsSel={state.tsSel}
          tileSize={state.tileSize}
          activeLayerName={state.layers.find((l: any) => l.id === state.activeLayerId)?.name || '—'}
          onSelectTs={(i) => dispatch({ type: 'SET_ACTIVE_TILESET', idx: i })}
          onRemoveTs={(i) => dispatch({ type: 'REMOVE_TILESET', idx: i })}
          onSelectTile={(sel) => dispatch({ type: 'SET_TS_SELECTION', sel })}
          onImport={() => setShowImportModal(true)}
        />
      </div>

      {showImportModal && (
        <TilesetBrowser
          onConfirm={(img, name, tileSize) => {
            dispatch({ type: 'ADD_TILESET', img, name, tileSize });
            setShowImportModal(false);
          }}
          onCancel={() => setShowImportModal(false)}
        />
      )}

      {showLibrary && (
        <RoomLibrary
          onClose={() => setShowLibrary(false)}
          onLoad={(id) => {
            dispatch({ type: 'LOAD_FROM_STORAGE', roomId: id });
            setShowLibrary(false);
          }}
          onSave={() => {
            const id = prompt('Enter room name to save:');
            if (id) dispatch({ type: 'SAVE_TO_STORAGE', roomId: id });
            setShowLibrary(false);
          }}
          onDelete={(id) => {
            const confirmed = confirm(`Delete room "${id}"?`);
            if (confirmed) {
              RoomStorage.deleteRoom(id);
              setShowLibrary(false);
            }
          }}
        />
      )}
    </div>
  );
};

export default RoomEditor;
