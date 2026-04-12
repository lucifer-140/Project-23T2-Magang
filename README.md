# UPH Lecturer Administration Dashboard

![Version](https://img.shields.io/badge/version-0.9.0-blue)
![Stack](https://img.shields.io/badge/stack-Next.js%2016%20%7C%20Prisma%207%20%7C%20PostgreSQL-informational)

Sistem Informasi Dasbor Administrasi terpadu untuk Dosen dan Kaprodi Universitas Pelita Harapan (UPH). Aplikasi ini dirancang untuk mendigitalisasi dan memusatkan berbagai manajemen berkas akademis dengan antarmuka yang modern, cepat, dan berorientasi pada penyelesaian tindakan (action-oriented).

## Fitur Utama

- **Multi-Role Dashboards:** Admin, Kaprodi, Koordinator, Dosen, dan Master (System Master).
- **Verifikasi RPS (Multi-Level):** Alur kerja dua tingkat persetujuan — Dosen → Koordinator → Kaprodi dengan status tracking real-time.
- **Digital Signature:** Tanda tangan digital pada dokumen PDF oleh Kaprodi, dengan konversi DOCX otomatis.
- **Approval Workflow:** Backend enforce sekuensial — Kaprodi hanya bisa review jika Koordinator sudah setuju.
- **Rejection Attribution:** Catatan penolakan spesifik per reviewer (Koordinator atau Kaprodi) tersimpan terpisah.
- **Account Approval Flow:** RBAC dengan approval akun berbasis role sebelum akses diberikan.
- **Manajemen Matkul:** Assign Dosen & Koordinator dengan sinkronisasi instan; Change Request flow untuk Admin.
- **Manajemen Pengguna (Admin):** RBAC dengan perlindungan akun Master.
- **Manajemen Pengguna (Master):** Full CRUD akun seluruh sistem.
- **System Logs & Monitor:** Audit trail transaksi sistem dan status kesehatan server.
- **UI Library:** Komponen standar (`DataTable`, `Modal`, `NumberInput`, `StatusBadge`) yang konsisten di semua halaman.

## Roadmap

- [ ] Verifikasi SOAL (UTS dan UAS)
- [ ] Verifikasi LPP (Beserta Fitur Tindak Lanjut oleh Kaprodi)
- [ ] Verifikasi EPP (Beserta Fitur Tindak Lanjut oleh Kaprodi)
- [ ] Berita Acara Perwalian

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| Styling | Tailwind CSS 4 |
| ORM | Prisma 7 (`@prisma/adapter-pg`) |
| Database | PostgreSQL (Docker) |
| Data Fetching | SWR |
| Document Processing | PDF-lib, PDF.js, DOCX conversion |

## Versioning

Proyek ini mengikuti [Semantic Versioning](https://semver.org/).

| Segment | Meaning |
|---|---|
| MAJOR (`x.0.0`) | Perubahan besar yang tidak kompatibel ke belakang |
| MINOR (`0.x.0`) | Penambahan fitur baru yang kompatibel ke belakang |
| PATCH (`0.0.x`) | Perbaikan bug yang kompatibel ke belakang |

**Current Version:** `v0.9.0`

## Panduan Lokal

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

# 5. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Seed Accounts

| Email | Password | Role |
|---|---|---|
| master@test.com | master123 | MASTER |
| admin@test.com | admin123 | ADMIN |
| kaprodi@test.com | kaprodi123 | KAPRODI |
| koordinator@test.com | koordinator123 | KOORDINATOR |
| dosen@test.com | dosen123 | DOSEN |

## Useful Commands

```bash
npm run dev                   # Start dev server
npm run build                 # Production build
npm run lint                  # ESLint check
npx prisma studio             # Prisma GUI
docker compose up -d          # Start Postgres
docker compose down           # Stop Postgres
```

## Project Boilerplate

A reusable, stripped-down starter template based on this project's stack lives in [`boilerplate/`](boilerplate/). It contains:

- Clean `schema.prisma` with `User` + `Account` models only
- Generic `providers.tsx` SWRConfig wrapper
- `.env.example` with required variables
- `setup.sh` / `setup.bat` one-command init scripts
- Full contributor `README.md`

Use it as a starting point for new projects without any UPH-specific business logic.

## Documentation

| File | Description |
|---|---|
| [docs/architecture.md](docs/architecture.md) | System design and data flow |
| [docs/changelog.md](docs/changelog.md) | Full version history |
| [docs/project_status.md](docs/project_status.md) | Current progress and known issues |
| [project_spec.md](project_spec.md) | Full requirements and API specs |
