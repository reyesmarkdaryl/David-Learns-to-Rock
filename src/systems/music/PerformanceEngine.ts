import * as Tone from 'tone';
import { MixEngine } from './MixEngine';
import { MusicDirector } from './MusicDirector';
import { RiffStep, Direction } from './MusicTypes';

interface MinionVoice {
    sequence: Tone.Sequence;
}

export class PerformanceEngine {
    private activeVoices: Map<string, MinionVoice> = new Map();
    private currentBandRiffIndex: number = 0;
    private riffMemoryCounter: number = 0;
    private readonly RIFF_MEMORY_DURATION: number = 12;
    private pendingRiffIndex: number | null = null;
    private drumStepIndex: number = 0;
    private lastScheduledTime: number = 0;
    private isMenuMode: boolean = false;

    private readonly GROOVE_OFFSETS = [0, -0.005, 0.002, -0.004, 0.001, -0.003, 0.004, -0.002];
    private readonly TIMING_VARIANCE = { guitar: 0.003, drums: 0.008, default: 0.005 };

    constructor(private mixEngine: MixEngine, private director: MusicDirector) {}

    private getScheduledTime(): number {
        const now = Tone.now();
        const epsilon = 0.005;
        const scheduledTime = Math.max(now, this.lastScheduledTime) + epsilon;
        this.lastScheduledTime = scheduledTime;
        return scheduledTime;
    }

    public setMenuMode(enabled: boolean) {
        this.isMenuMode = enabled;
    }

    public updateRiffMemory() {
        this.riffMemoryCounter++;
        if (this.riffMemoryCounter >= this.RIFF_MEMORY_DURATION) {
            this.riffMemoryCounter = 0;
            if (this.pendingRiffIndex !== null) {
                this.currentBandRiffIndex = this.pendingRiffIndex;
                this.pendingRiffIndex = null;
                this.activeVoices.forEach((_, type) => {
                    if (type !== 'drums') this.updateMinionPattern(type, []);
                });
            }
        }
    }

    public updateMinionPattern(type: string, pattern: Direction[]) {
        const seed = pattern.reduce((acc, dir) => acc + dir.charCodeAt(0), 0);
        const targetRiffIndex = seed % 4;

        if (this.riffMemoryCounter === 0) {
            this.currentBandRiffIndex = targetRiffIndex;
        } else {
            this.pendingRiffIndex = targetRiffIndex;
        }

        const notes = this.generatePhrase(type);

        if (this.activeVoices.has(type)) {
            const oldVoice = this.activeVoices.get(type)!;
            oldVoice.sequence.stop();
            oldVoice.sequence.dispose();
        }

        const instrument = type === 'guitar' ? { L: this.mixEngine.instruments.guitarL, R: this.mixEngine.instruments.guitarR } : this.mixEngine.instruments[type];
        if (!instrument) return;

        let localStep = 0;
        const sequence = new Tone.Sequence(
            (time, note) => {
                const stepIndex = localStep;
                localStep = (localStep + 1) % notes.length;

                if (note === null) return;

                const grooveOffset = this.GROOVE_OFFSETS[stepIndex % this.GROOVE_OFFSETS.length];
                const variance = this.TIMING_VARIANCE[type] || this.TIMING_VARIANCE.default;
                const humanizedTime = time + grooveOffset + (Math.random() * variance * 2 - variance);

                // SAFETY: Ensure we never schedule in the past
                const safeTime = Math.max(Tone.now(), humanizedTime);

                const intensity = this.getIntensity();
                const currentBeat = (Tone.Transport.seconds * (Tone.Transport.bpm.value / 60)) % 4;
                const accent = this.getAccent(currentBeat);

                if (type === 'drums') {
                    this.playDrumNote(note as string, safeTime, accent * intensity);
                    this.drumStepIndex = stepIndex;
                } else {
                    this.playStringNote(type, note, safeTime, accent * intensity, stepIndex);
                }
            },
            notes,
            '8n'
        ).start(0);

        this.activeVoices.set(type, { sequence });
    }

    private playStringNote(type: string, note: any, time: number, velocity: number, stepIndex: number) {
        const chord = this.director.getCurrentChord();
        const tones = this.director.CHORD_TONES[chord];
        const notesList = this.generatePhrase(type);
        const step = notesList[stepIndex] as RiffStep;

        if (!step || step.note === null) return;

        let finalNotes: string | string[] | null = null;
        const relIndex = step.note;
        if (relIndex !== null && relIndex !== undefined) {
            if (type === 'bass') {
                finalNotes = relIndex === 0 ? tones[0] : tones[relIndex % tones.length];
            } else {
                const root = tones[relIndex % tones.length];
                finalNotes = [root, tones[2] || root];
            }
        }

        if (!finalNotes) return;

        if (type === 'guitar' && !this.mixEngine.guitarLoaded) return;
        if (type === 'bass' && !this.mixEngine.bassLoaded) return;

        const pickVariance = stepIndex % 2 === 0 ? 1.0 : 0.85;
        const vel = velocity * pickVariance;
        const isPalmMute = step.mute ?? (Math.random() > 0.4);
        const duration = isPalmMute ? '16n' : '8n';
        const muteVel = isPalmMute ? vel * 0.7 : vel;

        if (type === 'guitar') {
            const gL = this.mixEngine.instruments.guitarL;
            const gR = this.mixEngine.instruments.guitarR;

            // CRITICAL: Use the passed 'time' and add a small offset,
            // but ensure we are not scheduling in the past.
            const timeL = Math.max(Tone.now(), time) - 0.001;
            const timeR = Math.max(Tone.now(), time) + 0.006;

            // Since we can't schedule in the past, if time is already gone,
            // we just use Tone.now()
            const safeL = Math.max(Tone.now(), timeL);
            const safeR = Math.max(Tone.now(), timeR);

            gL.triggerAttackRelease(finalNotes, duration, safeL, muteVel);
            gR.triggerAttackRelease(finalNotes, duration, safeR, muteVel);
        } else if (type === 'bass') {
            const bass = this.mixEngine.instruments.bass;
            bass.triggerAttackRelease(finalNotes, duration, Math.max(Tone.now(), time), muteVel);
        }
    }

    private playDrumNote(note: string, time: number, velocity: number) {
        const drums = this.mixEngine.instruments.drums;
        const curveVel = [1.0, 0.75, 0.9, 0.8][this.drumStepIndex % 4];
        const finalVelocity = velocity * curveVel;

        if (note === 'K') {
            this.mixEngine.triggerSidechain(time);
        }

        const isBeforeBackbeat = (this.drumStepIndex + 1) % 4 === 0;
        const ghostProb = isBeforeBackbeat ? 0.3 : 0.1;
        if (Math.random() < ghostProb) {
            drums.hihat.triggerAttackRelease('16n', time, finalVelocity * 0.3);
        }

        switch (note) {
            case 'K': drums.kick.triggerAttackRelease('C2', '8n', time, finalVelocity); break;
            case 'S': drums.snare.triggerAttackRelease('8n', time, finalVelocity); break;
            case 'H': drums.hihat.triggerAttackRelease('8n', time, finalVelocity); break;
        }
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

    private generatePhrase(type: string): (RiffStep | string | number | null)[] {
        if (this.isMenuMode) {
            const menuRiffs = {
                guitar: [
                    { note: 0, mute: true }, { note: null }, { note: 0, mute: true }, { note: 3, mute: false },
                    { note: 2, mute: false }, { note: null }, { note: 0, mute: true }, { note: null },
                    { note: 0, mute: true }, { note: null }, { note: 0, mute: true }, { note: 3, mute: false },
                    { note: 2, mute: false }, { note: null }, { note: 0, mute: true }, { note: null }
                ],
                bass: [
                    { note: 0, mute: true }, { note: 0, mute: true }, { note: 0, mute: false }, { note: null },
                    { note: 3, mute: true }, { note: 3, mute: true }, { note: 2, mute: false }, { note: null },
                    { note: 0, mute: true }, { note: 0, mute: true }, { note: 0, mute: false }, { note: null },
                    { note: 3, mute: true }, { note: 3, mute: true }, { note: 2, mute: false }, { note: null }
                ],
                drums: [
                    'K', 'H', 'S', 'H', 'K', 'K', 'S', 'H', 'K', 'H', 'S', 'H', 'K', 'K', 'S', 'H'
                ]
            };
            return menuRiffs[type as keyof typeof menuRiffs] || [];
        }

        const riffs = {
            guitar: [
                [ // 0: Thrash Gallop (The 'Slayer' feel)
                    { note: 0, mute: true }, { note: 0, mute: true }, { note: 0, mute: false }, { note: null, mute: false },
                    { note: 0, mute: true }, { note: 0, mute: true }, { note: 0, mute: false }, { note: 2, mute: false },
                    { note: 0, mute: true }, { note: 0, mute: true }, { note: 0, mute: false }, { note: null, mute: false },
                    { note: 0, mute: true }, { note: 0, mute: true }, { note: 3, mute: true }, { note: 2, mute: false }
                ],
                [ // 1: Tremolo Aggression (Fast, descending)
                    { note: 0, mute: false }, { note: 0, mute: false }, { note: 0, mute: false }, { note: 0, mute: false },
                    { note: 0, mute: false }, { note: 0, mute: false }, { note: 3, mute: true }, { note: 2, mute: true },
                    { note: 0, mute: false }, { note: 0, mute: false }, { note: 0, mute: false }, { note: 0, mute: false },
                    { note: 0, mute: false }, { note: 0, mute: false }, { note: 1, mute: true }, { note: 0, mute: false }
                ],
                [ // 2: The Breakdown (Huge gaps, heavy chugs)
                    { note: 0, mute: true }, { note: null, mute: false }, { note: 0, mute: true }, { note: null, mute: false },
                    { note: 0, mute: true }, { note: null, mute: false }, { note: 3, mute: true }, { note: null, mute: false },
                    { note: 0, mute: true }, { note: null, mute: false }, { note: 0, mute: true }, { note: null, mute: false },
                    { note: 0, mute: true }, { note: 0, mute: true }, { note: 0, mute: true }, { note: null, mute: false }
                ],
                [ // 3: Doom/Stoner (Sustained, oppressive)
                    { note: 0, mute: false }, { note: null, mute: false }, { note: null, mute: false }, { note: null, mute: false },
                    { note: 3, mute: true }, { note: null, mute: false }, { note: null, mute: false }, { note: null, mute: false },
                    { note: 0, mute: false }, { note: null, mute: false }, { note: null, mute: false }, { note: null, mute: false },
                    { note: 2, mute: false }, { note: null, mute: false }, { note: 0, mute: false }, { note: null, mute: false }
                ]
            ],
            bass: [
                [ // 0: Gallop Sync
                    { note: 0, mute: true }, { note: 0, mute: true }, { note: 0, mute: false }, { note: null, mute: false },
                    { note: 0, mute: true }, { note: 0, mute: true }, { note: 0, mute: false }, { note: 2, mute: false },
                    { note: 0, mute: true }, { note: 0, mute: true }, { note: 0, mute: false }, { note: null, mute: false },
                    { note: 0, mute: true }, { note: 0, mute: true }, { note: 3, mute: true }, { note: 2, mute: false }
                ],
                [ // 1: Root Driving
                    { note: 0, mute: false }, { note: 0, mute: false }, { note: 0, mute: false }, { note: 0, mute: false },
                    { note: 0, mute: false }, { note: 0, mute: false }, { note: 0, mute: false }, { note: 0, mute: false },
                    { note: 0, mute: false }, { note: 0, mute: false }, { note: 0, mute: false }, { note: 0, mute: false },
                    { note: 0, mute: false }, { note: 0, mute: false }, { note: 0, mute: false }, { note: 0, mute: false }
                ],
                [ // 2: Heavy Space Sync
                    { note: 0, mute: true }, { note: null, mute: false }, { note: 0, mute: true }, { note: null, mute: false },
                    { note: 0, mute: true }, { note: null, mute: false }, { note: 3, mute: true }, { note: null, mute: false },
                    { note: 0, mute: true }, { note: null, mute: false }, { note: 0, mute: true }, { note: null, mute: false },
                    { note: 0, mute: true }, { note: 0, mute: true }, { note: 0, mute: true }, { note: null, mute: false }
                ],
                [ // 3: Slow Walking
                    { note: 0, mute: true }, { note: null, mute: false }, { note: null, mute: false }, { note: null, mute: false },
                    { note: 3, mute: true }, { note: null, mute: false }, { note: null, mute: false }, { note: null, mute: false },
                    { note: 0, mute: true }, { note: null, mute: false }, { note: null, mute: false }, { note: null, mute: false },
                    { note: 2, mute: true }, { note: null, mute: false }, { note: 0, mute: true }, { note: null, mute: false }
                ]
            ],
            drums: [
                ['K', 'K', 'S', 'K', 'K', 'K', 'S', 'K', 'K', 'K', 'S', 'K', 'K', 'K', 'S', 'K'], // 0: Double Kick Gallop
                ['K', 'S', 'K', 'S', 'K', 'S', 'K', 'S', 'K', 'S', 'K', 'S', 'K', 'S', 'K', 'S'], // 1: Aggressive 2-beat
                ['K', '-', 'K', '-', 'K', '-', 'K', '-', 'K', 'K', 'K', '-', 'K', 'K', 'K', '-'], // 2: Breakdown Chug
                ['K', '-', '-', '-', 'K', '-', '-', '-', 'K', '-', '-', '-', 'K', '-', '-', '-']  // 3: Doom Slow
            ]
        };

        const riff = riffs[type as keyof typeof riffs][this.currentBandRiffIndex];
        return riff as (RiffStep | string | number | null)[];
    }

    public triggerAction(action: string, time: number) {
        const intensity = this.getIntensity();

        switch (action) {
            case 'CHUG':
                this.playSurgicalNote('bass', 0, time, 1.0 * intensity, true);
                this.playSurgicalNote('guitar', 0, time, 0.8 * intensity, true);
                break;
            case 'ACCENT':
                this.playSurgicalNote('bass', 0, time, 1.2 * intensity, false);
                this.playSurgicalNote('guitar', 0, time, 1.2 * intensity, false);
                this.playDrumSurgical('C', time, 1.0 * intensity); // Crash/China
                break;
            case 'FILL':
                // Rapid sequence of notes for a "lick" feel
                for (let i = 0; i < 4; i++) {
                    const noteOffset = [0, 3, 2, 0][i];
                    this.playSurgicalNote('guitar', noteOffset, time + (i * 0.06), 0.7 * intensity, false);
                }
                this.playDrumSurgical('S', time + 0.12, 0.8 * intensity); // Snare accent at end of fill
                break;
            case 'RESOLUTION':
                this.playSurgicalNote('bass', 0, time, 0.9 * intensity, false);
                this.playSurgicalNote('guitar', 0, time, 1.1 * intensity, false);
                // Long sustain handled by the triggerAttackRelease duration in playSurgicalNote
                break;
        }
    }

    private playSurgicalNote(type: string, relNote: number, time: number, velocity: number, isMuted: boolean) {
        const chord = this.director.getCurrentChord();
        const tones = this.director.CHORD_TONES[chord];
        const finalNote = tones[relNote % tones.length];

        if (!finalNote) return;

        if (type === 'guitar' && !this.mixEngine.guitarLoaded) return;
        if (type === 'bass' && !this.mixEngine.bassLoaded) return;

        const duration = isMuted ? '16n' : '4n';
        const vel = isMuted ? velocity * 0.7 : velocity;

        if (type === 'guitar') {
            const gL = this.mixEngine.instruments.guitarL;
            const gR = this.mixEngine.instruments.guitarR;
            gL.triggerAttackRelease(finalNote, duration, time, vel);
            gR.triggerAttackRelease(finalNote, duration, time + 0.005, vel);
        } else if (type === 'bass') {
            const bass = this.mixEngine.instruments.bass;
            bass.triggerAttackRelease(finalNote, duration, time, vel);
        }
    }

    private playDrumSurgical(note: string, time: number, velocity: number) {
        const drums = this.mixEngine.instruments.drums;
        if (!drums) return;

        switch (note) {
            case 'C':
                const crash = this.mixEngine.instruments.crashCymbal;
                if (crash) crash.triggerAttackRelease('2n', time, velocity);
                break;
            case 'K': drums.kick.triggerAttackRelease('C2', '8n', time, velocity); break;
            case 'S': drums.snare.triggerAttackRelease('8n', time, velocity); break;
            case 'H': drums.hihat.triggerAttackRelease('8n', time, velocity); break;
        }
    }

    public triggerImpact(time: number) {
        if (this.activeVoices.size === 0) return;
        const china = this.mixEngine.instruments.drums.china;
        const crash = this.mixEngine.instruments.crashCymbal;

        const safeTime = Math.max(Tone.now(), time);

        if (Math.random() > 0.7 && china) {
            china.triggerAttackRelease('4n', safeTime, 0.8);
        } else {
            crash.triggerAttackRelease('2n', safeTime, 0.6);
        }
    }

    public stopInstrument(type: string) {
        const voice = this.activeVoices.get(type);
        if (voice) {
            voice.sequence.stop();
            voice.sequence.dispose();
            this.activeVoices.delete(type);
        }
    }

    public playSummonHook(minionType: string, time: number) {
        const intensity = this.getIntensity();

        // Define a synchronized "hook" for each minion type
        // Hook = a short sequence of surgical notes across all instruments
        const hooks: Record<string, { instrument: string, note: number, timeOffset: number, mute: boolean }[]> = {
            'warrior': [
                { instrument: 'guitar', note: 0, timeOffset: 0, mute: false },
                { instrument: 'bass', note: 0, timeOffset: 0, mute: false },
                { instrument: 'guitar', note: 3, timeOffset: 0.2, mute: true },
                { instrument: 'guitar', note: 2, timeOffset: 0.4, mute: false },
                { instrument: 'bass', note: 2, timeOffset: 0.4, mute: false },
            ],
            'lancer': [
                { instrument: 'bass', note: 0, timeOffset: 0, mute: false },
                { instrument: 'bass', note: 0, timeOffset: 0.1, mute: true },
                { instrument: 'bass', note: 3, timeOffset: 0.2, mute: false },
                { instrument: 'guitar', note: 3, timeOffset: 0.2, mute: false },
                { instrument: 'bass', note: 0, timeOffset: 0.4, mute: false },
            ],
            'archer': [
                { instrument: 'guitar', note: 0, timeOffset: 0, mute: false },
                { instrument: 'guitar', note: 0, timeOffset: 0.1, mute: false },
                { instrument: 'guitar', note: 7, timeOffset: 0.2, mute: false },
                { instrument: 'bass', note: 0, timeOffset: 0, mute: false },
                { instrument: 'bass', note: 0, timeOffset: 0.2, mute: false },
            ]
        };

        const hook = hooks[minionType] || hooks['warrior'];

        hook.forEach(step => {
            this.playSurgicalNote(
                step.instrument,
                step.note,
                time + step.timeOffset,
                1.2 * intensity,
                step.mute
            );
        });
    }
}
