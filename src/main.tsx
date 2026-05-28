import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { bootGame, destroyGame } from './main';
import GameUI from './ui/GameUI';
import RoomEditor from './editor/react/RoomEditor';
import EnemyEditor from './ui/EnemyEditor';
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

  const saveEnemyAtlas = (enemiesData: any) => {
    const fullAtlas = {
      basePath: '/assets/sprites/Enemies/',
      enemies: {
        types: enemiesData
      }
    };

    const blob = new Blob([JSON.stringify(fullAtlas, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'enemies_atlas.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    console.log('[Editor] Enemy Atlas exported to JSON');
  };

  return (
    <>
      <div id="playing-field-screen" />
      {activeScene === 'RoomEditorScene' ? (
        <RoomEditor />
      ) : activeScene === 'EnemyEditorScene' ? (
        <EnemyEditor
          onClose={() => {
            if (window.gameScene) {
              window.gameScene.scene.start('MainMenuScene');
            }
          }}
          onSave={saveEnemyAtlas}
        />
      ) : activeScene === 'GymScene' || activeScene === 'PlaytestScene' ? (
        <GameUI />
      ) : null}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
