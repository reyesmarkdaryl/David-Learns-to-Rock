export default class FlowFieldManager {
    constructor(config) {
        this.tileSize = config.tileSize;         // world tile size (e.g. 16)
        this.navSize = config.navSize;           // nav grid size (e.g. 32 or 64)
        this.cols = config.cols;
        this.rows = config.rows;
        this.isWalkable = config.isWalkable;     // function(x, y) => boolean

        this.grid = [];
        this.flow = [];

        this.playerTile = { x: 0, y: 0 };

        this.updateInterval = config.updateInterval || 400;
        this._time = 0;

        this._init();
    }

    _init() {
        for (let y = 0; y < this.rows; y++) {
            this.grid[y] = [];
            this.flow[y] = [];

            for (let x = 0; x < this.cols; x++) {
                this.grid[y][x] = Infinity;
                this.flow[y][x] = { x: 0, y: 0 };
            }
        }
    }

    worldToGrid(wx, wy) {
        return {
            x: Math.floor(wx / this.navSize),
            y: Math.floor(wy / this.navSize)
        };
    }

    update(delta, playerWorldX, playerWorldY) {
        this._time += delta;

        if (this._time < this.updateInterval) return;
        this._time = 0;

        const tile = this.worldToGrid(playerWorldX, playerWorldY);

        if (tile.x === this.playerTile.x && tile.y === this.playerTile.y) return;

        this.playerTile = tile;

        this._buildDistanceField();
        this._buildFlowField();
    }

    _buildDistanceField() {
        // Reset grid
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                this.grid[y][x] = Infinity;
            }
        }

        const queue = [];
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
            const current = queue.shift();

            for (const d of dirs) {
                const nx = current.x + d.x;
                const ny = current.y + d.y;

                if (!this._inBounds(nx, ny)) continue;
                if (!this.isWalkable(nx, ny)) continue;

                const newCost = this.grid[current.y][current.x] + 1;

                if (newCost < this.grid[ny][nx]) {
                    this.grid[ny][nx] = newCost;
                    queue.push({ x: nx, y: ny });
                }
            }
        }
    }

    _buildFlowField() {
        const dirs = [
            { x: 1, y: 0 },
            { x: -1, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: -1 }
        ];

        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {

                if (!this.isWalkable(x, y)) {
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

    getDirection(worldX, worldY) {
        const { x, y } = this.worldToGrid(worldX, worldY);

        if (!this._inBounds(x, y)) return { x: 0, y: 0 };

        return this.flow[y][x];
    }

    _inBounds(x, y) {
        return x >= 0 && y >= 0 && x < this.cols && y < this.rows;
    }
}