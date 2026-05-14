import React, { useEffect, useRef, useState } from "react";
import { gameEvents } from "../systems/GameEvents";

const COLORS = {
  beat: { fill: '#e8c46a', glow: 'rgba(232,196,106,0.35)', border: '#c8944a' },
  half: { fill: '#4ab8e8', glow: 'rgba(74,184,232,0.35)', border: '#2a98c8' },
  accent: { fill: '#e8734a', glow: 'rgba(232,115,74,0.45)', border: '#c85020' },
};

const HIT_WINDOW = 0.25;
const NOTE_SPEED = 220; // px per second

export default function RhythmBar() {
  const canvasRef = useRef(null);
  const [state, setState] = useState({
    bpm: 120,
    combo: 0,
    multiplier: 1,
    accuracy: 100,
  });
  const [feedback, setFeedback] = useState({ text: '', quality: '' });
  const [beatPips, setBeatPips] = useState([false, false, false, false]);

  const notes = useRef([]);
  const particles = useRef([]);
  const lastTime = useRef(0);

  useEffect(() => {
    const onBeatTick = ({ beatCount }) => {
      // Update beat pips (4/4 time)
      const step = (beatCount - 1) % 4;
      setBeatPips(prev => prev.map((_, i) => i <= step));

      // Spawn a note on the beat
      spawnNote();
    };

    const onRhythmHit = (data) => {
      setState(prev => ({ ...prev, combo: data.combo, multiplier: data.multiplier, accuracy: data.accuracy }));
      setFeedback({
        text: data.hit ? 'HIT' : 'MISS',
        quality: data.hit ? 'perfect' : 'miss'
      });
      setTimeout(() => setFeedback({ text: '', quality: '' }), 500);
    };

    gameEvents.on('rhythm-beat-tick', onBeatTick);
    gameEvents.on('rhythm-hit', onRhythmHit);

    return () => {
      gameEvents.off('rhythm-beat-tick', onBeatTick);
      gameEvents.off('rhythm-hit', onRhythmHit);
    };
  }, []);

  const spawnNote = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    notes.current.push({
      x: canvas.width + 20,
      type: 'beat',
      hit: null,
      age: 0,
    });
  };

  const spawnParticles = (x, y, color) => {
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 80;
      particles.current.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.04 + Math.random() * 0.04,
        size: 2 + Math.random() * 3,
        color,
      });
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const render = (ts) => {
      if (!lastTime.current) lastTime.current = ts;
      const dt = Math.min((ts - lastTime.current) / 1000, 0.05);
      lastTime.current = ts;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cy = canvas.height / 2;
      const hx = canvas.width / 2;

      // Draw Lane Guide
      ctx.strokeStyle = '#2e1e0a';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(canvas.width, cy);
      ctx.stroke();
      ctx.setLineDash([]);

      // Move and Draw Notes
      notes.current.forEach(note => {
        if (!note.hit) note.x -= NOTE_SPEED * dt;
        note.age += dt;

        if (note.hit && note.age > 0.15) return;
        if (note.x < -40) return;

        const c = COLORS[note.type];
        ctx.save();
        ctx.globalAlpha = note.hit ? Math.max(0, 1 - note.age * 8) : 1;
        ctx.translate(note.x, cy);
        if (note.hit) ctx.scale(1 + note.age * 4, 1 + note.age * 4);
        ctx.rotate(Math.PI / 4);
        ctx.shadowColor = c.glow;
        ctx.shadowBlur = note.hit ? 0 : 12;
        ctx.strokeStyle = c.border;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-7, -7, 14, 14);
        ctx.fillStyle = c.fill;
        ctx.fillRect(-6, -6, 12, 12);
        ctx.restore();
      });

      // Particle rendering
      particles.current = particles.current.filter(p => p.life > 0);
      particles.current.forEach(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 60 * dt;
        p.life -= p.decay;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
        ctx.restore();
      });

      notes.current = notes.current.filter(n => n.x > -80);
      requestAnimationFrame(render);
    };

    const animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div style={{
      width: '100%',
      height: '120px',
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

      {/* Beat Lane */}
      <div style={{ flex: 1, position: 'relative' }}>
        <canvas
          ref={canvasRef}
          width={window.innerWidth}
          height={60}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        />

        {/* Hit Zone */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: '36px',
          height: '56px',
          border: `2px solid ${feedback.quality === 'perfect' ? '#7de84a' : feedback.quality === 'good' ? '#e8c46a' : feedback.quality === 'miss' ? '#e84a4a' : '#e8c46a'}`,
          borderRadius: '3px',
          zIndex: 10,
          transition: 'all 0.08s',
          background: 'rgba(232,196,106,0.04)',
          boxShadow: feedback.text ? `0 0 12px ${feedback.quality === 'perfect' ? '#7de84a' : '#e84a4a'}` : 'none'
        }} />

        {/* Feedback Label */}
        <div style={{
          position: 'absolute',
          top: '8px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '7px',
          letterSpacing: '2px',
          opacity: feedback.text ? 1 : 0,
          color: feedback.quality === 'perfect' ? '#7de84a' : feedback.quality === 'good' ? '#e8c46a' : '#e84a4a',
          transition: 'opacity 0.08s',
          pointerEvents: 'none',
          zIndex: 15,
        }}>
          {feedback.text}
        </div>

        {/* Beat Pips */}
        <div style={{
          position: 'absolute',
          top: '0',
          right: '14px',
          display: 'flex',
          gap: '3px',
        }}>
          {beatPips.map((on, i) => (
            <div key={i} style={{
              width: '7px',
              height: '14px',
              background: on ? '#e8c46a' : '#1a1208',
              border: '1px solid #2e1e0a',
              boxShadow: on ? '0 0 5px rgba(232,196,106,0.7)' : 'none',
              transition: 'background 0.05s',
            }} />
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div style={{
        height: '32px',
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
