class GameEventEmitter {
  private events: Map<string, Set<(data: any) => void>> = new Map();

  on(event: string, listener: (data: any) => void) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)?.add(listener);
  }

  off(event: string, listener: (data: any) => void) {
    this.events.get(event)?.delete(listener);
  }

  emit(event: string, data: any) {
    this.events.get(event)?.forEach(listener => listener(data));
  }
}

export const gameEvents = new GameEventEmitter();
