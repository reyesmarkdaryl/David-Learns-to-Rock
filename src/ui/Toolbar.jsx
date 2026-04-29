import React, { useState, useEffect } from 'react';
import { EventBus } from '../editor/EventBus';

const Toolbar = () => {
  const [activeBrush, setActiveBrush] = useState('floor');

  const handleBrushChange = (brush) => {
    setActiveBrush(brush);
    EventBus.emit('EDITOR_BRUSH_CHANGE', brush);
  };

  const handleSave = () => {
    EventBus.emit('EDITOR_SAVE_REQUESTED');
  };

  const handleLoad = () => {
    EventBus.emit('EDITOR_LOAD_REQUESTED');
  };

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      left: '20px',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      padding: '15px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      borderRadius: '8px',
      fontFamily: 'sans-serif',
      border: '1px solid #444'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '5px', textAlign: 'center' }}>Toolbox</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <div style={{ fontSize: '10px', color: '#aaa', marginBottom: '2px' }}>TILES</div>
        <button
          onClick={() => handleBrushChange('floor')}
          style={{
            backgroundColor: activeBrush === 'floor' ? '#4CAF50' : '#333',
            color: 'white', border: 'none', padding: '8px', cursor: 'pointer', borderRadius: '4px'
          }}
        >
          Floor Brush
        </button>
        <button
          onClick={() => handleBrushChange('wall')}
          style={{
            backgroundColor: activeBrush === 'wall' ? '#888' : '#333',
            color: 'white', border: 'none', padding: '8px', cursor: 'pointer', borderRadius: '4px'
          }}
        >
          Wall Brush
        </button>
        <button
          onClick={() => handleBrushChange('eraser')}
          style={{
            backgroundColor: activeBrush === 'eraser' ? '#f44336' : '#333',
            color: 'white', border: 'none', padding: '8px', cursor: 'pointer', borderRadius: '4px'
          }}
        >
          Eraser
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '10px' }}>
        <div style={{ fontSize: '10px', color: '#aaa', marginBottom: '2px' }}>OBJECTS</div>
        <button
          onClick={() => handleBrushChange('door')}
          style={{
            backgroundColor: activeBrush === 'door' ? '#2196F3' : '#333',
            color: 'white', border: 'none', padding: '8px', cursor: 'pointer', borderRadius: '4px'
          }}
        >
          Door
        </button>
        <button
          onClick={() => handleBrushChange('enemySpawn')}
          style={{
            backgroundColor: activeBrush === 'enemySpawn' ? '#f44336' : '#333',
            color: 'white', border: 'none', padding: '8px', cursor: 'pointer', borderRadius: '4px'
          }}
        >
          Enemy Spawn
        </button>
        <button
          onClick={() => handleBrushChange('playerSpawn')}
          style={{
            backgroundColor: activeBrush === 'playerSpawn' ? '#4CAF50' : '#333',
            color: 'white', border: 'none', padding: '8px', cursor: 'pointer', borderRadius: '4px'
          }}
        >
          Player Spawn
        </button>
        <button
          onClick={() => handleBrushChange('decorSocket')}
          style={{
            backgroundColor: activeBrush === 'decorSocket' ? '#9C27B0' : '#333',
            color: 'white', border: 'none', padding: '8px', cursor: 'pointer', borderRadius: '4px'
          }}
        >
          Decor Socket
        </button>
        <button
          onClick={() => handleBrushChange('select')}
          style={{
            backgroundColor: activeBrush === 'select' ? '#FFC107' : '#333',
            color: 'black', border: 'none', padding: '8px', cursor: 'pointer', borderRadius: '4px'
          }}
        >
          Select/Move
        </button>
      </div>

      <hr style={{ width: '100%', border: '0.5px solid #555', margin: '10px 0' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <button onClick={handleSave} style={{ backgroundColor: '#2196F3', color: 'white', border: 'none', padding: '8px', cursor: 'pointer', borderRadius: '4px' }}>
          Save Room
        </button>
        <button onClick={handleLoad} style={{ backgroundColor: '#9C27B0', color: 'white', border: 'none', padding: '8px', cursor: 'pointer', borderRadius: '4px' }}>
          Load Room
        </button>
        <button
          onClick={() => EventBus.emit('EDITOR_VALIDATE_REQUESTED')}
          style={{ backgroundColor: '#FFC107', color: 'black', border: 'none', padding: '8px', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}
        >
          Validate Room
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
