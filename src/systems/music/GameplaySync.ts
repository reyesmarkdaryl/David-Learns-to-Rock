import * as Tone from 'tone';
import { gameEvents, MusicEvent } from '../GameEvents';
import { MixEngine } from './MixEngine';
import { MusicDirector } from './MusicDirector';
import { PerformanceEngine } from './PerformanceEngine';

export class GameplaySync {
    constructor(
        private mixEngine: MixEngine,
        private director: MusicDirector,
        private performance: PerformanceEngine
    ) {
        this.setupEventListeners();
    }

    private setupEventListeners() {
        gameEvents.on(MusicEvent.PLAYER_ATTACK, () => this.handleAttack());
        gameEvents.on(MusicEvent.ENEMY_KILLED, () => this.handleImpact());
        gameEvents.on(MusicEvent.SUMMON_SUCCESS, () => this.handleImpact());
        gameEvents.on(MusicEvent.COMBO_MILESTONE, () => this.handleCombo());
    }

    private handleAttack() {
        const time = this.performance.getScheduledTime();
        this.mixEngine.instruments.drums.snare.triggerAttackRelease('16n', time, 0.9);
        this.mixEngine.triggerSidechain(time);
    }

    private handleImpact() {
        const time = this.performance.getScheduledTime();
        this.performance.triggerImpact(time);
    }

    private handleCombo() {
        const time = this.performance.getScheduledTime();
        const squeal = new Tone.NoiseSynth({
            noise: { type: "white" },
            envelope: { attack: 0.001, decay: 0.1, sustain: 0 }
        }).toDestination();
        squeal.triggerAttackRelease('32n', time, 0.5);
        setTimeout(() => squeal.dispose(), 200);
    }
}
