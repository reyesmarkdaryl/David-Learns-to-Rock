# Rhythm Horde - Room Editor Progress Tracker

This file tracks the implementation of the Room Editor based on the `room_maker_guide.md` architecture.

## ✅ Completed (Week 1 & 2)
### Infrastructure & Grid
- [x] `GridSystem.ts`: World-to-grid and grid-to-world conversions.
- [x] `GridSystem.ts`: Visual grid rendering in the scene.
- [x] `TilePainter.ts`: Basic painting logic (floor, wall, eraser).

### Core Editor Tools
- [x] `SelectionTool.ts`: Ability to select and drag objects across the grid.
- [x] `ObjectPlacer.ts`: Placement of Doors, Enemy Spawns, and Player Spawns.
- [x] `RoomEditorScene.ts`: Integrated input handling for all brushes and selection.
- [x] Deletion: Support for removing selected objects via the `DELETE` key.

### Data & Visuals
- [x] `SaveSystem.ts`: Exporting room layouts to JSON files.
- [x] `Toolbar.jsx`: React-based UI for switching tools and triggering save/load.
- [x] Visuals: Improved placeholder shapes for tiles and objects (colored rectangles/diamonds/circles with borders).

---

## 🚧 In Progress / Next Steps (Week 3)
### 1. Decor Socket System (High Priority)
- [ ] Implement `DecorSocket` data type in `RoomData.ts`.
- [ ] Add `placeDecorSocket` to `ObjectPlacer.ts`.
- [ ] Implement visual representation for sockets in `RoomEditorScene.ts`.
- [ ] Create a `BiomePools` configuration to map socket types (e.g., "torch") to random assets.

### 2. Playtest Loop (Critical)
- [ ] Create `PlaytestScene.ts` (or integrate with `GameScene.ts`).
- [ ] Implement a mechanism to pass the current editor's `RoomData` directly into the scene without saving to a file.
- [ ] Implement a "Playtest" button in the `Toolbar.jsx`.

### 3. Validation System
- [ ] Create `ValidationSystem.ts` to check for:
    - [ ] Presence of a player spawn.
    - [ ] Reachability of doors.
    - [ ] Valid spawn point placements.

---

## ⏳ Future Work (Week 4+)
- [ ] **Undo/Redo System:** Implementation of a command pattern to revert editor actions.
- [ ] **Thumbnail System:** Auto-generating a small image of the room for the room browser.
- [ ] **Room Variants:** Logic to generate different decor seeds for the same room layout.
- [ ] **Advanced Tools:** Mirroring, flipping, and area-fill painting.

---

**Last Updated:** 2026-04-29
