# Project Progress - Rhythm Horde

## 🎯 Current Focus (June 2, 2026)
- **Hero Animation & Asset Pipeline**: Migrating Hero to use `hero_atlas.json` for proper sprite loading in `GymScene.ts`.
- **Animation Fixes**: Resolving regressions in Special Attack animations caused by Hero sprite updates.

## ✅ Recently Completed
- **Combat Mechanics**:
  - Implemented Dash Attack.
  - Refined and fixed general attack patterns.
  - Added several new Special Attacks.
- **Enemy & Level Design**:
  - Developed and integrated an Enemy Editor.
  - Added new Boss enemies to the game.
- **Systems**:
  - Integrated `HeroAtlas.ts` for better asset management.

## 🚧 Remaining / Backlog
- **Special Attack Expansion**: Implement upgraded versions of special attacks earned via the post-round upgrade panel (Reference: `gdd/dark_fantasy_powerup_panel.html`).
- **Upgrade System Integration**: Fully wire the "Dark Fantasy" power-up panel into the game loop.
- **Wave Progression**: Refine scaling and milestone boss fight triggers.
- **UI/UX Polish**: Implement "Attention Split" solutions (Rhythm Aura, World-Space Feedback).
- **Music System**: Finalize dynamic score and "Battle Intensity Filter".

---

## 📜 History

### Progress Update (2026-05-24)
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

### Status (2026-05-17)
- **Editor Tools**: Ported React Editor components to TS, implemented state management, RoomDataConverter, and GridSystem.
- **Room System**: Implement `RoomEditorScene`, flexible Flexbox layout, and persistence via `RoomStorage`.
- **Integration**: Load custom rooms in `GymScene` with collision and dynamic world bounds.
- **AI Overhaul**: Implemented `FlowFieldManager.ts`, Steering behaviors, `Pathfinder.ts` (BFS), and Aggro Range.
- **Combat/Physics**: Unified entity physics circles, fixed Hero physics body offset.
- **Music**: Implemented Dynamic Stem System and menu music loop.
- **Rhythm UI**: Integrated `RhythmBar` and `RhythmSystem` with tiered hit windows.
- **Gameplay**: Implemented dash invulnerability.
