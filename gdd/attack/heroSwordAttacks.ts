// ─────────────────────────────────────────────────────────────────────────────
// JUICY SWORD ATTACK SYSTEM — drop-in replacement
// Assumes your Hero class has these members already:
//   this.sword          – Phaser.GameObjects.Image
//   this.swordAngle     – number  (radians)
//   this.swordDistance  – number  (pixels from hero centre)
//   this.isSwordTweening– boolean
//   this.state          – HeroState
//   this.facingDirection– 0 = right, 1 = left
//   this.stats          – { attackRange, attackConeAngle, moveSpeed }
//   this.scene          – Phaser.Scene
//   this.attackCooldown – number
//   this.hitEnemies     – Set
//   this.ATTACK_COOLDOWN_MS – number
//   this.lastAttackDirection – string | undefined
//   this.attackComboIndex   – 0 | 1
//
// New optional helper called below – add to your class or inline:
//   this.scene.cameras.main.shake(duration, intensity)  — built-in Phaser
// ─────────────────────────────────────────────────────────────────────────────

// ── tiny helpers ─────────────────────────────────────────────────────────────

/** Animate sword scale for a single squash-stretch pulse */
function swordPulse(
  scene: Phaser.Scene,
  sword: Phaser.GameObjects.Image,
  squashX: number,
  squashY: number,
  duration: number
): void {
  scene.tweens.add({
    targets: sword,
    scaleX: squashX,
    scaleY: squashY,
    duration: duration * 0.35,
    ease: 'Back.Out',
    yoyo: true,
    onComplete: () => sword.setScale(1, 1),
  });
}

/** Quickly flash the sword's tint white then restore */
function swordFlash(
  scene: Phaser.Scene,
  sword: Phaser.GameObjects.Image,
  delay = 0
): void {
  scene.time.delayedCall(delay, () => {
    sword.setTint(0xffffff);
    scene.time.delayedCall(60, () => sword.clearTint());
  });
}

// ── MAIN ATTACK METHOD ────────────────────────────────────────────────────────
// Replace your existing performAttack with this one.

performAttack(time: number, direction?: string): void {
  if (this.state === HeroState.ATTACK) return;

  this.state       = HeroState.ATTACK;
  this.lastAttackDirection = direction;
  this.isSwordTweening     = false;

  this.playAnim('hero_attack1_anim');
  this.setVelocity(0);
  this.spawnAttackVFX(direction);

  this.attackCooldown = time + this.ATTACK_COOLDOWN_MS;
  this.hitEnemies.clear();

  // ── direction dispatch ────────────────────────────────────────────────────
  if (direction === 'UP' || direction === 'DOWN') {
    this._doThrustAttack(direction);
  } else if (direction === 'LEFT' || direction === 'RIGHT') {
    this._doSlashAttack(direction);
  } else {
    // default: spin-slash
    this._doSpinSlash();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ATTACK 1 — THRUST  (UP / DOWN input)
//
// The sword coils *behind* the hero, hesitates for a moment (anticipation),
// then rockets forward with a slight overshoot, vibrates on impact, and snaps
// back in a graceful arc.
// ─────────────────────────────────────────────────────────────────────────────
_doThrustAttack(direction: 'UP' | 'DOWN'): void {
  const thrustAngle  = this.facingDirection === 0 ? 0 : Math.PI;
  const range        = this.stats.attackRange;

  // Anticipation: sword pulls back
  const pullX = this.x - Math.cos(thrustAngle) * 18;
  const pullY = this.y - Math.sin(thrustAngle) * 18;
  const thrustX = this.x + Math.cos(thrustAngle) * range;
  const thrustY = this.y + Math.sin(thrustAngle) * range;

  // Snap to pull-back position instantly
  this.sword.x = pullX;
  this.sword.y = pullY;
  this.sword.setScale(0.75, 1.3); // compress before strike

  this.isSwordTweening = true;

  // Phase 1 – anticipation hold (40 ms)
  this.scene.time.delayedCall(40, () => {

    // Phase 2 – rocket forward
    this.scene.tweens.add({
      targets: this.sword,
      x: thrustX,
      y: thrustY,
      scaleX: 1.25,
      scaleY: 0.8,
      duration: 70,
      ease: 'Sine.In',
      onComplete: () => {

        // IMPACT flash + shake
        swordFlash(this.scene, this.sword);
        this.scene.cameras.main.shake(80, 0.006);
        this.sword.setScale(0.7, 1.4); // squash on impact

        // Phase 3 – impact vibration (micro-shake in place)
        this.scene.tweens.add({
          targets: this.sword,
          x: thrustX + 3,
          duration: 25,
          ease: 'Sine.InOut',
          yoyo: true,
          repeat: 2,
          onComplete: () => {

            // Phase 4 – graceful pull-back arc
            this.scene.tweens.add({
              targets: this.sword,
              x: this.x + Math.cos(thrustAngle) * 20,
              y: this.y + Math.sin(thrustAngle) * 20 - 8,
              scaleX: 1,
              scaleY: 1,
              duration: 130,
              ease: 'Back.In',
              onComplete: () => {
                this.isSwordTweening = false;
              }
            });
          }
        });
      }
    });
  });

  // Keep angle + distance in sync for the update() hit-detection block
  this.swordAngle    = thrustAngle;
  this.swordDistance = range;
}

// ─────────────────────────────────────────────────────────────────────────────
// ATTACK 2 — SLASH  (LEFT / RIGHT input)
//
// A wide crescent swing with three phases:
//   1. Wind-up: sword sweeps to the *opposite* extreme fast (short, snappy)
//   2. Strike:  blazes across the full arc in one powerful motion
//   3. Follow-through: overshoots slightly, then eases back to hover
//
// The sword stretches along its travel axis during the strike.
// ─────────────────────────────────────────────────────────────────────────────
_doSlashAttack(direction: 'LEFT' | 'RIGHT'): void {
  const isRight = direction === 'RIGHT';
  const facing  = this.facingDirection;  // 0 = right, 1 = left

  const baseConeRad = this.stats.attackConeAngle * (Math.PI / 180);
  const halfArc     = baseConeRad;          // half the swing arc
  const centre      = facing === 0 ? 0 : Math.PI;

  // When input direction matches facing: forward slash
  // When input direction opposes facing: backhand slash — same math, mirrored
  const sign = (isRight && facing === 0) || (!isRight && facing === 1) ? 1 : -1;

  const windUpAngle = centre - sign * halfArc * 1.1; // slightly past start
  const strikeAngle = centre + sign * halfArc * 1.2; // slightly past end
  const restAngle   = centre + sign * halfArc * 0.6; // settle point

  const dist = this.stats.attackRange * 0.65;
  this.swordDistance = dist;

  // ── Wind-up (snap to opposite side, fast) ─────────────────────────────────
  this.swordAngle = windUpAngle;
  this.sword.x    = this.x + Math.cos(windUpAngle) * dist * 0.7;
  this.sword.y    = this.y + Math.sin(windUpAngle) * dist * 0.7;
  this.sword.setScale(1.1, 0.85); // slight pre-squash

  this.isSwordTweening = true;

  this.scene.time.delayedCall(30, () => { // brief anticipation pause

    // ── Strike ───────────────────────────────────────────────────────────────
    this.scene.tweens.add({
      targets: this,
      swordAngle: strikeAngle,
      duration: 90,
      ease: 'Cubic.Out',
      onUpdate: () => {
        // Stretch sword along travel direction during strike
        const progress = Math.abs(this.swordAngle - windUpAngle)
                       / Math.abs(strikeAngle - windUpAngle);
        const stretchX = 1 + Math.sin(progress * Math.PI) * 0.4;
        const stretchY = 1 - Math.sin(progress * Math.PI) * 0.25;
        this.sword.setScale(stretchX, stretchY);
      },
      onComplete: () => {
        // Impact: flash + mild shake
        swordFlash(this.scene, this.sword);
        this.scene.cameras.main.shake(50, 0.004);

        // ── Follow-through + settle ──────────────────────────────────────────
        this.scene.tweens.add({
          targets: this,
          swordAngle: restAngle,
          duration: 160,
          ease: 'Back.Out',
          onUpdate: () => this.sword.setScale(1, 1),
          onComplete: () => {
            this.isSwordTweening = false;
          }
        });
      }
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ATTACK 3 — SPIN SLASH  (no directional input = "special")
//
// The sword orbits the hero in a full 360° + 45° extra (winding energy),
// accelerating through the back-half of the spin.
// A trailing scale pulse emphasises the rotation momentum.
// Ends with a dramatic outward "release" lunge before drifting back.
// ─────────────────────────────────────────────────────────────────────────────
_doSpinSlash(): void {
  const range        = this.stats.attackRange * 0.7;
  const startAngle   = this.facingDirection === 0
                       ? -Math.PI * 0.9
                       :  Math.PI * 0.1;
  const endAngle     = startAngle + Math.PI * 2.25; // full rotation + 45° overshoot

  this.swordDistance  = range;
  this.swordAngle     = startAngle;
  this.isSwordTweening = false; // update() drives position via swordAngle

  // Squash at start for anticipation
  this.sword.setScale(0.8, 1.2);

  this.scene.tweens.add({
    targets: this,
    swordAngle: endAngle,
    duration: 480,
    ease: 'Quad.In',           // starts slow, accelerates — feels like gathering power
    onUpdate: () => {
      // Pulse scale in rhythm with the spin to simulate momentum
      const t      = (this.swordAngle - startAngle) / (endAngle - startAngle);
      const pulse  = 1 + Math.sin(t * Math.PI * 4) * 0.12;
      this.sword.setScale(pulse, 2 - pulse);
    },
    onComplete: () => {
      // Flash + strong shake at release point
      swordFlash(this.scene, this.sword);
      this.scene.cameras.main.shake(120, 0.009);

      // "Release" lunge: sword flies outward briefly
      const releaseAngle = this.swordAngle;
      const releaseX     = this.x + Math.cos(releaseAngle) * this.stats.attackRange;
      const releaseY     = this.y + Math.sin(releaseAngle) * this.stats.attackRange;

      this.isSwordTweening = true;
      this.sword.setScale(1.3, 0.7);

      this.scene.tweens.add({
        targets: this.sword,
        x: releaseX,
        y: releaseY,
        scaleX: 1,
        scaleY: 1,
        duration: 90,
        ease: 'Expo.Out',
        onComplete: () => {
          this.isSwordTweening = false;
        }
      });
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE — sword position & rotation while attacking
//
// Replace the `else { // During attack … }` block in your update() method.
// ─────────────────────────────────────────────────────────────────────────────

// REPLACE the attack block in update() with this:
//
//   } else {
//     if (!this.isSwordTweening) {
//       this.sword.x = this.x + Math.cos(this.swordAngle) * this.swordDistance;
//       this.sword.y = this.y + Math.sin(this.swordAngle) * this.swordDistance;
//     }
//     // Blade always faces outward from hero — tilt slightly for spin attacks
//     const baseTilt = this.swordAngle + Math.PI / 2;
//     this.sword.rotation = baseTilt;
//   }
//
// No other changes to update() are needed.
