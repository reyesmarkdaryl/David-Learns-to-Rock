import { RoomData } from '../room/RoomData';

export class SaveSystem {
  public static saveRoom(roomData: RoomData): string {
    return JSON.stringify(roomData, null, 2);
  }

  public static loadRoom(json: string): RoomData {
    return JSON.parse(json);
  }

  /**
   * Simulates saving to a file.
   * In a real browser environment, this would trigger a file download.
   */
  public static async exportToFile(roomData: RoomData) {
    const dataStr = this.saveRoom(roomData);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `room_${roomData.id}.json`;
    link.click();

    URL.revokeObjectURL(url);
  }
}
