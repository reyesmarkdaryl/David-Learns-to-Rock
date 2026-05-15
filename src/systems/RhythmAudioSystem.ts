import * as Tone from 'tone';
import { gameEvents } from './GameEvents';

export class RhythmAudioSystem {
    private static instance: RhythmAudioSystem;
    private kick: Tone.MembraneSynth | null = null;
    private snap: Tone.NoiseSynth | null = null;
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

        // Low-pass kick drum for the "feel"
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

        // Percussive "snap" using white noise for a natural drum-like transient
        this.snap = new Tone.NoiseSynth({
            noise: {
                type: 'white'
            },
            envelope: {
                attack: 0.001,
                decay: 0.005,
                sustain: 0,
                release: 0.005
            }
        }).toDestination();

        // Volume balancing
        this.kick.volume.value = -18;
        this.snap.volume.value = -22; // Sharp but not piercing

        this.setupListeners();
        this.isInitialized = true;
        console.log('[RhythmAudioSystem] Metronome initialized with percussive snap');
    }

    private setupListeners() {
        gameEvents.on('rhythm-beat-tick', () => {
            this.playBeat();
        });
    }

    private playBeat() {
        const now = Tone.now();

        if (this.kick) {
            this.kick.triggerAttackRelease('C1', '8n', now);
        }

        if (this.snap) {
            // NoiseSynth doesn't take a pitch, just a duration
            this.snap.triggerAttackRelease('16n', now);
        }
    }
}

export default RhythmAudioSystem.getInstance();
