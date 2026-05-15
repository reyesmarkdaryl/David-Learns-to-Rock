import React, { useEffect, useState } from "react";
import { gameEvents } from "../systems/GameEvents";

export default function RhythmBar() {
  const [state, setState] = useState({
    bpm: 120,
    combo: 0,
    multiplier: 1,
    accuracy: 100,
  });
  const [beatPips, setBeatPips] = useState([false, false, false, false]);

  useEffect(() => {
    const onBeatTick = ({ beatCount }) => {
      const step = (beatCount - 1) % 4;
      setBeatPips(prev => prev.map((_, i) => i <= step));
    };

    const onRhythmHit = (data) => {
      setState(prev => ({ ...prev, combo: data.combo, multiplier: data.multiplier, accuracy: data.accuracy }));
    };

    gameEvents.on('rhythm-beat-tick', onBeatTick);
    gameEvents.on('rhythm-hit', onRhythmHit);

    return () => {
      gameEvents.off('rhythm-beat-tick', onBeatTick);
      gameEvents.off('rhythm-hit', onRhythmHit);
    };
  }, []);

  return (
    <div style={{
      width: '100%',
      height: '80px',
      background: 'linear-gradient(180deg, #120d06 0%, #0e0a04 100%)',
      borderTop: '2px solid #2e1e0a',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Press Start 2P', monospace",
      color: '#e8c46a',
      overflow: 'hidden',
    }}>
      {/* Top Bar */}
      <div style={{
        height: '30px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 14px',
        gap: '20px',
        borderBottom: '1px solid #2e1e0a',
        background: 'linear-gradient(180deg, #1a1208 0%, #120d06 100%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '6px', height: '6px', background: '#e8c46a',
            boxShadow: '0 0 6px #e8c46a', opacity: 0.5
          }} />
          <span style={{ fontSize: '6px', color: '#3a2810' }}>BPM</span>
          <span style={{ fontSize: '8px' }}>{state.bpm}</span>
        </div>
        <div style={{ width: '1px', height: '14px', background: '#2e1e0a' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '6px', color: '#3a2810' }}>COMBO</span>
          <span style={{ fontSize: '9px' }}>×{state.combo}</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontSize: '6px', color: '#3a2810' }}>MULT</span>
          <span style={{ fontSize: '8px' }}>×{state.multiplier}</span>
        </div>
      </div>

      {/* Bottom Bar */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        padding: '0 14px',
        gap: '10px',
        borderTop: '1px solid #2e1e0a',
        background: 'linear-gradient(180deg, #120d06 0%, #1a1208 100%)',
      }}>
        <span style={{ fontSize: '5px', color: '#3a2810', letterSpacing: '2px' }}>ACCURACY</span>
        <div style={{
          flex: 1,
          height: '8px',
          background: '#1a1208',
          border: '1px solid #2e1e0a',
          borderRadius: '2px',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${state.accuracy}%`,
            background: state.accuracy >= 90 ? 'linear-gradient(90deg,#4ae84a88,#4ae84a)' :
                        state.accuracy >= 70 ? 'linear-gradient(90deg,#e8c46a88,#e8c46a)' :
                        'linear-gradient(90deg,#e84a4a88,#e84a4a)',
            transition: 'width 0.4s ease',
          }} />
        </div>
        <span style={{ fontSize: '6px', color: '#4a3018' }}>{state.accuracy}%</span>
      </div>
    </div>
  );
}
