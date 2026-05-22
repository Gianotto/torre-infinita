/**
 * ═══════════════════════════════════════════════════════════════
 * Torre Infinita — Servidor de Ranking
 * ═══════════════════════════════════════════════════════════════
 *
 * Endpoints:
 *   GET  /api/scores       → retorna o top 10
 *   POST /api/scores       → recebe { name, score } e salva
 *   GET  /                 → serve o index.html (jogo)
 *
 * Persistência:
 *   scores.json (na raiz do projeto)
 *
 * Como rodar:
 *   npm install
 *   npm start
 *
 * Variáveis de ambiente opcionais:
 *   PORT             porta (padrão 3000)
 *   SCORES_FILE      caminho do arquivo de scores
 *   MAX_SCORES       quantos scores manter (padrão 10)
 *   RATE_LIMIT_MS    intervalo mínimo entre POSTs por IP (padrão 3000)
 * ═══════════════════════════════════════════════════════════════
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();

// Confiar no proxy reverso (nginx) para obter o IP real do cliente
// via X-Forwarded-For. Sem isso, o rate limit veria todos os usuários
// como '127.0.0.1' e bloquearia o site inteiro após 1 envio.
app.set('trust proxy', 1);

// ─── Configuração ────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
const SCORES_FILE = process.env.SCORES_FILE || path.join(__dirname, 'scores.json');
const MAX_SCORES = parseInt(process.env.MAX_SCORES || '10', 10);
const RATE_LIMIT_MS = parseInt(process.env.RATE_LIMIT_MS || '3000', 10);
const MAX_NAME_LENGTH = 12;
const MAX_SCORE_VALUE = 1_000_000; // tetão "sanidade" — quem chegar aqui é hacker

// ─── Middleware ──────────────────────────────────────────────────
app.use(cors());                              // libera CORS pra qualquer origem
app.use(express.json({ limit: '4kb' }));      // payload é minúsculo
app.use(express.static(path.join(__dirname, 'public'))); // serve o jogo

// ─── Rate limiting simples por IP (em memória) ───────────────────
const lastPostByIp = new Map();
function rateLimit(req, res, next) {
  const ip = (req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim();
  const now = Date.now();
  const last = lastPostByIp.get(ip) || 0;
  if (now - last < RATE_LIMIT_MS) {
    return res.status(429).json({ error: 'aguarde alguns segundos antes de enviar de novo' });
  }
  lastPostByIp.set(ip, now);
  // limpar mapa periodicamente pra não vazar memória
  if (lastPostByIp.size > 1000) {
    const cutoff = now - RATE_LIMIT_MS * 10;
    for (const [k, v] of lastPostByIp) if (v < cutoff) lastPostByIp.delete(k);
  }
  next();
}

// ─── Helpers de leitura/escrita do arquivo ───────────────────────
async function readScores() {
  try {
    const data = await fs.readFile(SCORES_FILE, 'utf8');
    const arr = JSON.parse(data);
    return Array.isArray(arr) ? arr : [];
  } catch (err) {
    if (err.code === 'ENOENT') return []; // arquivo ainda não existe
    console.error('Erro ao ler scores:', err);
    return [];
  }
}

// fila simples pra evitar race condition em escritas simultâneas
let writeChain = Promise.resolve();
function writeScores(scores) {
  writeChain = writeChain.then(async () => {
    const tmp = SCORES_FILE + '.tmp';
    await fs.writeFile(tmp, JSON.stringify(scores, null, 2), 'utf8');
    await fs.rename(tmp, SCORES_FILE); // atômico
  }).catch(err => console.error('Erro ao salvar scores:', err));
  return writeChain;
}

// ─── Sanitização ────────────────────────────────────────────────
function sanitizeName(name) {
  if (typeof name !== 'string') return null;
  // remove caracteres de controle e tags, limita tamanho
  const cleaned = name
    .replace(/[\x00-\x1F\x7F<>&"']/g, '')
    .trim()
    .toUpperCase()
    .slice(0, MAX_NAME_LENGTH);
  return cleaned.length ? cleaned : null;
}

function sanitizeScore(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) return null;
  if (n < 0 || n > MAX_SCORE_VALUE) return null;
  return Math.floor(n);
}

// ─── Rotas ──────────────────────────────────────────────────────

// GET /api/scores → top 10
app.get('/api/scores', async (req, res) => {
  const scores = await readScores();
  // garante que vai ordenado e cortado
  const top = scores
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_SCORES);
  res.json(top);
});

// POST /api/scores → adicionar score
app.post('/api/scores', rateLimit, async (req, res) => {
  const name = sanitizeName(req.body?.name);
  const score = sanitizeScore(req.body?.score);

  if (!name) return res.status(400).json({ error: 'nome inválido' });
  if (score === null) return res.status(400).json({ error: 'score inválido' });

  const scores = await readScores();
  const entry = { name, score, date: Date.now() };
  scores.push(entry);

  // ordena, mantém só os top N
  scores.sort((a, b) => b.score - a.score);
  const trimmed = scores.slice(0, MAX_SCORES);

  await writeScores(trimmed);

  // descobre a posição do score recém-adicionado
  const rank = trimmed.findIndex(s => s.date === entry.date && s.name === entry.name && s.score === entry.score);

  res.json({
    ok: true,
    top: trimmed,
    yourRank: rank >= 0 ? rank + 1 : null, // 1-indexed; null se não entrou no top
    yourEntry: entry
  });
});

// Health check (útil pra serviços como Render/Railway)
app.get('/api/health', (req, res) => res.json({ ok: true, uptime: process.uptime() }));

// ─── Inicialização ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✓ Torre Infinita rodando em http://localhost:${PORT}`);
  console.log(`  Scores em: ${SCORES_FILE}`);
});
