# Music System Implementation Plan: The Virtual Conductor

## Core Philosophy
The player does not play "notes"; they control "musical intentions." The system guarantees musicality through a hidden harmonic safety net, rhythmic quantization, and role-based phrasing.

## 1. The Riff Grammar (Input Mapping)
Instead of `Key -> Sample`, we use `Key -> Phrasing Action`.

| Key | Musical Role | Action/Effect |
| :--- | :--- | :--- |
| $\downarrow$ (Down) | **Foundation (Chug)** | Palm-muted rhythm, low-end drive, "heartbeat" of the riff. |
| $\uparrow$ (Up) | **Impact (Accent)** | Power chord hits, cymbal crashes, high-energy punctuations. |
| $\leftarrow$ (Left) | **Tension (Fill)** | Quick licks, slides, drum fills, bridging transitions. |
| $\rightarrow$ (Right) | **Resolution (Sustain)** | Open ringing chords, melodic release, breathing room. |

## 2. Technical Architecture

### A. The Harmonic Safety Net
- **Fixed Key:** The game is locked to a specific key (e.g., E Minor / Drop D).
- **Safe-Interval Lookup:** Any "random" or "procedural" notes are pulled from a curated list of scale-appropriate intervals to prevent harmonic clash.

### B. The Quantization Engine (The Groove Glue)
- **Input Buffering:** Inputs are not triggered instantly.
- **Tick-Based Triggering:** Sounds are snapped to the nearest 1/8 or 1/16 note tick of the master clock.
- **Sensation:** Turns clumsy input into professional, "locked-in" rhythmic performance.

### C. Band Layering (Minion Synchronization)
- **Archer (Drums):** The Master Clock. Provides the rhythmic grid.
- **Lancer (Bass):** Locks to the $\downarrow$ (Down) input and the Archer's kick drum.
- **Warrior (Guitar):** Handles the $\uparrow$ accents and $\leftarrow$ fills over the foundation.

### D. Summon Hooks (Phrase-Based Rewards)
- **Sequence Completion $\rightarrow$ Musical Reward:**
    - **Warrior Summon:** Triggers a 2-bar "Guitar Hook" that loops in the background.
    - **Lancer Summon:** Adds a "Bass Groove" layer to the current riff.
    - **Archer Summon:** Triggers a "Drum Fill" and increases overall band intensity.

## 3. Implementation Roadmap

### Phase 1: The Foundation (The Clock & Quantizer)
- [ ] Implement a master `MusicClock` with 16th-note precision.
- [ ] Create an `InputQuantizer` to snap arrow-key presses to the clock ticks.
- [ ] Set up the basic `RiffGrammar` mapping in `MusicManager`.

### Phase 2: The Band Integration (Layering)
- [ ] Map $\downarrow$ (Down) to a looping "Chug" state for Warrior and Lancer.
- [ ] Map $\uparrow$ (Up) to a one-shot "Accent" for Warrior and Archer.
- [ ] Synchronize Bass (Lancer) transients with Drum (Archer) transients.

### Phase 3: The Hook System (Summon Sync)
- [ ] Connect `SummonSystem` events to `MusicManager`.
- [ ] Implement "Riff Slots" where summoning a minion activates a specific, pre-authored melodic loop.
- [ ] Create "Intensity Levels" that change the band's default riff based on the number of active minions.

### Phase 4: Polish & Articulation
- [ ] Implement "Attack vs Sustain" sample layering to avoid "machine-gun" repetition.
- [ ] Add dynamic low-pass filters based on gameplay intensity.
- [ ] Final tuning of the "Harmonic Safety Net" for maximum "metalness."
