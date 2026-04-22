import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { bootGame, destroyGame } from './main';
import GameUI from './ui/GameUI';

function App() {
  useEffect(() => {
    const game = bootGame();
    setTimeout(() => {
      game.canvas.setAttribute('tabindex', '0');
      game.canvas.focus();
    }, 200);

    return () => destroyGame();
  }, []);

  return <GameUI />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);