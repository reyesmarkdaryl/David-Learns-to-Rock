import React, { useEffect, useRef } from 'react';
import RoomEditor from './RoomEditor';

const EditorUI = () => {
  return (
    <div style={{ pointerEvents: 'none', width: '100%', height: '100%' }}>
      <div style={{ pointerEvents: 'all', width: '100%', height: '100%' }}>
        <RoomEditor />
      </div>
    </div>
  );
};

export default EditorUI;
