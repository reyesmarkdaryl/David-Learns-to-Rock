import * as Tone from 'tone';

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface BattleState {
    enemyCount: number;
    playerHP: number;
    maxPlayerHP: number;
    isBossPresent: boolean;
    comboStreak: number;
}

interface MinionMusic {
    instrument: any;
    sequence: Tone.Sequence;
}

class MusicManager {
    private static instance: MusicManager;
    private activeVoices: Map<string, MinionMusic> = new Map();
    private currentBandRiffIndex: number = 0;
    private mainFilter: Tone.Filter;
    private guitarSidechain: Tone.AmplitudeEnvelope;

    // Professional Metal Riffs (Relative Indices: 0=Root, 1=Third, 2=Fifth, 3=Flat5, 4=Flat7)
    private readonly guitarRiffs: (number | null)[][] = [
        [0, 0, 0, null, 0, 0, 0, 2], // 0: Thrash Gallop (DA-da-da DA-da-da CHUG)
        [0, 0, 0, 0, 0, 0, 3, 2],    // 1: Slayer Trem Pick (Fast and aggressive)
        [0, null, 0, null, 3, null, 2, null], // 2: Breakdown (Huge spaces = heavy)
        [0, null, null, 3, null, null, 2, null], // 3: Doom Metal (Slow and oppressive)
    ];

    private readonly bassRiffs: (number | null)[][] = [
        [0, 0, 0, null, 0, 0, 0, 2], // 0: Gallop (Sync with guitar)
        [0, 0, 0, 0, 0, 0, 0, 0],    // 1: Driving Root (Consistent low end)
        [0, null, 0, null, 0, null, 0, null], // 2: Heavy Space
        [0, 0, 0, 0, 0, 0, 0, 2],    // 3: Walking Heavy
    ];

    private readonly drumRiffs = [
        ['K', 'K', 'S', 'K'], // 0: Double Kick Groove
        ['K', 'K', 'K', 'K'], // 1: Pure Double Pedal
        ['K', '-', 'S', 'K'], // 2: Basic Metal
        ['K', 'H', 'S', 'K'], // 3: Power Groove
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
    private bassLoaded: boolean = false;
    private currentTension: number = 0.5;

    private instrumentGains: Record<string, Tone.Gain> = {};
    private volumes: Record<string, number> = {
        guitar: 0.8,
        bass: 0.4,
        drums: 0.9,
        crash: 0.3,
        ride: 0.5,
        china: 0.3
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

        // Define sample mappings first to avoid ReferenceErrors
        const guitarSamples = {
            "C3": "C3.wav",
            "E3": "E2.wav",
            "G3": "G3.wav",
            "A3": "A3.wav",
            "C4": "C4.wav",
        };

        const bassCorrectedSamples = {
            "E1": "E1.wav",
            "G1": "G1.wav",
            "A1": "As1.wav",
            "C2": "Cs1.wav",
        };

        // Global Master Filter for Battle Intensity
        this.mainFilter = new Tone.Filter(20000, "lowpass").toDestination();
        console.log('[MusicManager] mainFilter created');

        // Initialize Gain Nodes for Mixer
        Object.keys(this.volumes).forEach(key => {
            this.instrumentGains[key] = new Tone.Gain(this.volumes[key]).connect(this.mainFilter);
        });

        // 🎸 Sidechain Compression: Duck guitar when kick hits
        this.guitarSidechain = new Tone.AmplitudeEnvelope({
            attack: 0.001,
            decay: 0.1,
            sustain: 1.0,
            release: 0.2
        }).connect(this.instrumentGains['guitar']);

        // We reroute guitar through the sidechain instead of directly to the gain node
        // This will be handled in the instrument connection section below.

        // 🎸 ROCK GUITAR: Electric Guitar Sampler
        const guitar = new Tone.Sampler({
            urls: guitarSamples,
            baseUrl: "assets/samples/guitar-acoustic/",
            onload: () => {
                this.guitarLoaded = true;
                console.log('[MusicManager] Electric Guitar samples loaded');
            }
        });
        const guitarChorus = new Tone.Chorus(4, 2.5, 0.3).start();
        const guitarDist = new Tone.Distortion(0.4);

        guitar.connect(this.instrumentGains['guitar']);
        this.instrumentGains['guitar'].connect(guitarChorus);
        guitarChorus.connect(guitarDist);
        guitarDist.connect(this.mainFilter);
        this.instruments.guitar = guitar;
        console.log('[MusicManager] Electric Guitar sampler initialized (Sidechain Bypassed)');

        // 🎸 BASS: Electric Bass Sampler
        const bass = new Tone.Sampler({
            urls: bassCorrectedSamples,
            baseUrl: "assets/samples/bass-electric/",
            onload: () => {
                this.bassLoaded = true;
                console.log('[MusicManager] Electric Bass samples loaded');
            }
        });
        const bassFilter = new Tone.Filter(200, "lowpass");

        bass.connect(this.instrumentGains['bass']);
        this.instrumentGains['bass'].connect(bassFilter);
        bassFilter.connect(this.mainFilter);
        this.instruments.bass = bass;
        console.log('[MusicManager] Electric Bass sampler initialized');

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
            }).connect(drumOut),
            ride: new Tone.MetalSynth({
                frequency: 400,
                envelope: { attack: 0.001, decay: 0.4, release: 0.2 },
                harmonicity: 2.1,
                modulationIndex: 16,
            }).connect(drumOut),
            china: new Tone.MetalSynth({
                frequency: 800,
                envelope: { attack: 0.001, decay: 0.8, release: 0.1 },
                harmonicity: 10.1,
                modulationIndex: 64,
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

            // Structural Accent: Crash/Ride on the start of every 4th measure
            if (this.totalMeasuresPlayed % 4 === 0) {
                this.triggerSummonImpact(time); // Use crash for big measure starts
            } else if (this.totalMeasuresPlayed % 2 === 0) {
                // Ride cymbal on every other measure for consistency
                this.instruments.drums.ride.triggerAttackRelease('8n', time, 0.4);
            }

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

    public async waitForInstruments(): Promise<void> {
        console.log('[MusicManager] Waiting for instruments to load...');
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                clearInterval(check);
                console.warn('[MusicManager] Loading timeout reached. Starting game with partial assets.');
                resolve();
            }, 5000);

            const check = setInterval(() => {
                if (this.guitarLoaded && this.bassLoaded) {
                    clearInterval(check);
                    clearTimeout(timeout);
                    console.log('[MusicManager] All instruments loaded and ready!');
                    resolve();
                }
            }, 100);
        });
    }

    public triggerSummonImpact(time?: number) {
        if (this.activeVoices.size === 0) return; // Silence impact if no band members are active
        if (!this.crashCymbal) {
            console.warn('[MusicManager] crashCymbal not initialized yet');
            return;
        }
        const triggerTime = time || Tone.now() + 0.01;

        // Randomize between Crash and China for more variety in impact
        if (Math.random() > 0.7 && this.instruments.drums.china) {
            this.instruments.drums.china.triggerAttackRelease('4n', triggerTime, 0.8);
        } else {
            this.crashCymbal.triggerAttackRelease('2n', triggerTime, 0.6);
        }
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

    public updateBattleState(state: BattleState) {
        // Calculate Tension (0.0 to 1.0)
        // Factors: More enemies = higher tension, Lower HP = higher tension, Boss = massive boost
        const enemyFactor = Math.min(state.enemyCount / 20, 0.4);
        const hpFactor = 1.0 - (state.playerHP / state.maxPlayerHP);
        const bossFactor = state.isBossPresent ? 0.3 : 0;
        const comboFactor = Math.min(state.comboStreak / 10, 0.1);

        const newTension = Math.min(enemyFactor + (hpFactor * 0.3) + bossFactor + comboFactor, 1.0);

        // Smooth tension transition
        this.currentTension = this.currentTension * 0.9 + newTension * 0.1;

        // 1. Update Intensity Filter & Progression (Existing logic)
        this.updateIntensity(this.currentTension);

        // 2. Dynamic BPM: Scale from 100 to 130 BPM based on tension
        const targetBpm = 100 + (this.currentTension * 30);
        Tone.Transport.bpm.rampTo(targetBpm, 2);

        // 3. Riff Evolution: Force aggressive riffs at high tension
        if (this.currentTension > 0.8) {
            // Shift all active voices to aggressive riffs (Gallop/Tremolo)
            this.activeVoices.forEach((voice, type) => {
                if (type !== 'drums') {
                    // Force a specific aggressive riff index
                    this.currentBandRiffIndex = Math.random() > 0.5 ? 0 : 1;
                    this.updateMinionPattern(type, []); // Re-generate with new riff index
                }
            });
        }
    }


    public updateIntensity(intensity: number) {
        // Map intensity (0 to 1) to frequency (400Hz to 20000Hz)
        const freq = 400 + (intensity * 19600);
        this.mainFilter.frequency.rampTo(freq, 0.5); // Smooth transition

        // Dynamic Swing: High intensity = Straighter/More robotic feel (Djent/Thrash)
        const targetSwing = intensity >= 0.7 ? 0.1 : 0.35;
        Tone.Transport.swing = targetSwing;

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

                // DEBUG: Trace every note attempt
                // console.log(`[MusicManager] Sequence trigger for ${type}: note ${note} at ${time.toFixed(3)}`);

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
                    // Bass prioritizes root (tones[0]), Guitar uses power chords (Root + Fifth)
                    let finalNotes: string | string[];
                    if (type === 'bass') {
                        const relIndex = note as number;
                        finalNotes = relIndex === 0 ? tones[0] : tones[relIndex % tones.length];
                    } else {
                        const relIndex = note as number;
                        const root = tones[relIndex % tones.length];
                        // Power chord: Root + Fifth (tones[2] is typically the 5th)
                        finalNotes = [root, tones[2] || root];
                    }

                    // Guard for guitar loading
                    if (type === 'guitar' && !this.guitarLoaded) {
                        console.warn(`[MusicManager] GUITAR NOT LOADED - skipping note ${finalNotes}. guitarLoaded: ${this.guitarLoaded}`);
                        return;
                    }

                    if (type === 'guitar') {
                        console.log(`[MusicManager] Triggering sampled guitar power chord: ${finalNotes} at ${humanizedTime.toFixed(3)}`);
                    }

                    // Humanize velocity + Alternate Picking Simulation
                    const stepIndex = notes.indexOf(note);
                    const pickVariance = stepIndex % 2 === 0 ? 1.0 : 0.85;
                    const vel = (0.7 + Math.random() * 0.2) * accent * intensity * pickVariance;

                    // Use triggerAttackRelease to create "chugging" and avoid audio mud
                    // '8n' matches the sequence timing for a tight, rhythmic feel
                    instrument.triggerAttackRelease(finalNotes, '8n', humanizedTime, vel);
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

        // Sidechain Trigger: If it's a kick, duck the guitar
        if (note === 'K') {
            this.guitarSidechain.triggerAttackRelease(0.1, time);
        }

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
