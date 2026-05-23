# Deploy — Random Games

## Deploy com Docker (recomendado)

### Pré-requisitos na VPS
- Docker + Docker Compose instalados
- Nginx como proxy reverso (opcional, mas recomendado para HTTPS)
- Domínio apontando para o IP da VPS

### Primeira vez

```bash
# Clonar o repositório
git clone https://github.com/Gianotto/torre-infinita.git random-games
cd random-games

# Subir o container
docker compose up -d --build

# Verificar que está rodando
docker compose ps
curl http://localhost:3000/api/health
curl http://localhost:3000/api/games
```

### Atualizar depois de um push

```bash
cd random-games
git pull
docker compose up -d --build
```

Os scores são persistidos no volume Docker `scores-data` e sobrevivem a rebuilds.

---

## Nginx (proxy reverso + HTTPS)

```nginx
server {
    listen 80;
    server_name seudominio.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name seudominio.com;

    # Certificado (gerado pelo certbot)
    ssl_certificate     /etc/letsencrypt/live/seudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seudominio.com/privkey.pem;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Certbot (HTTPS gratuito)
certbot --nginx -d seudominio.com
```

---

## Comandos úteis

```bash
# Logs em tempo real
docker compose logs -f

# Reiniciar sem rebuild
docker compose restart

# Status dos containers
docker compose ps

# Parar tudo
docker compose down

# Backup dos rankings
docker compose exec app cat /data/scores/torre-infinita.json > backup-$(date +%F).json

# Ver ranking atual
docker compose exec app node -e "
  const fs = require('fs');
  const s = JSON.parse(fs.readFileSync('/data/scores/torre-infinita.json'));
  s.forEach((e,i) => console.log(i+1, e.name, e.score));
"
```

---

## Variáveis de ambiente

Definidas no `docker-compose.yml`. Para sobrescrever, crie um `docker-compose.override.yml`:

```yaml
services:
  app:
    environment:
      MAX_SCORES: 20
      RATE_LIMIT_MS: 5000
```

| Variável        | Padrão          | Descrição                        |
|-----------------|-----------------|----------------------------------|
| `PORT`          | `3000`          | Porta HTTP                       |
| `SCORES_DIR`    | `/data/scores`  | Diretório dos rankings           |
| `GAMES_FILE`    | `./games.json`  | Registro de jogos (no container) |
| `MAX_SCORES`    | `10`            | Scores por jogo                  |
| `RATE_LIMIT_MS` | `3000`          | Intervalo mínimo entre POSTs/IP  |

---

## Adicionar um novo jogo

1. Criar `public/games/{id}/index.html`
2. Adicionar entrada em `games.json`
3. Commit + push
4. Na VPS: `git pull && docker compose up -d --build`

Ver [GAMES.md](GAMES.md) para o passo-a-passo completo.

---

## Troubleshooting

**Hub mostra "ERRO"**
→ `/api/games` está falhando. Verifique os logs: `docker compose logs -f`
→ Certifique-se de que o rebuild incluiu o `games.json` atualizado.

**502 Bad Gateway**
→ Container não está rodando. `docker compose up -d`

**Scores sumindo após restart**
→ O volume `scores-data` precisa estar montado. `docker compose ps` deve mostrar o volume.

**Rate limit bloqueando todos**
→ O Nginx precisa passar o header `X-Forwarded-For`. Confirme que `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;` está no config.
