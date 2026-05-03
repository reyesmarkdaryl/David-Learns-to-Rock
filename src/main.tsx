import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { bootGame, destroyGame } from './main';
import GameUI from './ui/GameUI';
import RoomEditor from './editor/react/RoomEditor';
import { EventBus } from './editor/EventBus';

function App() {
  const [activeScene, setActiveScene] = useState('MainMenuScene');

  useEffect(() => {
    const game = bootGame();

    const handleSceneChange = (sceneName: string) => {
      setActiveScene(sceneName);
    };

    EventBus.on('SCENE_CHANGE', handleSceneChange);

    setTimeout(() => {
      game.canvas.setAttribute('tabindex', '0');
      game.canvas.focus();
    }, 200);

    return () => {
      EventBus.off('SCENE_CHANGE', handleSceneChange);
      destroyGame();
    };
  }, []);

  return (
    <>
      <div id="playing-field-screen" />
      {activeScene === 'RoomEditorScene' ? (
        <RoomEditor />
      ) : activeScene === 'GymScene' || activeScene === 'PlaytestScene' ? (
        <GameUI />
      ) : null}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
