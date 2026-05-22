# 🚀 Deploy em VPS com nginx

Guia passo a passo do zero ao deploy.

## 📋 Pré-requisitos

- VPS rodando Ubuntu/Debian (DigitalOcean, Hetzner, Contabo, Oracle Cloud, etc.)
- Domínio apontando pro IP da VPS (registro A no DNS)
- Acesso root via SSH

---

## 1️⃣ Subir o código pro Git

Localmente, na pasta `server/`:

```bash
git init
git add .
git commit -m "Torre Infinita — initial commit"
git branch -M main
git remote add origin git@github.com:seu-usuario/torre-infinita.git
git push -u origin main
```

O `.gitignore` já está configurado para **NÃO** subir:
- `node_modules/`
- `scores.json` (ranking real fica só na VPS)
- `.env`, logs, etc.

---

## 2️⃣ Preparar a VPS (uma vez só)

SSH na VPS:

```bash
ssh root@seu-ip
```

Instale o necessário:

```bash
# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs nginx certbot python3-certbot-nginx git

# PM2 (gerenciador de processo)
npm install -g pm2

# Usuário dedicado pra rodar o app (não rode como root!)
adduser --system --group --shell /bin/bash torre
```

---

## 3️⃣ Clonar e instalar o projeto

```bash
# como root
mkdir -p /var/www/torre
chown torre:torre /var/www/torre

# trocar pro usuário torre
su - torre
cd /var/www
git clone https://github.com/seu-usuario/torre-infinita.git torre
cd torre
npm install --omit=dev
```

Crie a pasta de logs e o local pro ranking persistente:

```bash
mkdir -p /var/www/torre/logs
exit  # voltar pro root
mkdir -p /var/lib/torre
chown torre:torre /var/lib/torre
```

---

## 4️⃣ Iniciar o app com PM2

```bash
su - torre
cd /var/www/torre
pm2 start ecosystem.config.js
pm2 save
exit
```

Configure o PM2 pra iniciar no boot da VPS (como root):

```bash
env PATH=$PATH:/usr/bin pm2 startup systemd -u torre --hp /home/torre
# rode o comando que o pm2 imprimir
```

Verifique que está rodando:

```bash
su - torre -c "pm2 status"
curl http://localhost:3000/api/health
# deve retornar {"ok":true,"uptime":...}
```

---

## 5️⃣ Configurar o nginx

```bash
# como root
cp /var/www/torre/nginx.conf.example /etc/nginx/sites-available/torre
nano /etc/nginx/sites-available/torre
```

**Edite os campos:**
- `server_name torre.seudominio.com;` → coloque seu domínio
- Linhas de SSL podem ficar como estão (certbot vai preencher)

Ative o site e teste:

```bash
ln -s /etc/nginx/sites-available/torre /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default  # se existir
nginx -t
systemctl reload nginx
```

---

## 6️⃣ HTTPS gratuito com Let's Encrypt

```bash
certbot --nginx -d torre.seudominio.com
```

Responda as perguntas (email, aceitar termos, redirecionar HTTP→HTTPS = sim).

Renovação automática já vem configurada. Pra testar:

```bash
certbot renew --dry-run
```

---

## ✅ Pronto!

Acesse `https://torre.seudominio.com` e jogue.

---

## 🔄 Como atualizar depois (workflow)

Quando fizer mudanças no código:

**Local:**
```bash
git add .
git commit -m "ajuste no pulo"
git push
```

**Na VPS:**
```bash
ssh root@seu-ip
su - torre
cd /var/www/torre
git pull
npm install --omit=dev    # se mudou package.json
pm2 restart torre
exit
```

Ou, pra automatizar, crie um script de deploy:

```bash
# /var/www/torre/deploy.sh
#!/bin/bash
set -e
cd /var/www/torre
git pull
npm install --omit=dev
pm2 restart torre
echo "✓ Deploy concluído"
```

```bash
chmod +x /var/www/torre/deploy.sh
```

Aí pra atualizar é só `ssh root@seu-ip 'su - torre -c /var/www/torre/deploy.sh'`.

---

## 🔍 Comandos úteis no dia a dia

```bash
# Ver logs em tempo real
su - torre -c "pm2 logs torre"

# Reiniciar app
su - torre -c "pm2 restart torre"

# Ver status / uso de memória
su - torre -c "pm2 status"

# Logs do nginx
tail -f /var/log/nginx/torre-access.log
tail -f /var/log/nginx/torre-error.log

# Backup do ranking
cp /var/lib/torre/scores.json /root/backups/scores-$(date +%F).json

# Ver ranking atual (sem abrir o jogo)
cat /var/lib/torre/scores.json | python3 -m json.tool
```

---

## 🛡️ Hardening adicional (opcional)

### Firewall (UFW)
```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

### Fail2ban (proteção contra SSH brute force)
```bash
apt install -y fail2ban
systemctl enable --now fail2ban
```

### Backup automático do scores.json
Crie `/etc/cron.daily/torre-backup`:
```bash
#!/bin/bash
mkdir -p /var/backups/torre
cp /var/lib/torre/scores.json /var/backups/torre/scores-$(date +%F).json
find /var/backups/torre -name 'scores-*.json' -mtime +30 -delete
```
```bash
chmod +x /etc/cron.daily/torre-backup
```

---

## ❓ Troubleshooting

**"502 Bad Gateway"** → Node não está rodando. `pm2 status` na VPS.

**Rate limit bloqueando todos** → o `trust proxy` não está habilitado. Já está no código, mas confirme que o servidor foi atualizado: `pm2 restart torre`.

**Ranking sumiu após restart** → o `SCORES_FILE` no `ecosystem.config.js` aponta pra dentro do repo. Mova pra `/var/lib/torre/scores.json` (já está configurado).

**Quero testar localmente antes do deploy** → `npm start` na pasta, abre `http://localhost:3000`.
