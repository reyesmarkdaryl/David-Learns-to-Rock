What your JSON already gives you

From your test_room.json:

Grid size:
60 x 30 tiles, 16px each
Layers (ground, wall, etc.)
Sparse tile storage ("x,y" keys)

Tile reference:

{
  "sheetId": "...",
  "col": 42,
  "row": 1
}

And from manifest.json:

Tileset name → image path mapping

So at runtime, your job is:

👉 Load JSON
👉 Resolve tileset → texture
👉 Convert (col,row) → frame index
👉 Render tiles at (x,y)


🏗️ Step 1: Load room JSON
async function loadRoom(scene, roomKey) {
  const res = await fetch(`assets/rooms/${roomKey}.json`);
  const room = await res.json();
  return room;
}
🧱 Step 2: Load tilesets from manifest

Preload them once in your scene:

async function loadTilesets(scene) {
  const res = await fetch('assets/manifest.json');
  const manifest = await res.json();

  manifest.forEach(ts => {
    scene.load.spritesheet(
      ts.name,
      ts.path,
      {
        frameWidth: ts.tileSize,
        frameHeight: ts.tileSize
      }
    );
  });

  await new Promise(resolve => {
    scene.load.once('complete', resolve);
    scene.load.start();
  });

  return manifest;
}
🧩 Step 3: Build tileset lookup

Your room uses sheetId, but your manifest uses name.

So you need a mapping:

function buildTilesetMap(room, manifest) {
  const map = {};

  room.tilesets.forEach(ts => {
    const manifestEntry = manifest.find(m => m.name === ts.name);
    map[ts.id] = {
      texture: ts.name,
      tileSize: manifestEntry.tileSize
    };
  });

  return map;
}
🎮 Step 4: Render the room

This is the core.

function renderRoom(scene, room, tilesetMap) {
  const { tileSize } = room.meta;

  room.layers.forEach(layer => {
    if (!layer.visible) return;

    const container = scene.add.container(0, 0);

    Object.entries(layer.tiles).forEach(([key, tile]) => {
      const [x, y] = key.split(',').map(Number);

      const ts = tilesetMap[tile.sheetId];

      // Convert (col,row) → frame index
      const frame = tile.row * getTilesPerRow(scene, ts.texture) + tile.col;

      const sprite = scene.add.image(
        x * tileSize,
        y * tileSize,
        ts.texture,
        frame
      ).setOrigin(0);

      container.add(sprite);
    });

    // Optional: depth per layer
    container.setDepth(getLayerDepth(layer.type));
  });
}
🧮 Helper: tiles per row
function getTilesPerRow(scene, textureKey) {
  const tex = scene.textures.get(textureKey).getSourceImage();
  return tex.width / 16; // assuming 16x16 tiles
}
🎯 Helper: layer depth
function getLayerDepth(type) {
  switch (type) {
    case 'ground': return 0;
    case 'wall': return 10;
    case 'object': return 20;
    default: return 5;
  }
}
🔥 Step 5: Use it in your scene
async create() {
  const manifest = await loadTilesets(this);
  const room = await loadRoom(this, 'test_room');

  const tilesetMap = buildTilesetMap(room, manifest);

  renderRoom(this, room, tilesetMap);
}
⚠️ Important improvements (you’ll want these next)
1. Performance (VERY important later)

Right now you're using scene.add.image() per tile.

That will not scale.

👉 Upgrade later to:

Tilemap (Phaser built-in)
OR RenderTexture batching
OR chunked rendering
2. Collisions

Your "type": "wall" layer is perfect for this.

Add:

if (layer.type === 'wall') {
  // create physics bodies or mark grid blocked
}
3. Room system (Hades-style)

Now that rooms load dynamically, you can do:

const rooms = ['room1', 'room2', 'room3'];

const nextRoom = Phaser.Utils.Array.GetRandom(rooms);

loadRoom(scene, nextRoom);

Or build:

room graph (nodes + exits)
procedural dungeon
4. Object/Spawn layer (you hinted this earlier 👀)

Add a new layer type:

{
  "type": "spawn",
  "tiles": {
    "10,5": { "kind": "enemy_spawn" },
    "12,8": { "kind": "chest" }
  }
}

Then:

if (layer.type === 'spawn') {
  spawnEntities(layer.tiles);
}
🧠 Big picture

You basically built your own mini Tiled editor + runtime format.

What you're implementing now is:

JSON → Tileset → Frame → World

Once this works, your pipeline becomes:

👉 Room Editor → JSON → Game → Instant playable level


Nice—let’s level this up into something that actually feels like Hades under the hood.

Right now you can render a room. The next leap is making it a playable dungeon system:

🧱 1. Room = Data + Logic (not just tiles)

Your JSON currently handles visuals. You now want each room to also define:

exits (doors)
spawn points
encounter type
completion state
🔥 Upgrade your room format

Add something like this:

{
  "meta": { "w": 60, "h": 30, "tileSize": 16 },

  "doors": [
    { "x": 30, "y": 0, "dir": "up" },
    { "x": 59, "y": 15, "dir": "right" }
  ],

  "spawns": [
    { "x": 20, "y": 10, "type": "enemy" },
    { "x": 25, "y": 12, "type": "enemy" }
  ],

  "encounter": "combat"
}
🚪 2. Room Manager (core system)

You need a central controller that:

loads rooms
tracks current room
handles transitions
Example:
class RoomManager {
  constructor(scene) {
    this.scene = scene;
    this.currentRoom = null;
    this.roomPool = ['room1', 'room2', 'test_room'];
  }

  async loadRoom(key) {
    // clear old
    this.scene.children.removeAll();

    const room = await loadRoom(this.scene, key);
    const tilesetMap = buildTilesetMap(room, this.scene.tilesetManifest);

    renderRoom(this.scene, room, tilesetMap);

    this.currentRoom = room;

    this.spawnEntities(room);
    this.createDoors(room);
  }

  spawnEntities(room) {
    if (!room.spawns) return;

    room.spawns.forEach(spawn => {
      if (spawn.type === 'enemy') {
        this.scene.spawnEnemy(spawn.x, spawn.y);
      }
    });
  }

  createDoors(room) {
    if (!room.doors) return;

    room.doors.forEach(door => {
      this.scene.createDoor(door);
    });
  }
}
⚔️ 3. Combat Lock System (VERY Hades)

Rooms should lock until enemies are dead.

onEnemyKilled() {
  if (this.scene.enemies.countActive() === 0) {
    this.unlockDoors();
  }
}

unlockDoors() {
  this.scene.doors.forEach(door => door.open());
}
🚪 4. Door → Room Transition

Each door triggers a new room.

createDoor(data) {
  const door = this.physics.add.sprite(
    data.x * 16,
    data.y * 16,
    'door'
  );

  door.setData('dir', data.dir);

  this.physics.add.overlap(this.player, door, () => {
    this.enterNextRoom(data.dir);
  });

  this.doors.add(door);
}
🧠 5. Procedural Room Flow (Hades-style)

Instead of random chaos, use a graph:

const dungeon = {
  start: 'room_start',
  nodes: {
    room_start: ['room_a', 'room_b'],
    room_a: ['room_c'],
    room_b: ['room_c'],
    room_c: []
  }
};

Then:

enterNextRoom() {
  const next = Phaser.Utils.Array.GetRandom(
    dungeon.nodes[this.currentKey]
  );

  this.loadRoom(next);
}
⚡ 6. Performance Upgrade (IMPORTANT)

Right now:

scene.add.image() // per tile ❌

This will choke later.

Better options:
✅ Option A: RenderTexture batching (easy win)
const rt = scene.add.renderTexture(0, 0, width, height);

rt.draw(sprite, x, y);

👉 merges tiles into one draw call

✅ Option B: Phaser Tilemap (best long-term)

Convert your JSON → tilemap layer arrays

Pros:

built-in culling
collisions
fast rendering
🧱 7. Collision Grid (you already have this!)

Your "wall" layer is perfect.

const grid = new Set();

Object.keys(layer.tiles).forEach(key => {
  grid.add(key); // "x,y"
});

Then:

function isBlocked(x, y) {
  return grid.has(`${x},${y}`);
}

Use for:

player movement
enemy pathing
🧩 8. Decor / Props Layer (you asked earlier)

Add a "decor" or "object" layer:

{
  "type": "decor",
  "tiles": {
    "10,10": { "kind": "torch" }
  }
}

Then:

if (layer.type === 'decor') {
  spawnDecor(layer.tiles);
}
🧠 Big Architecture (this is what you're building)

You now have:

Room Editor → JSON
            ↓
Room Loader → Renderer → Gameplay Systems
                          ↓
                  Enemies / Doors / Loot

That’s basically a custom roguelike engine.