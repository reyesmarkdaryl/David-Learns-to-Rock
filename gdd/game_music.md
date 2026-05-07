🎮 GAME SYSTEM: “David Learns to Rock” – Music Summoning System
🧠 Core Concept
Player presses arrow key combinations
Input becomes a musical pattern
Pattern is assigned to a minion
Each minion plays a looped musical riff
All minions together form a synchronized band
🎹 INPUT SYSTEM
Directions:
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
Input Buffer:
Store recent inputs in an array
Max length: 3–5 keys

Example:

['UP', 'LEFT', 'RIGHT']
🔁 SUMMONING LOGIC
Minion Types (fixed):
guitar
bass
drums
Rules:
Each minion type can only have ONE active instance
Summoning:
If minion does NOT exist → create it
If minion EXISTS → update its pattern (do not create new one)
activeMinions: Record<string, Minion>
🎵 PATTERN → MUSIC
Mapping (melodic instruments):
const noteMap = {
  UP: 'C4',
  DOWN: 'A3',
  LEFT: 'F3',
  RIGHT: 'G3'
};
Drum Mapping:
const drumMap = {
  UP: 'C2',   // kick
  DOWN: 'D2', // snare
  LEFT: 'E2', // tom
  RIGHT: 'G2' // clap
};
Conversion:
pattern: Direction[] → notes: string[]
🎧 AUDIO ENGINE

Use: Tone.js

Global Setup
await Tone.start();
Tone.Transport.start();
Tone.Transport.bpm.value = 100;
🧱 MINION ARCHITECTURE
Minion
class Minion {
  type: 'guitar' | 'bass' | 'drums';
  music: MinionMusic;

  setPattern(pattern: Direction[]): void;
}
MinionMusic (CORE AUDIO UNIT)
Each minion owns one Tone.Sequence
Sequence loops indefinitely
Sequence is synced to Tone.Transport
class MinionMusic {
  instrument: Tone.Instrument;
  sequence: Tone.Sequence;

  constructor(instrument, notes);
  update(notes);
  stop();
}
🎼 LOOP BEHAVIOR
Sequence:
new Tone.Sequence(
  (time, note) => {
    instrument.triggerAttackRelease(note, '8n', time);
  },
  notes,
  '8n'
);
Rules:
All sequences:
Start at 0
Loop automatically
Stay in sync via Transport
🔄 RESUMMON BEHAVIOR

When summoning same minion type:

minion.setPattern(newPattern);

Internally:

Dispose old sequence
Create new sequence
Start immediately (still synced)
🧩 INSTRUMENT SETUP
const instruments = {
  guitar: Tone.Synth,
  bass: Tone.MonoSynth,
  drums: Tone.MembraneSynth
};

(All routed to toDestination())

⏱ TIMING RULES
All playback uses Tone.Transport
No manual timers
Grid: '8n' (eighth notes)
🎯 GAMEPLAY EFFECT
Each minion contributes a layer:
Guitar → melody
Bass → low groove
Drums → rhythm
Player builds music dynamically during combat
⚡ OPTIONAL (BUT RECOMMENDED)
1. Quantization
Snap input timing to beat
2. Humanization
sequence.humanize = true;
3. Swing
Tone.Transport.swing = 0.2;
4. Musical Key Constraint
Force all notes into a scale (prevents bad sounds)
🚀 EXPECTED RESULT
Player inputs → generates riffs
Riffs loop per minion
All loops sync perfectly
Re-summoning updates only one layer
System behaves like a live band builder
🔥 IMPLEMENTATION PRIORITY
Tone.js setup + Transport
Input buffer
Pattern → notes conversion
Minion + MinionMusic classes
Summon logic (replace/update)
Basic instruments working
Sync + loop validation