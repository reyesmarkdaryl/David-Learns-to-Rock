Phaser 4 Room Maker – Full Code Architecture

For your Hades / Skull Horde style game

This will be your internal level editor + content factory.

Core Structure
src/
 ├── main.ts
 ├── scenes/
 │    ├── BootScene.ts
 │    ├── MenuScene.ts
 │    ├── RoomEditorScene.ts
 │    ├── PlaytestScene.ts
 │    └── GameScene.ts
 │
 ├── editor/
 │    ├── GridSystem.ts
 │    ├── TilePainter.ts
 │    ├── ObjectPlacer.ts
 │    ├── SelectionTool.ts
 │    ├── UndoSystem.ts
 │    ├── SaveSystem.ts
 │    ├── ValidationSystem.ts
 │    └── ThumbnailSystem.ts
 │
 ├── room/
 │    ├── RoomLoader.ts
 │    ├── RoomBuilder.ts
 │    ├── DecorSpawner.ts
 │    └── EnemySpawner.ts
 │
 └── data/
      ├── rooms/
      ├── biomes/
      └── decorPools.json
Scene Responsibilities
BootScene

Loads assets.

MenuScene

Choose:

Play Game
Room Editor
Settings
RoomEditorScene

Main editor.

PlaytestScene

Loads current room instantly for testing.

GameScene

Real game.

RoomEditorScene Layout
Left Toolbar
Brush Tile
Erase
Collision Paint
Place Door
Place Enemy Spawn
Place Player Spawn
Place Decor Socket
Select / Move
Delete
Right Properties Panel

When clicking object:

Type: Decor Socket
Category: Torch
Spawn Chance: 80%
Rotation: Random
Scale Variance: On
Tag: Ruins Only
Bottom Toolbar
Save
Load
Playtest
Undo
Redo
Validate
Screenshot
Export JSON
Core Classes
GridSystem.ts

Handles snapping.

worldToGrid(x,y)
gridToWorld(tx,ty)
snap(pointer)
drawGrid()
TilePainter.ts

Places floor/walls.

paint(tileX, tileY, tileId)
erase(tileX, tileY)
fillArea()
ObjectPlacer.ts

Places room objects.

placeDoor()
placeSpawn()
placeDecorSocket()
placeHazard()
SelectionTool.ts

Click + drag editor objects.

select()
move()
duplicate()
delete()
UndoSystem.ts

Critical feature.

pushAction()
undo()
redo()
SaveSystem.ts

Exports JSON.

saveRoom(roomData)
loadRoom(id)
exportFile()
Room JSON Format
{
  "id":"ruins_012",
  "biome":"ruins",
  "width":20,
  "height":14,

  "tiles":[...],

  "doors":[
    {"x":10,"y":0,"dir":"north"}
  ],

  "enemySpawns":[
    {"x":8,"y":6}
  ],

  "playerSpawn":{"x":10,"y":12},

  "decorSockets":[
    {"x":3,"y":2,"type":"torch"},
    {"x":15,"y":9,"type":"rubble"},
    {"x":5,"y":5,"type":"large"}
  ]
}
Decor Socket System (Best Part)
In Editor

Place placeholder icon:

🔥 Torch
🪨 Rubble
🏛 Large Prop
🩸 Decal
🧱 Wall Decor
Runtime
for socket of room.decorSockets:
   pool = biomePools[socket.type]
   asset = random(pool)
   spawn(asset)
Example Decor Pools
{
  "ruins": {
    "torch": ["torch1","blue_flame","brazier"],
    "rubble": ["stones","bones","debris"],
    "large": ["broken_statue","altar","pillar"]
  }
}
Validation System

Checks before save:

✓ doors reachable
✓ player spawn exists
✓ no blocked exits
✓ enemy spawns valid
✓ tile bounds clean
Playtest Button

Instantly launches room:

Editor -> current room data -> PlaytestScene

No save needed.

This massively speeds iteration.

Recommended Phaser Rendering Layers
0 Ground
1 Walls
2 Back Decor
3 Player / Enemies
4 Front Decor
5 FX
6 UI
Development Order (Best)
Week 1
grid
tile paint
save/load
Week 2
doors
spawn points
select/move
Week 3
decor sockets
playtest
validation
Week 4
undo/redo
thumbnails
polish
Smart Bonus Features Later
Mirror Room
Flip horizontal
Flip vertical
Auto Variants

Same room, different decor seeds.

Tags
small
elite_room
boss_antechamber
loot_room
corridor