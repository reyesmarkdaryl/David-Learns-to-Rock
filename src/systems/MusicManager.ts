import * as Tone from 'tone';

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

interface MinionMusic {
    instrument: any;
    sequence: Tone.Sequence;
}

class MusicManager {
    private static instance: MusicManager;
    private activeVoices: Map<string, MinionMusic> = new Map();
    private currentBandRiffIndex: number = 0;
    private mainFilter: Tone.Filter;

    // Professional Rock Riffs (Relative Indices: 0=Root, 1=Third, 2=Fifth, 3=Flat5, 4=Flat7)
    private readonly guitarRiffs: (number | null)[][] = [
        [0, 0, null, 0, 3, 0, null, 0], // 0: Heavy Chug (Syncopated)
        [0, 4, 2, null, 2, 4, 0, null], // 1: Bluesy Hero (Walking)
        [2, 2, 0, null, 3, 0, null, null], // 2: Dark Descent (Heavy)
        [0, null, 0, 2, null, 0, 0, 4], // 3: Groove Hook (Rhythmic)
    ];

    private readonly bassRiffs: (number | null)[][] = [
        [0, null, 0, null], // 0: Root bounce
        [0, 0, 1, null], // 1: Walking
        [0, null, 2, 1], // 2: Minor groove
        [0, 0, 0, 2], // 3: Driving rock
    ];

    private readonly drumRiffs = [
        ['K', '-', 'S', '-'], // 0: Basic
        ['K', 'H', 'S', 'H'], // 1: Groove
        ['K', '-', 'K', 'S'], // 2: Energy
        ['K', 'H', 'S', 'K'], // 3: Power
    ];

    private readonly drumFills: string[][] = [
        ['S', 'S', 'K', 'S', 'S', 'S', 'K', 'S'], // Linear snare roll
        ['K', 'S', 'K', 'S', 'H', 'H', 'S', 'S'], // Syncopated kick/snare
        ['S', 'H', 'S', 'H', 'K', 'K', 'S', '-'], // Mixed percussion
        ['-', 'S', '-', 'S', 'K', 'S', 'K', 'S'], // Gapped rhythmic fill
    ];

    private readonly CHORD_TONES: Record<string, string[]> = {
        'Am': ['A3', 'C4', 'E4', 'Eb4', 'G3'], // Root, 3rd, 5th, b5, b7
        'C':  ['C4', 'E4', 'G4', 'Gb4', 'Bb3'],
        'G':  ['G3', 'B3', 'D4', 'Db4', 'F3'],
        'F':  ['F3', 'A3', 'C4', 'Cb4', 'Eb3'],
        'D':  ['D4', 'F#4', 'A4', 'Ab4', 'C4'],
    };

    private readonly PROGRESSIONS = [
        ['Am', 'G', 'F', 'G'], // Low Intensity
        ['Am', 'C', 'G', 'D'], // Medium Intensity
        ['Am', 'F', 'C', 'G'], // High Intensity
    ];

    private currentProgressionIndex: number = 0;
    private chordIndex: number = 0;
    private totalMeasuresPlayed: number = 0;
    private drumStepIndex: number = 0;
    private currentActiveFill: string[] = [];
    private guitarLoaded: boolean = false;

    private instrumentGains: Record<string, Tone.Gain> = {};
    private volumes: Record<string, number> = {
        guitar: 0.8,
        bass: 0.8,
        drums: 0.9,
        crash: 0.6
    };



    private instruments: Record<string, any> = {};
    private crashCymbal: Tone.NoiseSynth;

    private constructor() {
        console.log('[MusicManager] Initializing instruments...');
        try {
            this.initInstruments();
            console.log('[MusicManager] Instruments initialized successfully');
        } catch (e) {
            console.error('[MusicManager] Critical error during instrument init:', e);
        }
    }

    public static getInstance(): MusicManager {
        if (!MusicManager.instance) {
            MusicManager.instance = new MusicManager();
        }
        return MusicManager.instance;
    }

    private initInstruments() {
        console.log('[MusicManager] Running initInstruments...');
        // Global Master Filter for Battle Intensity
        this.mainFilter = new Tone.Filter(20000, "lowpass").toDestination();
        console.log('[MusicManager] mainFilter created');

        // Initialize Gain Nodes for Mixer
        Object.keys(this.volumes).forEach(key => {
            this.instrumentGains[key] = new Tone.Gain(this.volumes[key]).connect(this.mainFilter);
        });

        // 🎸 ROCK GUITAR: Transitioned to Sampler for realism
        const guitarSamples = {
            "C3": "AC pick low.wav",
            "D3": "AC pick mid.wav",
            "E3": "AC pick high.wav",
            "F3": "AC oct low.wav",
            "G3": "AC oct hi.wav",
        };
        const guitar = new Tone.Sampler({
            urls: guitarSamples,
            baseUrl: "/assets/samples/guitar/",
            onload: () => {
                this.guitarLoaded = true;
                console.log('[MusicManager] Guitar samples loaded');
            }
        });
        const guitarChorus = new Tone.Chorus(4, 2.5, 0.3).start();
        const guitarDist = new Tone.Distortion(0);

        guitar.connect(this.instrumentGains['guitar']);
        this.instrumentGains['guitar'].connect(guitarChorus);
        guitarChorus.connect(guitarDist);
        guitarDist.connect(this.mainFilter);
        this.instruments.guitar = guitar;
        console.log('[MusicManager] Guitar sampler initialized');

        // 🎸 BASS: Square wave + Deep Lowpass
        const bass = new Tone.MonoSynth({
            oscillator: { type: "square" },
            envelope: { attack: 0.01, decay: 0.3, sustain: 0.6, release: 1 }
        });
        const bassFilter = new Tone.Filter(120, "lowpass");

        bass.connect(this.instrumentGains['bass']);
        this.instrumentGains['bass'].connect(bassFilter);
        bassFilter.connect(this.mainFilter);
        this.instruments.bass = bass;
        console.log('[MusicManager] Bass initialized');

        // 🥁 DRUMS: Layered Percussion
        const drumOut = new Tone.Gain(this.volumes.drums);
        drumOut.connect(this.mainFilter);
        this.instrumentGains['drums'] = drumOut;

        this.instruments.drums = {
            kick: new Tone.MembraneSynth().connect(drumOut),
            snare: new Tone.NoiseSynth({
                noise: { type: "white" },
                envelope: { attack: 0.001, decay: 0.2, sustain: 0 }
            }).connect(drumOut),
            hihat: new Tone.MetalSynth({
                frequency: 200,
                envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
                harmonicity: 5.1,
                modulationIndex: 32,
            }).connect(drumOut)
        };
        console.log('[MusicManager] Drums initialized');

        // 💥 SUMMON IMPACT (Crash) - Bypasses main filter for maximum punch
        this.crashCymbal = new Tone.NoiseSynth({
            noise: { type: "white" },
            envelope: { attack: 0.001, decay: 1.0, sustain: 0 }
        });
        this.crashCymbal.connect(this.instrumentGains['crash']);
        this.instrumentGains['crash'].toDestination();
        console.log('[MusicManager] Crash cymbal initialized');
    }

    public async start() {
        await Tone.start();
        Tone.Transport.bpm.value = 100;
        Tone.Transport.swing = 0.35;
        Tone.Transport.swingSubdivision = '8n';

        // Chord Progression Tracker: Change chord every measure
        Tone.Transport.scheduleRepeat((time) => {
            this.totalMeasuresPlayed++;
            const progression = this.PROGRESSIONS[this.currentProgressionIndex];
            this.chordIndex = (this.chordIndex + 1) % progression.length;

            // Prepare fill for the upcoming measure if it's the 4th bar of the cycle
            if (this.totalMeasuresPlayed % 4 === 3) {
                const randomIdx = Math.floor(Math.random() * this.drumFills.length);
                this.currentActiveFill = this.drumFills[randomIdx];
            }
        }, '1m');

        Tone.Transport.start();
    }

    public stopAll() {
        this.activeVoices.forEach(voice => {
            voice.sequence.stop();
            voice.sequence.dispose();
        });
        this.activeVoices.clear();
    }

    public triggerSummonImpact(time?: number) {
        const triggerTime = time || Tone.now() + 0.01;
        this.crashCymbal.triggerAttackRelease('2n', triggerTime, 0.6);
    }

    public setVolume(instrument: string, volume: number) {
        if (this.instrumentGains[instrument]) {
            this.volumes[instrument] = volume;
            this.instrumentGains[instrument].gain.rampTo(volume, 0.1);
            console.log(`[MusicManager] ${instrument} volume set to ${volume}`);
        } else {
            console.error(`[MusicManager] No volume control found for instrument: ${instrument}`);
        }
    }


    public updateIntensity(intensity: number) {
        // Map intensity (0 to 1) to frequency (400Hz to 20000Hz)
        const freq = 400 + (intensity * 19600);
        this.mainFilter.frequency.rampTo(freq, 0.5); // Smooth transition

        // Update progression based on intensity thresholds
        let newProgIndex = 0;
        if (intensity >= 0.7) newProgIndex = 2;
        else if (intensity >= 0.4) newProgIndex = 1;

        if (this.currentProgressionIndex !== newProgIndex) {
            this.currentProgressionIndex = newProgIndex;
            this.chordIndex = 0; // Reset to start of new progression
        }
    }

    public updateMinionPattern(type: string, pattern: Direction[]) {
        console.log(`[MusicManager] Updating pattern for ${type}`, pattern);
        const seed = pattern.reduce((acc, dir) => acc + dir.charCodeAt(0), 0);
        this.currentBandRiffIndex = seed % 4;

        const notes = this.generatePhrase(type);
        console.log(`[MusicManager] Generated phrase for ${type}:`, notes);

        if (this.activeVoices.has(type)) {
            const oldVoice = this.activeVoices.get(type)!;
            oldVoice.sequence.stop();
            oldVoice.sequence.dispose();
        }

        const instrument = this.instruments[type];
        if (!instrument) {
            console.error(`[MusicManager] No instrument found for type: ${type}`);
            return;
        }

        const sequence = new Tone.Sequence(
            (time, note) => {
                if (note === null) return;

                // Humanize timing: slight shift for more natural feel
                const humanizedTime = time + (Math.random() * 0.02 - 0.01);

                const intensity = this.getIntensity();
                const currentBeat = (Tone.Transport.seconds * (Tone.Transport.bpm.value / 60)) % 4;
                const accent = this.getAccent(currentBeat);

                if (type === 'drums') {
                    let noteToPlay = note as string;

                    // Logic: Current step is in 2nd measure (8-15) AND it is the 4th measure of a cycle
                    if (this.drumStepIndex >= 8 && this.totalMeasuresPlayed % 4 === 3) {
                        const fillNote = this.currentActiveFill[this.drumStepIndex - 8];
                        if (fillNote) {
                            noteToPlay = fillNote;
                        }
                    }

                    this.playDrumNote(noteToPlay, humanizedTime, accent * intensity);

                    // Track drum step index (0-15) for phrase positioning
                    this.drumStepIndex = (this.drumStepIndex + 1) % 16;
                } else {
                    // Resolve harmonic note based on current chord
                    const progression = this.PROGRESSIONS[this.currentProgressionIndex];
                    const chord = progression[this.chordIndex];
                    const tones = this.CHORD_TONES[chord];

                    // Map relative index to chord tone
                    // Bass prioritizes root (tones[0]), Guitar uses samples
                    let finalNote: string;
                    if (type === 'bass') {
                        const relIndex = note as number;
                        finalNote = relIndex === 0 ? tones[0] : tones[relIndex % tones.length];
                    } else {
                        const relIndex = note as number;
                        finalNote = tones[relIndex % tones.length];
                    }

                    // Guard for guitar loading
                    if (type === 'guitar' && !this.guitarLoaded) {
                        console.log('[MusicManager] Guitar not yet loaded, skipping note');
                        return;
                    }

                    if (type === 'guitar') {
                        console.log(`[MusicManager] Playing sampled guitar note: ${finalNote} at ${humanizedTime.toFixed(3)}`);
                    }

                    // Humanize velocity
                    const vel = (0.7 + Math.random() * 0.2) * accent * intensity;

                    // Use triggerAttack instead of triggerAttackRelease to let the
                    // real guitar samples ring out naturally without being cut off.
                    instrument.triggerAttack(finalNote, humanizedTime, vel);
                }
            },
            notes,
            '8n'
        ).start(0);

        console.log(`[MusicManager] Sequence started for ${type}`);
        this.activeVoices.set(type, { instrument, sequence });
    }

    private getAccent(beat: number): number {
        const accents = [1.0, 0.6, 0.8, 0.6];
        return accents[Math.floor(beat) % 4] || 0.6;
    }

    private getIntensity(): number {
        const count = this.activeVoices.size;
        if (count === 0) return 0.5;
        if (count === 1) return 0.7;
        if (count === 2) return 0.9;
        return 1.0;
    }

    private generatePhrase(type: string): (string | number | null)[] {
        const riff = this.selectBaseRiff(type);
        const phrase: (string | number | null)[] = [];

        // A A B A structure (16 steps total)
        phrase.push(...riff); // A
        phrase.push(...riff); // A

        const variation = [...riff];
        if (variation[3] !== null) {
            variation[3] = variation[0];
        }
        phrase.push(...variation); // B

        phrase.push(...riff); // A

        return phrase;
    }

    private selectBaseRiff(type: string): (string | number | null)[] {
        const idx = this.currentBandRiffIndex;
        if (type === 'drums') return this.drumRiffs[idx];
        if (type === 'bass') return this.bassRiffs[idx];
        if (type === 'guitar') return this.guitarRiffs[idx];
        return [];
    }

    private playDrumNote(note: string, time: number, velocity: number) {
        const drums = this.instruments.drums;

        // Add random ghost notes for groove
        if (Math.random() < 0.15) {
            drums.hihat.triggerAttackRelease('16n', time, velocity * 0.4);
        }

        switch (note) {
            case 'K': drums.kick.triggerAttackRelease('C2', '8n', time, velocity); break;
            case 'S': drums.snare.triggerAttackRelease('8n', time, velocity); break;
            case 'H': drums.hihat.triggerAttackRelease('8n', time, velocity); break;
        }
    }
}

export default MusicManager.getInstance();
