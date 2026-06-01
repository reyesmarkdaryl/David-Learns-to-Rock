We also made an Enemy Editor and currently trying to improve the Room Editor. We are trying to find a way to make the character hide behind a pillar.
The idea I was thinking of was cutting the asset into two wherein the base of the pillar is solid while the other half is passable but the character will be hidden behind it.

## Progress Update (2026-05-24)

### ✅ Completed Today
- **Core Gameplay Shift**: Disabled rhythm requirements and metronome to prioritize action-focused combat.
- **Enemy Balance**: Doubled health for all enemies to increase challenge.
- **Special Attack System**: 
  - Implemented `SpecialAttackSystem` singleton.
  - Added Holy Slash (Warrior), Holy Nova (Lancer), and Holy Bolt (Archer).
  - Fixed Holy Bolt to respect wall collisions and target nearest enemy.
  - Integrated special attacks into the summoning flow.
- **Upgrade System**:
  - Implemented `UpgradeSystem` for random stat boosts (HP, Damage, Dash Speed).
  - Created `UpgradePanel` React component with a "Dark Fantasy" aesthetic.
  - Wired the room-completion flow: Room Clear $\rightarrow$ Upgrade Panel $\rightarrow$ Selection/Skip $\rightarrow$ Next Room.
- **UI/UX Overhaul**:
  - Transitioned `GameUI` to a consistent "Dark Fantasy" theme (Void/Gold/Bone palette).
  - Polished `TrackRow`, `HeroHPBar`, and `SummonLog` visuals.
- **Enemy Combat Overhaul**:
  - Implemented varied attack patterns (Melee, AOE, Range Projectile, Range AOE) to prevent circular "back-stabbing" damage.
  - Introduced data-driven attack cooldowns with $\pm$10% variance.
  - Implemented attack interruption (stuns) for stunnable enemies when damaged.
  - Updated `enemies_atlas.json` with per-enemy balance stats.

### 🚧 Remaining / Improvement Plan
- **Upgrade Expansion**: Add new special attack abilities and tiered rarities as upgrade options.
- **Attack Polish**: Implement levels/variants for special attacks and enhance visual effects.
- **Wave Progression**: Implement more advanced enemy scaling and milestone boss fights.
- **Thematic Polish**: Improve room transition overlays and the general atmosphere.

---

## Current Status (2026-05-17)
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
- [x] Debugging: Remove unused `drawWorldBounds` call in `GymScene` debug view
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
- [x] Bug Fix: Resolved health laek
- [x] Debug Visualization: Fix attack range visualization for minions
- [x] UI Bug Fix: Resolve layout shift in Room Editor UI
- [x] Dynamic Loading: Implement async room loading pipeline with `RoomAssetManager`
- [x] Visual Polish: Fixed Lancer minion using red assets (corrected to blue)
- [x] Bug Fix: Resolved Phaser internal `TypeError` (currentFrame undefined) by fixing Lancer animation keys
- [x] Music System: Implemented Phaser-based Dynamic Stem System (Drums/Guitar/Bass) synchronized on minion summon
- [x] Music System: Integrated menu music loop using `full-hymn.wav` with interaction trigger
- [x] Rhythm UI: Integrated `gdd/rhythm_beat_ui.html` into `GameUI` with a dynamic `RhythmBar` and `RhythmSystem` backend
- [x] Rhythm Logic: Implemented tiered hit windows (Perfect, Good, Okay, Miss) and gated summoning sequences on rhythm success.
- [x] Gameplay: Implement dash invulnerability (Hero cannot take damage while in DASH state)
- [x] Bug Fix: Fix animation frame range crashes in `GymScene` by using explicit frames from `index.json`
- [x] Bug Fix: Correct asset naming typo for "special dash" spritesheet
- [x] Experimentation: Tested special dash animation with physics offsets (reverted to simple dash for stability)
- [x] Gameplay: Added new enemy types to expand combat variety
- [x] Visuals: Implemented a dynamic lighting system using Phaser 4
- [x] Gameplay: Integrated special attack animations for the Hero

### 🚧 In Progress
- [x] **Enemy Wave System:** implementing `WaveSystem.ts` and integrating into `GymScene` to replace static spawning.
- [ ] **Music Summoning System:** Implementing a synchronized band system using Tone.js where minion summons generate looping musical riffs.

### 📅 Next Steps
- [x] **Wave System Integration:** Finalize `GymScene` refactor to use `WaveSystem` for spawning and room completion.
- [x] **Combat Expansion:** Implement `SpecialAttackSystem` with Slash, Nova, and Bolt attacks triggered by minion summons.
- [x] **Rhythm System Removal:** Disable rhythm requirements and metronome for action-focused gameplay.
- [x] **Balance:** Increase all enemy health by 2x for increased challenge.
- [ ] **UI Feedback:** Hook `wave-changed` event to the HUD.
- [ ] **Gameplay Loop:** Continue integrating "Doors" and "Enemy Spawns" into the active gameplay wave system.
- [ ] **Music System: Final Polish & Dynamic Score:**
    - [ ] Implement "Battle Intensity Filter" (Dynamic LPF based on enemy count/proximity).
    - [ la] Add "Rhythmic Attack Integration" (Hero attacks trigger synced drum hits).
    - [ ] Implement "Harmonic Evolution" (Key shifts based on wave progression).

---

## 🎨 UX Iteration: The "Attention Split" Problem
**Context:** The player is currently splitting focus between the Hero (Combat) and the Rhythm Bar (Timing). This breaks the "flow" and takes away from the action-game feel.

### Proposed Approaches
1. **Combat Pop-ups:** Move "PERFECT/GOOD/MISS" labels from the Rhythm Bar to floating text above the Hero.
2. **Rhythm Aura:** Implement a visual "Beat Ring" around the Hero that pulses and flashes colors in sync with the BPM.
3. **World Pulse:** Remove the scrolling notes. The entire world (Hero sprite, ground tiles, enemies) subtly pulses or sways to the rhythm.

### Recommended Hybrid Approach
Combine the best of all three:
- **World-Space Feedback:** Labels pop up over the Hero.
- **Rhythm Aura:** A central visual pulse for timing reference.
- **Minimalist Bar:** Keep the `RhythmBar` for high-level stats (Combo, Multiplier, Accuracy) but remove the primary timing focus.

in the future, i will be adding several kinds of special attacks that will be triggered based on the combination that    was finished. Finishing the Warrior arrow combination  triggers a slash special attack, Finishing the Lancer           combination triggers an AOE around the Hero, Finishing the Archer arrow combination triggers a ranged special attack.    It will be boring to only have 3 special attacks so I will also have to prepare upgraded versions of those special     attacks that are earned as an option when the Round ends. The inspiration for the panel that appears after every        round is already prepared, its at gdd/dark_fantasy_powerup_panel.html but first i want to make sure that each special    attack is working. can we create a system for this? HolySlash_A_spritesheet.png for the slash, Holy Nova.png for the    AOE, Holy Bolt.png for range attack. 
