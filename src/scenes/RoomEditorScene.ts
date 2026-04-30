import * as Phaser from 'phaser';
import { EventBus } from '../editor/EventBus';

export class RoomEditorScene extends Phaser.Scene {
  constructor() {
    super('RoomEditorScene');
  }

  preload() {
    this.load.json('asset-index', 'assets/index.json');
  }

  create() {
    EventBus.emit('SCENE_CHANGE', 'RoomEditorScene');
    console.log('RoomEditorScene created (React Shell Mode)');

    // Handle playtest request from React UI
    EventBus.on('EDITOR_PLAYTEST_REQUESTED', () => {
      this.scene.start('PlaytestScene');
    });
  }

  update(time: number, delta: number) {
  }
}
