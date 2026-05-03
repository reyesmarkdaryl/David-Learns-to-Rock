The Optimal Enemy AI System (Proven Pattern)
Core Idea:

One brain (global navigation) + many dumb followers (enemies)

1. Use a Flow Field (NOT per-enemy A*)

This is non-negotiable at your scale.

How it works:
When player moves → build a distance map from player
Then convert it into a direction map

Each tile stores:

↑ ↓ ← → (best direction toward player)

Each enemy just does:

dir = flowField[tileX][tileY];
velocity = dir * speed;
Why this wins:
1 computation instead of 100
O(grid size), not O(enemies × grid)
2. Build it using BFS (not A*)

Important detail people miss.

Since your goal is:

“go to player”

You don’t need A*. Use Breadth-First Search (flood fill):

Start at player tile
Expand outward

This gives you:

Distance to player (cheap)
Perfect for flow field generation
3. Rebuild at a fixed interval (not every frame)

Sweet spot:

every 300–500 ms

Why:

Feels responsive
Avoids CPU spikes
4. Use a COARSE navigation grid

Even if your tiles are 16×16:

👉 Use:

32×32 or 64×64 nav grid
Example:
Room Size	Tile Grid	Nav Grid
1024×1024	64×64	16×16

That’s 16× fewer nodes.

5. Add Local Steering (this is what prevents wall-hugging)

Flow field alone isn’t enough.

Each enemy applies:

Final velocity:
flowDirection
+ wallAvoidance
+ separation
Cheap implementation:
Check 4–8 nearby tiles
If blocked → push away
if (isWallAhead) {
    velocity += avoidVector * weight;
}
6. Separation (prevents clumping)

Without this, 100 enemies become a blob.

Simple version:

for (neighbor of nearbyEnemies) {
    pushAway += (self - neighbor).normalize();
}
velocity += pushAway * smallWeight;

Keep it:

Small radius
Low strength
7. Line-of-Sight Shortcut (BIG optimization)

Before using flow field:

if (hasLineOfSight(enemy, player)) {
    moveDirect();
} else {
    followFlowField();
}

This:

Skips grid lookup
Makes enemies feel aggressive
8. Stagger Enemy Updates

Never update all enemies at once.

if (enemy.id % 4 !== frame % 4) return;

Result:

Only 25% updated per frame
4× smoother CPU usage
9. Active Enemy Culling

Don’t simulate everything.

if (distanceToPlayer > 600) {
    sleep();
}

Sleeping enemies:

No steering
No checks
Just idle or slow drift
10. Stuck Detection (failsafe)

Even good systems fail sometimes.

if (enemy.movedDistance < 2px over 0.5s) {
    applyRandomNudge();
}
🔄 Full System Flow
// GLOBAL (runs every ~400ms)
buildFlowFieldFromPlayer();

// PER ENEMY (staggered)
if (!isActive) return;

if (hasLineOfSight(player)) {
    velocity = directToPlayer;
} else {
    velocity = flowFieldDirection;
}

velocity += wallAvoidance;
velocity += separation;

applyVelocity();
⚡ Performance Expectations

With this setup:

✅ 50 enemies → effortless
✅ 100 enemies → stable
⚠️ 150 → still playable with tuning
❌ 200+ → needs further simplification
🔥 Why this is “best”

Because it balances:

Factor	Result
CPU usage	VERY low
Movement quality	Smooth, natural
Scalability	High
Implementation difficulty	Medium