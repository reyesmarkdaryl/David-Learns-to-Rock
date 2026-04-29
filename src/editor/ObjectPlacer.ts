import { DoorData, SpawnData, DoorDirection, DecorSocketData } from '../room/RoomData';

export class ObjectPlacer {
  private doors: DoorData[] = [];
  private enemySpawns: SpawnData[] = [];
  private playerSpawn: SpawnData | null = null;
  private decorSockets: DecorSocketData[] = [];

  public placeDoor(x: number, y: number, dir: DoorDirection = 'north') {
    // Remove any existing door at this position
    this.removeObjectAt(x, y);
    this.doors.push({ x, y, dir });
  }

  public placeEnemySpawn(x: number, y: number) {
    this.removeObjectAt(x, y);
    this.enemySpawns.push({ x, y });
  }

  public placePlayerSpawn(x: number, y: number) {
    // Player spawn must be unique
    this.playerSpawn = { x, y };
    // Remove any other object at the new spawn position
    this.removeObjectAt(x, y);
    // Also remove the previous player spawn from other lists if it was there
    // (handled by removeObjectAt during placement)
  }

  public placeDecorSocket(x: number, y: number, type: string = 'generic') {
    this.removeObjectAt(x, y);
    this.decorSockets.push({ x, y, type });
  }

  public removeObjectAt(x: number, y: number) {
    this.doors = this.doors.filter(d => d.x !== x || d.y !== y);
    this.enemySpawns = this.enemySpawns.filter(s => s.x !== x || s.y !== y);
    this.decorSockets = this.decorSockets.filter(s => s.x !== x || s.y !== y);
    if (this.playerSpawn && this.playerSpawn.x === x && this.playerSpawn.y === y) {
      this.playerSpawn = null;
    }
  }

  public getObjectAt(x: number, y: number) {
    if (this.playerSpawn && this.playerSpawn.x === x && this.playerSpawn.y === y) {
      return { type: 'playerSpawn', data: this.playerSpawn };
    }
    const door = this.doors.find(d => d.x === x && d.y === y);
    if (door) return { type: 'door', data: door };
    const spawn = this.enemySpawns.find(s => s.x === x && s.y === y);
    if (spawn) return { type: 'enemySpawn', data: spawn };
    const socket = this.decorSockets.find(s => s.x === x && s.y === y);
    if (socket) return { type: 'decorSocket', data: socket };
    return null;
  }

  public getDoors() { return this.doors; }
  public getEnemySpawns() { return this.enemySpawns; }
  public getPlayerSpawn() { return this.playerSpawn; }
  public getDecorSockets() { return this.decorSockets; }

  public setDoors(doors: DoorData[]) { this.doors = [...doors]; }
  public setEnemySpawns(spawns: SpawnData[]) { this.enemySpawns = [...spawns]; }
  public setPlayerSpawn(spawn: SpawnData | null) { this.playerSpawn = spawn; }
  public setDecorSockets(sockets: DecorSocketData[]) { this.decorSockets = [...sockets]; }
}
