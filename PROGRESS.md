# Project Progress - Rhythm Horde

we have slash assets like public/assets/attacks/HolySlash_A_spritesheet.png . i wonder if it will look good if we apply it on our current attack swing.

## 🎯 Current Focus (June 2, 2026)
- **Hero Animation & Asset Pipeline**: COMPLETED. Hero now uses a fully data-driven animation system with automatic texture switching.
- **Special Attack Pipeline**: COMPLETED. Unified naming convention and data-driven frame control for all special effects.

## ✅ Recently Completed
- **Hero Combat Polish**:
  - Implemented mirroring for horizontal attack animations based on hero facing direction.
  - Added a dynamic "Attack Cone" system (now based on `attackConeAngle` stat) to ensure attacks only hit enemies in front of the hero.
  - Integrated "Target Snapping" for both the thrust animation AND the attack cone, so damage follows the snapped trajectory.
  - Optimized hitbox detection to use the closest point on enemy hitboxes, fixing "missed" hits on large enemies.
  - Synchronized visual sword swing arcs with the physical attack cone.
  - Added an "Arcane Focus" upgrade to increase the attack cone angle.
  - Implemented visual debug representations for the attack cone (Green) and enemy hitboxes (Blue).
- **Hero Animation System**:
  - Implemented `baseTextureKey` logic in `Hero.ts` to mirror `Enemy.ts` behavior.
  - Rewrote `playAnim` to handle automatic texture switching, preventing "Texture not found" errors.
  - Fixed a critical race condition by implementing "Force Loading" of core Hero and Special Attack assets in `GymScene.preload()`.
  - Resolved `ReferenceError` by correctly importing `HeroAtlas` into `Hero.ts`.
- **Special Attack Pipeline**:
  - Restructured `hero_atlas.json` to use an object-based mapping for special attacks instead of a simple file list.
  - Added granular control for `startFrame`, `endFrame`, and `frameRate` for each special attack.
  - Synchronized keys across `HeroAtlas`, `SpecialAttackSystem`, and `GymScene` (e.g., `special_slash_anim`).
  - Implemented frame-boundary safety checks in `HeroAtlas.createAnimations` to prevent Phaser crashes when frame ranges are incorrect.
- **General Fixes**:
  - Resolved `PARSE_ERROR` in `GymScene.ts` caused by duplicate method declarations.
  - Verified Hero movement and basic special attack triggers are working.

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
- **AI Overhaul**: Implemented `FlowFieldManager.ts`, Steering behaviors, `Pathfinder.ts`으로 (BFS), and Aggro Range.
- **Combat/Physics**: Unified entity physics circles, fixed Hero physics body offset.
- **Music**: Implemented Dynamic Stem System and menu music loop.
- **Rhythm UI**: Integrated `RhythmBar` and `RhythmSystem` with tiered hit windows.
- **Gameplay**: Implemented dash invulnerability.
