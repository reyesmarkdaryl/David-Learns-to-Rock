import * as Phaser from 'phaser';
import { RoomRegistry } from '../room/RoomRegistry';
import { RoomBuilder } from '../room/RoomBuilder';
import { EventBus } from '../editor/EventBus';

export class PlaytestScene extends Phaser.Scene {
  constructor() {
    super('PlaytestScene');
  }

  create() {
    EventBus.emit('SCENE_CHANGE', 'PlaytestScene');
    console.log('PlaytestScene created');

    const roomData = RoomRegistry.getCurrentRoom();
    if (roomData) {
      console.log(`Playtesting room: ${roomData.id}`);
      RoomBuilder.build(this, roomData);

      // Setup basic camera and bounds
      const worldWidth = roomData.width * 64;
      const worldHeight = roomData.height * 64;
      this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
      this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    } else {
      console.error('No room data found in registry for playtest!');
    }

    this.add.text(20, 20, 'Playtest Mode: Press ESC to return to Editor', {
      color: '#ffffff',
      backgroundColor: '#000000'
    });

    this.input.keyboard.on('keydown-ESC', () => {
      this.scene.start('RoomEditorScene');
    });
  }
}
