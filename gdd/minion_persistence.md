# Implementation Plan: Minion Persistence Across Floors

## Goal
Summoned minions should persist when the player transitions between rooms (floors), retaining their current health and type, similar to the mechanics in Skull Horde.

## Current State
- Minions are spawned in `GymScene.spawnFriendlyMinion` and added to the `enemies` group.
- `GymScene.cleanupRoom` explicitly destroys all entities in the `enemies` group, including friendly minions, during room transitions.
- Minion state (HP) is stored within the entity instance and is lost upon destruction.

## Proposed Solution

### 1. Minion State Persistence Layer
Since Phaser scenes are destroyed/restarted during transitions, we need a data structure that lives outside the scene lifecycle.

- **Create a `MinionPersistenceManager`**: A singleton or a system attached to a global game state that tracks active minions.
- **State Definition**: Store only the essential data for each minion:
  - `type`: ('warrior' | 'lancer' | 'archer')
  - `currentHp`: number
  - `maxHp`: number

### 2. Transition Workflow

#### Phase A: Room Exit (Pre-Transition)
Before `cleanupRoom` is called in `transitionToNextRoom`:
1. Iterate through all entities in the `enemies` group.
2. Filter for entities with `team === 'hero'`.
3. Extract their `type` and `hp`.
4. Save this list to the `MinionPersistenceManager`.

#### Phase B: Room Entry (Post-Transition)
In `startRoomFlow`, after the hero is spawned and the room is ready:
1. Query the `MinionPersistenceManager` for the list of persisted minions.
2. For each persisted minion:
   - Spawn the corresponding minion type using `spawnFriendlyMinion` logic.
   - Override the new minion's `hp` with the saved `currentHp`.
   - Randomly position them around the hero's new spawn point.
3. Clear the persistence buffer for the new room.

## Technical Steps

### Step 1: Persistence Manager
- Create `src/systems/MinionPersistenceManager.ts`.
- Implement methods: `saveMinions(minions: MinionData[])` and `getPersistedMinions(): MinionData[]`.

### Step 2: Update `GymScene` Transition
- Modify `transitionToNextRoom` to call `MinionPersistenceManager.saveMinions()` before `cleanupRoom()`.
- Modify `startRoomFlow` to call a new `restoreMinions()` method after `this.hero` is created.

### Step 3: Update Minion Classes
- Ensure `WarriorMinion`, `LancerMinion`, and `ArcherMinion` have a consistent way to set their HP upon instantiation (e.g., via constructor or a `setHp` method).

## Success Criteria
- [ ] Summon a minion in Room A.
- [ ] Clear Room A.
- [ ] Transition to Room B.
- [ ] Verify the same number and type of minions spawn in Room B.
- [ ] Damage a minion in Room A, transition, and verify it spawns in Room B with the reduced health.
