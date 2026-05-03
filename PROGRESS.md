# Room Maker Progress Log

## Current Status (2026-05-02)
AI and Pathfinding systems have been heavily updated to prevent entities from getting stuck and to implement smarter targeting.

### ✅ Completed
- [x] Port React Editor components to TypeScript (`src/editor/react/`)
- [x] Implement state management with `useEditorState.ts` (Paint, Erase, Fill, Undo/Redo)
- [x] Create `RoomDataConverter.ts` to bridge Editor JSON $\rightarrow$ Game RoomData
- [x] Set up `RoomEditorScene` as a shell for the React UI
- [x] Implement `GridSystem.ts` for coordinate mapping
- [x] Wire up `EDITOR_PLAYTEST_REQUESTED` $\rightarrow$ `PlaytestScene` transition
- [x] Implement flexible Flexbox layout for Editor UI (Toolbar, Layers, Canvas, TilesPsets)
- [x] Visual polish: a professional "dark mode" theme with refined colors and typography
- [x] Verify asset loading and tileset rendering via a project-integrated Tileset Browser (replaced manual ImportModal)
- [x] Visual Fidelity: Update `RoomBuilder` to render actual textures from `public/assets/tilemaps`
- [x] Persistence: Implement `RoomStorage` using local storage for quick access and JSON export for permanent storage
- [x] Room Library: Create a visual UI gallery to manage, load, and delete saved rooms
- [x] Integration: Load custom rooms from JSON in `GymScene` with collision support
- [x] Visual Fidelity: Implement frame-perfect tile rendering using (col, row) $\rightarrow$ frame index conversion
- [x] Gameplay: Set dynamic world bounds based on room dimensions
- [x] Gameplay: Fix Hero physics body offset to align collision circle with feet (Prevents "floating" collision)
- [x] Debugging: Remove unused `drawWorldBounds` call in `GymScene` to fix TypeError
- [x] Debugging: Center enemy attack range circles in `GymScene` debug view
- [x] Physics Alignment: Unified all entity physics circles and offsets to match visuals (32px grid)
- [x] Asset Integration: Updated manifest and GymScene to support Velmora tilesets
- [x] Editor Fix: Implemented async tileset loading during map import to fix missing textures
- [x] Editor Fix: Resolved TypeError when loading tilesets by tracking and exporting tile paths
- [x] Editor Fix: Fixed empty grid on map import by preserving tileset IDs during loading
- [x] Gameplay: Refactored GymScene to use spawn points defined in Room JSON instead of random positions
- [x] AI Overhaul: Implement `FlowFieldManager.ts` for Hero-centric navigation
- [x] AI Overhaul: Integrate Steering behaviors (Wall avoidance, separation) into Base Enemy and Minions
- [x] AI Overhaul: Implement `Pathfinder.ts` (BFS) for target-specific navigation around walls
- [x] AI Overhaul: Implement Aggro Range for minions to prevent global targeting
- [x] AI Overhaul: Restrict minion attacks/targeting to Line-of-Sight (LOS) only; otherwise follow Hero
- [x] AI Overhaul: Optimize BFS search with `MAX_ITERATIONS` to prevent game lag
- [x] Bug Fix: Resolve `TypeError` in `WarriorMinion` and `Enemy` related to `this.scene` and `heroOrTarget`

### 🚧 In Progress
- [x] **Debug Visualization:** Fix the position of the "blue circle" (attack range visualization) for minions to center it on the entity's hitbox (green box).
- [ ] **UI Bug Fix:** Resolve the layout shift issue where the Room Editor UI is pushed to the left.
- [ ] **Gameplay Loop:** Continue integrating "Doors" and "Enemy Spawns" into the active gameplay wave system.
- [x] **Dynamic Loading:** Implement async room loading pipeline in `GymScene` with `RoomAssetManager` and loading overlays.

### 📅 Next Steps
- [ ] **Gameplay Loop:** Continue integrating "Doors" and "Enemy Spawns" into the active gameplay wave system.
- [ ] **UI Bug Fix:** Resolve the layout shift issue where the Room Editor UI is pushed to the left.
