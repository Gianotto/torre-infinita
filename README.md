# Torre Infinita — Servidor de Ranking

Backend Node.js + Express com persistência em arquivo JSON.

## 📁 Estrutura

```
server/
├── server.js           ← Backend Express
├── package.json
├── scores.json         ← Criado automaticamente na 1ª gravação
└── public/
    └── index.html      ← O jogo (servido pelo Express)
```

## 🚀 Como rodar localmente

```bash
cd server
npm install
npm start
```

Abra `http://localhost:3000` no navegador.

## 🌐 Endpoints

| Método | Rota             | Descrição                          |
|--------|------------------|------------------------------------|
| GET    | `/api/scores`    | Retorna o top 10 ordenado          |
| POST   | `/api/scores`    | Envia `{ name, score }` p/ ranking |
| GET    | `/api/health`    | Health check (uptime)              |
| GET    | `/`              | Serve o jogo (`public/index.html`) |

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

| Variável         | Padrão                | Descrição                                  |
|------------------|-----------------------|--------------------------------------------|
| `PORT`           | `3000`                | Porta HTTP                                 |
| `SCORES_FILE`    | `./scores.json`       | Caminho do arquivo de persistência         |
| `MAX_SCORES`     | `10`                  | Quantos scores manter no ranking           |
| `RATE_LIMIT_MS`  | `3000`                | Intervalo mínimo entre POSTs por IP (ms)   |

## 🛡️ Proteções já incluídas

- ✅ Sanitização de nome (remove tags, controla tamanho)
- ✅ Validação de score (numérico, faixa 0-1M)
- ✅ Rate limit por IP (1 envio a cada 3s)
- ✅ Escrita atômica (write em `.tmp` + rename)
- ✅ Fila de escrita (evita race condition)
- ✅ Limit de payload (4KB)
- ✅ CORS liberado

## 🛡️ O que NÃO está protegido

Qualquer um pode usar curl pra mandar `score: 999999`. Pra evitar:
- Tokens de sessão (gerar no GET, validar no POST)
- Validação de "tempo de jogo" (rejeitar scores muito altos em poucos segundos)
- Captcha (Cloudflare Turnstile é grátis)

## ☁️ Deploy

### Render.com (recomendado, free tier)
1. Crie um repositório Git com esta pasta `server/`
2. No Render: New → Web Service → conecte o repo
3. Build command: `npm install`
4. Start command: `npm start`
5. Adicione um **disco persistente** de 1GB montado em `/data`
6. Configure `SCORES_FILE=/data/scores.json` nas env vars

### Railway / Fly.io
Mesmo princípio: precisa de volume persistente, senão o `scores.json` é perdido a cada redeploy.

### VPS tradicional (DigitalOcean, Hetzner, etc.)
```bash
git clone https://github.com/Gianotto/torre-infinita.git
cd server
npm install --production
# rode com pm2 pra ficar em background
npm install -g pm2
pm2 start server.js --name torre
pm2 save
pm2 startup
```

Coloque um Nginx na frente pra HTTPS (Let's Encrypt com certbot).

### Hospedagem compartilhada (cPanel)
Geralmente não suporta Node. Use a opção PHP em vez desta.

## 🔧 Frontend em outro domínio?

Se o `index.html` ficar em um CDN diferente do backend (ex: site em Netlify e API em Render), edite o jogo na constante `API_BASE`:

```javascript
const API_BASE = 'https://torre-backend.onrender.com';
```

O CORS já está liberado no servidor.

## 📊 Backup do ranking

O ranking inteiro é o arquivo `scores.json`. Pra backup:
```bash
cp scores.json backups/scores-$(date +%Y%m%d).json
```
