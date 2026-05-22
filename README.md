# Torre Infinita — Pixel Art Edition

Jogo de plataformas endless-climber com ranking online. Backend Node.js + Express; frontend em Canvas puro.

## 📁 Estrutura

```
torre-infinita/
├── server.js              ← Backend Express
├── ecosystem.config.js    ← Configuração PM2
├── package.json
├── scores.json            ← Criado automaticamente na 1ª gravação
├── DEPLOY.md
└── public/
    └── index.html         ← O jogo (servido pelo Express)
```

## 🎮 Como jogar

| Ação       | Teclado                         | Mobile     |
|------------|---------------------------------|------------|
| Mover      | `← →` ou `A` `D`               | —          |
| Pular      | `Espaço`, `↑` ou `W`           | Toque      |
| Confirmar  | `Enter` (iniciar / reiniciar)   | —          |

**Objetivo:** suba o mais alto possível. A altura vira pontos; moedas coletadas valem +25 cada.

### Plataformas

| Tipo    | Cor     | Comportamento                    |
|---------|---------|----------------------------------|
| Normal  | Lilás   | Estática                         |
| Mola    | Verde   | Impulso extra (1,6× altura)      |
| Móvel   | Dourada | Vai e vem horizontalmente        |

Espinhos matam imediatamente. Tome cuidado com quedas longas — cair mais de 500px abaixo do ponto mais alto alcançado encerra a partida.

## 🚀 Como rodar localmente

```bash
npm install
npm start
```

Abra `http://localhost:3000` no navegador.

## 🌐 Endpoints

| Método | Rota          | Descrição                          |
|--------|---------------|------------------------------------|
| GET    | `/api/scores` | Retorna o top 10 ordenado          |
| POST   | `/api/scores` | Envia `{ name, score }` p/ ranking |
| GET    | `/api/health` | Health check (uptime)              |
| GET    | `/`           | Serve o jogo (`public/index.html`) |

### Exemplo de POST

```bash
curl -X POST http://localhost:3000/api/scores \
  -H "Content-Type: application/json" \
  -d '{"name":"VICTOR","score":1234}'
```

Resposta:
```json
{
  "ok": true,
  "top": [ { "name": "VICTOR", "score": 1234, "date": 1716400000000 } ],
  "yourRank": 1,
  "yourEntry": { "name": "VICTOR", "score": 1234, "date": 1716400000000 }
}
```

## ⚙️ Variáveis de ambiente (opcionais)

| Variável        | Padrão          | Descrição                                |
|-----------------|-----------------|------------------------------------------|
| `PORT`          | `3000`          | Porta HTTP                               |
| `SCORES_FILE`   | `./scores.json` | Caminho do arquivo de persistência       |
| `MAX_SCORES`    | `10`            | Quantos scores manter no ranking         |
| `RATE_LIMIT_MS` | `3000`          | Intervalo mínimo entre POSTs por IP (ms) |

## 🛡️ Proteções incluídas

- Sanitização de nome (remove tags, controla tamanho)
- Validação de score (numérico, faixa 0–1 M)
- Rate limit por IP (1 envio a cada 3 s)
- Escrita atômica (write em `.tmp` + rename)
- Fila de escrita (evita race condition)
- Limit de payload (4 KB)
- CORS liberado

> **Nota:** qualquer um pode enviar `score: 999999` via curl. Para mitigar: tokens de sessão, validação de tempo de jogo ou Cloudflare Turnstile.

## ☁️ Deploy

Ver [DEPLOY.md](DEPLOY.md) para instruções detalhadas (Render, Railway, Fly.io, VPS com PM2).

Se o `index.html` estiver em domínio diferente do backend, defina `API_BASE` no jogo:

```javascript
const API_BASE = 'https://torre-backend.onrender.com';
```

## 📊 Backup do ranking

```bash
cp scores.json backups/scores-$(date +%Y%m%d).json
```
