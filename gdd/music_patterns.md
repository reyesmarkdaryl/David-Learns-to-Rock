Instead of letting raw input define everything, you give each minion a musical “DNA” riff, and the player input just modifies or selects variations. That way it always sounds like real music.

Below are ready-to-use rock riffs designed for your system (4 steps, loopable, works with Tone.js).

🎸 GLOBAL SETTINGS
Key: C Major / A Minor
Tempo: 90–110 BPM
Step length: '8n'
Pattern length: 4 steps
🎸 GUITAR RIFFS (Melody / Lead)

These are catchy and loop cleanly.

Riff G1 (Classic Rock)
['C4', 'E4', 'G4', 'E4']

👉 Safe, always sounds good

Riff G2 (Heroic / David vibe)
['E4', 'G4', 'A4', 'G4']

👉 Feels uplifting and “battle ready”

Riff G3 (Darker tone)
['A3', 'C4', 'E4', 'C4']

👉 Minor feel, good for intense fights

Riff G4 (Hooky loop)
['G4', 'E4', 'C4', 'E4']

👉 Feels like a real riff, not random notes

🎸 BASS RIFFS (Groove / Foundation)

Simpler = better.

Riff B1 (Root bounce)
['C2', null, 'C2', null]
Riff B2 (Walking feel)
['C2', 'E2', 'G2', 'E2']
Riff B3 (Minor groove)
['A1', null, 'A1', 'G1']
Riff B4 (Driving rock)
['C2', 'C2', 'G1', 'C2']
🥁 DRUM PATTERNS (Rhythm Backbone)

Use sample triggers instead of pitch.

Legend:

K = Kick
S = Snare
H = Hi-hat
- = rest
Pattern D1 (Basic rock)
['K', 'H', 'S', 'H']
Pattern D2 (Stronger groove)
['K', 'H', 'K', 'S']
Pattern D3 (Fast energy)
['K', 'H', 'S', 'K']
Pattern D4 (Spaced groove)
['K', '-', 'S', 'H']
🎮 HOW TO USE THESE IN YOUR SYSTEM
Option 1 (Recommended): Input selects riff

Instead of raw mapping:

index = hash(pattern) % riffPool.length
selectedRiff = riffPool[index]
Option 2: Input modifies riff

Example:

base = ['C4','E4','G4','E4']

// shift notes slightly based on input
Option 3: Hybrid (BEST)
Input chooses riff
Input slightly alters 1–2 notes

👉 Keeps:

musical quality ✅
player agency ✅
🔥 BONUS: Make Them Sound MORE Rock
Guitar

Add distortion:

const guitar = new Tone.Distortion(0.4).toDestination();
Bass

Lowpass filter:

const bass = new Tone.Filter(200, "lowpass").toDestination();
Drums

Add slight reverb:

const reverb = new Tone.Reverb(2).toDestination();
🎯 RESULT

With these riffs:

❌ No more random noise
✅ Instantly sounds like a band
✅ Player still “creates” music
✅ Fits your combat system