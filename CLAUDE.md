# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UPH Lecturer Administration Dashboard — a portal for managing academic document workflows (primarily RPS — Rencana Pembelajaran Semester) at Universitas Pelita Harapan. UI language is Indonesian.

## Commands

```bash
# Development
npm run dev          # Start Next.js dev server

# Database
docker compose up -d # Start PostgreSQL container
npx prisma migrate dev   # Run migrations
npx prisma generate      # Regenerate Prisma client after schema changes
npm run seed             # Seed DB: npx tsx prisma/seed.ts

# Build & lint
npm run build
npm run lint
```

## Architecture

**Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Prisma 7 ORM, PostgreSQL (Docker).

### Authentication

Cookie-based sessions with no third-party auth library. Login sets three cookies: `userRole` (JSON array of Role enum values), `userId`, and `userName`. Passwords are stored in plain text (development only).

Authorization is enforced in [src/middleware.ts](src/middleware.ts) on the `/dashboard/:path*` matcher. Role routing rules:
- `MASTER` → `/dashboard/master` (exclusive; cannot be accessed by other roles)
- `ADMIN` → `/dashboard/admin`
- `KAPRODI` → `/dashboard/kaprodi` + `/dashboard/dosen`
- `KOORDINATOR` → `/dashboard/koordinator` + `/dashboard/dosen`
- `DOSEN` → `/dashboard/dosen`

KAPRODI, KOORDINATOR, and DOSEN roles are combinable on a single user account.

### Database (Prisma v7)

Schema: [prisma/schema.prisma](prisma/schema.prisma). Prisma v7 uses the `@prisma/adapter-pg` native driver pool (no Prisma engine bundling) — configured in [src/lib/db.ts](src/lib/db.ts) as a singleton.

Key models:
- **User** — `roles[]` (Role[]), `email` (unique), `password`. Relations: `rps` (Dosen submissions), `koordinatorReviews` (RPS reviewed by this Koordinator)
- **Matkul** — Course with M2M relations to User via `dosens[]` and `koordinators[]`
- **RPS** — Document per (matkul, dosen) pair with two-level approval workflow
  - `status`: `UNSUBMITTED | SUBMITTED | PENGECEKAN | REVISION | APPROVED`
  - `isKoordinatorApproved`: Boolean (false = waiting/rejected by Koordinator; true = Koordinator approved)
  - `koordinatorId`: User FK (who reviewed/approved at first level)
  - `koordinatorNotes`: String (Koordinator's rejection reason, if any)
  - `kaprodiNotes`: String (Kaprodi's rejection reason, if any)
  - `finalPdfUrl`: String (archived URL after Kaprodi approval)
  - Relations: `dosen` (User who submitted), `koordinator` (first-level reviewer)
- **MatkulChangeRequest** — Proposed course edits, approved by Admin
- **RpsAnnotation** — Annotation on RPS PDF. Fields: `type` (highlight/draw/box/sticky), `page`, `x/y` (% of page dims), `width/height`, `color`, `content` (sticky text), `pathData` (JSON `{x,y}[]` for draw), `reviewerRole`. Relation: `rps.annotations[]`. Cascade-deleted on re-upload.
  - `RPS.annotatedPdfUrl` — URL of PDF with annotations burned in (set on rejection via `/flatten`, cleared on re-upload).

When modifying the schema, always run `npx prisma migrate dev` then `npx prisma generate`.

### API Routes

All routes live in [src/app/api/](src/app/api/). They use Next.js App Router conventions (`route.ts` with exported `GET`, `POST`, `PATCH` handlers). No authentication middleware on API routes — authorization is enforced per-handler by reading cookies directly.

Key route groups:
- `/api/users` — User CRUD; MASTER accounts are hidden from non-MASTER callers
- `/api/matkul` — Course CRUD + `/[id]/assign`, `/[id]/assign-coordinator`, `/[id]/change-request`
- `/api/rps/upload` — Saves file to `/public/uploads/` with timestamp prefix; creates or updates RPS record. On re-upload, resets `isKoordinatorApproved=false`, `status=SUBMITTED`, deletes all `RpsAnnotation` rows, and clears `annotatedPdfUrl`.
- `/api/rps/[id]/review` — Koordinator or Kaprodi approve/reject with body `{ reviewer, action, notes }`. Enforces sequential workflow: Kaprodi can only approve if Koordinator already approved. Captures reviewer-specific notes (`koordinatorNotes` vs `kaprodiNotes`).
- `/api/rps/[id]/annotations` — GET all annotations for RPS; POST create annotation (KOORDINATOR/KAPRODI only).
- `/api/rps/[id]/annotations/[annotId]` — DELETE single annotation.
- `/api/rps/[id]/annotations/flatten` — POST burns all annotations into PDF via `pdf-lib`, saves result to `/public/uploads/`, stores URL in `annotatedPdfUrl`. Called automatically before rejection.
- `/api/change-requests/[id]` — Admin approve/reject; approval applies proposed changes to Matkul

### File Uploads

Files are written directly to `/public/uploads/` via Node `fs/promises` in [src/app/api/rps/upload/route.ts](src/app/api/rps/upload/route.ts). Filenames use a millisecond timestamp prefix. Accepted types: `.pdf`, `.doc`, `.docx`.

### Dashboard Structure

Each role has its own folder under [src/app/dashboard/](src/app/dashboard/). Shared dashboard shell (sidebar + layout) is in [src/app/dashboard/layout.tsx](src/app/dashboard/layout.tsx).

**New in v0.6.0:** Koordinator role now has a dedicated RPS management page at [src/app/dashboard/koordinator/rps/](src/app/dashboard/koordinator/rps/) with identical UI to Kaprodi's page but scoped to their assigned matkuls only.

Reusable UI components are in [src/components/ui-templates/](src/components/ui-templates/): `DataTable` (pagination + search), `Modal`, `StatusBadge`, `NumberInput`.

**RPS Management Pages:**
- **Dosen** ([src/app/dashboard/dosen/rps/](src/app/dashboard/dosen/rps/)) — Upload and track RPS status
- **Koordinator** ([src/app/dashboard/koordinator/rps/](src/app/dashboard/koordinator/rps/)) — First-level review queue
- **Kaprodi** ([src/app/dashboard/kaprodi/rps/](src/app/dashboard/kaprodi/rps/)) — Second-level review queue; sees Koordinator name on each submission

All three review/display pages are visually identical for consistency. Backend logic enforces role-specific actions.

### PDF Annotation System

`pdf-lib` (already in deps) handles server-side PDF writes. Coordinate system: stored as % of page dims → flatten route converts to PDF points (`pdfY = pageHeight - (y/100 * pageHeight) - rectHeight`; PDF origin = bottom-left).

`PdfAnnotationViewer` (`src/components/PdfAnnotationViewer.tsx`) — SSR-disabled; reviewer-mode only (Koordinator/Kaprodi). Uses react-pdf + SVG overlay (`viewBox="0 0 100 100" preserveAspectRatio="none"`). Dosen sees static `annotatedPdfUrl` PDF, not the overlay viewer.

### Design Tokens

Custom Tailwind colors defined in the global CSS:
- `uph-blue`: #1a2a4a (primary)
- `uph-red`: #b40a1e (accent/actions)
- `uph-grayBg`: #f7f9fc (page background)
- `uph-border`: #dde3ef

Fonts: Source Sans 3 (body), Playfair Display (headings) — loaded via Google Fonts in [src/app/layout.tsx](src/app/layout.tsx).

## Environment

Copy `.env.example` (or set manually):
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/uph_admin?schema=public
```

## Seed Accounts

| Email | Password | Role |
|---|---|---|
| master@test.com | master123 | MASTER |
| admin@test.com | admin123 | ADMIN |
| kaprodi@test.com | kaprodi123 | KAPRODI |
| koordinator@test.com | koordinator123 | KOORDINATOR |
| dosen@test.com | dosen123 | DOSEN |
| dosen2@test.com | dosen123 | DOSEN |

## Documentation

- [Project Spec](project_spec.md) - Full requirements, API specs, tech details
- [Architecture](docs/architecture.md) - System design and data flow
- [Changelog](docs/changelog.md) - Version history
- [Project Status](docs/project_status.md) - Current progress
- Update files in the docs folder after major milestones and major additions to the project.

## Custom Commands Setup

**If I type `update-docs-and-commit`, you must execute the following workflow in order:**

1. **Analyze Changes:** Review the current uncommitted changes in the workspace.
2. **Update Documentation:** - Open and append the new changes to `docs/changelog.md`.
   - Update the current progress in `docs/project_status.md` if the changes reflect a new milestone.
3. **Stage Files:** Run `git add .` in the terminal to stage all code and documentation updates.
4. **Commit:** Generate a concise, conventional commit message based on the changes and run `git commit -m "<your generated message>"` in the terminal.

### Git Workflow

- **Branch Naming:** `feat/feature-name`, `fix/bug-name`, `docs/doc-name`
- **Commit Messages:** Follow conventional commits format without Co-Authored-By lines
- **Pull Requests:** Require review and all checks passing
- **Merging:** Squash commits for clean history
- **Tagging & Releases:** Use Semantic Versioning. Minor features → `0.x.0` bump; patches/fixes → `0.x.y` bump. **Do NOT version to `1.0.0` unless the user explicitly says the project is ready to ship.**

**IMPORTANT:** When creating commits, do NOT include "Co-Authored-By: Claude" or similar attribution lines in commit messages.