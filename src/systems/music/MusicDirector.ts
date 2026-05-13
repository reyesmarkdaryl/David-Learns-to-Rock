import * as Tone from 'tone';
import { SongSection, Direction, RiffStep } from './MusicTypes';

export class MusicDirector {
    private currentTension: number = 0.5;
    private currentSection: SongSection = SongSection.INTRO;
    private sectionMeasureCount: number = 0;
    private currentProgressionIndex: number = 0;
    private chordIndex: number = 0;

    public readonly CHORD_TONES: Record<string, string[]> = {
        'Am': ['A3', 'C4', 'E4', 'Eb4', 'G3'],
        'C':  ['C4', 'E4', 'G4', 'Gb4', 'Bb3'],
        'G':  ['G3', 'B3', 'D4', 'Db4', 'F3'],
        'F':  ['F3', 'A3', 'C4', 'Cb4', 'Eb3'],
        'D':  ['D4', 'F#4', 'A4', 'Ab4', 'C4'],
    };

    public readonly PROGRESSIONS = [
        ['Am', 'G', 'F', 'G'],
        ['Am', 'C', 'G', 'D'],
        ['Am', 'F', 'C', 'G'],
    ];

    public updateBattleState(enemyCount: number, playerHP: number, maxPlayerHP: number, isBossPresent: boolean, comboStreak: number) {
        const enemyFactor = Math.min(enemyCount / 20, 0.4);
        const hpFactor = 1.0 - (playerHP / maxPlayerHP);
        const bossFactor = isBossPresent ? 0.3 : 0;
        const comboFactor = Math.min(comboStreak / 10, 0.1);

        const newTension = Math.min(enemyFactor + (hpFactor * 0.3) + bossFactor + comboFactor, 1.0);
        this.currentTension = this.currentTension * 0.9 + newTension * 0.1;

        // Update progression based on tension
        let newProgIndex = 0;
        if (this.currentTension >= 0.7) newProgIndex = 2;
        else if (this.currentTension >= 0.4) newProgIndex = 1;

        if (this.currentProgressionIndex !== newProgIndex) {
            this.currentProgressionIndex = newProgIndex;
            this.chordIndex = 0;
        }
    }

    public advanceMeasure(time: number) {
        this.sectionMeasureCount++;

        const measuresPerSection = this.currentSection === SongSection.BREAKDOWN ? 16 : 8;
        if (this.sectionMeasureCount >= measuresPerSection) {
            this.changeSection(time);
        }

        const progression = this.PROGRESSIONS[this.currentProgressionIndex];
        this.chordIndex = (this.chordIndex + 1) % progression.length;
    }

    private changeSection(time: number) {
        const sequence = [
            SongSection.INTRO,
            SongSection.VERSE,
            SongSection.CHORUS,
            SongSection.VERSE,
            SongSection.BREAKDOWN,
            SongSection.BRIDGE,
            SongSection.CHORUS
        ];

        const currentIndex = sequence.indexOf(this.currentSection);
        const nextIndex = (currentIndex + 1) % sequence.length;
        this.currentSection = sequence[nextIndex];
        this.sectionMeasureCount = 0;

        // This would normally trigger a BPM change in the PerformanceEngine
    }

    public getCurrentChord(): string {
        return this.PROGRESSIONS[this.currentProgressionIndex][this.chordIndex];
    }

    public getTension(): number {
        return this.currentTension;
    }

    public getCurrentSection(): SongSection {
        return this.currentSection;
    }
}
