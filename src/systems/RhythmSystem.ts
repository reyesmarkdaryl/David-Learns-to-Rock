import { gameEvents } from "./GameEvents";

export interface RhythmState {
  bpm: number;
  combo: number;
  multiplier: number;
  accuracy: number;
  totalNotes: number;
  totalHits: number;
}

export class RhythmSystem {
  private static instance: RhythmSystem;

  public bpm: number = 110;
  public combo: number = 0;
  public multiplier: number = 1;
  public totalNotes: number = 0;
  public totalHits: number = 0;

  private startTime: number = 0;
  private lastBeatTime: number = 0;
  private beatCount: number = 0;

  // Forgiving hit window (in seconds)
  private readonly WINDOW_HIT = 0.25;

  private constructor() {}

  public static getInstance(): RhythmSystem {
    if (!RhythmSystem.instance) {
      RhythmSystem.instance = new RhythmSystem();
    }
    return RhythmSystem.instance;
  }

  public start() {
    this.startTime = performance.now() / 1000;
    this.lastBeatTime = this.startTime;
  }

  /**
   * Call this in the main game loop
   * @param currentTime current time in seconds
   */
  public update(currentTime: number) {
    const beatInterval = 60 / this.bpm;

    if (currentTime - this.lastBeatTime >= beatInterval) {
      this.lastBeatTime += beatInterval;
      this.beatCount++;

      gameEvents.emit('rhythm-beat-tick', {
        beatCount: this.beatCount,
        phase: 0, // Start of beat
      });
    }
  }

  /**
   * Evaluates if an action happened on the beat.
   * @returns true if it was a hit, false if it was a miss.
   */
  public evaluateHit(): boolean {
    const currentTime = performance.now() / 1000;
    const beatInterval = 60 / this.bpm;

    // Calculate how far we are from the nearest beat (past or future)
    const timeSinceLastBeat = currentTime - this.lastBeatTime;
    const timeUntilNextBeat = (this.lastBeatTime + beatInterval) - currentTime;
    const offset = Math.min(timeSinceLastBeat, timeUntilNextBeat);

    this.totalNotes++;

    if (offset <= this.WINDOW_HIT) {
      this.handleHit(true);
      return true;
    } else {
      this.handleHit(false);
      return false;
    }
  }

  private handleHit(isHit: boolean) {
    if (!isHit) {
      this.combo = 0;
    } else {
      this.combo++;
      this.totalHits++;
    }

    this.updateMultiplier();

    gameEvents.emit('rhythm-hit', {
      hit: isHit,
      combo: this.combo,
      multiplier: this.multiplier,
      accuracy: this.calculateAccuracy(),
    });
  }

  private updateMultiplier() {
    if (this.combo >= 15) this.multiplier = 4;
    else if (this.combo >= 10) this.multiplier = 3;
    else if (this.combo >= 5) this.multiplier = 2;
    else this.multiplier = 1;
  }

  public calculateAccuracy(): number {
    if (this.totalNotes === 0) return 100;
    return Math.round((this.totalHits / this.totalNotes) * 100);
  }

  public getBeatPhase(): number {
    const currentTime = performance.now() / 1000;
    const beatInterval = 60 / this.bpm;
    return (currentTime - this.lastBeatTime) / beatInterval;
  }

  public getState(): RhythmState {
    return {
      bpm: this.bpm,
      combo: this.combo,
      multiplier: this.multiplier,
      accuracy: this.calculateAccuracy(),
      totalNotes: this.totalNotes,
      totalHits: this.totalHits,
    };
  }
}
