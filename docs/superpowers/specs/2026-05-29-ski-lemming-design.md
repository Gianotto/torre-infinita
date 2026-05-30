# Ski Lemming — Design Spec

**Date:** 2026-05-29  
**Game ID:** `ski-lemming`  
**Status:** Approved

---

## Overview

Single-file browser game (`public/games/ski-lemming/index.html`) inspired by the classic SkiFree. The player controls a Lemming-style character skiing down a mountain, dodging obstacles. Canvas 2D rendering with pixel art sprites drawn via `fillRect` — no external images or build dependencies.

---

## Identity

| Field      | Value                  |
|------------|------------------------|
| ID         | `ski-lemming`          |
| Name       | Ski Lemming            |
| Subtitle   | DOWNHILL EDITION       |
| Path       | `/games/ski-lemming/`  |
| Color      | `#a8d8ff`              |
| Tags       | arcade, endless, skill |

---

## Canvas Layout

Total canvas: **560 × 700px**, divided into three zones:

1. **HUD** (top 40px): lives (3 hearts), distance in meters, current score, HUB button
2. **Game area** (560 × 620px): the ski slope — all gameplay happens here
3. **Mobile buttons** (bottom 40px): ← → buttons, visible only on touch devices (detected via `navigator.maxTouchPoints > 0`)

---

## Perspective & Camera

- **Top-down diagonal**: the skier is fixed near the top of the game area (~20% from top, horizontally centered at start)
- The world (snow, obstacles) scrolls **bottom to top**, giving the illusion of descending
- Player moves only on the **X axis** (left/right) to dodge obstacles
- Ski tracks (two faint parallel lines) are drawn behind the player

---

## Speed

- **Phase 1** (first 3 seconds): world scroll speed accelerates from 0 → max speed (ease-in)
- **Phase 2**: constant scroll at **5px/frame** at 60fps (≈300px/s) — challenging but fair
- Player horizontal speed: **40% of scroll speed** (~120px/s), with smooth acceleration/deceleration on key press/release

---

## Obstacles

Obstacles spawn at the **bottom of the game area** and scroll upward with the world. Density is **constant**: approximately 1 new obstacle every 200px of scroll, X position randomized with 40px margin from each edge. Minimum 60px horizontal spacing between obstacles at spawn to avoid impossible clusters.

| Type             | Behavior                                       | On Contact        |
|------------------|------------------------------------------------|-------------------|
| Tree             | Static — does not move on X axis               | Lose 1 life       |
| Dog              | Oscillates ±30px on X axis (sine wave)         | Lose 1 life       |
| Slow skier       | Scrolls at 60% of world speed (player catches up) | Lose 1 life    |
| Red flag         | Static — does not move on X axis               | **Slowdown 2s** (no life lost) |

**Red flag effect:** on contact, world scroll speed drops to 40% for 2 seconds, then linearly ramps back to full speed over 0.5s. A yellow shimmer appears around the skier and a 2s countdown bar shows under the HUD.

---

## Collision & Lives

- **Hitbox:** 60% of visual sprite size (forgiveness factor — small grazes are ignored)
- **On collision with life-losing obstacle:**
  - Red flash overlay on skier
  - Screen shake for 0.3s
  - 1.5s invincibility window (skier blinks at 8Hz)
  - Life counter decrements
- **3rd collision → Game Over**

---

## Score Formula

```
score = Math.floor(distanceMeters / Math.max(1, collisions))
```

- Distance: **1 meter = 10px of world scroll**
- If player finishes with 0 collisions, denominator = 1 → score equals distance (bonus for clean runs)
- Score cap in API: 1,000,000

---

## Sprites (fillRect pixel art, scale factor S=2)

All sprites drawn with `ctx.fillRect` calls at 2px scale (1 logical pixel = 2×2 real pixels).

| Sprite           | Approximate size | Key colors                          |
|------------------|------------------|-------------------------------------|
| Lemming skier (player) | 8×14 logical px | Blue helmet `#1a6bb5`, red jacket `#dd2222`, flesh face |
| Slow skier (obstacle)  | 8×14 logical px | Orange helmet `#aa2200`, orange jacket `#cc5500` |
| Tree             | 6×12 logical px  | Green layers `#2eb52e / #228b22 / #1a6b1a`, brown trunk |
| Dog              | 10×10 logical px | Brown `#a0742a / #c09040`, dark nose |
| Red flag         | 8×12 logical px  | Red flag `#dd1111`, gray pole, snow base |
| Heart (life)     | 6×5 logical px   | Filled `#ff4466`, empty `#442233`   |

Snow background: linear gradient `#b8d8f8 → #eef6ff`, subtle white 1px dots scattered randomly.

---

## Screens

### Start Screen
- Title: "SKI LEMMING" (large, neon glow)
- Subtitle: "DOWNHILL EDITION"
- Name input (up to 12 chars, uppercase, same validation as Lua Runner — shake on empty)
- JOGAR button
- Leaderboard (Top 10) visible below

### Game Over Screen
- Shows: distance, collisions, final score
- Name input → submit → updated leaderboard (Top 10)
- Buttons: JOGAR NOVAMENTE, ← HUB

---

## Controls

| Input              | Action                          |
|--------------------|---------------------------------|
| `←` / `ArrowLeft`  | Move skier left                 |
| `→` / `ArrowRight` | Move skier right                |
| Mobile ◄ button    | Move skier left (touch)         |
| Mobile ► button    | Move skier right (touch)        |

Mobile buttons are rendered inside the bottom 40px zone of the canvas and only shown on touch devices.

---

## API Integration

```javascript
const GAME_ID  = 'ski-lemming';
const API_BASE = '../..';

// Fetch top 10
fetch(`${API_BASE}/api/scores/${GAME_ID}`)

// Submit score
fetch(`${API_BASE}/api/scores/${GAME_ID}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name, score })
})
```

`games.json` entry:
```json
{
  "id": "ski-lemming",
  "name": "Ski Lemming",
  "subtitle": "DOWNHILL EDITION",
  "description": "Desça a montanha como um Lemming esquiador. Desvie de árvores, cachorros e rivais.",
  "path": "/games/ski-lemming/",
  "color": "#a8d8ff",
  "added": "2026-05-29",
  "tags": ["arcade", "endless", "skill"]
}
```

---

## File Structure

```
public/games/ski-lemming/
└── index.html     ← single self-contained file, no external deps
```

---

## Out of Scope

- Sound effects / music
- Power-ups beyond the red flag
- Multiplayer
- Animated backgrounds (parallax layers)
