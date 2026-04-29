export type DoorDirection = 'north' | 'south' | 'east' | 'west';

export interface DoorData {
  x: number;
  y: number;
  dir: DoorDirection;
}

export interface SpawnData {
  x: number;
  y: number;
}

export interface TileData {
  x: number;
  y: number;
  tileId: string;
  type: 'floor' | 'wall';
}

export interface DecorSocketData {
  x: number;
  y: number;
  type: string;
}

export interface RoomData {
  id: string;
  biome: string;
  width: number;
  height: number;
  tiles: TileData[];
  doors: DoorData[];
  enemySpawns: SpawnData[];
  playerSpawn: SpawnData | null;
  decorSockets: DecorSocketData[];
}
