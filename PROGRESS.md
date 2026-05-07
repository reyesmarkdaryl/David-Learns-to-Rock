# Room Maker Progress Log

## Current Status (2026-05-05)
Implementing a dynamic Enemy Wave System to replace static room spawning, allowing for structured combat progression and timed spawns.

### ✅ Completed
- [x] Port React Editor components to TypeScript (`src/editor/react/`)
- [x] Implement state management with `useEditorState.ts` (Paint, Erase, Fill, Undo/Redo)
- [x] Create `RoomDataConverter.ts` to bridge Editor JSON → Game RoomData
- [x] Set up `RoomEditorScene` as a shell for the React UI
- [x] Implement `GridSystem.ts` for coordinate mapping
- [x] Wire up `EDITOR_PLAYTEST_REQUESTED` → `PlaytestScene` transition
- [x] Implement flexible Flexbox layout for Editor UI (Toolbar, Layers, Canvas, TilesPsets)
- [x] Visual polish: a professional "dark mode" theme with refined colors and typography
- [x] Verify asset loading and tileset rendering via a project-integrated Tileset Browser
- [x] Visual Fidelity: Update `RoomBuilder` to render actual textures from `public/assets/tilemaps`
- [x] Persistence: Implement `RoomStorage` using local storage and JSON export
- [x] Room Library: Create a visual UI gallery to manage, load, and delete saved rooms
- [x] Integration: Load custom rooms from JSON in `GymScene` with collision support
- [x] Visual Fidelity: Implement frame-perfect tile rendering
- [x] Gameplay: Set dynamic world bounds based on room dimensions
- [x] Gameplay: Fix Hero physics body offset
- [x] Debugging: Remove unused `drawWorldBounds` call in `GymScene`
- [x] Debugging: Center enemy attack range circles in `GymScene` debug view
- [x] Physics Alignment: Unified all entity physics circles and offsets
- [x] Asset Integration: Updated manifest and GymScene to support Velmora tilesets
- [x] Editor Fix: Implemented async tileset loading during map import
- [x] Editor Fix: Resolved TypeError when loading tilesets
- [x] Editor Fix: Fixed empty grid on map import
- [x] Gameplay: Refactored GymScene to use spawn points defined in Room JSON
- [x] AI Overhaul: Implement `FlowFieldManager.ts` for Hero-centric navigation
- [x] AI Overhaul: Integrate Steering behaviors (Wall avoidance, separation)
- [x] AI Overhaul: Implement `Pathfinder.ts` (BFS)
- [x] AI Overhaul: Implement Aggro Range for minions
- [x] AI Overhaul: Restrict minion attacks/targeting to Line-of-Sight (LOS)
- [x] AI Overhaul: Optimize BFS search with `MAX_ITERATIONS`
- [x] Bug Fix: Resolve `TypeError` in `WarriorMinion` and `Enemy`
- [x] Bug Fix: Fixed room transition infinite loop
- [x] Bug Fix: Prevented crashes during scene transitions
- [x] Bug Fix: Resolved health bar leak
- [x] Debug Visualization: Fix attack range visualization for minions
- [x] UI Bug Fix: Resolve layout shift in Room Editor UI
- [x] Dynamic Loading: Implement async room loading pipeline with `RoomAssetManager`
- [x] Visual Polish: Fixed Lancer minion using red assets (corrected to blue)
- [x] Bug Fix: Resolved Phaser internal `TypeError` (currentFrame undefined) by fixing Lancer animation keys

### 🚧 In Progress
- [x] **Enemy Wave System:** implementing `WaveSystem.ts` and integrating into `GymScene` to replace static spawning.
- [ ] **Music Summoning System:** Implementing a synchronized band system using Tone.js where minion summons generate looping musical riffs.

### 📅 Next Steps
- [x] **Wave System Integration:** Finalize `GymScene` refactor to use `WaveSystem` for spawning and room completion.
- [ ] **UI Feedback:** Hook `wave-changed` event to the HUD.
- [ ] **Gameplay Loop:** Continue integrating "Doors" and "Enemy Spawns" into the active gameplay wave system.
- [ ] **Music System: Final Polish & Dynamic Score:**
    - [ ] Implement "Battle Intensity Filter" (Dynamic LPF based on enemy count/proximity).
    - [ ] Add "Rhythmic Attack Integration" (Hero attacks trigger synced drum hits).
    - [ ] Implement "Harmonic Evolution" (Key shifts based on wave progression).

### 🎸 Music System: "Metal Polish" Implementation Plan
(Reference: `gdd/music_direction/improve_music5.md`)

**Goal:** Transition from "arcade combat music" to "authentic metal energy" by focusing on rhythm, attack, and harmonic weight.

- [ ] **Step 1: The "Heavy" Foundation**
    - Replace single notes with Power Chords (Root + Fifth) for guitars.
    - Switch from `triggerAttack` to `triggerAttackRelease` to create rhythmic "chugs" and prevent audio mud.
    - Implement "Alternate Picking" velocity variance (slight volume difference between odd/even notes).
- [ ] **Step 2: The "Groove" Update**
    - Integrate authentic metal riff patterns: Thrash Gallops, Tremolo Picking, and Breakdowns.
    - Introduce "Rhythmic Silence" (nulls) to create space and tension.
    - Experiment with 16th note rhythms for high-intensity segments.
- [ ] **Step 3: The "Percussion" Punch**
    - Update `drumRiffs` to include double-kick pedal patterns.
    - Add cymbal accents (Crash/Ride) for measure starts and summon events.
- [ ] **Step 4: Advanced Reactive Audio**
    - Implement "Sidechain Compression" (ducking guitar volume when the kick hits).
    - Expand `updateIntensity` to modify BPM and distortion levels dynamically.
    - Map Minion Types to specific Metal Genres (e.g., Warrior $\rightarrow$ Thrash, Tank $\rightarrow$ Doom).


### Enemy Wave System Implementation Plan                                                                              
     Context                                                                                                            
     Currently, enemies in GymScene spawn in a single static batch when a room loads. This creates a simplistic combat
     experience. We are replacing this with a dynamic WaveSystem that spawns enemies in waves over time, introducing
     intervals, cooldowns, and a structured progression of enemy types.

     Recommended Approach

     1. Configuration Update (src/config.ts)

     Replace the flat GYM_ENEMY_SPAWNS array with a structured GYM_WAVES definition.
     - Define WaveDefinition interface: { waveNumber: number, enemies: { type: string, count: number }[], interval:
     number, cooldown: number }.
     - Define GYM_WAVES containing the progression for the gym room.

     2. New System: WaveSystem (src/systems/WaveSystem.ts)

     Create a state-driven manager for the combat flow of a room.
     - States: WAITING $\rightarrow$ SPAWNING $\rightarrow$ COOLDOWN $\rightarrow$ COMPLETE.
     - Logic:
       - Tracks currentWaveIndex.
       - Uses a waveQueue to manage pending spawns for the active wave.
       - Manages a spawnTimer (per-enemy interval) and a cooldownTimer (between waves).
       - Integrates with SpawnManager to execute spawning at valid room points.
       - Signals isRoomComplete() when all defined waves are finished and all enemies are dead.

     3. GymScene Integration (src/scenes/GymScene.ts)

     Refactor the scene to delegate combat orchestration to the WaveSystem.
     - Initialization: Instantiate WaveSystem and call waveSystem.start() in startRoomFlow, removing the static
     GYM_ENEMY_SPAWNS loop.
     - Loop: Call waveSystem.update(time, delta, enemyCount) in the main update loop.
     - Transition: Change the room clear trigger from remainingEnemies.length === 0 to waveSystem.isRoomComplete().

     4. UX & Events

     - Emit wave-changed event via gameEvents whenever a new wave starts.
     - (Optional) Hook this event into the HUD to display "Wave X" to the player.

     Critical Files

     - src/config.ts: Update spawn configurations.
     - src/systems/WaveSystem.ts: Create new wave management logic.
     - src/scenes/GymScene.ts: Update scene lifecycle and update loop.
     - src/systems/SpawnManager.ts: Reuse for enemy instantiation.
     - src/systems/GameEvents.ts: For wave transition notifications.

     Verification Plan

     1. Spawn Sequence: Verify that enemies spawn one by one (or in small groups) at the defined interval rather than
     all at once.
     2. Wave Transitions: Ensure a cooldown period exists after a wave is cleared before the next wave begins spawning.
     3. Room Completion: Verify that transitionToNextRoom is only triggered after the final wave is cleared.
     4. UI Check: Confirm that the wave-changed event is emitted correctly.

