# Ski Lemming Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-file browser ski game (`public/games/ski-lemming/index.html`) where a Lemming-style character descends a mountain dodging trees, dogs, slow skiers, and red flag slowdown zones, with a 3-life system and distance/collision score.

**Architecture:** Single `index.html` with HTML5 Canvas 560×700px. All rendering via `ctx.fillRect` pixel art (scale S=2). `requestAnimationFrame` game loop with delta-time. No external dependencies.

**Tech Stack:** HTML5 Canvas 2D API, vanilla JavaScript ES6, project score REST API at `../../api/scores/ski-lemming`.

**Spec:** `docs/superpowers/specs/2026-05-29-ski-lemming-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `public/games/ski-lemming/index.html` | Create | Entire game — HTML, CSS, JS in one file |
| `games.json` | Modify | Add ski-lemming entry so hub includes it |

---

## Task 1: HTML Skeleton — Screens, Canvas, CSS

**Files:**
- Create: `public/games/ski-lemming/index.html`

- [ ] **Create the file with full HTML skeleton**

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ski Lemming — Downhill Edition</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      background: #0a0612;
      font-family: 'Courier New', monospace;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      color: #fff;
    }
    #game-wrap {
      position: relative;
      width: 560px;
      max-width: 100vw;
    }
    canvas {
      display: block;
      width: 100%;
      image-rendering: pixelated;
      border: 2px solid #1a2233;
      box-shadow: 0 0 30px rgba(168, 216, 255, 0.2);
    }
    .screen {
      position: absolute;
      left: 0; right: 0; top: 0; bottom: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: rgba(5, 10, 20, 0.93);
      z-index: 10;
      gap: 10px;
    }
    .screen.hidden { display: none; }
    h1.game-title {
      font-size: 38px;
      color: #a8d8ff;
      letter-spacing: 8px;
      text-shadow: 0 0 20px #4488cc;
      margin-bottom: 2px;
    }
    .game-subtitle {
      font-size: 11px;
      color: #4466aa;
      letter-spacing: 5px;
      margin-bottom: 14px;
    }
    label.field-label {
      font-size: 11px;
      color: #4466aa;
      letter-spacing: 3px;
      margin-bottom: 4px;
    }
    input[type=text] {
      background: transparent;
      border: 2px solid #4466aa;
      color: #a8d8ff;
      font-family: 'Courier New', monospace;
      font-size: 18px;
      padding: 8px 16px;
      text-align: center;
      letter-spacing: 3px;
      text-transform: uppercase;
      outline: none;
      width: 200px;
    }
    input[type=text]:focus { border-color: #a8d8ff; }
    input[type=text].input-error {
      animation: shake 0.3s ease;
      border-color: #ff4466;
    }
    @keyframes shake {
      0%,100% { transform: translateX(0); }
      20% { transform: translateX(-6px); }
      40% { transform: translateX(6px); }
      60% { transform: translateX(-4px); }
      80% { transform: translateX(4px); }
    }
    .btn {
      font-family: 'Courier New', monospace;
      font-weight: bold;
      cursor: pointer;
      letter-spacing: 3px;
      border-radius: 2px;
      transition: transform 0.1s, box-shadow 0.1s;
    }
    .btn-primary {
      font-size: 18px;
      padding: 12px 36px;
      background: linear-gradient(180deg, #3a88cc 0%, #1a4488 100%);
      border: 3px solid #a8d8ff;
      color: #a8d8ff;
      box-shadow: 0 4px 0 #0a1a33, 0 0 20px rgba(168,216,255,0.4);
    }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 0 #0a1a33, 0 0 30px rgba(168,216,255,0.6); }
    .btn-primary:active { transform: translateY(2px); box-shadow: 0 2px 0 #0a1a33; }
    .btn-secondary {
      font-size: 13px;
      padding: 8px 20px;
      background: transparent;
      border: 2px solid #4466aa;
      color: #6688cc;
    }
    .btn-secondary:hover { border-color: #a8d8ff; color: #a8d8ff; }
    .leaderboard { width: 240px; margin-top: 6px; }
    .lb-title {
      font-size: 9px;
      letter-spacing: 4px;
      color: #4466aa;
      margin-bottom: 6px;
      text-align: center;
    }
    .lb-scroll { max-height: 160px; overflow-y: auto; }
    .lb-entry {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #6688aa;
      padding: 2px 0;
      border-bottom: 1px solid rgba(68,102,170,0.2);
    }
    .lb-entry.highlight { color: #a8d8ff; }
    .lb-entry .rank { color: #4466aa; min-width: 24px; }
    .lb-entry .score-val { color: #ffd700; }
    #hub-btn {
      position: absolute;
      top: 8px; right: 8px;
      font-family: 'Courier New', monospace;
      font-size: 10px;
      letter-spacing: 2px;
      padding: 4px 10px;
      background: rgba(91,42,134,0.7);
      border: 1px solid #5b2a86;
      color: #aa6fce;
      cursor: pointer;
      z-index: 20;
    }
    #hub-btn:hover { color: #ffd700; border-color: #ffd700; }
    #mobile-btns {
      display: flex;
      justify-content: space-between;
      padding: 4px 12px;
      background: rgba(5,10,20,0.9);
      border: 2px solid #1a2233;
      border-top: none;
    }
    .mobile-btn {
      font-family: 'Courier New', monospace;
      font-size: 22px;
      font-weight: bold;
      color: #ffd700;
      background: rgba(91,42,134,0.5);
      border: 2px solid #5b2a86;
      padding: 6px 28px;
      cursor: pointer;
      user-select: none;
      -webkit-user-select: none;
    }
    .mobile-btn:active { background: rgba(168,216,255,0.2); }
    .gameover-stats {
      font-size: 12px;
      color: #6688aa;
      letter-spacing: 2px;
      text-align: center;
      line-height: 2;
    }
    .gameover-stats strong { color: #a8d8ff; }
    .gameover-score {
      font-size: 28px;
      color: #ffd700;
      letter-spacing: 4px;
      text-shadow: 0 0 15px #ffd700;
      margin: 4px 0;
    }
  </style>
</head>
<body>
<div id="game-wrap">
  <button id="hub-btn" onclick="window.location.href='/'">← HUB</button>

  <!-- START SCREEN -->
  <div id="screen-start" class="screen">
    <h1 class="game-title">SKI LEMMING</h1>
    <div class="game-subtitle">∙ DOWNHILL EDITION ∙</div>
    <label class="field-label" for="nameInput">NOME DO JOGADOR</label>
    <input type="text" id="nameInput" maxlength="12" autocomplete="off" placeholder="SEU NOME" />
    <button class="btn btn-primary" id="btn-start">JOGAR</button>
    <div class="leaderboard">
      <div class="lb-title">∙ TOP 10 ∙</div>
      <div class="lb-scroll" id="lb-start-entries"></div>
    </div>
  </div>

  <!-- GAME OVER SCREEN -->
  <div id="screen-gameover" class="screen hidden">
    <h1 class="game-title" style="font-size:26px; margin-bottom:0">GAME OVER</h1>
    <div id="go-stats" class="gameover-stats"></div>
    <div id="go-score" class="gameover-score"></div>
    <label class="field-label" for="nameInputGO">NOME DO JOGADOR</label>
    <input type="text" id="nameInputGO" maxlength="12" autocomplete="off" placeholder="SEU NOME" />
    <button class="btn btn-primary" id="btn-submit">ENVIAR SCORE</button>
    <button class="btn btn-secondary" id="btn-restart">JOGAR NOVAMENTE</button>
    <div class="leaderboard">
      <div class="lb-title">∙ TOP 10 ∙</div>
      <div class="lb-scroll" id="lb-go-entries"></div>
    </div>
  </div>

  <canvas id="gameCanvas" width="560" height="700"></canvas>

  <!-- MOBILE BUTTONS (hidden until touch detected) -->
  <div id="mobile-btns" style="display:none">
    <button class="mobile-btn" id="btn-left">◄</button>
    <button class="mobile-btn" id="btn-right">►</button>
  </div>
</div>

<script>
// GAME CODE — tasks 2-11 fill this script block
</script>
</body>
</html>
```

- [ ] **Verify in browser:** Open `public/games/ski-lemming/index.html` directly (or via dev server). The start screen must render over the canvas. The HUB button must appear top-right. No console errors.

- [ ] **Commit**

```bash
git add public/games/ski-lemming/index.html
git commit -m "feat: ski-lemming HTML skeleton with screens and CSS"
```

---

## Task 2: Constants, State Object & Sprite Functions

**Files:**
- Modify: `public/games/ski-lemming/index.html` — replace the `// GAME CODE` comment with all constants, state, and sprite drawing functions

- [ ] **Add constants and initial state inside `<script>`**

```javascript
// ── CONSTANTS ────────────────────────────────────────────────
const GAME_ID       = 'ski-lemming';
const API_BASE      = '../..';
const CW            = 560;          // canvas width
const CH            = 700;          // canvas height
const HUD_H         = 40;           // top HUD bar height
const BTN_H         = 40;           // bottom mobile-btn zone height
const GAME_H        = CH - HUD_H - BTN_H; // 620 — playfield height
const S             = 2;            // sprite pixel scale
const MAX_SPEED     = 5;            // world scroll px/frame at 60 fps
const ACCEL_MS      = 3000;         // ms to reach MAX_SPEED from 0
const SPAWN_DIST    = 200;          // px of scroll between obstacle spawns
const HITBOX_FACTOR = 0.60;         // collision hitbox shrink factor
const INVINC_MS     = 1500;         // invincibility after collision (ms)
const SHAKE_MS      = 300;          // screen shake duration (ms)
const FLAG_SLOW_MS  = 2000;         // slowdown duration (ms)
const FLAG_RAMP_MS  = 500;          // ms to ramp back to full speed
const FLAG_SPEED_FACTOR = 0.4;      // speed multiplier during slowdown
const LIVES_MAX     = 3;
const M_PER_PX      = 0.1;          // 1 m per 10 px scrolled
const PLAYER_Y      = HUD_H + 110;  // player fixed Y (~18% into game area = y≈150)
const PLAYER_SPEED_X = 3;           // horizontal speed px/frame (≈180px/s at 60fps)

// ── STATE ────────────────────────────────────────────────────
function makeState() {
  return {
    phase: 'start',          // 'start' | 'playing' | 'gameover'
    speed: 0,
    scrolled: 0,             // total world px scrolled
    distance: 0,             // meters (scrolled * M_PER_PX)
    lives: LIVES_MAX,
    collisions: 0,
    player: { x: CW / 2, vx: 0 },
    obstacles: [],
    nextSpawnAt: SPAWN_DIST, // scrolled value at which next obstacle spawns
    invincible: false,
    invincibleUntil: 0,
    flashUntil: 0,
    shakeUntil: 0,
    flagSlowUntil: 0,
    flagRampUntil: 0,
    startTime: 0,
    score: 0,
    lastTime: 0,
  };
}
let G = makeState();
```

- [ ] **Add all sprite functions** (draw operations only — no side effects, pure canvas calls)

```javascript
// ── SPRITES ─────────────────────────────────────────────────

function drawHeart(ctx, x, y, filled) {
  ctx.fillStyle = filled ? '#ff4466' : '#442233';
  ctx.fillRect(x+S,   y,     2*S, 2*S);
  ctx.fillRect(x+3*S, y,     2*S, 2*S);
  ctx.fillRect(x,     y+S,   6*S, 2*S);
  ctx.fillRect(x+S,   y+3*S, 4*S,   S);
  ctx.fillRect(x+2*S, y+4*S, 2*S,   S);
}

function drawSkier(ctx, x, y, helmetCol, bodyCol) {
  // skis
  ctx.fillStyle = '#777';
  ctx.fillRect(x - 3*S, y + 12*S, 14*S, S);
  // poles
  ctx.fillStyle = '#aaa';
  ctx.fillRect(x - S, y + 5*S, S, 7*S);
  ctx.fillRect(x + 8*S, y + 5*S, S, 7*S);
  // legs
  ctx.fillStyle = '#1a3a6a';
  ctx.fillRect(x + 2*S, y + 9*S, 2*S, 3*S);
  ctx.fillRect(x + 4*S, y + 9*S, 2*S, 3*S);
  // body + arms
  ctx.fillStyle = bodyCol;
  ctx.fillRect(x + S,   y + 5*S, 6*S, 5*S);
  ctx.fillRect(x - S,   y + 5*S, 2*S, 3*S);
  ctx.fillRect(x + 7*S, y + 5*S, 2*S, 3*S);
  // neck
  ctx.fillStyle = '#ffd0a0';
  ctx.fillRect(x + 3*S, y + 3*S, 2*S, 2*S);
  // face
  ctx.fillRect(x + 2*S, y + S,   4*S, 4*S);
  ctx.fillRect(x + S,   y + 2*S,   S, 2*S);
  ctx.fillRect(x + 7*S, y + 2*S,   S, 2*S);
  // eyes
  ctx.fillStyle = '#222';
  ctx.fillRect(x + 3*S, y + 2*S, S, S);
  ctx.fillRect(x + 5*S, y + 2*S, S, S);
  // helmet
  ctx.fillStyle = helmetCol;
  ctx.fillRect(x + S,   y,        6*S, 2*S);
  ctx.fillRect(x + 2*S, y - S,    4*S, 2*S);
}

function drawTree(ctx, x, y) {
  ctx.fillStyle = '#5a3010';
  ctx.fillRect(x + 2*S, y + 8*S, 2*S, 4*S);
  ctx.fillStyle = '#1a6b1a';
  ctx.fillRect(x,        y + 5*S, 6*S, 4*S);
  ctx.fillStyle = '#228b22';
  ctx.fillRect(x + S,    y + 2*S, 4*S, 4*S);
  ctx.fillStyle = '#2eb52e';
  ctx.fillRect(x + 2*S,  y,       2*S, 3*S);
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.fillRect(x + S,    y + 2*S,   S, S);
  ctx.fillRect(x + 2*S,  y,         S, S);
}

function drawDog(ctx, x, y) {
  ctx.fillStyle = '#a0742a';
  ctx.fillRect(x + S,    y + 3*S, 7*S, 4*S);
  ctx.fillStyle = '#c09040';
  ctx.fillRect(x + 6*S,  y + S,   4*S, 4*S);
  ctx.fillStyle = '#d4a855';
  ctx.fillRect(x + 8*S,  y + 3*S, 2*S, 2*S);
  ctx.fillStyle = '#8a5c1a';
  ctx.fillRect(x + 6*S,  y,       2*S, 2*S);
  ctx.fillStyle = '#7a5820';
  ctx.fillRect(x + 2*S,  y + 7*S, 2*S, 3*S);
  ctx.fillRect(x + 5*S,  y + 7*S, 2*S, 3*S);
  ctx.fillStyle = '#c09040';
  ctx.fillRect(x,         y + 2*S, 2*S, 2*S);
  ctx.fillStyle = '#333';
  ctx.fillRect(x + 9*S,  y + 3*S,   S, S);
}

function drawFlag(ctx, x, y) {
  // pole
  ctx.fillStyle = '#888';
  ctx.fillRect(x + 2*S, y,         S,   10*S);
  // flag
  ctx.fillStyle = '#dd1111';
  ctx.fillRect(x + 3*S, y,         5*S, 4*S);
  ctx.fillStyle = '#ff4444';
  ctx.fillRect(x + 3*S, y,         5*S,   S);
  ctx.fillRect(x + 3*S, y,           S, 4*S);
  ctx.fillStyle = '#aa0000';
  ctx.fillRect(x + 7*S, y,           S, 4*S);
  ctx.fillRect(x + 3*S, y + 3*S,   5*S,   S);
  // snow base
  ctx.fillStyle = '#c8e0f8';
  ctx.fillRect(x,        y + 10*S, 6*S, 2*S);
  ctx.fillStyle = '#fff';
  ctx.fillRect(x + S,    y + 10*S, 4*S,   S);
}
```

- [ ] **Verify sprites render:** Add a temporary test render just before `</script>`:

```javascript
// TEMP: preview sprites on canvas
const cv = document.getElementById('gameCanvas');
const cx = cv.getContext('2d');
cx.fillStyle = '#d8eeff'; cx.fillRect(0, 0, CW, CH);
drawSkier(cx, 60, 100, '#1a6bb5', '#dd2222');
drawTree(cx, 160, 100);
drawDog(cx, 260, 100);
drawFlag(cx, 360, 100);
drawHeart(cx, 460, 100, true);
drawHeart(cx, 478, 100, false);
```

Open the file in a browser. All 5 sprites must be visible and correct. Then **remove the temp code**.

- [ ] **Commit**

```bash
git add public/games/ski-lemming/index.html
git commit -m "feat: constants, state, and sprite functions for ski-lemming"
```

---

## Task 3: Snow Background, HUD & Game Loop Scaffold

**Files:**
- Modify: `public/games/ski-lemming/index.html`

- [ ] **Add background and HUD render functions**

```javascript
// ── BACKGROUND ───────────────────────────────────────────────
const SNOW_DOTS = Array.from({ length: 60 }, () => ({
  x: Math.random() * CW,
  y: Math.random() * GAME_H + HUD_H,
}));

function drawBackground(ctx) {
  // Snow gradient
  const grad = ctx.createLinearGradient(0, HUD_H, 0, CH - BTN_H);
  grad.addColorStop(0, '#b0d4f8');
  grad.addColorStop(0.5, '#d4ecff');
  grad.addColorStop(1, '#eef6ff');
  ctx.fillStyle = grad;
  ctx.fillRect(0, HUD_H, CW, GAME_H);

  // Snow dots (scroll with world: offset by scrolled % spacing)
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  const offset = G.scrolled % 80;
  SNOW_DOTS.forEach(d => {
    const y = ((d.y + offset) % GAME_H) + HUD_H;
    ctx.fillRect(Math.floor(d.x), Math.floor(y), 1, 1);
  });
}

function drawTracks(ctx) {
  // Two faint ski tracks behind the player
  ctx.strokeStyle = 'rgba(150,195,240,0.45)';
  ctx.lineWidth = S;
  ctx.setLineDash([4, 6]);
  const px = G.player.x;
  ctx.beginPath();
  ctx.moveTo(px - 3*S, PLAYER_Y + 14*S);
  ctx.lineTo(px - 5*S, CH - BTN_H);
  ctx.moveTo(px + 3*S, PLAYER_Y + 14*S);
  ctx.lineTo(px + 5*S, CH - BTN_H);
  ctx.stroke();
  ctx.setLineDash([]);
}
```

- [ ] **Add HUD render function**

```javascript
function drawHUD(ctx) {
  // Background bar
  ctx.fillStyle = 'rgba(5,10,20,0.88)';
  ctx.fillRect(0, 0, CW, HUD_H);

  // Hearts
  for (let i = 0; i < LIVES_MAX; i++) {
    drawHeart(ctx, 8 + i * 18, 12, i < G.lives);
  }

  // Distance
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 11px Courier New';
  ctx.fillText(`${Math.floor(G.distance)}m`, CW / 2 - 30, 25);

  // Score
  ctx.fillStyle = '#a8d8ff';
  ctx.font = '10px Courier New';
  ctx.fillText(`SCORE: ${G.score}`, CW - 110, 25);

  // Slowdown timer bar (shown when flag slowdown active)
  if (G.flagSlowUntil > G.lastTime || G.flagRampUntil > G.lastTime) {
    const remaining = Math.max(0, G.flagSlowUntil - G.lastTime);
    const ratio = remaining / FLAG_SLOW_MS;
    ctx.fillStyle = '#332200';
    ctx.fillRect(8, 34, CW - 16, 4);
    ctx.fillStyle = '#ffdd00';
    ctx.fillRect(8, 34, (CW - 16) * ratio, 4);
  }
}
```

- [ ] **Add the main game loop scaffold**

```javascript
// ── CANVAS REFERENCE ─────────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

// ── GAME LOOP ────────────────────────────────────────────────
function gameLoop(ts) {
  requestAnimationFrame(gameLoop);

  const dt = Math.min((ts - (G.lastTime || ts)) / (1000 / 60), 3); // frames elapsed, capped at 3
  G.lastTime = ts;

  if (G.phase !== 'playing') return;

  update(dt, ts);
  render(ts);
}

function update(dt, ts) {
  // placeholder — filled in Tasks 4-9
}

function render(ts) {
  const shake = ts < G.shakeUntil;
  if (shake) {
    ctx.save();
    ctx.translate(
      (Math.random() - 0.5) * 6,
      (Math.random() - 0.5) * 6
    );
  }

  drawBackground(ctx);
  drawTracks(ctx);
  // obstacles drawn in Task 7
  // player drawn in Task 4
  drawHUD(ctx);

  if (ts < G.flashUntil) {
    ctx.fillStyle = 'rgba(255,30,50,0.35)';
    ctx.fillRect(0, HUD_H, CW, GAME_H);
  }

  if (shake) ctx.restore();
}

requestAnimationFrame(gameLoop);
```

- [ ] **Verify:** Refresh. Start screen should still show. No console errors. Open DevTools → Network to confirm rAF is running (CPU usage slightly above 0).

- [ ] **Commit**

```bash
git add public/games/ski-lemming/index.html
git commit -m "feat: snow background, HUD, game loop scaffold"
```

---

## Task 4: Player Movement & Input

**Files:**
- Modify: `public/games/ski-lemming/index.html`

- [ ] **Add input state and handlers**

```javascript
// ── INPUT ────────────────────────────────────────────────────
const keys = { left: false, right: false };

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft'  || e.key === 'a') keys.left  = true;
  if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
});
document.addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft'  || e.key === 'a') keys.left  = false;
  if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
});

// Mobile buttons (Task 12 wires these up — placeholders here)
document.getElementById('btn-left').addEventListener('touchstart',  e => { e.preventDefault(); keys.left  = true;  }, { passive: false });
document.getElementById('btn-left').addEventListener('touchend',    e => { e.preventDefault(); keys.left  = false; }, { passive: false });
document.getElementById('btn-right').addEventListener('touchstart', e => { e.preventDefault(); keys.right = true;  }, { passive: false });
document.getElementById('btn-right').addEventListener('touchend',   e => { e.preventDefault(); keys.right = false; }, { passive: false });
// Also handle mousedown/mouseup for mobile-btn click on non-touch
document.getElementById('btn-left').addEventListener('mousedown',  () => keys.left  = true);
document.getElementById('btn-left').addEventListener('mouseup',    () => keys.left  = false);
document.getElementById('btn-right').addEventListener('mousedown', () => keys.right = true);
document.getElementById('btn-right').addEventListener('mouseup',   () => keys.right = false);
```

- [ ] **Add player update and draw inside `update()` and `render()`**

In `update(dt, ts)`, add:

```javascript
function update(dt, ts) {
  updateSpeed(dt, ts);   // Task 5
  updatePlayer(dt);
  // updateObstacles(dt);  // Task 6
  // checkCollisions(ts);  // Task 7-8
  updateScore();
}

function updatePlayer(dt) {
  const accel = PLAYER_SPEED_X * 0.25; // per-frame acceleration
  if (keys.left)  G.player.vx = Math.max(G.player.vx - accel * dt, -PLAYER_SPEED_X);
  else if (keys.right) G.player.vx = Math.min(G.player.vx + accel * dt,  PLAYER_SPEED_X);
  else G.player.vx *= Math.pow(0.75, dt); // decelerate

  G.player.x = Math.max(10*S, Math.min(CW - 10*S, G.player.x + G.player.vx * dt));
}
```

In `render(ts)`, after `drawTracks(ctx)`, add:

```javascript
  // player (blink during invincibility)
  const blink = G.invincible && Math.floor(ts / 62) % 2 === 0;
  if (!blink) {
    drawSkier(ctx, G.player.x - 4*S, PLAYER_Y, '#1a6bb5', '#dd2222');
  }
  // yellow shimmer when flag slowdown active
  if (ts < G.flagSlowUntil) {
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#ffdd00';
    ctx.fillRect(G.player.x - 6*S, PLAYER_Y - S, 16*S, 16*S);
    ctx.restore();
  }
```

- [ ] **Stub `updateSpeed` and `updateScore` so the game doesn't crash**

```javascript
function updateSpeed(dt, ts) {
  // Filled in Task 5
  G.speed = MAX_SPEED;
}

function updateScore() {
  // Filled in Task 9
}
```

- [ ] **Temporarily start the game on load to test player movement**

Add at bottom of `<script>` (remove after testing):
```javascript
// TEMP
G.phase = 'playing';
G.startTime = performance.now();
G.lastTime  = performance.now();
```

- [ ] **Verify:** Open browser. The ski slope must appear. Moving ← → moves the Lemming sprite left and right with smooth deceleration. Sprite stays within canvas bounds. Remove the TEMP block after verification.

- [ ] **Commit**

```bash
git add public/games/ski-lemming/index.html
git commit -m "feat: player movement with keyboard and touch input"
```

---

## Task 5: World Scroll & Speed Phases

**Files:**
- Modify: `public/games/ski-lemming/index.html`

- [ ] **Replace the stub `updateSpeed` with real implementation**

```javascript
function updateSpeed(dt, ts) {
  const elapsed = ts - G.startTime;

  // Effective scroll speed accounting for flag slowdown
  if (ts < G.flagSlowUntil) {
    G.speed = MAX_SPEED * FLAG_SPEED_FACTOR;
  } else if (ts < G.flagRampUntil) {
    const rampProgress = 1 - (G.flagRampUntil - ts) / FLAG_RAMP_MS;
    G.speed = MAX_SPEED * FLAG_SPEED_FACTOR + (MAX_SPEED * (1 - FLAG_SPEED_FACTOR)) * rampProgress;
  } else if (elapsed < ACCEL_MS) {
    G.speed = MAX_SPEED * (elapsed / ACCEL_MS);
  } else {
    G.speed = MAX_SPEED;
  }
}
```

- [ ] **Add world scroll to `update()`** — after `updateSpeed`, before `updatePlayer`:

```javascript
function update(dt, ts) {
  updateSpeed(dt, ts);
  G.scrolled += G.speed * dt;
  updatePlayer(dt);
  // updateObstacles(dt);
  // checkCollisions(ts);
  updateScore();
}
```

- [ ] **Verify:** Re-add the TEMP start block, open browser. The snow dots must scroll upward (giving descent illusion). Remove TEMP after verifying.

- [ ] **Commit**

```bash
git add public/games/ski-lemming/index.html
git commit -m "feat: world scroll with acceleration phase and flag slowdown hook"
```

---

## Task 6: Obstacle System

**Files:**
- Modify: `public/games/ski-lemming/index.html`

- [ ] **Add obstacle type definitions and spawn function**

```javascript
// ── OBSTACLES ────────────────────────────────────────────────
const OB_TYPES = ['tree', 'tree', 'tree', 'dog', 'skier', 'flag'];
// tree appears 3× more often than others

function spawnObstacle() {
  const type = OB_TYPES[Math.floor(Math.random() * OB_TYPES.length)];
  const margin = 50;
  const x = margin + Math.random() * (CW - margin * 2);
  G.obstacles.push({
    type,
    x,
    y: CH - BTN_H + 20, // spawn just below visible area
    phase: Math.random() * Math.PI * 2, // for dog oscillation
  });
}
```

- [ ] **Add obstacle sprite sizes (used for hitbox)**

```javascript
const OB_SIZE = {
  tree:   { w: 6*S, h: 12*S },
  dog:    { w: 10*S, h: 10*S },
  skier:  { w: 8*S, h: 14*S },
  flag:   { w: 8*S, h: 12*S },
};
```

- [ ] **Add `updateObstacles(dt)` function**

```javascript
function updateObstacles(dt) {
  // Spawn
  if (G.scrolled >= G.nextSpawnAt) {
    spawnObstacle();
    G.nextSpawnAt = G.scrolled + SPAWN_DIST + Math.random() * 80;
  }

  // Move obstacles upward
  for (const ob of G.obstacles) {
    if (ob.type === 'skier') {
      ob.y -= G.speed * 0.6 * dt; // slower than world
    } else {
      ob.y -= G.speed * dt;
    }

    // Dog oscillation
    if (ob.type === 'dog') {
      ob.phase += 0.03 * dt;
      ob.x += Math.sin(ob.phase) * 1.5;
      ob.x = Math.max(20, Math.min(CW - 20, ob.x));
    }
  }

  // Remove obstacles that have scrolled off the top
  G.obstacles = G.obstacles.filter(ob => ob.y > HUD_H - 30);
}
```

- [ ] **Add `drawObstacles(ctx)` function**

```javascript
function drawObstacles(ctx) {
  for (const ob of G.obstacles) {
    if (ob.y < HUD_H - 20 || ob.y > CH - BTN_H + 10) continue;
    const x = Math.floor(ob.x - OB_SIZE[ob.type].w / 2);
    const y = Math.floor(ob.y - OB_SIZE[ob.type].h);
    switch (ob.type) {
      case 'tree':   drawTree(ctx, x, y);                          break;
      case 'dog':    drawDog(ctx, x, y);                           break;
      case 'skier':  drawSkier(ctx, x, y, '#aa2200', '#cc5500');   break;
      case 'flag':   drawFlag(ctx, x, y);                          break;
    }
  }
}
```

- [ ] **Wire up in `update()` and `render()`**

In `update()`, uncomment `updateObstacles(dt)`.

In `render()`, add `drawObstacles(ctx)` after `drawTracks(ctx)` and before the player draw.

- [ ] **Verify:** With TEMP start block active — obstacles appear at the bottom and scroll upward. All 4 types appear. Dogs oscillate side to side. Slow skiers move upward at a slower rate than trees. Remove TEMP after verification.

- [ ] **Commit**

```bash
git add public/games/ski-lemming/index.html
git commit -m "feat: obstacle system with spawn, movement and rendering"
```

---

## Task 7: Collision Detection & Life System

**Files:**
- Modify: `public/games/ski-lemming/index.html`

- [ ] **Add AABB collision helper**

```javascript
// ── COLLISION ────────────────────────────────────────────────
function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx &&
         ay < by + bh && ay + ah > by;
}
```

- [ ] **Add `checkCollisions(ts)` function**

```javascript
function checkCollisions(ts) {
  if (G.invincible && ts < G.invincibleUntil) return;

  const pSize = OB_SIZE['skier']; // player has same visual size as skier sprite
  const pH    = HITBOX_FACTOR;
  const px    = G.player.x - pSize.w / 2 + pSize.w * (1 - pH) / 2;
  const py    = PLAYER_Y           + pSize.h * (1 - pH) / 2;
  const pw    = pSize.w * pH;
  const ph_h  = pSize.h * pH;

  for (const ob of G.obstacles) {
    const oSize = OB_SIZE[ob.type];
    const oh    = HITBOX_FACTOR;
    const ox    = ob.x - oSize.w / 2 + oSize.w * (1 - oh) / 2;
    const oy    = ob.y - oSize.h     + oSize.h * (1 - oh) / 2;
    const ow    = oSize.w * oh;
    const ohh   = oSize.h * oh;

    if (!rectsOverlap(px, py, pw, ph_h, ox, oy, ow, ohh)) continue;

    if (ob.type === 'flag') {
      handleFlagHit(ts, ob);
    } else {
      handleObstacleHit(ts, ob);
    }
    break; // only one collision per frame
  }
}

function handleFlagHit(ts, ob) {
  // Stub — full implementation in Task 8
  G.obstacles = G.obstacles.filter(o => o !== ob);
}

function handleObstacleHit(ts, ob) {
  G.lives--;
  G.collisions++;
  G.flashUntil = ts + 400;
  G.shakeUntil = ts + SHAKE_MS;
  G.invincible = true;
  G.invincibleUntil = ts + INVINC_MS;

  // Remove hit obstacle
  G.obstacles = G.obstacles.filter(o => o !== ob);

  if (G.lives <= 0) {
    triggerGameOver();
  }
}
```

- [ ] **Wire `checkCollisions` in `update()`**, uncomment the `checkCollisions(ts)` call:

```javascript
function update(dt, ts) {
  updateSpeed(dt, ts);
  G.scrolled += G.speed * dt;
  updatePlayer(dt);
  updateObstacles(dt);
  checkCollisions(ts);
  updateScore();
}
```

- [ ] **Add `triggerGameOver()` stub** (full implementation in Task 10):

```javascript
function triggerGameOver() {
  G.phase = 'gameover';
  G.score = Math.floor(G.distance / Math.max(1, G.collisions));
  showGameOver();
}

function showGameOver() {
  // filled in Task 10
  document.getElementById('screen-gameover').classList.remove('hidden');
}
```

- [ ] **Update invincibility state** — add to `update()` after `checkCollisions`:

```javascript
  if (G.invincible && ts >= G.invincibleUntil) {
    G.invincible = false;
  }
```

- [ ] **Verify:** With TEMP start block — crash into a tree. Screen shakes briefly, player flashes, heart disappears. After 3 hits the game over screen appears. Remove TEMP after verification.

- [ ] **Commit**

```bash
git add public/games/ski-lemming/index.html
git commit -m "feat: AABB collision detection with invincibility and life system"
```

---

## Task 8: Red Flag Slowdown Mechanic

**Files:**
- Modify: `public/games/ski-lemming/index.html`

- [ ] **Add `handleFlagHit` function** (referenced in Task 7's `checkCollisions`):

```javascript
function handleFlagHit(ts, ob) {
  // No life loss — just slowdown
  G.flagSlowUntil  = ts + FLAG_SLOW_MS;
  G.flagRampUntil  = ts + FLAG_SLOW_MS + FLAG_RAMP_MS;
  // brief visual flash (yellow)
  G.flashUntil = ts + 200;

  // Remove the flag so it doesn't re-trigger
  G.obstacles = G.obstacles.filter(o => o !== ob);
}
```

- [ ] **Override flash color when flag hit** — in `render()`, replace the single flash block with:

```javascript
  const now = ts;
  if (now < G.flashUntil) {
    const isFlagFlash = now < G.flagSlowUntil || now < G.flagRampUntil;
    ctx.fillStyle = isFlagFlash
      ? 'rgba(255,220,0,0.25)'
      : 'rgba(255,30,50,0.35)';
    ctx.fillRect(0, HUD_H, CW, GAME_H);
  }
```

- [ ] **Verify:** With TEMP start block — ski into a red flag. Speed must visibly drop for 2 seconds, then ramp back. No life lost. Yellow tint flashes briefly. The HUD timer bar must appear and drain. Remove TEMP after verification.

- [ ] **Commit**

```bash
git add public/games/ski-lemming/index.html
git commit -m "feat: red flag slowdown — 2s speed reduction, no life lost"
```

---

## Task 9: Score & Distance Tracking

**Files:**
- Modify: `public/games/ski-lemming/index.html`

- [ ] **Replace the stub `updateScore()` with real implementation**

```javascript
function updateScore() {
  G.distance = G.scrolled * M_PER_PX;
  G.score    = Math.floor(G.distance / Math.max(1, G.collisions));
}
```

- [ ] **Verify:** With TEMP start — the distance counter in the HUD increases as the player skis. Score equals distance when no collisions. After one hit, score = floor(distance / 1). Remove TEMP.

- [ ] **Commit**

```bash
git add public/games/ski-lemming/index.html
git commit -m "feat: score and distance tracking in HUD"
```

---

## Task 10: Start Screen, Game Over & API Integration

**Files:**
- Modify: `public/games/ski-lemming/index.html`

- [ ] **Add leaderboard render helper**

```javascript
// ── API & LEADERBOARD ────────────────────────────────────────
async function fetchScores() {
  try {
    const res = await fetch(`${API_BASE}/api/scores/${GAME_ID}`, { cache: 'no-store' });
    return res.ok ? res.json() : [];
  } catch { return []; }
}

async function submitScore(name, score) {
  try {
    const res = await fetch(`${API_BASE}/api/scores/${GAME_ID}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, score }),
    });
    return res.ok ? res.json() : [];
  } catch { return []; }
}

function renderLeaderboard(containerId, entries, highlightName) {
  const el = document.getElementById(containerId);
  if (!entries.length) { el.innerHTML = '<div class="lb-entry" style="justify-content:center;color:#4466aa">— sem scores ainda —</div>'; return; }
  el.innerHTML = entries.slice(0, 10).map((e, i) => `
    <div class="lb-entry ${e.name === highlightName ? 'highlight' : ''}">
      <span class="rank">${i + 1}.</span>
      <span>${e.name}</span>
      <span class="score-val">${e.score}</span>
    </div>
  `).join('');
}
```

- [ ] **Wire up start screen**

```javascript
// ── START SCREEN ─────────────────────────────────────────────
async function initStartScreen() {
  const scores = await fetchScores();
  renderLeaderboard('lb-start-entries', scores, '');
}

function startGame() {
  const input = document.getElementById('nameInput');
  const name  = input.value.trim().toUpperCase();
  if (!name) {
    input.classList.remove('input-error');
    void input.offsetWidth; // reflow to restart animation
    input.classList.add('input-error');
    return;
  }
  G = makeState();
  G.phase     = 'playing';
  G.startTime = performance.now();
  G.lastTime  = performance.now();
  G.playerName = name;
  document.getElementById('screen-start').classList.add('hidden');
  document.getElementById('screen-gameover').classList.add('hidden');
}

document.getElementById('btn-start').addEventListener('click', startGame);
document.getElementById('nameInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') startGame();
});
```

- [ ] **Replace the stub `showGameOver()` with full implementation**

```javascript
// ── GAME OVER ────────────────────────────────────────────────
async function showGameOver() {
  const screen = document.getElementById('screen-gameover');
  screen.classList.remove('hidden');

  document.getElementById('go-stats').innerHTML =
    `DISTÂNCIA: <strong>${Math.floor(G.distance)}m</strong><br>` +
    `COLISÕES: <strong>${G.collisions}</strong>`;
  document.getElementById('go-score').textContent = G.score;

  // Pre-fill name from start screen
  const goInput = document.getElementById('nameInputGO');
  goInput.value = G.playerName;

  const scores = await fetchScores();
  renderLeaderboard('lb-go-entries', scores, G.playerName);
}

async function submitAndRefresh() {
  const input = document.getElementById('nameInputGO');
  const name  = input.value.trim().toUpperCase();
  if (!name) {
    input.classList.remove('input-error');
    void input.offsetWidth;
    input.classList.add('input-error');
    return;
  }
  const btn = document.getElementById('btn-submit');
  btn.disabled = true;
  btn.textContent = 'ENVIANDO...';
  const scores = await submitScore(name, G.score);
  renderLeaderboard('lb-go-entries', scores, name);
  btn.textContent = 'ENVIADO ✓';
}

document.getElementById('btn-submit').addEventListener('click', submitAndRefresh);
document.getElementById('btn-restart').addEventListener('click', () => {
  document.getElementById('screen-gameover').classList.add('hidden');
  document.getElementById('screen-start').classList.remove('hidden');
  initStartScreen();
});
document.getElementById('nameInputGO').addEventListener('keydown', e => {
  if (e.key === 'Enter') submitAndRefresh();
});
```

- [ ] **Call `initStartScreen()` on page load** — at bottom of script:

```javascript
initStartScreen();
```

- [ ] **Verify full flow:**
  1. Page loads → start screen with leaderboard visible
  2. Click JOGAR without a name → input shakes
  3. Enter name, click JOGAR → game starts, HUD shows, obstacles scroll
  4. Die 3 times → game over screen shows stats + score
  5. Enter name → ENVIAR SCORE → score appears in leaderboard
  6. JOGAR NOVAMENTE → back to start screen

- [ ] **Commit**

```bash
git add public/games/ski-lemming/index.html
git commit -m "feat: start screen, game over, and API score integration"
```

---

## Task 11: Mobile Buttons & Touch Detection

**Files:**
- Modify: `public/games/ski-lemming/index.html`

- [ ] **Show mobile buttons on touch devices** — add after `initStartScreen()`:

```javascript
if (navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches) {
  document.getElementById('mobile-btns').style.display = 'flex';
}
```

- [ ] **Verify on mobile / DevTools touch simulation:** The ← ► buttons appear below the canvas. Tapping and holding moves the skier. Releasing stops movement.

- [ ] **Commit**

```bash
git add public/games/ski-lemming/index.html
git commit -m "feat: mobile touch buttons for ski-lemming"
```

---

## Task 12: games.json Entry & Hub Integration

**Files:**
- Modify: `games.json`

- [ ] **Add the ski-lemming entry to `games.json`**

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

The final `games.json` should be:

```json
[
  {
    "id": "torre-infinita",
    "name": "Torre Infinita",
    "subtitle": "PIXEL ART EDITION",
    "description": "Escale a torre infinita sem fim. Desvie dos espinhos, colete moedas.",
    "path": "/games/torre-infinita/",
    "color": "#ffd700",
    "added": "2025-01-01",
    "tags": ["platform", "endless", "arcade"]
  },
  {
    "id": "lua-runner",
    "name": "Lua Runner",
    "subtitle": "MOON SURFACE EDITION",
    "description": "Corra pela superfície da lua. Desvie de crateras e OVNIs.",
    "path": "/games/lua-runner/",
    "color": "#aaddff",
    "added": "2026-05-22",
    "tags": ["runner", "endless", "arcade"]
  },
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
]
```

- [ ] **Verify:** Open the hub (`/`). Ski Lemming must appear in the game list. The slot machine must be able to land on it. Clicking it must navigate to the game.

- [ ] **Commit**

```bash
git add games.json
git commit -m "feat: register ski-lemming in games.json"
```

---

## Done

At this point the full game is playable end-to-end:
- ✅ Start screen with leaderboard
- ✅ Lemming-style pixel art skiing on snow slope
- ✅ 4 obstacle types (tree ×3 spawn weight, dog, slow skier, red flag)
- ✅ 3-life system with flash, shake, invincibility
- ✅ Red flag: 2s slowdown, no life lost, yellow shimmer + timer bar
- ✅ Speed ramp on start, then constant
- ✅ Score = distance / max(1, collisions)
- ✅ Game over with score submission to API
- ✅ Mobile touch buttons
- ✅ Registered in hub
