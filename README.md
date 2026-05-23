# Random Games

Plataforma arcade com um novo jogo por semana. Cada acesso à raiz sorteia um jogo diferente. Todos os jogos têm ranking TOP 10.

**Stack:** Node.js + Express + Canvas API (vanilla JS). Sem framework, sem build step.

## Jogos disponíveis

| Jogo           | Estilo            | Adicionado   |
|----------------|-------------------|--------------|
| Torre Infinita | Platform endless  | 2025-01-01   |

## Estrutura

```
├── server.js                       ← API REST (scores + games)
├── games.json                      ← Registro de jogos
├── scores/{gameId}.json            ← Rankings (gerados automaticamente)
├── public/
│   ├── index.html                  ← Hub arcade (sorteia um jogo)
│   └── games/{id}/index.html      ← Cada jogo
└── GAMES.md                        ← Como adicionar um novo jogo
```

## Rodar localmente

```bash
npm install
npm start   # http://localhost:3000
```

## API

| Método | Rota                    | Descrição                     |
|--------|-------------------------|-------------------------------|
| GET    | `/api/games`            | Lista de jogos registrados    |
| GET    | `/api/scores/:gameId`   | Top 10 do jogo                |
| POST   | `/api/scores/:gameId`   | Envia `{ name, score }`       |
| GET    | `/api/health`           | Health check                  |

## Adicionar um jogo

Ver [GAMES.md](GAMES.md) para o passo-a-passo completo.

## Deploy

Ver [DEPLOY.md](DEPLOY.md). Variáveis de ambiente:

| Variável        | Padrão              | Descrição                   |
|-----------------|---------------------|-----------------------------|
| `PORT`          | `3000`              | Porta HTTP                  |
| `SCORES_DIR`    | `./scores`          | Diretório dos rankings      |
| `GAMES_FILE`    | `./games.json`      | Registro de jogos           |
| `MAX_SCORES`    | `10`                | Scores por jogo             |
| `RATE_LIMIT_MS` | `3000`              | Intervalo entre POSTs/IP    |
