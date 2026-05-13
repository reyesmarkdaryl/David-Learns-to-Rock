export enum SongSection {
    INTRO,
    VERSE,
    CHORUS,
    BREAKDOWN,
    BRIDGE
}

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type RiffStep = {
    note: number | null;
    mute: boolean;
};

export interface BattleState {
    enemyCount: number;
    playerHP: number;
    maxPlayerHP: number;
    isBossPresent: boolean;
    comboStreak: number;
}
