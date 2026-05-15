import * as Tone from 'tone';
import { RhythmSystem } from './RhythmSystem';

export interface BattleState {
    enemyCount: number;
    playerHP: number;
    maxPlayerHP: number;
    isBossPresent: boolean;
    comboStreak: number;
}

class MusicManager {
    private static instance: MusicManager;
    private isPlaying: boolean = false;
    private isInitializing: boolean = false;

    // Synths
    private kick!: Tone.MembraneSynth;
    private snare!: Tone.NoiseSynth;
    private hat!: Tone.MetalSynth;
    private drone!: Tone.AMSynth;
    private lead!: Tone.Synth;

    // Loops
    private drumLoop!: Tone.Sequence;
    private droneLoop!: Tone.Loop;
    private melodyLoop!: Tone.Sequence;

    private constructor() {}

    public static getInstance(): MusicManager {
        if (!MusicManager.instance) {
            MusicManager.instance = new MusicManager();
        }
        return MusicManager.instance;
    }

    public async start() {
        if (this.isPlaying) return;
        if (this.isInitializing) return;

        this.isInitializing = true;
        try {
            await Tone.start();

            const bpm = RhythmSystem.getInstance().bpm;
            Tone.Transport.bpm.value = bpm;

            this.initInstruments();
            this.initLoops();

            this.drumLoop.start(0);
            this.droneLoop.start(0);
            this.melodyLoop.start(0);

            Tone.Transport.start();
            this.isPlaying = true;
            console.log('[MusicManager] Tone.js Compose-Loop initialized');
        } finally {
            this.isInitializing = false;
        }
    }

    private initInstruments() {
        // Drum Pulse
        this.kick = new Tone.MembraneSynth({
            pitchDecay: 0.05,
            octaves: 6,
            oscillator: { type: 'sine' },
            envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.1 },
            volume: -10
        }).toDestination();

        this.snare = new Tone.NoiseSynth({
            noise: { type: 'white' },
            envelope: { attack: 0.001, decay: 0.15, sustain: 0 },
            volume: -12
        }).toDestination();

        this.hat = new Tone.MetalSynth({
            frequency: 250,
            envelope: { attack: 0.001, decay: 0.05, release: 0.01 },
            volume: -18
        }).toDestination();

        // Harmony Drone
        this.drone = new Tone.AMSynth({
            harmonicity: 1.5,
            envelope: { attack: 2, decay: 1, sustain: 0.8, release: 3 },
            volume: -20 // Start muted
        }).toDestination();

        // Melody Lead
        this.lead = new Tone.Synth({
            oscillator: { type: 'triangle' },
            envelope: { attack: 0.02, release: 0.3 },
            volume: -20 // Start muted
        }).toDestination();

        // Mute drums by default
        this.kick.volume.value = -100;
        this.snare.volume.value = -100;
        this.hat.volume.value = -100;
    }

    private initLoops() {
        // Drum Pattern
        this.drumLoop = new Tone.Sequence((time, step) => {
            if (step % 4 === 0) this.kick.triggerAttackRelease('C1', '8n', time);
            if (step % 4 === 2) this.kick.triggerAttackRelease('C1', '16n', time);
            if (step % 4 === 1 || step % 4 === 3) this.snare.triggerAttackRelease('8n', time);
            this.hat.triggerAttackRelease('32n', time, 0.2);
        }, [0,1,2,3,4,5,6,7], '8n');

        // Drone Harmony
        const chords = ['D3', 'A3', 'G3', 'Bb3'];
        this.droneLoop = new Tone.Loop((time) => {
            const note = chords[Math.floor(Math.random() * chords.length)];
            this.drone.triggerAttackRelease(note, '2m', time);
        }, '2m');

        // Melody Motif
        const motif = ['D4', null, 'F4', null, 'A4', null, 'G4', null];
        this.melodyLoop = new Tone.Sequence((time, note) => {
            if (note) this.lead.triggerAttackRelease(note, '8n', time);
        }, motif, '8n');
    }

    public queueInstrument(minionType: string) {
        if (!this.kick) return; // Guard against uninitialized synths

        switch (minionType) {
            case 'warrior':
                this.kick.volume.rampTo(-10, 0.5);
                this.snare.volume.rampTo(-12, 0.5);
                this.hat.volume.rampTo(-18, 0.5);
                break;
            case 'lancer':
                this.drone.volume.rampTo(-14, 0.5);
                break;
            case 'archer':
                this.lead.volume.rampTo(-10, 0.5);
                break;
        }
        console.log(`[MusicManager] Faded in ${minionType} layer`);
    }

    public stopInstrument(minionType: string) {
        if (!this.kick) return; // Guard against uninitialized synths

        switch (minionType) {
            case 'warrior':
                this.kick.volume.rampTo(-100, 0.5);
                this.snare.volume.rampTo(-100, 0.5);
                this.hat.volume.rampTo(-100, 0.5);
                break;
            case 'lancer':
                this.drone.volume.rampTo(-100, 0.5);
                break;
            case 'archer':
                this.lead.volume.rampTo(-100, 0.5);
                break;
        }
        console.log(`[MusicManager] Faded out ${minionType} layer`);
    }

    public stopAll() {
        Tone.Transport.stop();
        this.isPlaying = false;
        this.stopInstrument('warrior');
        this.stopInstrument('lancer');
        this.stopInstrument('archer');
    }

    public setScene(scene: any) {
        // No longer strictly needed for audio, but kept for interface compatibility
    }

    public async loadStems(manifest: any): Promise<void> {
        return Promise.resolve();
    }

    public updateBattleState(state: BattleState) {}
    public updateIntensity(intensity: number) {}
    public async waitForInstruments(): Promise<void> { return Promise.resolve(); }
    public playVocalStem() {}
}

export default MusicManager.getInstance();
