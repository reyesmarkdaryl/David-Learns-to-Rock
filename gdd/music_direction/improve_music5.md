You now have:

shared harmonic structure
evolving progressions
fills
dynamic intensity
humanization
riff synchronization

That’s basically a procedural band system.

But right now your riffs are still closer to:

blues rock
garage rock
arcade combat music

If you want actual metal energy, you’re still missing:

Palm-muted gallops
Tremolo picking
Rhythmic silence
Octave jumps
Pedal tones
Real metal drum accents
Proper low tuning feel
Transitional tension
BIGGEST IMPROVEMENT FIRST:
Add RHYTHM TYPES

Right now your riffs are:

[0, 0, null, 0, 3, 0, null, 0]

But metal is mostly about:

rhythm
attack
silence

Not melody.

Add These Metal Riffs

These are MUCH more authentic.

THRASH GALLOP

(Metallica / Maiden)

[0, 0, 0, null, 0, 0, 0, 2]

Feel:

DA-da-da DA-da-da CHUG
SLAYER TREM PICK
[0,0,0,0,0,0,3,2]

Played very fast.

This sounds amazing if:

'16n'

instead of '8n'.

BREAKDOWN RIFF
[0, null, 0, null, 3, null, 2, null]

Huge spaces = heavy.

DOOM METAL
[0, null, null, 3, null, null, 2, null]

Slow and oppressive.

DJENT STYLE
[0, null, 0, 0, null, 3, 0, null]

Works great with:

Tone.Transport.swing = 0;
Add a Separate Rhythm Engine

This is MASSIVE.

Instead of:

note arrays

Split:

rhythm
pitch

Example:

const rhythm = [1,0,1,1,0,1,0,0];
const pitches = [0,3,2,4];

Now you can combine:

any rhythm
any harmonic shape

Which creates:

hundreds of riffs procedurally.
Your Current Harmonic Mapping is GOOD

This:

'Am': ['A3', 'C4', 'E4', 'Eb4', 'G3']

is already smart.

You included:

b5
b7

which are core metal tones.

But add:

'F#'

and diminished movement.

Metal LOVES tritones.

Add Metal Scale Degrees

Instead of:

Root, 3rd, 5th

Add:

b2
b5
b6

Example:

'Am': [
 'A2', // root
 'Bb2', // b2
 'C3', // minor third
 'Eb3', // tritone
 'F3', // b6
 'G3' // b7
]

Now your riffs instantly sound darker.

HUGE IMPROVEMENT:
Use POWER CHORDS Instead of Single Notes

Right now:

instrument.triggerAttack(finalNote)

Metal guitars almost never play single notes during riffs.

Instead:

['A2', 'E3']

or

['A2', 'E3', 'A3']

Example:

instrument.triggerAttackRelease(
    ['A2','E3'],
    '8n',
    humanizedTime,
    vel
);

This alone will massively improve realism.

EVEN BETTER:
Alternate Pick Simulation

Human guitarists don’t hit every note equally.

Add:

const pickVariance =
    step % 2 === 0 ? 1.0 : 0.82;

Then:

vel *= pickVariance;

Instant realism.

Your Drums Need Double Kick

Right now:

['K', '-', 'K', 'S']

Metal drums need:

['K','K','S','K']

and

['K','K','K','K']

Fast double pedal creates metal instantly.

Add Cymbal Accents

Right now hihat is doing everything.

Add:

crash
ride
china

Especially:

on measure starts
summons
boss spawns
BEST IMPROVEMENT FOR YOUR GAME:
Minion Type = Genre

This is PERFECT for your game concept.

Example:

Minion	Genre
Warrior	Thrash
Tank	Doom
Assassin	Black Metal
Priest	Choir / Ambient
Boss	Djent

Now summoning changes the band style.

That’s memorable gameplay identity.

Your Biggest Audio Problem Right Now

This:

instrument.triggerAttack(finalNote)

means notes NEVER stop.

Eventually:

overlaps
mud
clipping
infinite sustain

Instead:

triggerAttackRelease()

BUT:
use longer durations.

Example:

'4n'

or

'2n'

for sustained chords.

VERY IMPORTANT:
Your Guitar Samples Are Better Than You Think

You have:

multiple octaves
sharps
enough range for metal

The electric guitar pack especially is usable.

But:
you should switch to:

assets/samples/guitar-electric/

for combat.

Keep acoustic for:

towns
menus
story scenes
Another MASSIVE Upgrade:
Add Sidechain Compression

When kick hits:

duck guitar volume slightly

This creates:

punch
clarity
professional mix feel

Tone.js can do this.

BEST THING YOU COULD ADD:
Battle Director

You already have:

updateIntensity()

Take it further.

Track:

nearby enemies
HP
combo streak
summons alive
boss phase

Then dynamically:

raise BPM
switch riffs
add double kick
open filter
add distortion

This makes music feel reactive.

Most Important Recommendation

DO NOT try to make:

fully melodic songs

Focus on:

groove
rhythm
aggression
transitions

Game combat music succeeds through:

repetition
tension
layering

not complexity.

Your current system is already structurally strong enough to become genuinely impressive if you improve:

rhythm realism
chord voicings
percussion
dynamic transitions

That’s where the next leap is.