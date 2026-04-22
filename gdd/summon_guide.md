# Summoning Minigame

## Overview

The screen displays three summoning options, each with a randomly generated sequence of arrow keys. The player must press the correct arrow keys in the exact order shown to summon that minion type.

---

## Display Layout

```
Summon Warrior : [↑ ↓ ← → ↑]          (5 arrow keys)
Summon Lancer  : [→ ↑ ↓ ↑ ← → ↓]      (7 arrow keys)
Summon Archer  : [↓ → ↑ ← ↓ → ↑ ← →]  (9 arrow keys)
```

---

## Minion Types

| Minion   | Sequence Length | Description                        |
|----------|-----------------|------------------------------------|
| Warrior  | 5 arrow keys    | Easiest to summon, basic unit      |
| Lancer   | 7 arrow keys    | Moderate difficulty, mid-tier unit |
| Archer   | 9 arrow keys    | Hardest to summon, ranged unit     |

---

## Game Logic

### On Screen Load / Reset
1. Generate **5 random arrow keys** → assign to Warrior sequence.
2. Generate **7 random arrow keys** → assign to Lancer sequence.
3. Generate **9 random arrow keys** → assign to Archer sequence.
4. Display all three sequences on screen.

### Arrow Key Pool
```
↑  (Up)
↓  (Down)
←  (Left)
→  (Right)
```
Each key in a sequence is independently and randomly chosen from this pool. Repetitions are allowed.

### Input Tracking
- Track the player's current input progress against **all three sequences simultaneously**.
- Each sequence has its own independent progress counter (e.g., `warriorProgress`, `lancerProgress`, `archerProgress`).

### On Each Arrow Key Press
```
For each minion sequence:
  If pressed key == sequence[currentProgress]:
    Increment currentProgress by 1
    If currentProgress == sequence length:
      → SUMMON that minion
      → Reset that sequence (generate a new random one)
      → Reset that minion's progress counter to 0
  Else:
    Reset that minion's progress counter to 0
```

### Summoning
- When a sequence is completed, display a **summon message** (e.g., `"Warrior summoned!"`).
- Immediately regenerate a new random sequence for that minion slot.
- The other two sequences remain unchanged.

---

## Edge Cases

- **Wrong key mid-sequence**: Progress for that minion resets to 0. Other minions are unaffected.
- **Simultaneous partial matches**: Multiple minions can be partially matched at the same time.
- **Reroll on summon**: Only the completed sequence is rerolled; others persist.

---

## Example Flow

```
Screen shows:
  Summon Warrior : ↑ → ↓ ← ↑
  Summon Lancer  : ↓ ↓ → ↑ ← ↓ →
  Summon Archer  : → ↑ ← ↓ → ↑ ← ↓ ↑

Player presses: ↑ → ↓ ← ↑
  → Warrior progress: 1 → 2 → 3 → 4 → 5 ✓
  → "Warrior summoned!"
  → New 5-key sequence generated for Warrior
```

---

## Notes

- Sequences are regenerated randomly on each game start and after each successful summon.
- The player does **not** need to select which minion they are targeting — all three are tracked simultaneously.
- Consider adding visual feedback (highlight the current progress) for better UX.