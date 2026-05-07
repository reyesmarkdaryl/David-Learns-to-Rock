export interface MinionData {
  type: 'warrior' | 'lancer' | 'archer';
  hp: number;
  maxHp: number;
}

export class MinionPersistenceManager {
  private static instance: MinionPersistenceManager;
  private persistedMinions: MinionData[] = [];

  private constructor() {}

  public static getInstance(): MinionPersistenceManager {
    if (!MinionPersistenceManager.instance) {
      MinionPersistenceManager.instance = new MinionPersistenceManager();
    }
    return MinionPersistenceManager.instance;
  }

  public saveMinions(minions: MinionData[]): void {
    this.persistedMinions = [...minions];
  }

  public getPersistedMinions(): MinionData[] {
    return [...this.persistedMinions];
  }

  public clear(): void {
    this.persistedMinions = [];
  }
}
