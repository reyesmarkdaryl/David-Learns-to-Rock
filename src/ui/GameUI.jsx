import React, { useState, useEffect, useCallback, useRef } from "react";
import { gameEvents } from "../systems/GameEvents";

// ─── Pixel-art SVG Arrow Keys ────────────────────────────────────────────────

const KEY_UP_UNPRESSED = (
  <>
    <rect x="0" y="0" width="14" height="14" fill="#2a1e10"/>
    <rect x="1" y="1" width="12" height="11" fill="#c8944a"/>
    <rect x="1" y="1" width="12" height="1" fill="#e8b870"/>
    <rect x="1" y="1" width="1" height="10" fill="#d8a458"/>
    <rect x="1" y="11" width="12" height="1" fill="#5a3010"/>
    <rect x="12" y="2" width="1" height="9" fill="#7a4820"/>
    <rect x="2" y="2" width="10" height="9" fill="#b87c38"/>
    <rect x="3" y="4" width="1" height="1" fill="#a06828"/>
    <rect x="8" y="7" width="1" height="1" fill="#a06828"/>
    <rect x="6" y="3" width="2" height="1" fill="#3a2008"/>
    <rect x="5" y="4" width="4" height="1" fill="#3a2008"/>
    <rect x="4" y="5" width="6" height="1" fill="#3a2008"/>
    <rect x="6" y="5" width="2" height="4" fill="#3a2008"/>
    <rect x="6" y="3" width="1" height="1" fill="#5a3818"/>
    <rect x="0" y="12" width="14" height="2" fill="#1a0e06"/>
    <rect x="1" y="12" width="12" height="1" fill="#3a2010"/>
  </>
);
const KEY_UP_PRESSED = (
  <>
    <rect x="0" y="0" width="14" height="14" fill="#1a0e06"/>
    <rect x="1" y="2" width="12" height="11" fill="#8a5020"/>
    <rect x="1" y="2" width="12" height="1" fill="#7a4418"/>
    <rect x="1" y="2" width="1" height="10" fill="#7a4418"/>
    <rect x="1" y="12" width="12" height="1" fill="#3a2008"/>
    <rect x="12" y="3" width="1" height="9" fill="#3a2008"/>
    <rect x="2" y="3" width="10" height="9" fill="#7a3e10"/>
    <rect x="3" y="5" width="1" height="1" fill="#6a3410"/>
    <rect x="8" y="8" width="1" height="1" fill="#6a3410"/>
    <rect x="6" y="4" width="2" height="1" fill="#200e02"/>
    <rect x="5" y="5" width="4" height="1" fill="#200e02"/>
    <rect x="4" y="6" width="6" height="1" fill="#200e02"/>
    <rect x="6" y="6" width="2" height="4" fill="#200e02"/>
    <rect x="6" y="4" width="2" height="1" fill="#c86820" opacity="0.4"/>
    <rect x="0" y="13" width="14" height="1" fill="#0e0802"/>
  </>
);
const KEY_DOWN_UNPRESSED = (
  <>
    <rect x="0" y="0" width="14" height="14" fill="#2a1e10"/>
    <rect x="1" y="1" width="12" height="11" fill="#c8944a"/>
    <rect x="1" y="1" width="12" height="1" fill="#e8b870"/>
    <rect x="1" y="1" width="1" height="10" fill="#d8a458"/>
    <rect x="1" y="11" width="12" height="1" fill="#5a3010"/>
    <rect x="12" y="2" width="1" height="9" fill="#7a4820"/>
    <rect x="2" y="2" width="10" height="9" fill="#b87c38"/>
    <rect x="3" y="4" width="1" height="1" fill="#a06828"/>
    <rect x="8" y="7" width="1" height="1" fill="#a06828"/>
    <rect x="6" y="3" width="2" height="4" fill="#3a2008"/>
    <rect x="4" y="7" width="6" height="1" fill="#3a2008"/>
    <rect x="5" y="8" width="4" height="1" fill="#3a2008"/>
    <rect x="6" y="9" width="2" height="1" fill="#3a2008"/>
    <rect x="6" y="3" width="1" height="1" fill="#5a3818"/>
    <rect x="0" y="12" width="14" height="2" fill="#1a0e06"/>
    <rect x="1" y="12" width="12" height="1" fill="#3a2010"/>
  </>
);
const KEY_DOWN_PRESSED = (
  <>
    <rect x="0" y="0" width="14" height="14" fill="#1a0e06"/>
    <rect x="1" y="2" width="12" height="11" fill="#8a5020"/>
    <rect x="1" y="2" width="12" height="1" fill="#7a4418"/>
    <rect x="1" y="2" width="1" height="10" fill="#7a4418"/>
    <rect x="1" y="12" width="12" height="1" fill="#3a2008"/>
    <rect x="12" y="3" width="1" height="9" fill="#3a2008"/>
    <rect x="2" y="3" width="10" height="9" fill="#7a3e10"/>
    <rect x="3" y="5" width="1" height="1" fill="#6a3410"/>
    <rect x="8" y="8" width="1" height="1" fill="#6a3410"/>
    <rect x="6" y="4" width="2" height="4" fill="#200e02"/>
    <rect x="4" y="8" width="6" height="1" fill="#200e02"/>
    <rect x="5" y="9" width="4" height="1" fill="#200e02"/>
    <rect x="6" y="10" width="2" height="1" fill="#200e02"/>
    <rect x="6" y="8" width="2" height="1" fill="#c86820" opacity="0.4"/>
    <rect x="0" y="13" width="14" height="1" fill="#0e0802"/>
  </>
);
const KEY_LEFT_UNPRESSED = (
  <>
    <rect x="0" y="0" width="14" height="14" fill="#2a1e10"/>
    <rect x="1" y="1" width="12" height="11" fill="#c8944a"/>
    <rect x="1" y="1" width="12" height="1" fill="#e8b870"/>
    <rect x="1" y="1" width="1" height="10" fill="#d8a458"/>
    <rect x="1" y="11" width="12" height="1" fill="#5a3010"/>
    <rect x="12" y="2" width="1" height="9" fill="#7a4820"/>
    <rect x="2" y="2" width="10" height="9" fill="#b87c38"/>
    <rect x="3" y="4" width="1" height="1" fill="#a06828"/>
    <rect x="9" y="7" width="1" height="1" fill="#a06828"/>
    <rect x="3" y="6" width="1" height="2" fill="#3a2008"/>
    <rect x="4" y="5" width="1" height="4" fill="#3a2008"/>
    <rect x="5" y="4" width="1" height="6" fill="#3a2008"/>
    <rect x="6" y="5" width="4" height="4" fill="#3a2008"/>
    <rect x="6" y="6" width="1" height="1" fill="#5a3818"/>
    <rect x="0" y="12" width="14" height="2" fill="#1a0e06"/>
    <rect x="1" y="12" width="12" height="1" fill="#3a2010"/>
  </>
);
const KEY_LEFT_PRESSED = (
  <>
    <rect x="0" y="0" width="14" height="14" fill="#1a0e06"/>
    <rect x="1" y="2" width="12" height="11" fill="#8a5020"/>
    <rect x="1" y="2" width="12" height="1" fill="#7a4418"/>
    <rect x="1" y="2" width="1" height="10" fill="#7a4418"/>
    <rect x="1" y="12" width="12" height="1" fill="#3a2008"/>
    <rect x="12" y="3" width="1" height="9" fill="#3a2008"/>
    <rect x="2" y="3" width="10" height="9" fill="#7a3e10"/>
    <rect x="3" y="5" width="1" height="1" fill="#6a3410"/>
    <rect x="9" y="8" width="1" height="1" fill="#6a3410"/>
    <rect x="3" y="7" width="1" height="2" fill="#200e02"/>
    <rect x="4" y="6" width="1" height="4" fill="#200e02"/>
    <rect x="5" y="5" width="1" height="6" fill="#200e02"/>
    <rect x="6" y="6" width="4" height="4" fill="#200e02"/>
    <rect x="5" y="7" width="1" height="1" fill="#c86820" opacity="0.4"/>
    <rect x="0" y="13" width="14" height="1" fill="#0e0802"/>
  </>
);
const KEY_RIGHT_UNPRESSED = (
  <>
    <rect x="0" y="0" width="14" height="14" fill="#2a1e10"/>
    <rect x="1" y="1" width="12" height="11" fill="#c8944a"/>
    <rect x="1" y="1" width="12" height="1" fill="#e8b870"/>
    <rect x="1" y="1" width="1" height="10" fill="#d8a458"/>
    <rect x="1" y="11" width="12" height="1" fill="#5a3010"/>
    <rect x="12" y="2" width="1" height="9" fill="#7a4820"/>
    <rect x="2" y="2" width="10" height="9" fill="#b87c38"/>
    <rect x="3" y="4" width="1" height="1" fill="#a06828"/>
    <rect x="9" y="7" width="1" height="1" fill="#a06828"/>
    <rect x="3" y="5" width="4" height="4" fill="#3a2008"/>
    <rect x="7" y="4" width="1" height="6" fill="#3a2008"/>
    <rect x="8" y="5" width="1" height="4" fill="#3a2008"/>
    <rect x="9" y="6" width="1" height="2" fill="#3a2008"/>
    <rect x="7" y="6" width="1" height="1" fill="#5a3818"/>
    <rect x="0" y="12" width="14" height="2" fill="#1a0e06"/>
    <rect x="1" y="12" width="12" height="1" fill="#3a2010"/>
  </>
);
const KEY_RIGHT_PRESSED = (
  <>
    <rect x="0" y="0" width="14" height="14" fill="#1a0e06"/>
    <rect x="1" y="2" width="12" height="11" fill="#8a5020"/>
    <rect x="1" y="2" width="12" height="1" fill="#7a4418"/>
    <rect x="1" y="2" width="1" height="10" fill="#7a4418"/>
    <rect x="1" y="12" width="12" height="1" fill="#3a2008"/>
    <rect x="12" y="3" width="1" height="9" fill="#3a2008"/>
    <rect x="2" y="3" width="10" height="9" fill="#7a3e10"/>
    <rect x="3" y="5" width="1" height="1" fill="#6a3410"/>
    <rect x="9" y="8" width="1" height="1" fill="#6a3410"/>
    <rect x="3" y="6" width="4" height="4" fill="#200e02"/>
    <rect x="7" y="5" width="1" height="6" fill="#200e02"/>
    <rect x="8" y="6" width="1" height="4" fill="#200e02"/>
    <rect x="9" y="7" width="1" height="2" fill="#200e02"/>
    <rect x="7" y="7" width="1" height="1" fill="#c86820" opacity="0.4"/>
    <rect x="0" y="13" width="14" height="1" fill="#0e0802"/>
  </>
);

const KEY_CONTENT = {
  UP:    { pressed: KEY_UP_PRESSED,    unpressed: KEY_UP_UNPRESSED    },
  DOWN:  { pressed: KEY_DOWN_PRESSED,  unpressed: KEY_DOWN_UNPRESSED  },
  LEFT:  { pressed: KEY_LEFT_PRESSED,  unpressed: KEY_LEFT_UNPRESSED  },
  RIGHT: { pressed: KEY_RIGHT_PRESSED, unpressed: KEY_RIGHT_UNPRESSED },
};

function ArrowKey({ dir, pressed, dim, size = 38, onClick }) {
  const content = pressed ? KEY_CONTENT[dir].pressed : KEY_CONTENT[dir].unpressed;
  return (
    <svg
      onClick={onClick}
      width={size} height={size} viewBox="0 0 14 14"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        imageRendering: "pixelated",
        opacity: dim ? 0.22 : 1,
        transition: "opacity 0.12s, transform 0.05s, filter 0.05s",
        transform: pressed ? "translateY(3px)" : "translateY(0)",
        filter: pressed ? "drop-shadow(0 1px 2px rgba(0,0,0,0.7))" : "drop-shadow(0 3px 6px rgba(0,0,0,0.6))",
        cursor: onClick ? "pointer" : "default",
        display: "block",
      }}
    >
      {content}
    </svg>
  );
}

// ─── SummonSystem logic (mirrors SummonSystem.ts) ────────────────────────────

const DIRECTIONS = ['UP', 'DOWN', 'LEFT', 'RIGHT'];

const TRACK_CONFIGS = [
  { name: 'warrior', length: 5,  color: '#e8734a', glow: '#e8734a55', label: 'WARRIOR', icon: '⚔️' },
  { name: 'lancer',  length: 7,  color: '#4ab8e8', glow: '#4ab8e855', label: 'LANCER',  icon: '🗡️' },
  { name: 'archer',  length: 9,  color: '#7de84a', glow: '#7de84a55', label: 'ARCHER',  icon: '🏹' },
];

function initTracks() {
  return TRACK_CONFIGS.map(c => ({
    name: c.name,
    targetSequence: makeSeq(c.length),
    currentIndex: 0,
    requiredLength: c.length,
  }));
}

// ─── Divider SVG ─────────────────────────────────────────────────────────────

function StoneDivider({ vertical = false }) {
  if (vertical) return (
    <div style={{
      width: 6,
      alignSelf: 'stretch',
      background: 'linear-gradient(180deg, #1a0e06 0%, #3a2810 20%, #5a3a18 50%, #3a2810 80%, #1a0e06 100%)',
      borderLeft: '1px solid #2a1a08',
      borderRight: '1px solid #6a4820',
      flexShrink: 0,
      position: 'relative',
    }}>
      {[15, 35, 55, 75].map(pct => (
        <div key={pct} style={{
          position: 'absolute', top: `${pct}%`, left: 1, right: 1, height: 2,
          background: 'rgba(0,0,0,0.3)',
        }} />
      ))}
    </div>
  );
  return null;
}

// ─── Single summon track row ──────────────────────────────────────────────────

function TrackRow({ track, config, pressedKey, justCompleted }) {
  const { targetSequence, currentIndex } = track;
  const pct = currentIndex / track.requiredLength;

  return (
    <div style={{
      background: justCompleted
        ? `linear-gradient(135deg, #1e1408 0%, ${config.color}18 100%)`
        : 'linear-gradient(135deg, #1a1208 0%, #221608 100%)',
      border: `1px solid ${justCompleted ? config.color : '#2e1e0a'}`,
      borderRadius: 3,
      padding: '8px 10px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      boxShadow: justCompleted ? `0 0 16px ${config.glow}, inset 0 0 8px ${config.glow}` : '0 2px 6px rgba(0,0,0,0.5)',
      transition: 'all 0.2s ease',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {justCompleted && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(90deg, transparent 0%, ${config.color}20 50%, transparent 100%)`,
          animation: 'shimmer 0.6s ease-out forwards',
          pointerEvents: 'none',
        }} />
      )}

      {/* Track header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 11 }}>{config.icon}</span>
          <span style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 7,
            color: config.color,
            textShadow: justCompleted ? `0 0 10px ${config.color}` : `0 0 4px ${config.glow}`,
            letterSpacing: 1,
          }}>{config.label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 60, height: 3,
            background: '#1a1208',
            border: '1px solid #2e1e0a',
            borderRadius: 2,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${pct * 100}%`,
              background: `linear-gradient(90deg, ${config.color}80, ${config.color})`,
              boxShadow: `0 0 4px ${config.color}`,
              transition: 'width 0.1s ease',
            }} />
          </div>
          <span style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 5,
            color: '#4a3018',
          }}>{currentIndex}/{track.requiredLength}</span>
        </div>
      </div>

      {/* Key sequence */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
        {targetSequence.map((dir, i) => {
          const isDone = i < currentIndex;
          const isCurrent = i === currentIndex;
          return (
            <div key={i} style={{ position: 'relative' }}>
              {isDone && (
                <div style={{
                  position: 'absolute', inset: 0, zIndex: 3,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  pointerEvents: 'none',
                }}>
                  <div style={{
                    width: 16, height: 16,
                    background: `${config.color}dd`,
                    borderRadius: 2,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, lineHeight: 1,
                    boxShadow: `0 0 6px ${config.color}`,
                  }}>✓</div>
                </div>
              )}
              <div style={{
                outline: isCurrent ? `2px solid ${config.color}` : 'none',
                outlineOffset: 2,
                borderRadius: 3,
                animation: isCurrent ? 'pulseKey 1.2s ease-in-out infinite' : 'none',
              }}>
                <ArrowKey
                  dir={dir}
                  pressed={isDone || (isCurrent && pressedKey === dir)}
                  dim={!isDone && !isCurrent}
                  size={32}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── D-Pad input widget ───────────────────────────────────────────────────────

function DPad({ pressedKey, onInput }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 38px)',
      gridTemplateRows: 'repeat(3, 38px)',
      gap: 3,
    }}>
      <div style={{ gridColumn: 2, gridRow: 1 }}>
        <ArrowKey dir="UP" pressed={pressedKey === 'UP'} size={38} onClick={() => onInput('UP')} />
      </div>
      <div style={{ gridColumn: 1, gridRow: 2 }}>
        <ArrowKey dir="LEFT" pressed={pressedKey === 'LEFT'} size={38} onClick={() => onInput('LEFT')} />
      </div>
      <div style={{ gridColumn: 2, gridRow: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="38" height="38" viewBox="0 0 14 14" style={{ imageRendering: 'pixelated' }}>
          <rect x="0" y="0" width="14" height="14" fill="#1a1208"/>
          <rect x="2" y="2" width="10" height="10" fill="#2e1e0a"/>
          <rect x="3" y="3" width="8" height="8" fill="#221608"/>
          <rect x="5" y="5" width="1" height="1" fill="#3a2810"/>
          <rect x="8" y="8" width="1" height="1" fill="#3a2810"/>
        </svg>
      </div>
      <div style={{ gridColumn: 3, gridRow: 2 }}>
        <ArrowKey dir="RIGHT" pressed={pressedKey === 'RIGHT'} size={38} onClick={() => onInput('RIGHT')} />
      </div>
      <div style={{ gridColumn: 2, gridRow: 3 }}>
        <ArrowKey dir="DOWN" pressed={pressedKey === 'DOWN'} size={38} onClick={() => onInput('DOWN')} />
      </div>
    </div>
  );
}

// ─── Summon log ───────────────────────────────────────────────────────────────

function SummonLog({ log }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #120d06 0%, #1a1208 100%)',
      border: '1px solid #2e1e0a',
      borderRadius: 3,
      padding: '8px 10px',
      minHeight: 60,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}>
      <div style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: 6, color: '#3a2810', letterSpacing: 2, marginBottom: 2,
      }}>◆ SUMMON LOG</div>
      {log.length === 0 && (
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: '#2a1e0a' }}>
          — awaiting commands —
        </div>
      )}
      {log.map((entry, i) => {
        const cfg = TRACK_CONFIGS.find(c => c.name === entry.name);
        return (
          <div key={entry.id} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            opacity: Math.max(0.2, 1 - i * 0.22),
            animation: i === 0 ? 'popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)' : 'none',
          }}>
            <span style={{ fontSize: 10 }}>{cfg?.icon}</span>
            <span style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 6,
              color: cfg?.color,
              textShadow: `0 0 6px ${cfg?.color}88`,
              letterSpacing: 1,
            }}>
              {entry.name.toUpperCase()} SUMMONED
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Hero HP Bar ──────────────────────────────────────────────────────────────

function HeroHPBar({ hp = 100, maxHp = 100 }) {
  const pct = Math.max(0, hp / maxHp);
  const color = pct > 0.5 ? '#4ae84a' : pct > 0.25 ? '#e8c44a' : '#e84a4a';
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 3,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: '#a07840', letterSpacing: 1 }}>
          ❤ HERO
        </span>
        <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: color }}>
          {hp}/{maxHp}
        </span>
      </div>
      <div style={{
        height: 8, background: '#120d06',
        border: '1px solid #2e1e0a', borderRadius: 2, overflow: 'hidden',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)',
      }}>
        <div style={{
          height: '100%', width: `${pct * 100}%`,
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          boxHadow: `0 0 6px ${color}`,
          transition: 'width 0.3s ease, background 0.3s ease',
          borderRadius: 2,
        }} />
      </div>
    </div>
  );
}

// ─── Playing Field ────────────────────────────────────────────────────────────

function PlayingField({ summonLog }) {
  // Simulated unit counters from summon log
  const counts = { warrior: 0, lancer: 0, archer: 0 };
  summonLog.forEach(e => { if (counts[e.name] !== undefined) counts[e.name]++; });

  const [heroStats, setHeroStats] = useState({ hp: 100, maxHp: 100 });

  useEffect(() => {
    const onHpUpdate = (stats) => {
      setHeroStats(stats);
    };
    gameEvents.on('hero-hp-update', onHpUpdate);
    return () => gameEvents.off('hero-hp-update', onHpUpdate);
  }, []);

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      background: '#120d06',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Top bar */}
      <div style={{
        height: 40,
        background: 'linear-gradient(180deg, #1e1408 0%, #160f06 100%)',
        borderBottom: '2px solid #2e1e0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        flexShrink: 0,
        gap: 12,
      }}>
        {/* Hero HP */}
        <div style={{ flex: 1, maxWidth: 240 }}>
          <HeroHPBar hp={heroStats.hp} maxHp={heroStats.maxHp} />
        </div>

        {/* Title centre */}
        <div style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 8, color: '#e8c46a',
          textShadow: '1px 1px 0 #5a3a0a, 0 0 12px rgba(232,196,106,0.3)',
          letterSpacing: 2,
          whiteSpace: 'nowrap',
        }}>⚔ BATTLEFIELD</div>

        {/* Active units */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {TRACK_CONFIGS.map(c => (
            <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ fontSize: 10 }}>{c.icon}</span>
              <span style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 7, color: c.color,
                textShadow: `0 0 5px ${c.color}88`,
              }}>{counts[c.name]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Field area — Phaser canvas mounts here */}
      <div
        id="phaser-container"
        style={{
          flex: 1,
          position: 'relative',
          background: `
            radial-gradient(ellipse at 30% 40%, #1a3a12 0%, transparent 50%),
            radial-gradient(ellipse at 70% 60%, #0e2808 0%, transparent 50%),
            #0e1a08
          `,
          backgroundSize: 'cover',
          overflow: 'visible',
          border: '2px solid #00ff00',
          zIndex: 1,
        }}
      >
        {/* Grid overlay (gives a tactical map feel) */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          pointerEvents: 'none',
        }} />

        {/* Scanline overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)',
          pointerEvents: 'none',
        }} />

        {/* Decorative corner brackets */}
        {[
          { top: 8, left: 8,   borderTop: '2px solid #3a2810', borderLeft: '2px solid #3a2810' },
          { top: 8, right: 8,  borderTop: '2px solid #3a2810', borderRight: '2px solid #3a2810' },
          { bottom: 8, left: 8,  borderBottom: '2px solid #3a2810', borderLeft: '2px solid #3a2810' },
          { bottom: 8, right: 8, borderBottom: '2px solid #3a2810', borderRight: '2px solid #3a2810' },
        ].map((s, i) => (
          <div key={i} style={{ position: 'absolute', width: 16, height: 16, ...s }} />
        ))}
      </div>

      {/* Bottom status bar */}
      <div style={{
        height: 28,
        background: 'linear-gradient(180deg, #160f06 0%, #1e1408 100%)',
        borderTop: '2px solid #2e1e0a',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: 16,
        flexShrink: 0,
      }}>
        <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: '#3a2810', letterSpacing: 1 }}>
          WASD MOVE
        </span>
        <div style={{ width: 1, height: 12, background: '#2e1e0a' }} />
        <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: '#3a2810', letterSpacing: 1 }}>
          SPACE ATTACK
        </span>
        <div style={{ width: 1, height: 12, background: '#2e1e0a' }} />
        <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: '#3a2810', letterSpacing: 1 }}>
          ARROWS SUMMON
        </span>
      </div>
    </div>
  );
}

// ─── Main GameUI ──────────────────────────────────────────────────────────────

export default function GameUI() {
  const [tracks, setTracks]             = useState([]);
  const [pressedKey, setPressedKey]     = useState(null);
  const [justCompleted, setJustCompleted] = useState({});
  const [summonLog, setSummonLog]       = useState([]);
  const pressTimer = useRef(null);

  const handleInput = useCallback((dir) => {
    if (!DIRECTIONS.includes(dir)) return;

    setPressedKey(dir);
    clearTimeout(pressTimer.current);
    pressTimer.current = setTimeout(() => setPressedKey(null), 150);

    // Input is now handled by Phaser, so we just trigger a visual press
    // In a full implementation, we could send this to Phaser if we wanted
    // the UI to be able to trigger summons.
  }, []);

  useEffect(() => {
    const onStateUpdate = (updatedTracks) => {
      setTracks(updatedTracks);
    };

    const onSummonComplete = ({ name }) => {
      setJustCompleted(jc => ({ ...jc, [name]: true }));
      setTimeout(() => setJustCompleted(jc => ({ ...jc, [name]: false })), 700);
      setSummonLog(log => [{ name, id: Date.now() }, ...log.slice(0, 5)]);
    };

    gameEvents.on('summon-state-update', onStateUpdate);
    gameEvents.on('summon-complete', onSummonComplete);

    return () => {
      gameEvents.off('summon-state-update', onStateUpdate);
      gameEvents.off('summon-complete', onSummonComplete);
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      const map = { ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT' };
      if (map[e.key]) {
        // We don't e.preventDefault() here because we want Phaser to also see it,
        // but if Phaser is not seeing it, we might need to.
        handleInput(map[e.key]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleInput]);

  const trackMap = Object.fromEntries(tracks.map(t => [t.name, t]));

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: '#0e0a04',
      display: 'flex',
      overflow: 'hidden',
      fontFamily: "'Press Start 2P', monospace",
      boxSizing: 'border-box',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes shimmer {
          from { transform: translateX(-150%); }
          to   { transform: translateX(150%); }
        }
        @keyframes pulseKey {
          0%, 100% { box-shadow: 0 0 0 0 rgba(232,196,106,0.5); }
          50%       { box-shadow: 0 0 0 5px rgba(232,196,106,0); }
        }
        @keyframes popIn {
          0%   { transform: scale(0.5) translateY(6px); opacity: 0; }
          70%  { transform: scale(1.08) translateY(-1px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes panelIn {
          from { opacity: 0; transform: translateX(-12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        #phaser-container canvas {
          display: block;
          width: 100% !important;
          height: 100% !important;
          position: absolute;
          top: 0;
          left: 0;
        }

      `}</style>

      {/* ── LEFT: Summon Panel ── */}
      <div style={{
        width: 260,
        flexShrink: 0,
        background: 'linear-gradient(180deg, #1a1208 0%, #120d06 100%)',
        borderRight: '2px solid #2e1e0a',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        animation: 'panelIn 0.4s ease-out',
        overflow: 'hidden',
        height: '100%', // Ensure it fills vertical space
      }}>

        {/* Panel header */}
        <div style={{
          padding: '12px 12px 10px',
          borderBottom: '2px solid #2e1e0a',
          background: 'linear-gradient(180deg, #221608 0%, #1a1208 100%)',
          flexShrink: 0,
        }}>
          <div style={{
            fontSize: 9, color: '#e8c46a', letterSpacing: 2,
            textShadow: '1px 1px 0 #5a3a0a, 0 0 14px rgba(232,196,106,0.25)',
            textAlign: 'center',
            marginBottom: 2,
          }}>⚔ SUMMON</div>
          <div style={{ fontSize: 5, color: '#3a2810', letterSpacing: 2, textAlign: 'center' }}>
            COMPLETE SEQUENCES
          </div>
        </div>

        {/* Tracks */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px 10px 6px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          {TRACK_CONFIGS.map((config, i) => {
            const track = trackMap[config.name];
            if (!track) return null; // Prevent crash if state hasn't arrived yet
            return (
              <div key={config.name} style={{
                animation: `panelIn ${0.3 + i * 0.08}s ease-out both`,
              }}>
                <TrackRow
                  track={track}
                  config={config}
                  pressedKey={pressedKey}
                  justCompleted={!!justCompleted[config.name]}
                />
              </div>
            );
          })}
        </div>

        {/* D-pad */}
        <div style={{
          padding: '8px 10px',
          borderTop: '1px solid #2e1e0a',
          borderBottom: '1px solid #2e1e0a',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          background: 'linear-gradient(180deg, #120d06 0%, #1a1208 100%)',
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 5, color: '#3a2810', letterSpacing: 2, alignSelf: 'flex-start' }}>◆ INPUT</div>
          <DPad pressedKey={pressedKey} onInput={handleInput} />
          <div style={{ fontSize: 5, color: '#2a1a08', letterSpacing: 1 }}>CLICK OR USE ARROW KEYS</div>
        </div>

        {/* Summon log */}
        <div style={{ padding: '8px 10px', flexShrink: 0 }}>
          <SummonLog log={summonLog} />
        </div>
      </div>

      {/* ── Stone divider ── */}
      <StoneDivider vertical />

      {/* ── RIGHT: Playing Field ── */}
      <PlayingField summonLog={summonLog} />
    </div>
  );
}
