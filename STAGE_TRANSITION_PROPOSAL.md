# Stage Transition System Proposal

## Goal
Implement a Hades/Skull Horde inspired progression loop where defeating all enemies in a room triggers a transition to a randomly selected new room from the `public/assets/rooms` directory.

## Proposed Approach

### 1. Room Registry
Add a list of available room keys to `src/config.ts` to facilitate random selection.
- **File**: `src/config.ts`
- **Change**: Export `AVAILABLE_ROOMS` array containing the keys for the rooms found in `public/assets/rooms`.

### 2. Transition Logic in `GymScene`
Implement a state-managed transition sequence in `src/scenes/GymScene.ts`.

#### State Management
- Add `isTransitioning: boolean` to prevent multiple transition triggers.
- Track `currentRoomKey: string` to avoid loading the same room twice in a row.

#### Cleanup Mechanism
Create a `cleanupRoom()` method to ensure the scene is pristine before loading the next room:
- Destroy `this.hero`.
- Clear `this.enemies` group (with `true, true` to destroy game objects).
- Clear `this.walls` group.
- Clear any active projectiles.
- Reset `isRoomReady` to `false`.

#### Win Condition & Trigger
In the `update()` loop, specifically after the existing "Cleanup dead enemies" section:
- Check if `this.enemies.getChildren().filter(e => e.team === 'enemy').length === 0`.
- If true and `!isTransitioning`, trigger `transitionToNextRoom()`.

#### Transition Sequence
1. Set `isTransitioning = true`.
2. Call `showLoading()`.
3. Execute `cleanupRoom()`.
4. Pick a random key from `AVAILABLE_ROOMS` (excluding `currentRoomKey`).
5. Call `startRoomFlow(newKey)`.
6. Inside `startRoomFlow`, update `currentRoomKey` and set `isTransitioning = false` upon completion.

## Critical Files
- `src/config.ts`: Room registry.
- `src/scenes/GymScene.ts`: Win detection, cleanup, and transition flow.

## Verification Plan
1. **Trigger Test**: Load a room with a single enemy $\rightarrow$ Kill enemy $\rightarrow$ Verify "LOADING ROOM..." overlay appears.
2. **Randomness Test**: Cycle through 5 rooms $\rightarrow$ Verify no immediate repeats of the same room.
3. **Integrity Test**: After several transitions, verify that only one Hero and one set of walls exist (no leaks).
4. **Asset Test**: Verify that different rooms load their respective tilesets and spawns correctly via `RoomAssetManager`.
