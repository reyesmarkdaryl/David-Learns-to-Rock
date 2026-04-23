# Phaser + React Fixed Files

## main.ts

```ts
import * as Phaser from 'phaser';
import config from './config';

let game: Phaser.Game | null = null;

export function bootGame() {
  if (game) return game;
  game = new Phaser.Game(config);
  return game;
}

export function destroyGame() {
  if (game) {
    game.destroy(true);
    game = null;
  }
}
```

## main.tsx

```tsx
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { bootGame, destroyGame } from './main';
import GameUI from './ui/GameUI';

function App() {
  useEffect(() => {
    const game = bootGame();
    setTimeout(() => {
      game.canvas.setAttribute('tabindex', '0');
      game.canvas.focus();
    }, 200);

    return () => destroyGame();
  }, []);

  return <GameUI />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
```

## config.ts

```ts
import * as Phaser from 'phaser';
import { GymScene } from './scenes/GymScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'phaser-container',
  backgroundColor: '#111',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 }, debug: false }
  },
  input: { keyboard: true },
  scene: [GymScene]
};

export const DEBUG_MODE = false;
export default config;
```

## GymScene.ts Important Fixes

```ts
create() {
  this.wasdKeys = this.input.keyboard.addKeys({
    left: Phaser.Input.Keyboard.KeyCodes.A,
    right: Phaser.Input.Keyboard.KeyCodes.D,
    up: Phaser.Input.Keyboard.KeyCodes.W,
    down: Phaser.Input.Keyboard.KeyCodes.S,
  });

  this.arrowKeys = {
    up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
    down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
    left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
    right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT)
  };
}

update(time:number) {
  const customCursors = {
    left: this.wasdKeys.left,
    right: this.wasdKeys.right,
    up: this.wasdKeys.up,
    down: this.wasdKeys.down
  };

  this.hero.update(customCursors, time);
}
```

## Hero.ts Fixes

```ts
update(cursors:any, time:number) {
  const moveX = (cursors.left.isDown ? -1 : 0) + (cursors.right.isDown ? 1 : 0);
  const moveY = (cursors.up.isDown ? -1 : 0) + (cursors.down.isDown ? 1 : 0);

  if (moveX !== 0 || moveY !== 0) {
    const len = Math.hypot(moveX, moveY);
    this.setVelocity(
      (moveX / len) * this.stats.moveSpeed,
      (moveY / len) * this.stats.moveSpeed
    );
  } else {
    this.setVelocity(0,0);
  }
}
```

## FULL GymScene.ts Upgrade

```ts
// Major upgrades to apply to your GymScene.ts
// 1. Add missing properties at top of class:
private arrowKeys!: any;
private attackKey!: Phaser.Input.Keyboard.Key;
private projectiles!: Phaser.Physics.Arcade.Group;
private isHitStopped:boolean = false;

// 2. In create() after hero creation:
this.cameras.main.startFollow(this.hero, true, 0.08, 0.08);
this.cameras.main.setZoom(1.15);
this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

// 3. Replace summon input block inside update() with:
if (Phaser.Input.Keyboard.JustDown(this.arrowKeys.up)) this.handleSummon('UP');
if (Phaser.Input.Keyboard.JustDown(this.arrowKeys.down)) this.handleSummon('DOWN');
if (Phaser.Input.Keyboard.JustDown(this.arrowKeys.left)) this.handleSummon('LEFT');
if (Phaser.Input.Keyboard.JustDown(this.arrowKeys.right)) this.handleSummon('RIGHT');

// 4. Add method:
private handleSummon(dir:string){
 const completed=this.summonSystem.checkInput(dir);
 completed.forEach(type=>{
   this.spawnFriendlyMinion(type);
   gameEvents.emit('summon-complete',{name:type});
 });
 gameEvents.emit('summon-state-update', this.summonSystem.getTracksState());
}

// 5. Replace attack check with:
if (Phaser.Input.Keyboard.JustDown(this.attackKey) || this.input.activePointer.isDown) {
   this.hero.performAttack(time);
}

// 6. Cleanup dead enemies safely:
const dead:any[]=[];
this.enemies.getChildren().forEach((enemy:any)=>{
 if(enemy.isDead()) dead.push(enemy);
});
dead.forEach(e=>e.destroy());

// 7. Add world bounds in create():
this.physics.world.setBounds(0,0,3000,3000);
this.hero.setCollideWorldBounds(true);

// 8. Better feel:
// Camera now follows hero smoothly.
// Summon keys no longer recreated every frame.
// Attack key now uses JustDown.
// Safe cleanup prevents iterator issues.
```

## SummonSystem.ts Upgrade

```ts
// Replace mistake reset logic with partial forgiveness:
// inside checkInput()
else {
  track.currentIndex = direction === track.targetSequence[0] ? 1 : 0;
}

// This makes combos feel much better.
```

## Notes

Replace your existing files with these versions / changes. If you want, I can also generate the FULL complete GymScene.ts and Hero.ts production-ready versions next.
