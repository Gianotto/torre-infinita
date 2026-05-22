# ─── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copia só o necessário pra instalar dependências
# (aproveita cache do Docker — só reinstala se package.json mudar)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ─── Runtime stage ────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

# Usuário não-root por segurança
RUN addgroup -S torre && adduser -S torre -G torre

WORKDIR /app

# Copia dependências do estágio anterior
COPY --from=deps /app/node_modules ./node_modules

# Copia o código da aplicação
COPY server.js ./
COPY public/ ./public/

# Volume para o scores.json persistente (mapeado pelo docker-compose)
RUN mkdir -p /data && chown torre:torre /data

USER torre

# Porta exposta pelo servidor Express
EXPOSE 3000

# Variáveis de ambiente padrão (sobrescritas pelo docker-compose)
ENV NODE_ENV=production \
    PORT=3000 \
    SCORES_FILE=/data/scores.json \
    MAX_SCORES=10 \
    RATE_LIMIT_MS=3000

# Health check nativo do Docker
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
