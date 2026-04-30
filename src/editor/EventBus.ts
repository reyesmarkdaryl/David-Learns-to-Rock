import * as Phaser from 'phaser';

class EditorEventBus extends Phaser.Events.EventEmitter {
  public static readonly instance = new EditorEventBus();

  private constructor() {
    super();
  }
}

export const EventBus = EditorEventBus.instance;
