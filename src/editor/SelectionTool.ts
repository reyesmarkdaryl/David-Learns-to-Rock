import { DoorData, SpawnData } from '../room/RoomData';
import { ObjectPlacer } from './ObjectPlacer';

export class SelectionTool {
  private activeObject: { type: string; data: any } | null = null;

  constructor(private objectPlacer: ObjectPlacer) {}

  public select(x: number, y: number): boolean {
    const obj = this.objectPlacer.getObjectAt(x, y);
    this.activeObject = obj;
    return !!obj;
  }

  public move(newX: number, newY: number): boolean {
    if (!this.activeObject) return false;

    const { type, data } = this.activeObject;

    // Remove existing object first to ensure clean move
    this.objectPlacer.removeObjectAt(data.x, data.y);

    if (type === 'door') {
      this.objectPlacer.placeDoor(newX, newY, data.dir);
    } else if (type === 'enemySpawn') {
      this.objectPlacer.placeEnemySpawn(newX, newY);
    } else if (type === 'playerSpawn') {
      this.objectPlacer.placePlayerSpawn(newX, newY);
    }

    // Update internal reference
    this.activeObject = this.objectPlacer.getObjectAt(newX, newY);
    return true;
  }

  public delete(): boolean {
    if (!this.activeObject) return false;

    const { data } = this.activeObject;
    this.objectPlacer.removeObjectAt(data.x, data.y);
    this.activeObject = null;
    return true;
  }

  public deselect() {
    this.activeObject = null;
  }

  public getSelectedObject() {
    return this.activeObject;
  }

  public getSelectedCoordinates() {
    if (!this.activeObject) return null;
    return { x: this.activeObject.data.x, y: this.activeObject.data.y };
  }
}
