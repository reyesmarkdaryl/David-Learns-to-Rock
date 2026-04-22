import * as Phaser from 'phaser';

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

interface SummonTrack {
  name: string;
  targetSequence: Direction[];
  currentIndex: number;
  requiredLength: number;
}

export class SummonSystem {
  private tracks: Map<string, SummonTrack> = new Map();
  private readonly DIRECTIONS: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];

  constructor() {
    this.initTracks();
  }

  private initTracks(): void {
    const trackConfigs = [
      { name: 'warrior', length: 5 },
      { name: 'lancer', length: 7 },
      { name: 'archer', length: 9 },
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
          this.randomizeTrack(track.name);
        }
      } else {
        track.currentIndex = 0; // Reset progress on mistake
      }
    });

    return completedSummons;
  }

  getTracksState(): SummonTrack[] {
    return Array.from(this.tracks.values());
  }
}
