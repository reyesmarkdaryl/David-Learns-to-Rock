import * as Phaser from 'phaser';
import { Hero, HeroState } from '../entities/player/Hero';
import { EnemyAtlas } from '../systems/EnemyAtlas';
import { HeroAtlas } from '../systems/HeroAtlas';
import { Lancer } from '../entities/enemies/Lancer';
import { Archer } from '../entities/enemies/Archer';
import { WarriorMinion } from '../entities/player/WarriorMinion';
import { LancerMinion } from '../entities/player/LancerMinion';
import { ArcherMinion } from '../entities/player/ArcherMinion';
import { WaveSystem } from '../systems/WaveSystem';
import { SpawnManager } from '../systems/SpawnManager';
import { RoomDataConverter } from '../editor/RoomDataConverter';
import { DEBUG_MODE, GYM_WAVES } from '../config';
import { SummonSystem } from '../systems/SummonSystem';
import { RhythmSystem } from '../systems/RhythmSystem';
import SpecialAttackSystem from '../systems/SpecialAttackSystem';
import { gameEvents } from '../systems/GameEvents';
import RhythmAudioSystem from '../systems/RhythmAudioSystem';
import { RoomRegistry } from '../room/RoomRegistry';
import { RoomBuilder } from '../room/RoomBuilder';
import { GridSystem } from '../editor/GridSystem';
import { EventBus } from '../editor/EventBus';
import FlowFieldManager from '../systems/FlowFieldManager';
import RoomAssetManager from '../systems/RoomAssetManager';
import { MinionPersistenceManager, MinionData } from '../systems/MinionPersistenceManager';
import MusicManager from '../systems/MusicManager';
import UpgradeSystem from '../systems/UpgradeSystem';

export class GymScene extends Phaser.Scene {
  private hero!: Hero;
  private enemies!: Phaser.Physics.Arcade.Group;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: any;
  private attackKey!: Phaser.Input.Keyboard.Key;
  private debugText!: Phaser.GameObjects.Text;
  private debugGraphics!: Phaser.GameObjects.Graphics;
  private assetIndex: any = null;
  private isGameOver: boolean = false;
  private summonSystem!: SummonSystem;
  private isHitStopped: boolean = false;
  private projectiles!: Phaser.Physics.Arcade.Group;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private flowField!: FlowFieldManager;
  private arrowKeys: any;
  private assetManager!: RoomAssetManager;
  private waveSystem!: WaveSystem;
  private spawnManager!: SpawnManager;
  private isRoomReady: boolean = false;
  private loadingOverlay!: Phaser.GameObjects.Container;
  private isTransitioning: boolean = false;
  private currentRoomKey: string = '';
  private musicUpdateTimer: number = 0;
  private heroLight!: any;

  constructor() {
    super('GymScene');
  }

  preload() {
    EventBus.emit('SCENE_CHANGE', 'GymScene');
    this.load.json('hero-atlas', '/assets/hero_atlas.json');
    this.load.json('asset-index', '/assets/index.json');
    this.load.json('gym_room', '/assets/rooms/gym_room.json');

    // FORCE LOAD CORE HERO TEXTURES
    // These must be queued in preload to be available in create()
    const heroBasePath = '/assets/sprites/shadow/';
    const coreHeroAssets = [
      { key: 'hero_idle', file: 'Idle.png' },
      { key: 'hero_run', file: 'Run.png' },
      { key: 'hero_dash', file: 'dash.png' },
      { key: 'hero_attack1', file: 'dash.png' }, // Shared with dash based on atlas
    ];

    coreHeroAssets.forEach(asset => {
      this.load.spritesheet(asset.key, `${heroBasePath}${asset.file}`, {
        frameWidth: 240,
        frameHeight: 128,
      });
    });

    // FORCE LOAD CORE SPECIAL ATTACKS
    const specialBasePath = '/assets/sfx/attacks/';
    const coreSpecialAssets = [
      { key: 'special_slash', file: 'HolySlash_A_spritesheet.png', w: 64, h: 64 },
      { key: 'special_nova', file: 'Holy Nova.png', w: 64, h: 64 },
      { key: 'special_bolt', file: 'Holy Bolt.png', w: 64, h: 64 },
    ];

    coreSpecialAssets.forEach(asset => {
      this.load.spritesheet(asset.key, `${specialBasePath}${asset.file}`, {
        frameWidth: asset.w,
        frameHeight: asset.h,
      });
    });

    const team = 'Blue';
    // Lancer sprites
    const lancerSprites = [
      { file: "Lancer_Idle.png", key: "lancer_idle_blue" },
      { file: "Lancer_Run.png", key: "lancer_run_blue" },
      { file: "Lancer_Right_Attack.png", key: "lancer_attack_right_blue" },
      { file: "Lancer_Down_Attack.png", key: "lancer_attack_down_blue" },
      { file: "Lancer_DownRight_Attack.png", key: "lancer_attack_downright_blue" },
      { file: "Lancer_UpRight_Attack.png", key: "lancer_attack_upright_blue" },
      { file: "Lancer_Up_Attack.png", key: "lancer_attack_up_blue" },
    ];
    const lancerBasePath = `/assets/tinysword/Units/${team} Units/Lancer/`;

    lancerSprites.forEach((sprite) => {
      this.load.spritesheet(sprite.key, `${lancerBasePath}${sprite.file}`, {
        frameWidth: 320,
        frameHeight: 320,
        startFrame: 0,
        endFrame: 5
      });
    });

    const archerSprites = [
      { file: "Archer_Idle.png", key: "archer_idle_blue" },
      { file: "Archer_Run.png", key: "archer_run_blue" },
      { file: "Archer_Shoot.png", key: "archer_attack_blue" },
    ];
    const archerBasePath = `/assets/tinysword/Units/${team} Units/Archer/`;

    archerSprites.forEach((sprite) => {
      this.load.spritesheet(sprite.key, `${archerBasePath}${sprite.file}`, {
        frameWidth: 192,
        frameHeight: 192,
        startFrame: 0,
        endFrame: 7
      });
    });

    const enemyTeam = 'Red';
    // Manual loading for base TinySwords enemies is now handled by EnemyAtlas in AssetPreloader.
    // Only keep non-atlas specific loads if necessary.

    this.load.spritesheet('dust_particle', `/assets/tinysword/Particle FX/Dust_02.png`, {
      frameWidth: 64,
      frameHeight: 64,
    });

    // Global assets used across all rooms
    this.load.image('glow', '/assets/sprites/glow.png');
    this.load.image('floating_sword', '/assets/sprites/pet/sword.png');

    // Explicit load for new enemies to ensure stability
    const enemySprites = [
      { key: 'enemy_chain_idle', path: '/assets/sprites/Enemies/Chain/Idle.png', width: 192, height: 192 },
      { key: 'enemy_chain_run', path: '/assets/sprites/Enemies/Chain/Run.png', width: 192, height: 192 },
      { key: 'enemy_chain_attack', path: '/assets/sprites/Enemies/Chain/Attack.png', width: 192, height: 192 },
      { key: 'enemy_chain_death', path: '/assets/sprites/Enemies/Chain/Death.png', width: 192, height: 192 },
      { key: 'enemy_giant_idle', path: '/assets/sprites/Enemies/Giant/Idle.png', width: 76, height: 50 },
      { key: 'enemy_giant_run', path: '/assets/sprites/Enemies/Giant/Run.png', width: 76, height: 50 },
      { key: 'enemy_giant_attack', path: '/assets/sprites/Enemies/Giant/Attack.png', width: 76, height: 50 },
      { key: 'enemy_giant_death', path: '/assets/sprites/Enemies/Giant/Death.png', width: 76, height: 50 },
      { key: 'enemy_harvester_idle', path: '/assets/sprites/Enemies/Harvester/Idle.png', width: 105, height: 86 },
      { key: 'enemy_harvester_run', path: '/assets/sprites/Enemies/Harvester/Run.png', width: 105, height: 86 },
      { key: 'enemy_harvester_attack', path: '/assets/sprites/Enemies/Harvester/Attack.png', width: 105, height: 86 },
      { key: 'enemy_harvester_death', path: '/assets/sprites/Enemies/Harvester/Death.png', width: 105, height: 86 },
      { key: 'enemy_sword_idle', path: '/assets/sprites/Enemies/Sword/Idle.png', width: 128, height: 64 },
      { key: 'enemy_sword_run', path: '/assets/sprites/Enemies/Sword/Run.png', width: 128, height: 64 },
      { key: 'enemy_sword_attack', path: '/assets/sprites/Enemies/Sword/Attack.png', width: 128, height: 64 },
      { key: 'enemy_sword_death', path: '/assets/sprites/Enemies/Sword/Death.png', width: 128, height: 64 },
      { key: 'enemy_shadow_boss_idle', path: '/assets/sprites/Enemies/Shadow Boss/Idle.png', width: 87, height: 87 },
      { key: 'enemy_shadow_boss_run', path: '/assets/sprites/Enemies/Shadow Boss/Run.png', width: 87, height: 87 },
      { key: 'enemy_shadow_boss_attack1', path: '/assets/sprites/Enemies/Shadow Boss/Attack 1.png', width: 87, height: 87 },
      { key: 'enemy_shadow_boss_attack2', path: '/assets/sprites/Enemies/Shadow Boss/Attack 2.png', width: 87, height: 87 },
      { key: 'enemy_shadow_boss_death', path: '/assets/sprites/Enemies/Shadow Boss/new/death.png', width: 87, height: 87 },
      { key: 'enemy_shadow_boss_hit', path: '/assets/sprites/Enemies/Shadow Boss/new/hit.png', width: 87, height: 87 },
      { key: 'enemy_shadow_boss_attack3_pre', path: '/assets/sprites/Enemies/Shadow Boss/new/Pre-Attack 3.png', width: 87, height: 87 },
      { key: 'enemy_shadow_boss_attack3_mid', path: '/assets/sprites/Enemies/Shadow Boss/new/mid-Attack 3.png', width: 87, height: 87 },
      { key: 'enemy_shadow_boss_attack3_end', path: '/assets/sprites/Enemies/Shadow Boss/new/end-Attack 3.png', width: 87, height: 87 },
    ];

    enemySprites.forEach(s => {
      console.log(`Preloading enemy sprite: ${s.key} from ${s.path}`);
      this.load.spritesheet(s.key, s.path, { frameWidth: s.width, frameHeight: s.height});
    });
  }

  create() {
    
    this.isGameOver = false;
    this.assetIndex = this.cache.json.get('asset-index');

    this.cursors = this.input.keyboard.createCursorKeys();

    this.wasdKeys = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
    });

    this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.enemies = this.physics.add.group();
    this.projectiles = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite
    });
    this.walls = this.physics.add.staticGroup();

    this.arrowKeys = {
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT)
    };

    this.assetManager = new RoomAssetManager(this);
    this.summonSystem = new SummonSystem();
    MusicManager.setScene(this);
    gameEvents.emit('summon-state-update', this.summonSystem.getTracksState());


    if (DEBUG_MODE) {
      this.debugText = this.add.text(10, 10, '', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#00ff00'
      });
      this.debugGraphics = this.add.graphics();
      this.debugGraphics.setDepth(10000);
    }

    this.events.on('minion:attack', ({ target }) => {
      this.applyHitStop(30);
      this.cameras.main.shake(50, 0.002);
      if (target.isDead()) {
        this.cameras.main.shake(100, 0.005);
      }
    });

    gameEvents.on('upgrade-selected', (upgrade) => {
      UpgradeSystem.applyUpgrade(this.hero, upgrade);
      this.transitionToNextRoom();
    });
    gameEvents.on('upgrade-skipped', () => {
      this.transitionToNextRoom();
    });

    this.startRoomFlow('gym_room');
  }


  private setupAnimations() {
    const createAnim = (key: string, framesKey: string, frameRate: number, repeat: number, startFrame = 0, endFrame = 0) => {
      if (this.anims.exists(key)) return;

      const texture = this.textures.get(framesKey);
      if (!texture) {
        console.error(`[Animation] Texture ${framesKey} NOT FOUND. Cannot create ${key}.`);
        return;
      }

      try {
        const maxFrame = texture.frameCount > 0 ? texture.frameCount - 1 : 0;
        const finalStart = Math.min(startFrame, maxFrame);
        const finalEnd = endFrame > 0 ? Math.min(endFrame, maxFrame) : maxFrame;

        this.anims.create({
          key,
          frames: this.anims.generateFrameNumbers(framesKey, finalStart, finalEnd),
          frameRate,
          repeat
        });
        console.log(`[Animation] Registered ${key} using ${framesKey} [${finalStart}-${finalEnd}] (Texture frames: ${texture.frameCount})`);
      } catch (e) {
        console.error(`[Animation] Failed to create ${key}:`, e);
      }
    };





    // Hero animations from asset index
    const shadowAnims = this.assetIndex?.sprites?.mappings?.hero?.animations;
    if (shadowAnims) {
      Object.entries(shadowAnims).forEach(([name, config]: [string, any]) => {
        const fileName = config.file || 'Idle.png';
        const textureKey = `hero_${fileName.split('.')[0].replace(/\s+/g, '_').toLowerCase()}`;

        createAnim(
          `hero_${name}_anim`,
          textureKey,
          config.frameRate,
          config.repeat,
          config.startFrame ?? 0,
          config.endFrame ?? 0
        );
      });
    } else {
      console.error('Hero animations mapping not found in asset-index!', this.assetIndex);
    }

    // 2. Enemy animations - FULLY Data Driven from index.json
    const enemyTypes = this.assetIndex?.enemies?.types;
    if (enemyTypes) {
      Object.entries(enemyTypes).forEach(([typeKey, typeData]: [string, any]) => {
        const animations = typeData.animations;
        if (!animations) return;

        Object.entries(animations).forEach(([animName, config]: [string, any]) => {
          const textureKey = `enemy_${typeKey}_${animName.toLowerCase()}`;
          const animationKey = `${textureKey}_anim`;

          createAnim(
            animationKey,
            textureKey,
            config.frameRate,
            config.repeat,
            config.startFrame ?? 0,
            config.endFrame ?? 0
          );
        });
      });
    } else {
      console.error('Enemy types not found in asset-index!');
    }

    createAnim('dust_anim', 'dust_particle', 12, 0);
  }


  

  private showLoading() {
    this.loadingOverlay = this.add.container(0, 0).setDepth(1000);
    const bg = this.add.rectangle(this.cameras.main.centerX, this.cameras.main.centerY, 1920, 1080, 0x000000, 0.7);
    const text = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, 'LOADING ROOM...', {
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.loadingOverlay.add([bg, text]);
  }

  private hideLoading() {
    if (this.loadingOverlay) {
      this.loadingOverlay.destroy();
    }
  }

  private getHeroSpawn(roomData: any): { x: number, y: number } {
    //It looks like we're actually using 32 as the proper tile size for spawn point calculations, even though the room meta says 16. This is likely a quirk of how the room was designed in Tiled vs how it's being rendered in Phaser. For now, we'll hardcode 32 here to match the actual layout of the room and ensure the hero spawns in the correct location.
    const tileSize = 32; //roomData.meta.tileSize;

    const spawnLayer = roomData.layers.find((l: any) => l.type === 'hero_spawn');
    if (!spawnLayer) {
      return { x: 400, y: 300 };
    }

    const tiles = Object.keys(spawnLayer.tiles);

    if (tiles.length === 0) {
      return { x: 400, y: 300 };
    }

    console.log('[GymScene] Found spawn tiles:', tiles);

    // take first spawn tile
    const [key] = tiles; // "7,11"
    const [tx, ty] = key.split(',').map(Number);
    return {
      x: tx * tileSize + tileSize / 2,
      y: ty * tileSize + tileSize / 2
    };
  }

  private getEnemySpawns(roomData: any): { x: number, y: number }[] {
    const tileSize = 32; //roomData.meta.tileSize;

    const layer = roomData.layers.find((l: any) => l.type === 'enemy_spawn');
    if (!layer) return [];

    const spawns: { x: number, y: number }[] = [];

    for (const key of Object.keys(layer.tiles)) {
      const [tx, ty] = key.split(',').map(Number);

      spawns.push({
        x: tx * tileSize + tileSize / 2,
        y: ty * tileSize + tileSize / 2
      });
    }

    return spawns;
  }

  private cleanupRoom() {
    if (this.heroLight) {
      this.lights.removeLight(this.heroLight);
    }
    this.hero?.destroy();

    if (this.debugGraphics) {
      this.debugGraphics.clear();
    }

    this.enemies.getChildren().forEach(enemy => {
      if (enemy.destroy) {
        enemy.destroy();
      }
    });
    this.enemies.clear(true, true);

    this.walls.clear(true, true);
    this.projectiles.clear(true, true);
    this.isRoomReady = false;

    MusicManager.stopAll();
  }

  private async transitionToNextRoom() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.showLoading();


    // Save persisting minions
    const minionsToSave: MinionData[] = [];
    this.enemies.getChildren().forEach(entity => {
      const minion = entity as any;
      if (minion.team === 'hero') {
        minionsToSave.push({
          type: minion instanceof WarriorMinion ? 'warrior' :
                minion instanceof LancerMinion ? 'lancer' :
                minion instanceof ArcherMinion ? 'archer' : 'warrior',
          hp: minion.hp,
          maxHp: minion.maxHp
        });
      }
    });
    MinionPersistenceManager.getInstance().saveMinions(minionsToSave);

    this.cleanupRoom();

    const manifest = this.cache.json.get('room-manifest');
    if (!manifest || !Array.isArray(manifest)) {
      console.error('Room manifest not found or invalid');
      this.isTransitioning = false;
      this.hideLoading();
      return;
    }

    const availableRooms = manifest.filter((key: string) => key !== this.currentRoomKey);
    const nextRoomKey = availableRooms[Phaser.Math.Between(0, availableRooms.length - 1)];

    await this.startRoomFlow(nextRoomKey);
  }

  async startRoomFlow(roomKey: string) {
    try {
      //this.lights.setAmbientColor(0xff0000);
      this.currentRoomKey = roomKey;
      if (!this.loadingOverlay) {
        this.showLoading();
      }

      // Load music stems from manifest
      const musicManifest = this.cache.json.get('music-manifest') || await
      fetch('/assets/music-manifest.json').then(res => res.json());
      await MusicManager.loadStems(musicManifest);

      const roomData = this.cache.json.get(roomKey);
      if (!roomData) throw new Error(`Room not found: ${roomKey}`);

      await this.assetManager.prepareRoom(roomData);

      // CRITICAL FIX: Ensure HeroAtlas is initialized BEFORE creating animations
      const atlas = HeroAtlas.getInstance(this);
      atlas.loadFromCache(this);

      // We need to load textures. Since we are already in create(),
      // scene.load.spritesheet won't work like it does in preload.
      // However, if the textures weren't loaded in preload, they'll be missing.
      // Let's check if we can force load them or if they were missed.
      atlas.loadTextures(this);

      atlas.createAnimations(this);
      EnemyAtlas.getInstance(this).createAnimations(this);

      // Build room
      const roomBuild = RoomBuilder.build(this, roomData);
      this.walls = roomBuild.walls;
      // Pipeline ALL scene children for Phaser 4 lighting:
      this.children.each((child: any) => {
        if (child.setLighting) {
          child.setLighting(true);
        }
      });


      this.children.each((child: any) => {
        if (child.setLighting) {
          child.setLighting(true);
        }
      });

      // Convert raw JSON to RoomData for systems
      const convertedRoomData = RoomDataConverter.convertFromJson(roomData);

      // World bounds
      this.physics.world.setBounds(0, 0, roomData.width * 32, roomData.height * 32);

      // Spawn hero
      const spawnPos = this.getHeroSpawn(roomData);

      this.hero = new Hero(this, spawnPos.x, spawnPos.y);
      UpgradeSystem.applyAllUpgrades(this.hero);
      this.heroLight = this.lights.addLight(
        this.hero.x, this.hero.y,
        350,       // radius — large enough to cover surrounding tiles
        0xffffff,  // pure white restores original texture colors
        2.5        // intensity above 1.0 to fight the dark ambient
      );
      this.hero.setLighting(true);
      this.hero.setCollideWorldBounds(true);

      this.cameras.main.startFollow(this.hero, true, 0.08, 0.08);
      this.cameras.main.setZoom(2);

      // Restore persisting minions
      const persisted = MinionPersistenceManager.getInstance().getPersistedMinions();
      persisted.forEach(data => {
        this.spawnPersistedMinion(data);
      });
      MinionPersistenceManager.getInstance().clear();

      // Collisions
      this.physics.add.collider(this.hero, this.walls);
      this.physics.add.collider(this.enemies, this.walls);
      this.physics.add.collider(this.projectiles, this.walls, (projectile, wall) => {
        projectile.destroy();
      });

      // Flow field
      this.flowField = new FlowFieldManager({
        tileSize: 32,
        navSize: 64,
        cols: Math.ceil((roomData.width * 32) / 64),
        rows: Math.ceil((roomData.height * 32) / 64),
        isWalkable: (x, y) => {
          const worldX = x * 64 + 32;
          const worldY = y * 64 + 32;
          return !this.walls.getChildren().some((wall: any) =>
            Phaser.Geom.Rectangle.Contains(wall.getBounds(), worldX, worldY)
          );
        },
        updateInterval: 400
      });

      const enemySpawns = this.getEnemySpawns(roomData);
      console.log('[GymScene] Enemy spawn points:', enemySpawns);

      // Spawn enemies
      this.spawnManager = new SpawnManager(this, this.enemies);
      this.waveSystem = new WaveSystem(this.spawnManager, convertedRoomData);
      this.waveSystem.start(GYM_WAVES, this.spawnManager, convertedRoomData);

      this.lights.enable();
      this.lights.setAmbientColor(0x111111); // near-black, tweak to taste

      this.hideLoading();
      this.isRoomReady = true;
      this.isTransitioning = false;

    } catch (err) {
      console.error('Room load failed:', err);
      this.isTransitioning = false;
      this.hideLoading();
    }
  }

  private async handleSummon(key: string) {
    const completed = this.summonSystem.checkInput(key);
    for (const type of completed) {
      //this.spawnFriendlyMinion(type);
      SpecialAttackSystem.executeAttack(this, this.hero, this.enemies, type);

      gameEvents.emit('summon-complete', { name: type });
    }
    gameEvents.emit('summon-state-update', this.summonSystem.getTracksState());
  }

  private performSpecialAttack() {
    const facing = (this.hero as any).facingDirection;
    const offset = facing === 0 ? 80 : -80;
    const effect = this.add.sprite(this.hero.x + offset, this.hero.y -20, 'special_attack_holy');
    effect.setOrigin(0.5, 0.5);
    effect.setScale(2);
    effect.setDepth(100);
    effect.setFlipX(facing === 1);

    const animKey = 'special_holyslash_c_spritesheet_anim';
    effect.play(animKey);

    // Cleanup when animation finishes
    effect.on('animationcomplete', () => {
      effect.destroy();
    });

    // Fallback cleanup to prevent leaked sprites if animation fails
    this.time.delayedCall(2000, () => {
      if (effect.active) effect.destroy();
    });
  }

  private findNearestEnemy(minion: Enemy): any {
    let nearest = this.hero;
    let minDist = Phaser.Math.Distance.Between(minion.x, minion.y, this.hero.x, this.hero.y);

    this.enemies.getChildren().forEach(enemy => {
      if (enemy.team === 'enemy') {
        const dist = Phaser.Math.Distance.Between(minion.x, minion.y, enemy.x, enemy.y);
        if (dist < minDist) {
          minDist = dist;
          nearest = enemy;
        }
      }
    });
    return nearest;
  }

  private spawnFriendlyMinion(type: string) {
    const x = this.hero.x + Phaser.Math.Between(-50, 50);
    const y = this.hero.y + Phaser.Math.Between(-50, 50);

    let minion: any;
    if (type === 'warrior') {
      minion = new WarriorMinion(this, x, y, 'hero_idle');
    } else if (type === 'lancer') {
      minion = new LancerMinion(this, x, y, 'lancer_idle_blue');
    } else if (type === 'archer') {
      minion = new ArcherMinion(this, x, y, 'archer_idle_blue');
    }

    if (minion) {
      this.enemies.add(minion);
      this.spawnDustEffect(x, y);

      // Add light to minion
      minion.light = this.lights.addPointLight(minion.x, minion.y, 0xffffff, 250, 0.05);
    } else {
      console.log(`Summon sequence for ${type} completed, but entity not yet implemented.`);
    }
  }

  private spawnPersistedMinion(data: MinionData) {
    const x = this.hero.x + Phaser.Math.Between(-50, 50);
    const y = this.hero.y + Phaser.Math.Between(-50, 50);

    let minion: any;
    if (data.type === 'warrior') {
      minion = new WarriorMinion(this, x, y, 'hero_idle', data.hp);
    } else if (data.type === 'lancer') {
      minion = new LancerMinion(this, x, y, 'lancer_idle_blue', data.hp);
    } else if (data.type === 'archer') {
      minion = new ArcherMinion(this, x, y, 'archer_idle_blue', data.hp);
    }

    if (minion) {
      this.enemies.add(minion);
      this.spawnDustEffect(x, y);

      // Add light to minion
      minion.light = this.lights.addPointLight(minion.x, minion.y, 0xffffff, 200, 0.05);
    }
  }

  private applyHitStop(duration: number) {
    this.isHitStopped = true;
    this.time.delayedCall(duration, () => {
      this.isHitStopped = false;
    });
  }

  update(time: number, delta: number) {
    if (!this.isRoomReady || !this.hero || this.isGameOver || this.isTransitioning) return;

    if (this.heroLight) {
      this.heroLight.setPosition(this.hero.x, this.hero.y);
    }

    // Update minion lights
    this.enemies.getChildren().forEach((entity: any) => {
      if (entity.team === 'hero' && entity.light) {
        entity.light.setPosition(entity.x, entity.y);
      }
    });


    if (this.isHitStopped) return; // Skip update during hit-stop

    this.waveSystem.update(time, delta, this.enemies.getChildren().filter((e: any) => e.team === 'enemy').length);

    this.flowField.update(delta, this.hero.x, this.hero.y);

    const customCursors = {
      left: this.wasdKeys.left,
      right: this.wasdKeys.right,
      up: this.wasdKeys.up,
      down: this.wasdKeys.down
    };

    this.hero.update(customCursors, time);


    // Handle Input: Arrow Keys trigger attacks AND track summoning sequences
    const keys = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
    keys.forEach(key => {
      if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes[key]))) {
        // Hero attack happens regardless of rhythm (or you could gate this too)
        this.hero.performAttack(time, key);

        this.handleSummon(key);
      }
    });

    // Update enemies

    this.enemies.getChildren().forEach((enemy: any) => {
      if (enemy.team === 'enemy') {
        // Find nearest hero-team member (Hero or Minions)
        let target = this.hero;
        let minDist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.hero.x, this.hero.y);

        this.enemies.getChildren().forEach((member: any) => {
          if (member.team === 'hero') {
            const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, member.x, member.y);
            if (dist < minDist) {
              minDist = dist;
              target = member;
            }
          }
        });
        enemy.update(target, time, this.flowField);
      } else if (enemy.team === 'hero') {
        enemy.update(this.enemies, time, this.flowField, this.hero);
      }
    });

    // Update Battle Director every 1000ms
    this.musicUpdateTimer += delta;
    if (this.musicUpdateTimer >= 1000) {
      this.musicUpdateTimer = 0;

      const enemiesOnScreen = this.enemies.getChildren().filter((e: any) => e.team === 'enemy').length;

      MusicManager.updateBattleState({
        enemyCount: enemiesOnScreen,
        playerHP: this.hero.stats.hp,
        maxPlayerHP: this.hero.stats.maxHp,
        isBossPresent: false, // Currently no boss system implemented
        comboStreak: 0 // Placeholder until combat combo system is added
      });
    }

    // Dynamic Music Intensity: Calculate "Battle Heat"
    // This is now handled by updateBattleState every 1000ms
    const enemiesOnScreen = this.enemies.getChildren().filter((e: any) => e.team === 'enemy').length;
    const battleHeat = Math.min(enemiesOnScreen / 10, 1.0); // Scale 0-1 based on 10 enemies
    MusicManager.updateIntensity(battleHeat);

    // Combat: Check hero attack against enemies
    this.enemies.getChildren().forEach((enemy: any) => {
      if (enemy.team !== 'hero') {
        // Only damage if the hero is actually in the attack state and hasn't hit this enemy yet
        if (this.hero.getState() === HeroState.ATTACK && !this.hero.getHitEnemies().has(enemy)) {
          if (this.hero.isEnemyInAttackCone(enemy)) {
            enemy.takeDamage(this.hero.stats.attackDamage);
            this.hero.getHitEnemies().add(enemy);

            // JUICE: Hit-stop and Screen Shake
            this.applyHitStop(60);
            this.cameras.main.shake(100, 0.005);

            if (enemy.isDead()) {
              // Extra juice for killing an enemy
              this.cameras.main.shake(200, 0.01);
              this.applyHitStop(100);
            }
          }
        }
      }
    });

    // Cleanup dead enemies
    this.enemies.getChildren().forEach((enemy: any) => {
      if (enemy.isDead()) {
        enemy.destroy();
      }
    });

    // Dynamic Music: Stop instruments if no minions of that type remain
    const activeMinions = this.enemies.getChildren().filter((e: any) => e.team === 'hero');
    const counts = {
      guitar: activeMinions.filter(m => m instanceof WarriorMinion).length,
      bass: activeMinions.filter(m => m instanceof LancerMinion).length,
      vocal: activeMinions.filter(m => m instanceof ArcherMinion).length
    };

    if (counts.guitar === 0) MusicManager.stopInstrument('warrior');
    if (counts.bass === 0) MusicManager.stopInstrument('lancer');
    if (counts.vocal === 0) MusicManager.stopInstrument('archer');

    // Check for room clear
    if (this.waveSystem.isRoomComplete() && !this.isTransitioning) {
      console.log('[GymScene] Room cleared! Triggering upgrade panel...');
      gameEvents.emit('room-completed');
    } else if (DEBUG_MODE) {
      const remainingEnemies = this.enemies.getChildren().filter((e: any) => e.team === 'enemy');
      console.log(`[GymScene] Enemies remaining: ${remainingEnemies.length}. Wave System Status:
      ${this.waveSystem.getCurrentWaveNumber()}`);
    }

    // Projectile handling: manual hurtbox check against all valid targets
    this.projectiles.getChildren().forEach((projectile: any) => {
      if (!projectile.active) return;

      const projX = projectile.x;
      const projY = projectile.y;
      const damage = projectile.damage || 10;

      // Enemy projectiles (no team or team === 'enemy') hit the hero and hero-team minions
      if (!projectile.team || projectile.team === 'enemy') {
        // Check hero
        const heroHurtbox = this.hero.getHurtbox();
        if (projX >= heroHurtbox.x && projX <= heroHurtbox.x + heroHurtbox.width &&
            projY >= heroHurtbox.y && projY <= heroHurtbox.y + heroHurtbox.height) {
          this.hero.takeDamage(damage);
          projectile.setActive(false).setVisible(false);
          return;
        }

        // Check hero-team minions
        for (const member of this.enemies.getChildren() as any[]) {
          if (member.team !== 'hero' || !member.active) continue;
          const hurtbox = member.getHitbox();
          if (projX >= hurtbox.x && projX <= hurtbox.x + hurtbox.width &&
              projY >= hurtbox.y && projY <= hurtbox.y + hurtbox.height) {
            member.takeDamage(damage);
            projectile.setActive(false).setVisible(false);
            return;
          }
        }
      }

      // Hero projectiles (team === 'hero') hit enemy-team members
      if (projectile.team === 'hero') {
        for (const enemy of this.enemies.getChildren() as any[]) {
          if (enemy.team !== 'enemy' || !enemy.active) continue;
          const hurtbox = enemy.getHitbox();
          if (projX >= hurtbox.x && projX <= hurtbox.x + hurtbox.width &&
              projY >= hurtbox.y && projY <= hurtbox.y + hurtbox.height) {
            enemy.takeDamage(damage);
            projectile.setActive(false).setVisible(false);
            return;
          }
        }
      }

      // Despawn projectiles that fly off-screen
      const bounds = this.cameras.main.worldView;
      if (projX < bounds.x - 100 || projX > bounds.right + 100 ||
          projY < bounds.y - 100 || projY > bounds.bottom + 100) {
        projectile.setActive(false).setVisible(false);
      }
    });

    if (Phaser.Input.Keyboard.JustDown(this.attackKey)) {
      this.hero.dash(time);
    } else if (this.input.activePointer.isDown) {
      this.hero.performAttack(time);
    }

    if (DEBUG_MODE) {
      this.updateDebug();
    }

    // Update Hero Health Bar via Event Bus
    gameEvents.emit('hero-hp-update', {
      hp: this.hero.stats.hp,
      maxHp: this.hero.stats.maxHp
    });


    if (this.hero.isDead()) {
      this.hero.setVisible(false);
      this.hero.body?.stop();
      this.handleGameOver();
      return;
    }
  }

  private handleGameOver() {
    this.isGameOver = true;
    this.physics.pause();

    // Stop all enemy and hero updates to prevent logic from running in background
    this.enemies.getChildren().forEach(enemy => {
      (enemy.body as any)?.stop();
    });

    const gameOverText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, 'GAME OVER\nClick to Restart', {
      fontSize: '64px',
      color: '#ff0000',
      align: 'center'
    }).setOrigin(0.5);

    this.input.once('pointerdown', () => {
      this.resetGame();
    });
  }

  private async resetGame() {
    this.isGameOver = false;
    this.isTransitioning = false;
    this.isRoomReady = false;

    this.physics.resume();

    this.cleanupRoom();
    await this.startRoomFlow('gym_room');
  }

  private spawnDustEffect(x: number, y: number) {
    const dust = this.add.sprite(x, y, 'dust_particle');
    dust.setScale(1.5);

    // Ensure dust animation exists (since it's a global effect)
    if (!this.anims.exists('dust_anim')) {
      this.anims.create({
        key: 'dust_anim',
        frames: this.anims.generateFrameNumbers('dust_particle', 0, 11),
        frameRate: 12,
        repeat: 0
      });
    }

    dust.play('dust_anim');


    // The animation needs to finish before the sprite is destroyed.
    // We use a delayed call or a tween to clean up after the animation duration.
    this.time.delayedCall(600, () => {
      dust.destroy();
    });

    // Still fade out the alpha for a smoother transition
    this.tweens.add({
      targets: dust,
      alpha: 0,
      duration: 600
    });
  }

  private updateDebug() {
    const stateStr = this.hero.getState();
    this.debugText.setText(
      `State: ${stateStr}\n` +
      `Pos: ${Math.round(this.hero.x)}, ${Math.round(this.hero.y)}\n` +
      `Vel: ${Math.round(this.hero.body?.velocity.x ?? 0)}, ${Math.round(this.hero.body?.velocity.y ?? 0)}`
    );


    this.debugGraphics.clear(); // Clear everything once at the start of debug update
    this.hero.drawDebug(this.debugGraphics);

    // Draw enemy debugs
    this.enemies.getChildren().forEach((enemy: any) => {
      const anchorX = enemy.x + (enemy.bodyOffset?.x || 0);
      const anchorY = enemy.y + (enemy.bodyOffset?.y || 0);

      // 1. Hitbox (Blue) - Use world coordinates directly from getHitbox()
      const bounds = enemy.getHitbox();
      this.debugGraphics.lineStyle(1, 0x0000ff, 1);
      this.debugGraphics.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);

      // 2. Physics Body Circle (Purple) - Centered on physics anchor
      this.debugGraphics.lineStyle(2, 0xB03060, 1);
      this.debugGraphics.strokeCircle(anchorX, anchorY, enemy.bodyRadius || 0);

      // 3. Attack range (Yellow/Red) - Centered on sprite center
      const isAttacking = enemy.isAttacking;
      this.debugGraphics.lineStyle(4, isAttacking ? 0xff0000 : 0xffff44, isAttacking ? 1.0 : 0.6);
      this.debugGraphics.strokeCircle(
        enemy.x,
        enemy.y,
        enemy.attackRange
      );
    });
  }
}
