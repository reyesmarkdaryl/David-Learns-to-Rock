import * as Phaser from 'phaser';

export interface FlowFieldConfig {
    tileSize: number;      // World tile size (e.g. 32)
    navSize: number;       // Navigation grid cell size (e.g. 64)
    cols: number;          // Number of columns in nav grid
    rows: number;          // Number of rows in nav grid
    isWalkable: (x: number, y: number) => boolean;
    updateInterval: number; // Update frequency in ms (e.g. 400)
}

export default class FlowFieldManager {
    private grid: number[][];
    private flow: { x: number, y: number }[][];
    private playerTile = { x: -1, y: -1 };
    private _time = 0;

    constructor(private config: FlowFieldConfig) {
        this.grid = [];
        this.flow = [];
        this._init();
    }

    private _init() {
        for (let y = 0; y < this.config.rows; y++) {
            this.grid[y] = [];
            this.flow[y] = [];
            for (let x = 0; x < this.config.cols; x++) {
                this.grid[y][x] = Infinity;
                this.flow[y][x] = { x: 0, y: 0 };
            }
        }
    }

    public worldToGrid(wx: number, wy: number) {
        return {
            x: Math.floor(wx / this.config.navSize),
            y: Math.floor(wy / this.config.navSize)
        };
    }

    public update(delta: number, playerWorldX: number, playerWorldY: number) {
        this._time += delta;
        if (this._time < this.config.updateInterval) return;
        this._time = 0;

        const tile = this.worldToGrid(playerWorldX, playerWorldY);

        if (tile.x === this.playerTile.x && tile.y === this.playerTile.y) return;

        this.playerTile = tile;
        this._buildDistanceField();
        this._buildFlowField();
    }

    private _buildDistanceField() {
        // Reset grid
        for (let y = 0; y < this.config.rows; y++) {
            for (let x = 0; x < this.config.cols; x++) {
                this.grid[y][x] = Infinity;
            }
        }

        const queue: { x: number, y: number }[] = [];
        const { x, y } = this.playerTile;

        if (!this._inBounds(x, y)) return;

        this.grid[y][x] = 0;
        queue.push({ x, y });

        const dirs = [
            { x: 1, y: 0 },
            { x: -1, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: -1 }
        ];

        while (queue.length > 0) {
            const current = queue.shift()!;

            for (const d of dirs) {
                const nx = current.x + d.x;
                const ny = current.y + d.y;

                if (!this._inBounds(nx, ny)) continue;
                if (!this.config.isWalkable(nx, ny)) continue;

                const newCost = this.grid[current.y][current.x] + 1;

                if (newCost < this.grid[ny][nx]) {
                    this.grid[ny][nx] = newCost;
                    queue.push({ x: nx, y: ny });
                }
            }
        }
    }

    private _buildFlowField() {
        const dirs = [
            { x: 1, y: 0 },
            { x: -1, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: -1 }
        ];

        for (let y = 0; y < this.config.rows; y++) {
            for (let x = 0; x < this.config.cols; x++) {
                if (!this.config.isWalkable(x, y)) {
                    this.flow[y][x] = { x: 0, y: 0 };
                    continue;
                }

                let bestDir = { x: 0, y: 0 };
                let bestCost = this.grid[y][x];

                for (const d of dirs) {
                    const nx = x + d.x;
                    const ny = y + d.y;

                    if (!this._inBounds(nx, ny)) continue;

                    const cost = this.grid[ny][nx];
                    if (cost < bestCost) {
                        bestCost = cost;
                        bestDir = d;
                    }
                }
                this.flow[y][x] = bestDir;
            }
        }
    }

    public getDirection(worldX: number, worldY: number): { x: number, y: number } {
        const { x, y } = this.worldToGrid(worldX, worldY);
        if (!this._inBounds(x, y)) return { x: 0, y: 0 };
        return this.flow[y][x];
    }

    private _inBounds(x: number, y: number): boolean {
        return x >= 0 && y >= 0 && x < this.config.cols && y < this.config.rows;
    }
}
