import Phaser from 'phaser';
import { GridSystem } from '../editor/GridSystem';
import { TilePainter } from '../editor/TilePainter';
import { EventBus } from '../editor/EventBus';
import { SaveSystem } from '../editor/SaveSystem';
import { RoomBuilder } from '../room/RoomBuilder';
import { RoomData } from '../room/RoomData';
import { ObjectPlacer } from '../editor/ObjectPlacer';
import { SelectionTool } from '../editor/SelectionTool';
import { ValidationSystem, ValidationResult } from '../editor/ValidationSystem';

export class RoomEditorScene extends Phaser.Scene {
  private painter: TilePainter;
  private objectPlacer: ObjectPlacer;
  private selectionTool: SelectionTool;
  private tileGroup: Phaser.GameObjects.Group;
  private objectGroup: Phaser.GameObjects.Group;
  private currentTool: string = 'floor';

  constructor() {
    super('RoomEditorScene');
  }

  preload() {
    this.load.json('asset-index', 'assets/index.json');
  }

  create() {
    console.log('RoomEditorScene created');

    this.painter = new TilePainter();
    this.objectPlacer = new ObjectPlacer();
    this.selectionTool = new SelectionTool(this.objectPlacer);
    this.tileGroup = this.add.group();
    this.objectGroup = this.add.group();


    const worldWidth = 2000;
    const worldHeight = 2000;

    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

    GridSystem.drawGrid(this, worldWidth, worldHeight);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

    // Listen for brush changes from the UI
    EventBus.on('EDITOR_BRUSH_CHANGE', (brush: any) => {
      this.painter.setBrush(brush);
    });

    // Listen for save request from UI
    EventBus.on('EDITOR_SAVE_REQUESTED', () => {
      this.saveCurrentRoom();
    });

    // Listen for playtest request from UI
    EventBus.on('EDITOR_PLAYTEST_REQUESTED', () => {
      this.startPlaytest();
    });

    EventBus.on('EDITOR_VALIDATE_REQUESTED', () => {
      this.validateRoom();
    });


    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.handleInput(pointer);
    });

    this.input.keyboard.on('keydown-DELETE', () => {
      if (this.currentTool === 'select') {
        this.selectionTool.delete();
        this.renderAll();
      }
    });



    this.add.text(20, 20, 'Room Editor: Left Click/Drag to Paint', {
      color: '#ffffff',
      backgroundColor: '#000000'
    });
  }

  private handleInput(pointer: Phaser.Input.Pointer) {
    const grid = GridSystem.worldToGrid(pointer.worldX, pointer.worldY);

    if (this.currentTool === 'select') {
      if (pointer.down) {
        const selected = this.selectionTool.select(grid.x, grid.y);
        if (selected) {
          // If pointer is moving while selected, move the object
          this.selectionTool.move(grid.x, grid.y);
        }
      }
    } else if (['floor', 'wall', 'eraser'].includes(this.currentTool)) {
      this.painter.paint(grid.x, grid.y);
    } else if (this.currentTool === 'door') {
      this.objectPlacer.placeDoor(grid.x, grid.y);
    } else if (this.currentTool === 'enemySpawn') {
      this.objectPlacer.placeEnemySpawn(grid.x, grid.y);
    } else if (this.currentTool === 'playerSpawn') {
      this.objectPlacer.placePlayerSpawn(grid.x, grid.y);
    } else if (this.currentTool === 'decorSocket') {
      this.objectPlacer.placeDecorSocket(grid.x, grid.y);
    }

    this.renderAll();
  }


  private renderAll() {
    this.renderTiles();
    this.renderObjects();
  }

  private renderTiles() {
    this.tileGroup.clear(true, true);

    const tiles = this.painter.getAllTiles();
    tiles.forEach(tile => {
      const world = GridSystem.gridToWorld(tile.x, tile.y);
      // Use a darker grey for walls and a deep green/brown for floors
      const color = tile.type === 'wall' ? 0x333333 : 0x2e4d2e;
      const rect = this.add.rectangle(world.x + 32, world.y + 32, 62, 62, color);
      // Add a slight border to tiles to see the grid better
      rect.setStrokeStyle(1, 0x000000);
      this.tileGroup.add(rect);
    });
  }

  private renderObjects() {
    this.objectGroup.clear(true, true);

    this.objectPlacer.getDoors().forEach(door => {
      const world = GridSystem.gridToWorld(door.x, door.y);
      // Doors as blue rectangles with a "frame"
      const rect = this.add.rectangle(world.x + 32, world.y + 32, 40, 40, 0x2196F3);
      rect.setStrokeStyle(2, 0xffffff);
      this.objectGroup.add(rect);
    });

    this.objectPlacer.getEnemySpawns().forEach(spawn => {
      const world = GridSystem.gridToWorld(spawn.x, spawn.y);
      // Enemy spawns as red diamonds (rotated square)
      const diamond = this.add.rectangle(world.x + 32, world.y + 32, 30, 30, 0xf44336);
      diamond.setAngle(45);
      diamond.setStrokeStyle(2, 0x000000);
      this.objectGroup.add(diamond);
    });

    const pSpawn = this.objectPlacer.getPlayerSpawn();
    if (pSpawn) {
      const world = GridSystem.gridToWorld(pSpawn.x, pSpawn.y);
      // Player spawn as a bright green star/circle with a border
      const circle = this.add.circle(world.x + 32, world.y + 32, 20, 0x4CAF50);
      circle.setStrokeStyle(3, 0xffffff);
      this.objectGroup.add(circle);
    }

    this.objectPlacer.getDecorSockets().forEach(socket => {
      const world = GridSystem.gridToWorld(socket.x, socket.y);
      // Decor sockets as small purple diamonds
      const diamond = this.add.rectangle(world.x + 32, world.y + 32, 20, 20, 0x9C27B0);
      diamond.setAngle(45);
      diamond.setStrokeStyle(1, 0xffffff);
      this.objectGroup.add(diamond);
    });

    const selected = this.selectionTool.getSelectedObject();
    if (selected) {
      const coords = this.selectionTool.getSelectedCoordinates();
      if (coords) {
        const world = GridSystem.gridToWorld(coords.x, coords.y);
        // Selection highlight as a glowing yellow box
        this.add.rectangle(world.x + 32, world.y + 32, 66, 66, 0xFFC107, 0.4);
      }
    }
  }

  update(time: number, delta: number) {
  }

  private startPlaytest() {
    const roomData = this.getCurrentRoomData();
    const validation = this.validateRoom();

    if (!validation.isValid) {
      console.error('Cannot playtest: Room has validation errors.');
      return;
    }

    RoomRegistry.setCurrentRoom(roomData);
    this.scene.start('PlaytestScene');
  }

  private saveCurrentRoom() {
    const roomData = this.getCurrentRoomData();
    const validation = this.validateRoom();

    if (!validation.isValid) {
      console.error('Cannot save: Room has validation errors.');
      return;
    }

    SaveSystem.exportToFile(roomData);
    console.log('Room exported to JSON');
  }

  private validateRoom(): ValidationResult {
    const roomData = this.getCurrentRoomData();
    const result = ValidationSystem.validate(roomData);

    if (!result.isValid) {
      console.error('Room Validation Failed:', result.errors);
      alert(`Room Errors:\n${result.errors.join('\n')}`);
    } else if (result.warnings.length > 0) {
      console.warn('Room Validation Warnings:', result.warnings);
      alert(`Room Warnings:\n${result.warnings.join('\n')}`);
    } else {
      alert('Room is valid!');
    }

    return result;
  }

  private getCurrentRoomData(): RoomData {
    return {
      id: 'current_editor_room',
      biome: 'ruins',
      width: 2000 / 64,
      height: 2000 / 64,
      tiles: this.painter.getAllTiles(),
      doors: this.objectPlacer.getDoors(),
      enemySpawns: this.objectPlacer.getEnemySpawns(),
      playerSpawn: this.objectPlacer.getPlayerSpawn(),
      decorSockets: this.objectPlacer.getDecorSockets(),
    };
  }

  private loadRoom() {
    console.log('Load Room requested. (File upload input would be implemented here)');
  }
}
