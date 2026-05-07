import * as Phaser from 'phaser';
import { WaveDefinition, GYM_WAVES } from '../config';
import { SpawnManager } from './SpawnManager';
import { gameEvents } from './GameEvents';
import { RoomData } from '../room/RoomData';

export enum WaveState {
  WAITING = 'WAITING',
  SPAWNING = 'SPAWNING',
  COOLDOWN = 'COOLDOWN',
  COMPLETE = 'COMPLETE'
}

export class WaveSystem {
  private currentWaveIndex: number = 0;
  private waveQueue: { type: string; count: number }[] = [];
  private state: WaveState = WaveState.WAITING;
  private spawnTimer: number = 0;
  private cooldownTimer: number = 0;
  private waves: WaveDefinition[] = [];
  private spawnManager!: SpawnManager;
  private roomData!: RoomData;

  public start(waves: WaveDefinition[], spawnManager: SpawnManager, roomData: RoomData) {
    this.waves = waves;
    this.spawnManager = spawnManager;
    this.roomData = roomData;
    this.currentWaveIndex = 0;
    this.transitionToWave(0);
  }

  private transitionToWave(index: number) {
    if (index >= this.waves.length) {
      this.state = WaveState.COMPLETE;
      return;
    }

    this.currentWaveIndex = index;
    const wave = this.waves[index];

    // Expand enemies into a flat queue for sequential spawning
    this.waveQueue = [];
    wave.enemies.forEach(group => {                                                                                           for (let i = 0; i < group.count; i++) {
          this.waveQueue.push({ type: group.type, count: 1 });                                                                  }
    });

    this.state = WaveState.SPAWNING;
    this.spawnTimer = 0;

    gameEvents.emit('wave-changed', {
      waveNumber: wave.waveNumber,
      totalWaves: this.waves.length
    });
  }

  public update(time: number, delta: number, currentEnemiesCount: number) {
    switch (this.state) {
      case WaveState.SPAWNING:
        if (this.waveQueue.length > 0) {
          this.spawnTimer -= delta;
          if (this.spawnTimer <= 0) {
            const enemy = this.waveQueue.shift();
            if (enemy) {
              this.spawnManager.spawnRoomEnemies(
                this.roomData,
                enemy.type as 'warrior' | 'lancer' | 'archer',
                enemy.count
              );
            }

            const currentWave = this.waves[this.currentWaveIndex];
            this.spawnTimer = currentWave.interval;
          }
        } else if (currentEnemiesCount === 0) {
          this.transitionToCooldown();
        }
        break;

      case WaveState.COOLDOWN:
        this.cooldownTimer -= delta;
        if (this.cooldownTimer <= 0) {
          this.transitionToWave(this.currentWaveIndex + 1);
        }
        break;
    }
  }

  private transitionToCooldown() {
    const wave = this.waves[this.currentWaveIndex];
    this.state = WaveState.COOLDOWN;
    this.cooldownTimer = wave.cooldown;
  }

  public isRoomComplete(): boolean {
    return this.state === WaveState.COMPLETE;
  }

  public getCurrentWaveNumber(): number {
    return this.currentWaveIndex + 1;
  }
}
