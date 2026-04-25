# Sistem Administrasi Prodi Informatika Medan

![Version](https://img.shields.io/badge/version-0.18.0-blue)
![Status](https://img.shields.io/badge/status-production--ready-brightgreen)
![Stack](https://img.shields.io/badge/stack-Next.js%2016%20%7C%20Prisma%207%20%7C%20PostgreSQL-informational)

Portal administrasi akademik terpadu untuk Dosen dan Kaprodi — mendigitalisasi pengelolaan dokumen akademik (RPS, Soal UTS/UAS, LPP, EPP, Berita Acara) dengan alur kerja multi-level approval, anotasi PDF inline, dan tanda tangan digital.

## Fitur Utama

- **Multi-Role RBAC:** MASTER, ADMIN, KAPRODI, KOORDINATOR, DOSEN, PRODI — dengan account approval flow
- **8 Tipe Dokumen:** RPS, Soal UTS, Soal UAS, LPP, EPP, Berita Acara Perwalian
- **3-Stage Approval:** Koordinator → PRODI → Kaprodi dengan enforcement sekuensial
- **PDF Annotation:** Highlight, Draw, Box, Sticky Note langsung di browser; di-flatten ke PDF saat penolakan
- **Digital Signature:** Tanda tangan drag-and-drop pada PDF; tersimpan per-user sebagai template
- **Berita Acara Perwalian:** Per-kelas per-semester, 3 slot file, unlock oleh Kaprodi
- **Notifikasi Real-Time:** In-app toast queue + bell icon; polling 5 detik
- **Kaprodi Analytics:** Chart EPP, breakdown dokumen per tipe/status, filter per semester
- **DOCX → PDF:** Konversi otomatis via Gotenberg → LibreOffice → Puppeteer (fallback chain)
- **Manajemen Matkul:** Hierarki TahunAkademik → Semester → Matkul → Kelas; live catalog dari KatalogMatkul

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| Styling | Tailwind CSS 4 |
| ORM | Prisma 7 (`@prisma/adapter-pg`) |
| Database | PostgreSQL (Docker) |
| Data Fetching | SWR (5s polling) |
| PDF Processing | pdf-lib, PDF.js, react-pdf, Puppeteer, Mammoth |
| Charts | Recharts |
| Icons | Lucide React |

## Panduan Lokal (Development)

### Prerequisites

- Node.js v20+
- Docker Desktop

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file and fill in DATABASE_URL
cp .env.example .env

# 3. Start the database container
docker compose up -d

# 4. Apply schema and seed data
npx prisma migrate dev
npm run seed
npm run seed:katalog

# 5. Start dev server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Deployment (Local Server)

**Target:** Ubuntu 24.04 LTS · Node.js 22 LTS · PM2 · PostgreSQL via Docker

```bash
# 1. Clone and install
git clone <repo> && cd <repo>
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL

# 3. Start database
docker compose up -d

# 4. Run migrations and seed
npx prisma migrate deploy
npm run seed
npm run seed:katalog

# 5. Build and start
npm run build
pm2 start npm --name uph-admin -- start
pm2 save
pm2 startup   # follow instructions to auto-start on reboot
```

Access via `http://<server-ip>:3000`. Optionally configure Nginx as reverse proxy on port 80.

> **MacBook sebagai server:** Tahan **Option** saat boot untuk pilih USB installer. Install Ubuntu 24.04 LTS headless. Gunakan Ethernet saat setup — WiFi Broadcom mungkin perlu `bcmwl-kernel-source`. Aktifkan OpenSSH saat install untuk remote management.

## Seed Accounts

| Email | Password | Role |
|---|---|---|
| master@test.com | master123 | MASTER |
| admin@test.com | admin123 | ADMIN |
| kaprodi@test.com | kaprodi123 | KAPRODI |
| koordinator@test.com | koordinator123 | KOORDINATOR |
| dosen@test.com | dosen123 | DOSEN |
| dosen2@test.com | dosen123 | DOSEN |
| prodi@test.com | prodi123 | DOSEN + PRODI |

## Useful Commands

```bash
npm run dev                   # Start dev server
npm run build                 # Production build
npm run lint                  # ESLint check
npm run seed                  # Seed test accounts
npm run seed:katalog          # Seed course catalog (KatalogMatkul)
npx prisma studio             # Prisma GUI
npx prisma migrate dev        # Run + create migrations
npx prisma generate           # Regenerate Prisma client
docker compose up -d          # Start Postgres
docker compose down           # Stop Postgres
```

## Known Limitations

- **Passwords plain text** — intentional for development; hash with bcrypt/argon2 before real-user production use
- **No email notifications** — in-app only; Resend atau Gmail OAuth2 integration planned
- **No HTTPS enforcement** — acceptable for local LAN; required for internet-facing deployment
- **No automated backups** — set up PostgreSQL scheduled dumps before going live

## Documentation

| File | Description |
|---|---|
| [docs/architecture.md](docs/architecture.md) | System design and data flow |
| [docs/changelog.md](docs/changelog.md) | Full version history |
| [docs/project_status.md](docs/project_status.md) | Current progress and known issues |
| [docs/alur-sistem.md](docs/alur-sistem.md) | User workflow guide (Indonesian) |
| [docs/roadmap-active-semester.md](docs/roadmap-active-semester.md) | Planned: active semester auto-detection |
| [docs/roadmap-master-pages.md](docs/roadmap-master-pages.md) | Planned: Master account pages |
| [docs/roadmap-pwa-mobile.md](docs/roadmap-pwa-mobile.md) | Planned: PWA + mobile responsive |
| [docs/roadmap-dashboard-ux.md](docs/roadmap-dashboard-ux.md) | Planned: deferred dashboard UX features |

## Versioning

Mengikuti [Semantic Versioning](https://semver.org/). Minor features → `0.x.0`; patches/fixes → `0.x.y`. Tidak naik ke `1.0.0` sampai siap rilis resmi.
