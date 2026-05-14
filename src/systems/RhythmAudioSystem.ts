import * as Tone from 'tone';
import { gameEvents } from './GameEvents';

export class RhythmAudioSystem {
    private static instance: RhythmAudioSystem;
    private kick: Tone.MembraneSynth | null = null;
    private isInitialized: boolean = false;

    private constructor() {}

    public static getInstance(): RhythmAudioSystem {
        if (!RhythmAudioSystem.instance) {
            RhythmAudioSystem.instance = new RhythmAudioSystem();
        }
        return RhythmAudioSystem.instance;
    }

    public async init() {
        if (this.isInitialized) return;

        await Tone.start();

        // Simple a a a a low-pass kick drum for a subtle auditory cue
        this.kick = new Tone.MembraneSynth({
            pitchDecay: 0.05,
            octaves: 4,
            oscillator: {
                type: 'sine'
            },
            envelope: {
                attack: 0.001,
                decay: 0.1,
                sustain: 0,
                release: 0.1
            }
        }).toDestination();

        // Keep it slightly audible (roughly -15dB to -20dB)
        this.kick.volume.value = -18;

        this.setupListeners();
        this.isInitialized = true;
        console.log('[RhythmAudioSystem] Metronome initialized');
    }

    private setupListeners() {
        gameEvents.on('rhythm-beat-tick', () => {
            this.playBeat();
        });
    }

    private playBeat() {
        if (!this.kick) return;

        // Trigger a low kick on every beat
        // We use Tone.now() to ensure it's scheduled as accurately as possible
        this.kick.triggerAttackRelease('C1', '8n', Tone.now());
    }
}

export default RhythmAudioSystem.getInstance();
