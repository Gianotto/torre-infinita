/**
 * Random Games — Servidor de Ranking Multi-Jogo
 *
 * GET  /api/games              → lista de jogos registrados
 * GET  /api/scores/:gameId     → top 10 do jogo
 * POST /api/scores/:gameId     → envia { name, score }
 * GET  /api/health             → health check
 * GET  /*                      → serve public/
 */

const express = require('express');
const cors    = require('cors');
const fs      = require('fs').promises;
const path    = require('path');

const app = express();
app.set('trust proxy', 1);

// ─── Configuração ────────────────────────────────────────────────
const PORT          = process.env.PORT          || 3000;
const SCORES_DIR    = process.env.SCORES_DIR    || path.join(__dirname, 'scores');
const GAMES_FILE    = process.env.GAMES_FILE    || path.join(__dirname, 'games.json');
const MAX_SCORES    = parseInt(process.env.MAX_SCORES    || '10',   10);
const RATE_LIMIT_MS = parseInt(process.env.RATE_LIMIT_MS || '3000', 10);
const MAX_NAME_LENGTH = 12;
const MAX_SCORE_VALUE = 1_000_000;

// ─── Middleware ──────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '4kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ─── Rate limiting por IP ─────────────────────────────────────────
const lastPostByIp = new Map();
function rateLimit(req, res, next) {
  const ip  = (req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim();
  const now = Date.now();
  const last = lastPostByIp.get(ip) || 0;
  if (now - last < RATE_LIMIT_MS) {
    return res.status(429).json({ error: 'aguarde alguns segundos antes de enviar de novo' });
  }
  lastPostByIp.set(ip, now);
  if (lastPostByIp.size > 1000) {
    const cutoff = now - RATE_LIMIT_MS * 10;
    for (const [k, v] of lastPostByIp) if (v < cutoff) lastPostByIp.delete(k);
  }
  next();
}

// ─── Helpers de arquivo ──────────────────────────────────────────
function scoresFile(gameId) {
  const safe = gameId.replace(/[^a-z0-9-]/g, '');
  return path.join(SCORES_DIR, `${safe}.json`);
}

async function readScores(gameId) {
  try {
    const data = await fs.readFile(scoresFile(gameId), 'utf8');
    const arr  = JSON.parse(data);
    return Array.isArray(arr) ? arr : [];
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    console.error(`Erro ao ler scores (${gameId}):`, err);
    return [];
  }
}

const writeChains = new Map();
function writeScores(gameId, scores) {
  const prev = writeChains.get(gameId) || Promise.resolve();
  const next = prev.then(async () => {
    const file = scoresFile(gameId);
    await fs.mkdir(path.dirname(file), { recursive: true });
    const tmp = file + '.tmp';
    await fs.writeFile(tmp, JSON.stringify(scores, null, 2), 'utf8');
    await fs.rename(tmp, file);
  }).catch(err => console.error(`Erro ao salvar scores (${gameId}):`, err));
  writeChains.set(gameId, next);
  return next;
}

// ─── Sanitização ────────────────────────────────────────────────
function sanitizeName(name) {
  if (typeof name !== 'string') return null;
  const cleaned = name
    .replace(/[\x00-\x1F\x7F<>&"']/g, '')
    .trim()
    .toUpperCase()
    .slice(0, MAX_NAME_LENGTH);
  return cleaned.length ? cleaned : null;
}

function sanitizeScore(score) {
  const n = Number(score);
  if (!Number.isFinite(n))          return null;
  if (n < 0 || n > MAX_SCORE_VALUE) return null;
  return Math.floor(n);
}

function sanitizeGameId(id) {
  return /^[a-z0-9-]{1,64}$/.test(id) ? id : null;
}

// ─── Rotas ──────────────────────────────────────────────────────

app.get('/api/games', async (req, res) => {
  try {
    const data  = await fs.readFile(GAMES_FILE, 'utf8');
    const games = JSON.parse(data);
    res.json(Array.isArray(games) ? games : []);
  } catch (err) {
    console.error('Erro ao ler games.json:', err);
    res.status(500).json({ error: 'erro ao carregar jogos' });
  }
});

app.get('/api/scores/:gameId', async (req, res) => {
  const gameId = sanitizeGameId(req.params.gameId);
  if (!gameId) return res.status(400).json({ error: 'gameId inválido' });

  const scores = await readScores(gameId);
  const top    = scores.sort((a, b) => b.score - a.score).slice(0, MAX_SCORES);
  res.json(top);
});

app.post('/api/scores/:gameId', rateLimit, async (req, res) => {
  const gameId = sanitizeGameId(req.params.gameId);
  if (!gameId) return res.status(400).json({ error: 'gameId inválido' });

  const name  = sanitizeName(req.body?.name);
  const score = sanitizeScore(req.body?.score);

  if (!name)          return res.status(400).json({ error: 'nome inválido' });
  if (score === null) return res.status(400).json({ error: 'score inválido' });

  const scores  = await readScores(gameId);
  const entry   = { name, score, date: Date.now() };
  scores.push(entry);
  scores.sort((a, b) => b.score - a.score);
  const trimmed = scores.slice(0, MAX_SCORES);

  await writeScores(gameId, trimmed);

  const rank = trimmed.findIndex(
    s => s.date === entry.date && s.name === entry.name && s.score === entry.score
  );

  res.json({ ok: true, top: trimmed, yourRank: rank >= 0 ? rank + 1 : null, yourEntry: entry });
});

app.get('/api/health', (req, res) => res.json({ ok: true, uptime: process.uptime() }));

// ─── Inicialização ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✓ Random Games rodando em http://localhost:${PORT}`);
  console.log(`  Scores em: ${SCORES_DIR}/`);
  console.log(`  Jogos em:  ${GAMES_FILE}`);
});
