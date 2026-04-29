import { RoomData } from './room/RoomData';

export class RoomRegistry {
  private static currentRoom: RoomData | null = null;

  public static setCurrentRoom(data: RoomData) {
    this.currentRoom = data;
  }

  public static getCurrentRoom(): RoomData | null {
    return this.currentRoom;
  }

  public static clear() {
    this.currentRoom = null;
  }
}
