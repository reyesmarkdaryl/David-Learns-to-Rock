import * as Phaser from 'phaser';

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

interface SummonTrack {
  name: string;
  targetSequence: Direction[];
  currentIndex: number;
  requiredLength: number;
  lastCompletedSequence: Direction[];
}

export class SummonSystem {
  private tracks: Map<string, SummonTrack> = new Map();
  private readonly DIRECTIONS: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];

  constructor() {
    this.initTracks();
  }

  private initTracks(): void {
    const trackConfigs = [
      { name: 'warrior', length: 6 },
      { name: 'lancer', length: 6 },
      { name: 'archer', length: 6 },
    ];

    trackConfigs.forEach(config => {
      this.tracks.set(config.name, this.createTrack(config.name, config.length));
    });
  }

  private createTrack(name: string, length: number): SummonTrack {
    const sequence: Direction[] = [];
    for (let i = 0; i < length; i++) {
      const randomDir = this.DIRECTIONS[Phaser.Math.Between(0, this.DIRECTIONS.length - 1)];
      sequence.push(randomDir);
    }

    return {
      name,
      targetSequence: sequence,
      currentIndex: 0,
      requiredLength: length,
      lastCompletedSequence: [],
    };
  }

  private randomizeTrack(name: string): void {
    const track = this.tracks.get(name);
    if (!track) return;

    const length = track.requiredLength;
    const newSequence: Direction[] = [];
    for (let i = 0; i < length; i++) {
      const randomDir = this.DIRECTIONS[Phaser.Math.Between(0, this.DIRECTIONS.length - 1)];
      newSequence.push(randomDir);
    }

    track.targetSequence = newSequence;
    track.currentIndex = 0;
  }

  checkInput(key: string): string[] {
    const inputMap: Record<string, Direction | null> = {
      'UP': 'UP',
      'DOWN': 'DOWN',
      'LEFT': 'LEFT',
      'RIGHT': 'RIGHT'
    };

    const direction = inputMap[key];
    if (!direction) return [];

    const completedSummons: string[] = [];

    this.tracks.forEach((track) => {
      if (direction === track.targetSequence[track.currentIndex]) {
        track.currentIndex++;
        if (track.currentIndex === track.requiredLength) {
          completedSummons.push(track.name);
          track.lastCompletedSequence = [...track.targetSequence];
          this.randomizeTrack(track.name);
        }
      } else {
        track.currentIndex = direction === track.targetSequence[0] ? 1 : 0; // Partial forgiveness: start over or start at 1
      }
    });

    return completedSummons;
  }

  getTracksState(): SummonTrack[] {
    return Array.from(this.tracks.values());
  }
}
