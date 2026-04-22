import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import GameUI from './ui/GameUI';
import { bootGame } from './main';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

function App() {
  useEffect(() => {
    bootGame();
  }, []);

  return <GameUI />;
}
