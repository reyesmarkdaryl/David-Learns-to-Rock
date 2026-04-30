import { RoomData } from './RoomData';

export class RoomStorage {
  private static STORAGE_KEY = 'rhythm_horde_rooms';

  /**
   * Saves a room to local storage.
   */
  public static saveRoom(roomData: RoomData): void {
    const rooms = this.getAllRooms();
    rooms[roomData.id] = roomData;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(rooms));
    console.log(`Room ${roomData.id} saved to local storage.`);
  }

  /**
   * Loads a specific room by its ID.
   */
  public static loadRoom(id: string): RoomData | null {
    const rooms = this.getAllRooms();
    return rooms[id] || null;
  }

  /**
   * Gets all saved rooms.
   */
  public static getAllRooms(): Record<string, RoomData> {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  }

  /**
   * Deletes a specific room.
   */
  public static deleteRoom(id: string): void {
    const rooms = this.getAllRooms();
    delete rooms[id];
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(rooms));
  }

  /**
   * Clears all saved rooms.
   */
  public static clearAll(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
