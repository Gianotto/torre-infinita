// PM2 ecosystem config — gerenciamento de processo em produção
//
// Uso:
//   pm2 start ecosystem.config.js
//   pm2 logs torre
//   pm2 restart torre
//   pm2 stop torre
//   pm2 save           ← salva lista para reiniciar no boot
//   pm2 startup        ← cria serviço systemd
//
module.exports = {
  apps: [{
    name: 'torre',
    script: './server.js',
    cwd: __dirname,

    // restart automático se cair
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',

    // logs (ajuste se quiser outro caminho)
    error_file: './logs/torre-error.log',
    out_file: './logs/torre-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,

    // variáveis de ambiente
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      SCORES_FILE: '/var/lib/torre/scores.json', // ← caminho fora do repo!
      MAX_SCORES: 10,
      RATE_LIMIT_MS: 3000
    },

    // limite de memória — reinicia se passar (proteção contra leak)
    max_memory_restart: '200M',

    // tempo para encerrar graciosamente
    kill_timeout: 5000
  }]
};
