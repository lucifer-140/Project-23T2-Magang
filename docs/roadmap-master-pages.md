# Master Account Pages — Upgrade Plan

> **Semester Manager is a blocking dependency** for several other features:
> - Dosen dashboard "Active Semester Banner" (`plan-dashboard-ux.md` item A)
> - Dosen dashboard "Document Progress Matrix" (`plan-dashboard-ux.md` item C)
> - Any semester-scoped analytics elsewhere
>
> Build Semester Manager (section 2 below) before implementing those features.

## Current Pages
- `/dashboard/master` — System Monitor
- `/dashboard/master/users` — Kelola Pengguna
- `/dashboard/master/approvals` — Persetujuan Akun
- `/dashboard/master/logs` — Application Logs

---

## 1. System Monitor (`/dashboard/master`) — Fix & Expand

**Problems:**
- Stats query `prisma.rPS` (old model). Real doc model is `AcademicDocument`.
- "Recent RPS Activity" shows old RPS, not academic docs.
- System info box hardcodes framework versions (stale/wrong).

**Fixes:**
- Replace `rPS` queries → `academicDocument` counts grouped by `status` and `type`.
- Add counts: `Notification` (total), `BeritaAcara`, `Kelas`, `Semester`, `TahunAkademik`.
- Show active semester name in header.
- "Recent Activity" → last 10 `AcademicDocument` updates (matkul + dosen + type + status + timestamp).
- DB health check: ping DB and show latency in ms.
- Remove hardcoded framework versions or read from `package.json`.

---

## 2. New Page: Semester Manager (`/dashboard/master/semesters`)

**Why:** No current UI for managing `TahunAkademik` / `Semester`. Critical gap.

**Features:**
- List all `TahunAkademik` with their semesters.
- Create / edit / delete `TahunAkademik`.
- Create / edit / delete `Semester` under each tahun.
- Toggle active semester (only one active at a time — unsets others).
- Show document count per semester.

---

## 3. New Page: DB Inspector (`/dashboard/master/db`)

**Features:**
- Table: model name | record count — for all Prisma models.
- Auto-refreshes every 30s.
- "Danger Zone" section: truncate-table buttons with confirm modal (dev-only).

---

## 4. Kelola Pengguna (`/dashboard/master/users`) — Improvements

- Add search by name/email.
- Filter by role and status.
- Show `createdAt` column.
- Add delete user button (with confirm).
- Bulk role assignment: select multiple → assign role modal.

---

## 5. Application Logs (`/dashboard/master/logs`) — Improvements

- Filter by severity: ERROR / WARN / INFO.
- Filter by time range: 1h / 24h / 7d / all.
- Download as `.log` or `.csv`.
- Auto-refresh toggle (every 10s).

---

## Implementation Order
1. Fix System Monitor queries (quick, high value)
2. Semester Manager (new page, critical missing feature)
3. Logs improvements (filter + download)
4. Users page improvements
5. DB Inspector (nice-to-have)
