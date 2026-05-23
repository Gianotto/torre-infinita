// PM2 ecosystem config — gerenciamento de processo em produção
//
// Uso:
//   pm2 start ecosystem.config.js
//   pm2 logs random-games
//   pm2 restart random-games
//   pm2 stop random-games
//   pm2 save           ← salva lista para reiniciar no boot
//   pm2 startup        ← cria serviço systemd
//
module.exports = {
  apps: [{
    name: 'random-games',
    script: './server.js',
    cwd: __dirname,

    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',

    error_file: './logs/error.log',
    out_file:   './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,

    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      SCORES_DIR: '/var/lib/random-games/scores', // fora do repo — dados persistentes
      // GAMES_FILE não precisa de override: games.json está no repo e é lido do __dirname
      MAX_SCORES: 10,
      RATE_LIMIT_MS: 3000
    },

    max_memory_restart: '200M',
    kill_timeout: 5000
  }]
};
