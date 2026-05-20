For a top-down horde survivor game in Phaser, the best approach is usually:

1. **Render the world normally**
2. Add a **full-screen darkness layer**
3. “Punch holes” into the darkness using lights/masks around the player

This gives you:

* dark dungeon atmosphere
* dynamic torch lighting
* cheap performance
* easy control over mood/fog radius

For your kind of game, I would strongly recommend a **2D light mask system**, not true real-time lighting/shadows.

---

# Recommended Technique (Best for Performance + Style)

## Method: Darkness Overlay + Erase Blend

### Concept

* Entire screen = black transparent layer
* Player torch = radial gradient that cuts through darkness

Like this:

```text
WORLD
↓
Enemies / tiles / effects
↓
Black darkness overlay
↓
Circular light around player
```

---

# Why This Is Better For Horde Survivors

Real lighting systems:

* expensive with many enemies
* harder to stylize
* difficult with procedural maps
* harder to keep readable

Your game needs:

* readability
* speed
* atmosphere
* lots of enemies

Games like:

* The Binding of Isaac
* Darkwood
* Nuclear Throne

mostly fake lighting rather than physically accurate lighting.

---

# Phaser Implementation

## Option 1 — RenderTexture Mask (Recommended)

This is the cleanest solution.

---

## Step 1: Create Darkness Layer

```ts
this.darkness = this.add.graphics();

this.darkness.fillStyle(0x000000, 0.92);
this.darkness.fillRect(0, 0, width, height);
```

But this alone won’t create the light hole yet.

---

## Step 2: Use RenderTexture

```ts
this.lightTexture = this.make.renderTexture({
    width: width,
    height: height,
    add: false
});
```

---

## Step 3: Create Torch Gradient Image

Create:

* white center
* soft fade edges
* transparent outside

Example:

Use it as:

```ts
this.lightTexture.draw('torchGradient', player.x, player.y);
```

---

## Step 4: Blend Mode

Set darkness layer to multiply or normal alpha.

Then erase light:

```ts
this.lightTexture.erase('torchGradient', player.x, player.y);
```

Each frame:

```ts
this.lightTexture.clear();
this.lightTexture.fill(0x000000, 0.92);

this.lightTexture.erase(
    'torchGradient',
    player.x - 256,
    player.y - 256
);
```

---

# HUGE Visual Improvement

Add:

* tiny flicker
* moving noise
* orange tint
* reduced visibility distance

Torch radius should breathe slightly:

```ts
radius = 220 + Math.sin(time * 0.01) * 8;
```

That alone massively improves atmosphere.

---

# Best Dungeon Feeling

## Use Multiple Darkness Levels

Instead of pure black:

| Area        | Alpha |
| ----------- | ----- |
| Near player | 0     |
| Mid range   | 0.5   |
| Far         | 0.9   |

Soft gradients feel MUCH better than hard circles.

---

# Extra Atmospheric Tricks

## 1. Enemy Eyes Outside Light Radius

Very effective horror trick.

Only show:

* glowing eyes
* silhouettes
* particles

until enemies enter light.

---

## 2. Fog Particles

Tiny drifting particles inside light cone:

* ash
* dust
* spores

Makes torch feel alive.

---

## 3. Limited Cone Vision

Instead of full circle:

* flashlight cone
* directional visibility

Good for:

* dark forest
* horror floor
* “dark world” transition

Example inspiration:

---

# If Using Pixel Art

IMPORTANT:

* keep gradients low resolution
* nearest-neighbor scaling
* avoid ultra-smooth modern bloom

Otherwise it clashes with pixel art.

Good approach:

* 128x128 light texture
* scaled up 2x or 4x

---

# Performance Advice

DO:

* one darkness layer
* one render texture
* one erase operation per light

DON’T:

* dynamic shadow casting
* per-enemy lights
* real-time ray tracing
* full normal map lighting

Especially for a horde game.

---

# For Your “Dark World” Floor

You can make the darkness mechanic part of gameplay:

| Mechanic                        | Result             |
| ------------------------------- | ------------------ |
| Small light radius              | tension            |
| Attacking emits flashes         | rhythmic feedback  |
| Beat combo increases brightness | rhythm integration |
| Killing enemies lights souls    | reward feedback    |
| Darkness damages player         | movement pressure  |

This is where your rhythm idea could actually become stronger instead of weaker.

Example:

* successful rhythm chains temporarily widen torch radius
* missing beats shrinks visibility
* music intensity affects lighting pulse

That creates gameplay/music connection WITHOUT forcing strict rhythm combat.

---

# My Recommendation For Your Game

Use:

* darkness overlay
* soft radial erase mask
* flickering torch
* enemies hidden in darkness
* attack flashes
* combo brightness boosts

That gives:

* readable combat
* strong atmosphere
* unique identity
* low CPU/GPU cost
* scalable procedural dungeon system





Hybrid Solution (BEST)

Most games do this:

Generate ONCE → Reuse Texture
Create gradient dynamically at startup
Save as texture
Reuse texture every frame

Example:

g.generateTexture('torchLight', 512, 512);

Then:

lightTexture.erase('torchLight', x, y);

This is the sweet spot.

Recommended Setup For Your Game

At startup:

createTorchTexture()

Then during gameplay:

renderDarkness()
eraseTorch()