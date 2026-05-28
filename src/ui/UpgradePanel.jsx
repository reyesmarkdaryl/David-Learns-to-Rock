import React, { useState, useEffect } from "react";
import { gameEvents } from "../systems/GameEvents";
import UpgradeSystem from "../systems/UpgradeSystem";

const CARDS_STYLE = {
  void: '#03020a',
  abyss: '#07050f',
  deep: '#0e0b1a',
  stone: '#16121f',
  ashen: '#201b2e',
  mist: '#2c2440',
  border: '#3a2f50',
  borderhi: '#5a4a70',
  bone: '#c8bfa0',
  parchment: '#a89880',
  dim: '#5c5070',
  blood: '#8b1a1a',
  bloodhi: '#c0282c',
  cursed: '#5a1f6e',
  cursedhi: '#9b3fc0',
  soul: '#1a4a6e',
  soulhi: '#2e80c8',
  gold: '#c8963c',
  goldhi: '#f0c060',
};

export default function UpgradePanel({ onClose }) {
  const [options, setOptions] = useState([]);
  const [chosenIdx, setChosenIdx] = useState(-1);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const upgrades = UpgradeSystem.getRandomUpgrades(3);
    setOptions(upgrades);
  }, []);

  const pick = (idx) => {
    if (chosenIdx !== -1) return;
    setChosenIdx(idx);
    setShowBanner(true);
  };

  const onContinue = () => {
    const upgrade = options[chosenIdx];
    if (upgrade) {
      // We need the hero instance. We can use an event or a shared state.
      // For now, let's emit an event and let the scene handle the application.
      gameEvents.emit('upgrade-selected', upgrade);
    }
    onClose();
  };

  const onSkip = () => {
    gameEvents.emit('upgrade-skipped');
    onClose();
  };

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 2000,
      backgroundColor: 'rgba(3, 2, 10, 0.85)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '"Cinzel", serif',
      color: CARDS_STYLE.bone,
      pointerEvents: 'all',
      animation: 'fadeIn 0.4s ease-out forwards'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Cinzel:wght@400;600&family=IM+Fell+English:ital@0;1&display=swap');

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes titleBreath {
          0%, 100% { text-shadow: 0 0 24px rgba(200,150,60,0.3), 0 0 60px rgba(200,150,60,0.08); }
          50% { text-shadow: 0 0 40px rgba(200,150,60,0.55), 0 0 80px rgba(200,150,60,0.15); }
        }
        @keyframes cardRise { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes glyphFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        @keyframes shimmer { from { transform: translateX(-100%); } to { transform: translateX(200%); } }
      `}</style>

      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '900px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px 16px 0'
      }}>
        {/* Top Bars */}
        <div style={{ width: '100%', height: '1px', background: `linear-gradient(90deg, transparent, ${CARDS_STYLE.border}, ${CARDS_STYLE.goldhi}, ${CARDS_STYLE.border}, transparent)`, marginBottom: '2px' }} />
        <div style={{ width: '60%', height: '1px', background: `linear-gradient(90deg, transparent, ${CARDS_STYLE.borderhi}, transparent)`, marginBottom: '18px' }} />

        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '7px', marginBottom: '18px' }}>
          <div style={{ fontFamily: '"Cinzel", serif', fontSize: '9px', letterSpacing: '0.28em', color: CARDS_STYLE.dim, textTransform: 'uppercase' }}>
            ― Power Bound ―
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '60px', height: '1px', background: `linear-gradient(90deg, transparent, ${CARDS_STYLE.gold})` }} />
            <span style={{ fontFamily: '"Cinzel Decorative", serif', fontSize: '24px', fontWeight: '700', color: CARDS_STYLE.goldhi, letterSpacing: '0.08em', textShadow: '0 0 32px rgba(200,150,60,0.35)', animation: 'titleBreath 3s ease-in-out infinite' }}>
              Claim Your Dark Gift
            </span>
            <div style={{ width: '60px', height: '1px', background: `linear-gradient(90deg, ${CARDS_STYLE.gold}, transparent)` }} />
          </div>
          <div style={{ fontFamily: '"IM Fell English", serif', fontStyle: 'italic', fontSize: '14px', color: CARDS_STYLE.dim, letterSpacing: '0.05em' }}>
            The abyss offers power to those who dare take it
          </div>
        </div>

        {/* Result Banner */}
        {showBanner && (
          <div style={{
            display: 'flex',
            width: 'calc(100% - 32px)',
            maxWidth: '820px',
            border: `1px solid ${CARDS_STYLE.border}`,
            background: CARDS_STYLE.stone,
            padding: '11px 16px',
            alignItems: 'center',
            gap: '14px',
            marginBottom: '14px',
            position: 'relative',
            animation: 'cardRise 0.45s cubic-bezier(0.22,1,0.36,1) both',
            borderLeft: `4px solid ${options[chosenIdx]?.color || CARDS_STYLE.gold}`
          }}>
            <span style={{ fontSize: '22px' }}>{options[chosenIdx]?.glyph}</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ fontFamily: '"Cinzel", serif', fontSize: '10px', fontWeight: '600', color: options[chosenIdx]?.color || CARDS_STYLE.goldhi, letterSpacing: '0.18em' }}>
                {options[chosenIdx]?.name.toUpperCase()} BOUND
              </div>
              <div style={{ fontFamily: '"IM Fell English", serif', fontStyle: 'italic', fontSize: '12px', color: CARDS_STYLE.parchment }}>
                The curse takes root within your soul...
              </div>
            </div>
            <button
              onClick={onContinue}
              style={{
                marginLeft: 'auto',
                fontFamily: '"Cinzel", serif',
                fontSize: '9px',
                letterSpacing: '0.14em',
                padding: '7px 14px',
                border: `1px solid ${CARDS_STYLE.gold}`,
                color: CARDS_STYLE.goldhi,
                background: 'transparent',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(200,150,60,0.08)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              Press Onward ▸
            </button>
          </div>
        )}

        {/* Cards Grid */}
        <div style={{ display: 'flex', gap: '12px', width: 'calc(100% - 32px)', maxWidth: '820px', margin: '0 auto' }}>
          {options.map((opt, i) => (
            <div
              key={opt.id}
              onClick={() => pick(i)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                background: CARDS_STYLE.abyss,
                border: `1px solid ${chosenIdx === i ? opt.color : CARDS_STYLE.border}`,
                position: 'relative',
                cursor: 'pointer',
                transition: 'transform 0.18s ease, border-color 0.18s ease',
                animation: `cardRise 0.55s cubic-bezier(0.22,1,0.36,1) both ${(i + 1) * 0.1}s`,
                opacity: chosenIdx !== -1 && chosenIdx !== i ? 0.15 : 1,
                pointerEvents: chosenIdx !== -1 ? 'none' : 'all',
                transform: chosenIdx === i ? 'translateY(0)' : 'none',
                filter: chosenIdx !== -1 && chosenIdx !== i ? 'saturate(0)' : 'none'
              }}
              onMouseOver={(e) => { if(chosenIdx === -1) e.currentTarget.style.transform = 'translateY(-4px)'; }}
              onMouseOut={(e) => { if(chosenIdx === -1) e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ height: '2px', width: '100%', opacity: 0.35, background: `linear-gradient(90deg, transparent, ${opt.color}, transparent)` }} />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px 0', position: 'relative', zIndex: 1 }}>
                <div style={{
                  fontFamily: '"Cinzel", serif', fontSize: '6px', letterSpacing: '0.22em',
                  padding: '2px 7px', border: `1px solid ${opt.color}66`, color: opt.color, fontWeight: '600'
                }}>
                  {opt.rarity}
                </div>
                <div style={{ display: 'flex', gap: '3px' }}>
                  {[1,2,3].map(dot => (
                    <div key={dot} style={{ width: '5px', height: '5px', background: dot <= (opt.rarity === 'Legendary' ? 3 : opt.rarity === 'Rare' ? 2 : 1) ? opt.color : CARDS_STYLE.ashen, boxShadow: dot <= (opt.rarity === 'Legendary' ? 3 : opt.rarity === 'Rare' ? 2 : 1) ? `0 0 4px ${opt.color}` : 'none' }} />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 12px 10px', position: 'relative', zIndex: 1, gap: '8px' }}>
                <div style={{
                  fontSize: '34px', color: opt.color, filter: `drop-shadow(0 0 6px ${opt.color})`,
                  animation: 'glyphFloat 4s ease-in-out infinite'
                }}>
                  {opt.glyph}
                </div>
                <div style={{ fontFamily: '"Cinzel", serif', fontSize: '6px', letterSpacing: '0.2em', opacity: 0.5, textAlign: 'center', color: opt.color }}>
                  DARK GIFT
                </div>
              </div>

              <div style={{ padding: '0 12px 0', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, position: 'relative', zIndex: 1 }}>
                <div style={{ fontFamily: '"Cinzel", serif', fontSize: '10px', fontWeight: '600', letterSpacing: '0.1em', color: opt.color }}>
                  {opt.name}
                </div>
                <div style={{ fontFamily: '"IM Fell English", serif', fontStyle: 'italic', fontSize: '11px', color: CARDS_STYLE.parchment, lineHeight: '1.65', opacity: 0.85 }}>
                  {opt.lore}
                </div>
                <div style={{ height: '1px', background: `linear-gradient(90deg, transparent, ${CARDS_STYLE.border}, transparent)`, margin: '2px 0' }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: '3px' }}>
                    {[1,2,3,4,5].map(pip => (
                      <div key={pip} style={{ width: '12px', height: '4px', background: pip <= 3 ? opt.color : CARDS_STYLE.ashen, boxShadow: pip <= 3 ? `0 0 4px ${opt.color}` : 'none' }} />
                    ))}
                  </div>
                  <div style={{ fontFamily: '"Cinzel", serif', fontSize: '8px', color: opt.color }}>
                    {opt.description}
                  </div>
                </div>
              </div>

              <button
                style={{
                  fontFamily: '"Cinzel", serif', fontSize: '8px', letterSpacing: '0.18em', fontWeight: '600',
                  padding: '9px 0', margin: '12px', border: `1px solid ${opt.color}88`, background: 'transparent',
                  color: opt.color, cursor: 'pointer', position: 'relative', overflow: 'hidden', zIndex: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
                onClick={(e) => { e.stopPropagation(); pick(i); }}
              >
                <span style={{ opacity: chosenIdx === i ? 0.5 : 1 }}>Embrace the Gift</span>
                {chosenIdx === i && <span style={{ color: opt.color }}>✦</span>}
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '16px 0 4px' }}>
          <button
            onClick={onSkip}
            style={{
              fontFamily: '"Cinzel", serif', fontSize: '8px', color: CARDS_STYLE.dim, letterSpacing: '0.12em',
              background: 'none', border: 'none', cursor: 'pointer', padding: '5px 12px', transition: 'color 0.15s'
            }}
            onMouseOver={(e) => e.currentTarget.style.color = CARDS_STYLE.parchment}
            onMouseOut={(e) => e.currentTarget.style.color = CARDS_STYLE.dim}
          >
            ✕ &nbsp; Refuse All Gifts
          </button>
          <div style={{ fontFamily: '"IM Fell English", serif', fontStyle: 'italic', fontSize: '11px', color: CARDS_STYLE.dim, opacity: 0.6 }}>
            "Power unclaimed is power surrendered to the dark."
          </div>
        </div>
      </div>
    </div>
  );
}
