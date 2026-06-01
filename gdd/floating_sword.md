im having problem with creating sprite sheets for attacks. is it possible to just have an image of a sword, make the sword follow or hover behind the hero and whenever we press attack, the sword will animate or make a sword attack motion. can we make different sword slashes motion in phaser? that way we can just use 1 frame of a sword.

Yes. In fact, many modern action games separate the **weapon sprite** from the **character sprite** instead of baking the sword swing into the character animation.

For a top-down game like yours, this can work very well and has several advantages:

* No need to draw attack spritesheets for every weapon.
* Easier weapon swapping.
* Easier attack variations.
* Better hitbox control.
* Less art production.

## Approach 1: Rotate the Sword Around the Hero

Keep the sword as a separate sprite.

```ts
this.sword = scene.add.sprite(hero.x, hero.y, 'iron_sword');

this.sword.setOrigin(0.5, 1); // handle at bottom
```

During update:

```ts
const distance = 16;

this.sword.x = hero.x + Math.cos(this.swordAngle) * distance;
this.sword.y = hero.y + Math.sin(this.swordAngle) * distance;

this.sword.rotation = this.swordAngle + Math.PI / 2;
```

Then animate `swordAngle`.

Example slash:

```ts
scene.tweens.add({
    targets: this,
    swordAngle: Phaser.Math.DegToRad(-90),
    duration: 100,
    yoyo: false
});
```

This creates a fast arc swing.

---

## Approach 2: Hades-Style Arc Swing

This is probably closest to what you're looking for.

Idle:

```text
      Sword
        |
        |
 Hero O
```

Attack:

```text
Start
    \
     \
 Hero O

Middle
 ---->

End
     /
    /
 Hero O
```

Tween the sword angle from:

```ts
-120° -> +120°
```

over 100-150ms.

```ts
scene.tweens.add({
    targets: this,
    swordAngle: Phaser.Math.DegToRad(120),
    duration: 120,
    ease: 'Sine.Out'
});
```

The sword sprite itself never changes frames.

---

## Approach 3: Multiple Attack Patterns

You can cycle attacks like many action roguelikes.

### Attack 1

Left → Right

```ts
-120° -> 120°
```

### Attack 2

Right → Left

```ts
120° -> -120°
```

### Attack 3

Overhead Slam

```ts
-180° -> 0°
```

### Attack 4

Spin Attack

```ts
0° -> 360°
```

```ts
scene.tweens.add({
    targets: this,
    swordAngle: Phaser.Math.DegToRad(360),
    duration: 250
});
```

Now a single sword image can produce an entire combo system.

---

## Approach 4: Slash Effect + Static Sword

Many games don't even show the sword moving much.

Instead:

1. Sword stays attached to hero.
2. Spawn slash effect sprite.
3. Damage enemies in arc.

```ts
const slash = scene.add.sprite(
    hero.x,
    hero.y,
    'slash_effect'
);

slash.play('slash');
```

This is how a lot of survivor-like games fake melee attacks.

---

## Approach 5: Procedural Hit Arc (Recommended)

For your horde survivor project, I'd do:

```text
Hero
  +
Separate Sword Sprite
  +
Procedural Rotation
  +
Arc Hitbox
  +
Slash Effect
```

Attack flow:

```text
Press Attack
     ↓
Rotate Sword 120°
     ↓
Spawn Slash FX
     ↓
Check enemies inside arc
     ↓
Apply damage + knockback
```

The actual sword can be just:

```text
32x32
or
48x16
```

single-frame PNG.

Then all attack variety comes from code:

* slash
* reverse slash
* thrust
* spin attack
* dash slash
* charged attack

without drawing a single additional sword frame.

For a game inspired by Hades, Death Must Die, or Vampire Survivors-style melee combat, this weapon-as-a-separate-sprite approach is usually much more scalable than creating hundreds of attack spritesheets.
