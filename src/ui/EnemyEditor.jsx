import React, { useState, useEffect } from 'react';
import { EnemyAtlas } from '../systems/EnemyAtlas';

const EnemyEditor = ({ onClose, onSave }) => {
  const [selectedKey, setSelectedKey] = useState('');
  const [config, setConfig] = useState(null);
  const [enemies, setEnemies] = useState({});
  const [zoom, setZoom] = useState(2);
  const [showHitbox, setShowHitbox] = useState(true);
  const [showBody, setShowBody] = useState(true);
  const [showAttack, setShowAttack] = useState(true);
  const [activeAnimKey, setActiveAnimKey] = useState('idle');

  useEffect(() => {
    const atlas = EnemyAtlas.getInstance(window.gameScene);
    const allConfigs = atlas.getAllConfigs();
    setEnemies(allConfigs);
    const keys = Object.keys(allConfigs);
    if (keys.length > 0) {
      setSelectedKey(keys[0]);
      setConfig(allConfigs[keys[0]]);
    }
  }, []);

  useEffect(() => {
    if (selectedKey && enemies[selectedKey]) {
      setConfig(enemies[selectedKey]);
    }
  }, [selectedKey, enemies]);

  useEffect(() => {
    if (config && window.gameScene) {
      window.gameScene.updatePreview(config);
      window.gameScene.updatePreviewAnimation(activeAnimKey);
      window.gameScene.setDebugVisibility(showHitbox, showBody, showAttack);
      if (window.gameScene.cameras?.main) window.gameScene.cameras.main.setZoom(zoom);
    }
  }, [config, activeAnimKey, showHitbox, showBody, showAttack, zoom]);

  const updateStat = (path, value) => {
    const newConfig = JSON.parse(JSON.stringify(config));
    const keys = path.split('.');
    let current = newConfig;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    setConfig(newConfig);

    const atlas = EnemyAtlas.getInstance(window.gameScene);
    atlas.setConfig(selectedKey, newConfig);
  };

  if (!config) return <div style={{color:'white', padding: '20px'}}>Loading Atlas...</div>;

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh',
      color: '#c9d1d9', fontFamily: 'monospace',
      display: 'grid', gridTemplateColumns: '350px 1fr', gap: '20px', padding: '20px',
      zIndex: 1000, overflow: 'auto',
      pointerEvents: 'none'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        backgroundColor: '#0d1117',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid #30363d',
        pointerEvents: 'auto',
        height: 'fit-content'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{margin:0}}>Enemy Editor</h2>
          <button onClick={onClose} style={{ cursor: 'pointer', padding: '4px 8px' }}>Close</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label>Enemy Select</label>
          <select value={selectedKey} onChange={(e) => setSelectedKey(e.target.value)} style={{ padding: '5px', background: '#161b22', color: 'white', border: '1px solid #30363d' }}>
            {Object.keys(enemies).map(key => <option key={key} value={key}>{enemies[key].name}</option>)}
          </select>
        </div>

        <div style={{ background: '#161b22', padding: '15px', borderRadius: '8px', border: '1px solid #30363d' }}>
          <h3 style={{marginTop:0, fontSize: '14px', color: '#8b949e'}}>Base Stats</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="field" style={{display:'flex', flexDirection:'column'}}>
              <label style={{fontSize:'10px'}}>HP</label>
              <input type="number" value={config.stats.hp} onChange={(e) => updateStat('stats.hp', parseInt(e.target.value) || 0)} style={{background:'#0d1117', color:'white', border:'1px solid #30363d', padding:'4px'}} />
            </div>
            <div className="field" style={{display:'flex', flexDirection:'column'}}>
              <label style={{fontSize:'10px'}}>Speed</label>
              <input type="number" value={config.stats.speed} onChange={(e) => updateStat('stats.speed', parseInt(e.target.value) || 0)} style={{background:'#0d1117', color:'white', border:'1px solid #30363d', padding:'4px'}} />
            </div>
            <div className="field" style={{display:'flex', flexDirection:'column'}}>
              <label style={{fontSize:'10px'}}>Damage</label>
              <input type="number" value={config.stats.damage} onChange={(e) => updateStat('stats.damage', parseInt(e.target.value) || 0)} style={{background:'#0d1117', color:'white', border:'1px solid #30363d', padding:'4px'}} />
            </div>
            <div className="field" style={{display:'flex', flexDirection:'column'}}>
              <label style={{fontSize:'10px'}}>Range</label>
              <input type="number" value={config.stats.attackRange} onChange={(e) => updateStat('stats.attackRange', parseInt(e.target.value) || 0)} style={{background:'#0d1117', color:'white', border:'1px solid #30363d', padding:'4px'}} />
            </div>
            <div className="field" style={{display:'flex', flexDirection:'column'}}>
              <label style={{fontSize:'10px'}}>Windup (ms)</label>
              <input type="number" value={config.stats.attackWindupMs} onChange={(e) => updateStat('stats.attackWindupMs', parseInt(e.target.value) || 0)} style={{background:'#0d1117', color:'white', border:'1px solid #30363d', padding:'4px'}} />
            </div>
            <div className="field" style={{display:'flex', flexDirection:'column'}}>
              <label style={{fontSize:'10px'}}>Aggro Range</label>
              <input type="number" value={config.stats.aggroRange} onChange={(e) => updateStat('stats.aggroRange', parseInt(e.target.value) || 0)} style={{background:'#0d1117', color:'white', border:'1px solid #30363d', padding:'4px'}} />
            </div>
            <div className="field" style={{display:'flex', flexDirection:'column'}}>
              <label style={{fontSize:'10px'}}>Lose Aggro</label>
              <input type="number" value={config.stats.loseAggroRange} onChange={(e) => updateStat('stats.loseAggroRange', parseInt(e.target.value) || 0)} style={{background:'#0d1117', color:'white', border:'1px solid #30363d', padding:'4px'}} />
            </div>
            <div className="field" style={{display:'flex', flexDirection:'column'}}>
              <label style={{fontSize:'10px'}}>Knockback Resist</label>
              <input type="number" step="0.1" value={config.stats.knockbackResist} onChange={(e) => updateStat('stats.knockbackResist', parseFloat(e.target.value) || 0)} style={{background:'#0d1117', color:'white', border:'1px solid #30363d', padding:'4px'}} />
            </div>
            <div className="field" style={{display:'flex', flexDirection:'column'}}>
              <label style={{fontSize:'10px'}}>XP</label>
              <input type="number" value={config.stats.xp} onChange={(e) => updateStat('stats.xp', parseInt(e.target.value) || 0)} style={{background:'#0d1117', color:'white', border:'1px solid #30363d', padding:'4px'}} />
            </div>
            <div className="field" style={{display:'flex', flexDirection:'column'}}>
              <label style={{fontSize:'10px'}}>Score</label>
              <input type="number" value={config.stats.score} onChange={(e) => updateStat('stats.score', parseInt(e.target.value) || 0)} style={{background:'#0d1117', color:'white', border:'1px solid #30363d', padding:'4px'}} />
            </div>
            <div className="field" style={{display:'flex', flexDirection:'column'}}>
              <label style={{fontSize:'10px'}}>Behavior</label>
              <select value={config.stats.behavior} onChange={(e) => updateStat('stats.behavior', e.target.value)} style={{background:'#0d1117', color:'white', border:'1px solid #30363d', padding:'4px'}}>
                <option value="persistent">Persistent</option>
                <option value="limited">Limited</option>
              </select>
            </div>
            <div className="field" style={{display:'flex', flexDirection:'column'}}>
              <label style={{fontSize:'10px'}}>Display W</label>
              <input type="number" value={config.stats.displaySize?.width} onChange={(e) => updateStat('stats.displaySize.width', parseInt(e.target.value) || 0)} style={{background:'#0d1117', color:'white', border:'1px solid #30363d', padding:'4px'}} />
            </div>
            <div className="field" style={{display:'flex', flexDirection:'column'}}>
              <label style={{fontSize:'10px'}}>Display H</label>
              <input type="number" value={config.stats.displaySize?.height} onChange={(e) => updateStat('stats.displaySize.height', parseInt(e.target.value) || 0)} style={{background:'#0d1117', color:'white', border:'1px solid #30363d', padding:'4px'}} />
            </div>
          </div
        >
        </div>

        <div style={{ background: '#161b22', padding: '15px', borderRadius: '8px', border: '1px solid #30363d' }}>
          <h3 style={{marginTop:0, fontSize: '14px', color: '#8b949e'}}>Physics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{gridColumn: 'span 2', fontWeight: 'bold', fontSize: '11px', color: '#58a6ff', marginTop: '10px'}}>Body Circle</div>
            <div className="field" style={{display:'flex', flexDirection:'column'}}>
              <label style={{fontSize:'10px'}}>Radius</label>
              <input type="number" value={config.physics.bodyCircle.radius} onChange={(e) => updateStat('physics.bodyCircle.radius', parseInt(e.target.value) || 0)} style={{background:'#0d1117', color:'white', border:'1px solid #30363d', padding:'4px'}} />
            </div>
            <div className="field" style={{display:'flex', flexDirection:'column'}}>
              <label style={{fontSize:'10px'}}>X Offset</label>
              <input type="number" value={config.physics.bodyCircle.x} onChange={(e) => updateStat('physics.bodyCircle.x', parseInt(e.target.value) || 0)} style={{background:'#0d1117', color:'white', border:'1px solid #30363d', padding:'4px'}} />
            </div>
            <div className="field" style={{display:'flex', flexDirection:'column'}}>
              <label style={{fontSize:'10px'}}>Y Offset</label>
              <input type="number" value={config.physics.bodyCircle.y} onChange={(e) => updateStat('physics.bodyCircle.y', parseInt(e.target.value) || 0)} style={{background:'#0d1117', color:'white', border:'1px solid #30363d', padding:'4px'}} />
            </div>

            <div style={{gridColumn: 'span 2', fontWeight: 'bold', fontSize: '11px', color: '#58a6ff', marginTop: '10px'}}>Hitbox (Rect)</div>
            <div className="field" style={{display:'flex', flexDirection:'column'}}>
              <label style={{fontSize:'10px'}}>X</label>
              <input type="number" value={config.physics.hitbox.x} onChange={(e) => updateStat('physics.hitbox.x', parseInt(e.target.value) || 0)} style={{background:'#0d1117', color:'white', border:'1px solid #30363d', padding:'4px'}} />
            </div>
            <div className="field" style={{display:'flex', flexDirection:'column'}}>
              <label style={{fontSize:'10px'}}>Y</label>
              <input type="number" value={config.physics.hitbox.y} onChange={(e) => updateStat('physics.hitbox.y', parseInt(e.target.value) || 0)} style={{background:'#0d1117', color:'white', border:'1px solid #30363d', padding:'4px'}} />
            </div>
            <div className="field" style={{display:'flex', flexDirection:'column'}}>
              <label style={{fontSize:'10px'}}>Width</label>
              <input type="number" value={config.physics.hitbox.w} onChange={(e) => updateStat('physics.hitbox.w', parseInt(e.target.value) || 0)} style={{background:'#0d1117', color:'white', border:'1px solid #30363d', padding:'4px'}} />
            </div>
            <div className="field" style={{display:'flex', flexDirection:'column'}}>
              <label style={{fontSize:'10px'}}>Height</label>
              <input type="number" value={config.physics.hitbox.h} onChange={(e) => updateStat('physics.hitbox.h', parseInt(e.target.value) || 0)} style={{background:'#0d1117', color:'white', border:'1px solid #30363d', padding:'4px'}} />
            </div>
          </div>
        </div>

        <button
          onClick={() => onSave(enemies)}
          style={{ padding: '10px', background: '#238636', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Save Atlas JSON
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: '20px', height: '100%', pointerEvents: 'auto', zIndex: 1001 }}>
        <div style={{ background: '#010409', padding: '20px', borderRadius: '12px', border: '1px solid #30363d', textAlign: 'center', marginBottom: '40px' }}>
          <h3 style={{color:'#8b949e', fontSize:'14px'}}>Live Preview</h3>

          <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {config.visuals.animations && Object.keys(config.visuals.animations).map(anim => (
              <button
                key={anim}
                onClick={() => {
                  setActiveAnimKey(anim);
                }}
                style={{
                  padding: '5px 12px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  background: activeAnimKey === anim ? '#1D9E75' : '#161b22',
                  color: 'white',
                  border: '1px solid #30363d',
                  borderRadius: '4px'
                }}
              >
                {anim.charAt(0).toUpperCase() + anim.slice(1)}
              </button>
            ))}
          </div>

          <div style={{ marginTop: '20px', display: 'flex', gap: '15px', justifyContent: 'center' }}>
            <label style={{fontSize:'12px', cursor:'pointer'}}><input type="checkbox" checked={showHitbox} onChange={(e) => setShowHitbox(e.target.checked)} /> Hitbox</label>
            <label style={{fontSize:'12px', cursor:'pointer'}}><input type="checkbox" checked={showBody} onChange={(e) => setShowBody(e.target.checked)} /> Body</label>
            <label style={{fontSize:'12px', cursor:'pointer'}}><input type="checkbox" checked={showAttack} onChange={(e) => setShowAttack(e.target.checked)} /> Attack</label>
          </div>
          <div style={{ marginTop: '20px' }}>
            <label style={{fontSize:'12px'}}>Zoom: </label>
            <input type="number" value={zoom} onChange={(e) => setZoom(parseInt(e.target.value))} style={{ width: '50px', background:'#161b22', color:'white', border:'1px solid #30363d', padding:'2px' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnemyEditor;
