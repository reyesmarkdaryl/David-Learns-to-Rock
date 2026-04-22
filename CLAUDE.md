# CLAUDE.md — Rhythm Horde (Phaser 4 Game Project)

Behavioral guidelines and project context for AI-assisted development.
Merge with task-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

---

## Karpathy Guidelines

*(Source: [multica-ai/andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills))*

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: *"Would a senior engineer say this is overcomplicated?"* If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

**The test:** Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

## Project Overview

**Game Title:** Rhythm Horde *(working title)*

**Engine:** Phaser 4

**Inspirations:**
- **Skull Horde** — horde management, minion summoning
- **Vampire Survivors** — auto-battler waves, passive + active survival loop
- **Rhythm Games** — timed key input, pattern matching as core mechanic

**Core Loop:**
1. Waves of monsters spawn continuously.
2. The player can attack manually OR summon minions by completing arrow-key sequences.
3. Summoned minions fight autonomously until killed.
4. Each wave escalates in difficulty; survival and summoning efficiency are the win conditions.

---

## Architecture

```
src/
├── scenes/
│   ├── BootScene.ts          # Asset loading
│   ├── GameScene.ts          # Main gameplay loop
│   └── UIScene.ts            # HUD overlay (health, wave counter, summon panel)
├── systems/
│   ├── WaveSystem.ts         # Spawn scheduling & wave escalation
│   ├── SummonSystem.ts       # Sequence tracking & minion spawning
│   ├── CombatSystem.ts       # Player attacks, minion AI, enemy AI
│   └── RhythmSystem.ts       # Beat tracking (optional synced mode)
├── entities/
│   ├── enemies/
│   │   ├── BaseEnemy.ts
│   │   └── [EnemyType].ts
│   └── player/
│       ├── Hero.ts
│       ├── Warrior.ts
│       ├── Lancer.ts
│       └── Archer.ts
├── ui/
│   └── SummonPanel.ts        # Displays the 3 active arrow-key sequences
└── utils/
    └── SequenceGenerator.ts  # Random arrow-key sequence generation
```

---

## Summoning Minigame

### Overview

Three summon slots are always visible on screen. Each slot displays a randomly generated arrow-key sequence. The player presses arrow keys and all three sequences are tracked simultaneously — no slot selection required.

### Display Layout

```
Summon Warrior : [ ↑  ↓  ←  →  ↑ ]          (5 keys)
Summon Lancer  : [ →  ↑  ↓  ↑  ←  →  ↓ ]    (7 keys)
Summon Archer  : [ ↓  →  ↑  ←  ↓  →  ↑  ←  → ] (9 keys)
```

### Minion Types

| Minion  | Sequence Length | Role                              |
|---------|-----------------|-----------------------------------|
| Warrior | 5 arrow keys    | Easiest to summon; melee bruiser  |
| Lancer  | 7 arrow keys    | Mid-tier; high single-target DPS  |
| Archer  | 9 arrow keys    | Hardest; ranged, attacks from safe distance |

### Arrow Key Pool

```
↑  (Up)    ↓  (Down)    ←  (Left)    →  (Right)
```

Each key in a sequence is independently and randomly chosen from this pool. Repetitions are allowed.

### Sequence Logic

```
On screen load / after summon:
  Generate 5 random keys  → Warrior sequence
  Generate 7 random keys  → Lancer sequence
  Generate 9 random keys  → Archer sequence

On each arrow key press:
  For each minion sequence:
    If key == sequence[currentProgress]:
      currentProgress++
      If currentProgress == sequence.length:
        → SUMMON that minion
        → Regenerate a new sequence for that slot only
        → Reset that minion's progress to 0
    Else:
      Reset that minion's progress to 0
```

Progress counters are independent — a wrong key for Warrior does not affect Lancer or Archer.

### Visual Feedback

- Completed keys in the sequence are highlighted (e.g., green or glowing).
- Wrong key press flashes the slot red and resets progress indicator.
- On summon: brief flash animation + "Warrior summoned!" toast message.

### Edge Cases

- **Wrong key mid-sequence:** Only that minion's progress resets. Others unaffected.
- **Simultaneous partial matches:** Multiple minions can be partially matched at the same time.
- **Reroll on summon:** Only the completed sequence regenerates; the other two persist.

### Example Flow

```
Screen shows:
  Warrior : ↑ → ↓ ← ↑
  Lancer  : ↓ ↓ → ↑ ← ↓ →
  Archer  : → ↑ ← ↓ → ↑ ← ↓ ↑

Player presses: ↑ → ↓ ← ↑
  → Warrior progress: 1 → 2 → 3 → 4 → 5 ✓
  → "Warrior summoned!"
  → New 5-key sequence generated for Warrior slot
  → Lancer and Archer sequences unchanged
```

---

## Wave System

- Enemies spawn in waves with increasing count and health per wave.
- Wave timer and enemy count are shown in the HUD.
- Between waves: short breathing room (3–5 seconds), sequences do NOT reset.
- Boss enemies may appear on milestone waves (wave 5, 10, 15…).

---

## Combat

### Player (Manual Attack)
- Primary attack: left-click or spacebar (melee swing).
- No cooldown management needed at MVP; keep it simple.

### Minion AI
- Minions auto-target the nearest enemy on spawn.
- Warrior: melee range, charges at target.
- Lancer: melee-ish range, piercing attack hits multiple targets in a line.
- Archer: maintains distance, fires projectiles at nearest target.

### Enemy AI
- Enemies walk toward the player.
- On reaching the player, they deal periodic damage.
- Minions intercept enemies by proximity.

---

## Tech Notes

- **Phaser 4 only** — do not reference Phaser 3 APIs unless explicitly bridging.
- TypeScript strict mode enabled.
- Keep scenes lean; delegate logic to systems.
- Arrow key input must be captured at the scene level and passed to `SummonSystem` — do not let Phaser's default camera controls consume arrow keys.
- Sequences stored as `string[]` using `'UP' | 'DOWN' | 'LEFT' | 'RIGHT'` literals.
- All randomness through a single seedable utility function for future replay support.

---

## MVP Checklist

```
[ ] BootScene loads placeholder assets
[ ] Player renders and moves (WASD)
[ ] Basic enemy spawns and walks toward player
[ ] Player manual attack kills enemy
[ ] SummonPanel renders 3 sequences on screen
[ ] Arrow key input tracked against all 3 sequences
[ ] Successful sequence triggers minion spawn
[ ] Minion auto-targets and attacks nearest enemy
[ ] Wave counter increments; new enemies spawn each wave
[ ] Game-over state when player HP reaches 0
```

---

## Out of Scope (for now)

- Music synchronization / beat-locked input
- Skill trees or upgrades
- Saving / loading progress
- Multiplayer