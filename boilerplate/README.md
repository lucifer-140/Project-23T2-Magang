# Next.js App Router Boilerplate

A clean, minimal starter template built on the same stack as the UPH Admin Dashboard. Strips all business logic and leaves only the essential wiring.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15+ (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| ORM | Prisma 7 (adapter-pg) |
| Database | PostgreSQL (via Docker) |
| Data Fetching | SWR |
| Runtime | Node.js 20+ |

## Prerequisites

Make sure the following are installed before proceeding:

- **Node.js** v20 or later — [nodejs.org](https://nodejs.org)
- **npm** v10 or later (bundled with Node)
- **Docker Desktop** — [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop) (for the PostgreSQL container)
- **Git** — [git-scm.com](https://git-scm.com)

## Quick Start

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd <your-project-folder>
```

### 2. Run the init script

**On macOS / Linux:**
```bash
chmod +x setup.sh
./setup.sh
```

**On Windows (Command Prompt or PowerShell):**
```bat
setup.bat
```

The script will:
- Run `npm install`
- Copy `.env.example` → `.env`
- Run `npx prisma generate` to build the Prisma client

### 3. Start the database

```bash
docker compose up -d
```

### 4. Apply the schema & seed (optional)

```bash
npx prisma migrate dev --name init
npm run seed        # if a seed file exists
```

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
.
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Optional seed script
├── public/
│   └── uploads/             # File upload destination (gitignored)
├── src/
│   ├── app/
│   │   ├── api/             # Route handlers (GET/POST/PATCH per route.ts)
│   │   ├── dashboard/       # Role-gated pages (one folder per role)
│   │   ├── layout.tsx       # Root layout — wraps app in <Providers>
│   │   ├── page.tsx         # Landing / login page
│   │   └── providers.tsx    # Global SWRConfig + any future context providers
│   ├── components/
│   │   └── ui-templates/    # Reusable: DataTable, Modal, StatusBadge, etc.
│   ├── lib/
│   │   └── db.ts            # Prisma singleton
│   └── middleware.ts        # Route-level auth guard
├── .env.example
├── .env                     # Created by setup script — never commit
├── docker-compose.yml
├── setup.sh
├── setup.bat
└── README.md
```

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:password@localhost:5432/myapp?schema=public` |
| `NEXT_PUBLIC_APP_URL` | Public base URL (used for redirects) | `http://localhost:3000` |

Edit `.env` after the setup script creates it.

## Useful Commands

```bash
npm run dev                      # Start dev server
npm run build                    # Production build
npm run lint                     # ESLint check

docker compose up -d             # Start Postgres container
docker compose down              # Stop container

npx prisma migrate dev           # Apply schema changes + regenerate client
npx prisma generate              # Regenerate client without migrating
npx prisma studio                # Open Prisma Studio (GUI)
```

## Authentication Model

Cookie-based sessions — no third-party auth library by default. On login:
- Set `userId`, `userName`, `userRole` as HTTP-only cookies.
- `middleware.ts` reads cookies on every `/dashboard/*` request and redirects unauthenticated users to `/`.

Swap in NextAuth or Clerk by replacing `src/middleware.ts` and the login API route.

## Customization Checklist

- [ ] Rename the app in `package.json` (`name` field)
- [ ] Update `DATABASE_URL` in `.env`
- [ ] Replace the `User` model in `schema.prisma` with your real schema
- [ ] Add role values to the `Role` enum (or remove it if not needed)
- [ ] Update Tailwind design tokens in `src/app/globals.css`
- [ ] Replace placeholder fonts in `src/app/layout.tsx`
