import { EventEmitter } from 'phaser';

class EditorEventBus extends EventEmitter {
  public static readonly instance = new EditorEventBus();

  private constructor() {}
}

export const EventBus = EditorEventBus.instance;
