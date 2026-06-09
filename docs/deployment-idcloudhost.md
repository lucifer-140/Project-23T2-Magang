# Deployment Plan: IDCloudHost VPS

## What to Buy on IDCloudHost

### 1. VPS
Go to: **IDCloudHost → Cloud VPS → Linux VPS**

**Recommended spec:**
| Spec | Minimum | Recommended |
|------|---------|-------------|
| vCPU | 2 core | 2–4 core |
| RAM | 2 GB | 4 GB |
| Storage | 40 GB SSD | 60 GB SSD |
| OS | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |
| Bandwidth | 2 TB | 2 TB+ |

> Why 2GB RAM minimum: Node.js (Next.js) + PostgreSQL + Gotenberg (LibreOffice-based) run simultaneously. 1GB will OOM.

**Product name on IDCloudHost:** "VPS Linux" or "Cloud VPS" — pick the 2GB/2vCPU tier at minimum.

### 2. Domain
Go to: **IDCloudHost → Domain → Cari Domain**
- Buy domain (e.g. `uphsystem.id` or similar)
- After VPS is created, go to DNS Management → add A Record pointing to VPS IP

### 3. SSL Certificate
**Free** via Certbot (Let's Encrypt) — no need to buy from IDCloudHost.

---

## Server Setup (one-time)

### 1. Initial Setup

SSH into VPS as root, then run:

```bash
apt update && apt upgrade -y
apt install -y curl git nginx certbot python3-certbot-nginx ufw

# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Docker (for PostgreSQL + Gotenberg)
curl -fsSL https://get.docker.com | sh
apt install -y docker-compose-plugin

# App user
useradd -m -s /bin/bash uphapp
usermod -aG docker uphapp

# Persistent uploads directory (survives redeployments)
mkdir -p /data/uph-uploads
chown uphapp:uphapp /data/uph-uploads

# Firewall
ufw allow ssh
ufw allow 80
ufw allow 443
ufw enable
```

### 2. PostgreSQL + Gotenberg via Docker

Create `/opt/uph-services/docker-compose.yml`:

```yaml
version: '3.8'
services:
  db:
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_USER: uphuser
      POSTGRES_PASSWORD: <strong-password-here>
      POSTGRES_DB: uph_admin
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "127.0.0.1:5432:5432"

  gotenberg:
    image: gotenberg/gotenberg:8
    restart: always
    ports:
      - "127.0.0.1:3001:3000"

volumes:
  postgres_data:
```

```bash
cd /opt/uph-services && docker compose up -d
```

### 3. Deploy App

```bash
su - uphapp
git clone <repo-url> /home/uphapp/uph-admin
cd /home/uphapp/uph-admin

# Symlink uploads to persistent dir
ln -s /data/uph-uploads public/uploads

# Environment variables
cat > .env.production << EOF
DATABASE_URL=postgresql://uphuser:<password>@localhost:5432/uph_admin?schema=public
NEXT_PUBLIC_APP_URL=https://<yourdomain>
GOTENBERG_URL=http://localhost:3001
NODE_ENV=production
EOF

npm ci
npx prisma migrate deploy
npx prisma generate
npm run build
```

Start with PM2 (process manager — keeps app alive on reboot):

```bash
npm install -g pm2
pm2 start npm --name "uph-admin" -- start
pm2 startup   # follow instructions shown
pm2 save
```

### 4. Nginx Reverse Proxy

Create `/etc/nginx/sites-available/uph-admin`:

```nginx
server {
    listen 80;
    server_name <yourdomain>;

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads/ {
        alias /data/uph-uploads/;
        expires 7d;
        add_header Cache-Control "public";
    }
}
```

```bash
ln -s /etc/nginx/sites-available/uph-admin /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

### 5. SSL (after domain DNS propagates)

```bash
certbot --nginx -d <yourdomain>
```

### 6. Seed Database (first time only)

```bash
cd /home/uphapp/uph-admin
npx tsx prisma/seed.ts
npx tsx prisma/seed-katalog.ts
```

> **Security:** Change all seed account passwords immediately after first login.

---

## Redeployment (future updates)

```bash
su - uphapp
cd /home/uphapp/uph-admin
git pull
npm ci
npx prisma migrate deploy
npm run build
pm2 restart uph-admin
```

Files in `/data/uph-uploads/` are untouched — symlink preserves them across deploys.

---

## Architecture Summary

| Component | Location |
|-----------|----------|
| Next.js app | VPS, PM2, port 3000 |
| PostgreSQL | Docker container, port 5432 (localhost only) |
| Gotenberg | Docker container, port 3001 (localhost only) |
| File uploads | `/data/uph-uploads/` (symlinked from `public/uploads/`) |
| Reverse proxy | Nginx → port 3000 |
| SSL | Certbot (Let's Encrypt, free) |
| Domain | IDCloudHost DNS A record → VPS IP |

---

## Multi-Project on Same VPS

Same VPS can host multiple projects. Each app runs on different port, Nginx routes by domain.

### Port Allocation (example)

| Project | App Port | Domain |
|---------|----------|--------|
| This project (UPH Admin) | 3000 | `uphsystem.id` |
| Project B | 3002 | `projectb.id` |
| Project C | 3003 | `projectc.id` |
| Gotenberg | 3001 | internal only |

> Each project gets its own PM2 process, its own `.env.production`, its own Nginx server block.

### Add New Project

```bash
# 1. Clone project
su - uphapp
git clone <repo-url> /home/uphapp/<project-name>
cd /home/uphapp/<project-name>

# 2. Set env — use different PORT
echo "PORT=3002" >> .env.production

# 3. Build & start
npm ci && npm run build
pm2 start npm --name "<project-name>" -- start
pm2 save
```

### Nginx for Second Project

Add new file `/etc/nginx/sites-available/<project-name>`:

```nginx
server {
    listen 80;
    server_name <projectb-domain>;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/<project-name> /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d <projectb-domain>
```

### Shared vs Separate Database

- **Separate DB** (recommended): each project gets own database in same PostgreSQL container
  ```sql
  CREATE DATABASE project_b;
  CREATE USER project_b_user WITH PASSWORD '<pw>';
  GRANT ALL ON DATABASE project_b TO project_b_user;
  ```
- **Separate PostgreSQL container**: only if projects need different PG versions

### VPS Spec Upgrade for Multiple Projects

| Projects | Recommended RAM |
|----------|----------------|
| 1 project | 2 GB |
| 2–3 projects | 4 GB |
| 4+ projects | 8 GB |

---

## Verification Checklist

- [ ] `curl https://<domain>/api/master/health` returns `{ status: "ok" }`
- [ ] Login works with seed accounts
- [ ] Upload test RPS PDF → file appears, URL accessible
- [ ] Upload .docx → converts to PDF (Gotenberg working)
- [ ] `pm2 logs uph-admin` → no errors
- [ ] HTTPS padlock shows in browser
