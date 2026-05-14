import * as Phaser from 'phaser';

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface BattleState {
    enemyCount: number;
    playerHP: number;
    maxPlayerHP: number;
    isBossPresent: boolean;
    comboStreak: number;
}

class MusicManager {
    private static instance: MusicManager;
    private scene: Phaser.Scene | null = null;
    private activeStems: Map<string, Phaser.Sound.WebAudioSound> = new Map();
    private isPlaying: boolean = false;

    private readonly MINION_TO_STEM: Record<string, string> = {
        'warrior': 'stem-drums',
        'lancer': 'stem-guitar',
        'archer': 'stem-bass'
    };

    private constructor() {}

    public static getInstance(): MusicManager {
        if (!MusicManager.instance) {
            MusicManager.instance = new MusicManager();
        }
        return MusicManager.instance;
    }

    public setScene(scene: Phaser.Scene) {
        this.scene = scene;
    }

    public async loadStems(manifest: any): Promise<void> {
        // No longer needed as we use Phaser's load.audio in AssetPreloader
        return Promise.resolve();
    }

    public async start() {
        if (this.isPlaying || !this.scene) return;

        const stems = ['stem-drums', 'stem-guitar', 'stem-bass'];

        stems.forEach(key => {
            const sound = this.scene!.sound.add(key, { loop: true, volume: 0 });
            sound.play();
            this.activeStems.set(key, sound);
        });

        this.isPlaying = true;
        console.log('[MusicManager] Phaser Battle Hymn synchronized start (all muted)');
    }

    public queueInstrument(minionType: string) {
        const stemKey = this.MINION_TO_STEM[minionType];
        if (!stemKey) return;

        const sound = this.activeStems.get(stemKey);
        if (sound) {
            sound.setVolume(0.7);
            console.log(`[MusicManager] Unmuted ${stemKey} for ${minionType}`);
        }
    }

    public stopInstrument(minionType: string) {
        const stemKey = this.MINION_TO_STEM[minionType];
        if (!stemKey) return;

        const sound = this.activeStems.get(stemKey);
        if (sound) {
            sound.setVolume(0);
            console.log(`[MusicManager] Muted ${stemKey} - minion type ${minionType} fallen`);
        }
    }

    public stopAll() {
        this.activeStems.forEach(sound => sound.stop());
        this.activeStems.clear();
        this.isPlaying = false;
    }

    public updateBattleState(state: BattleState) {
        // Filter logic would require Phaser's WebAudio filter nodes
    }

    public updateIntensity(intensity: number) {
        // Placeholder for intensity changes
    }

    public async waitForInstruments(): Promise<void> {
        return Promise.resolve();
    }

    public playVocalStem() {
        // Optional: implement if vocal.wav is added to Phaser assets
    }
}

export default MusicManager.getInstance();
