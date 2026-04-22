# Hybrid React-Phaser Integration Guide

This document outlines critical patterns and pitfalls discovered during the integration of React UI with a Phaser 4 game engine, specifically regarding input handling and lifecycle management.

## 1. Input & Focus Management
**Problem:** React DOM elements often steal focus from the Phaser canvas, causing keyboard inputs (like WASD) to stop working.

**Solutions:**
- **Programmatic Focus:** Ensure the canvas is focused on boot.
  - Set `tabindex="0"` or `tabindex="-1"` on the canvas/container.
  - Call `canvas.focus()` after the game has initialized.
- **Event Bubbling:** If using a full-screen React overlay, ensure the container has `pointer-events: auto` and that the canvas is not obscured by elements capturing keyboard events.

## 2. Input Polling Performance
**Problem:** Calling `input.keyboard.addKey()` or `createCursorKeys()` inside the `update()` loop creates new objects 60 times per second. This leads to massive memory leaks and breaks the input manager's state tracking.

**Solution:**
- **Initialize Once:** Always define keys in the `create()` method of the scene.
- **Store as Properties:** Save keys to a class variable (e.g., `this.wasdKeys`) and reference those in the `update()` loop.
- **Use `checkDown`:** For the most robust real-time polling, use `this.input.keyboard.checkDown(KeyCode)`.

## 3. Game Lifecycle in React
**Problem:** React's hot-reloading and component mounting/unmounting can create multiple Phaser game instances, leading to "ghost" games and memory exhaustion.

**Solution:**
- **Clean Up on Unmount:** Always call `game.destroy()` (or a wrapper like `destroyGame()`) in the React `useEffect` cleanup function.
- **Single Initialization:** Ensure `bootGame()` is only called once per mount.

## 4. Summary Checklist for New Scenes/UI
- [ ] Are all keys initialized in `create()`?
- [ ] Does the React component clean up the game instance on unmount?
- [ ] Is the canvas being focused after the UI renders?
- [ ] Does the `#phaser-container` have the correct `tabindex` and `pointer-events`?
