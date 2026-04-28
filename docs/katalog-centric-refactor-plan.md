# Katalog-Centric Matkul Hub Refactor

## Problem

Each `Matkul` row is a semester-specific instance. The current matkul hub URL
(`/dashboard/matkul/[matkulId]`) is locked to one instance, so switching the
semester dropdown never surfaces docs from other years — they live on different
`matkulId`s.

`KatalogMatkul` is the stable course identity across all years. Every historical
import and every future semester creates a new `Matkul` instance linked to the
same `KatalogMatkul` via `katalogMatkulId`.

## Goal

Route by `katalogId` instead of `matkulId`. The hub page resolves the right
`Matkul` instance for the selected semester automatically. Adding 2025/2026 data
requires no code change — the new instance is picked up automatically.

---

## Data Pre-condition

`Matkul.katalogMatkulId` is currently nullable. All historical matkuls have it
set (set by import script). Current/future matkuls created via the admin UI may
not. Before the refactor, ensure all `Matkul` rows have `katalogMatkulId` set.

**Migration needed:**
- Make `Matkul.katalogMatkulId` non-nullable (add `@default` or migrate existing
  nulls first by matching on `code`).
- Or: keep nullable but treat null as "no catalog link" and fall back gracefully.

Recommended: keep nullable for now, handle null in page logic.

---

## Architecture After Refactor

```
/dashboard/matkul                     → list grouped by KatalogMatkul
/dashboard/matkul/[katalogId]         → hub page, semester dropdown = all instances
/api/matkul/mine                      → returns KatalogMatkul list (deduplicated)
/api/matkul/[katalogId]/documents     → resolves Matkul instance, returns docs
/api/matkul/[katalogId]/documents/upload → same
```

Semester dropdown shows only semesters where a `Matkul` instance exists for this
katalog AND the user is a dosen/koordinator on that instance.

---

## Files to Change

### 1. `src/app/dashboard/matkul/page.tsx` + `MatkulListClient.tsx`

- Query: group by `katalogMatkulId`, deduplicate across semesters
- Each card links to `/dashboard/matkul/[katalog.id]` not `[matkul.id]`
- Show latest semester label on card (e.g. "2024/2025 Genap")
- Role annotation (dosen/koordinator/kaprodi) derived from any instance

### 2. `src/app/dashboard/matkul/[matkulId]/` → rename to `[katalogId]/`

- `page.tsx`: fetch all `Matkul` instances for this `katalogId` where user has
  access. Build semester list from those instances. Resolve active instance from
  selected semesterId.
- `MatkulHubClient.tsx`: semester dropdown shows `{ semesterId, label, matkulId }`
  tuples. On semester switch, update both `semesterId` and internal `matkulId`
  used for doc queries.

### 3. `src/app/api/matkul/mine/route.ts`

- Return `KatalogMatkul`-level list: for each katalog the user appears in (any
  semester), return one entry with `katalogId`, `name`, `code`, `sks`, and
  `latestSemester`.
- If `katalogMatkulId` is null on some Matkul rows, include them as-is (legacy).

### 4. `src/app/api/matkul/[id]/documents/route.ts`

- `[id]` = `katalogId`. Accept `semesterId` query param (unchanged).
- Resolve: `matkul = findFirst({ katalogMatkulId: id, semesterId })`.
- Pass resolved `matkul.id` to all existing doc queries.

### 5. `src/app/api/matkul/[id]/documents/upload/route.ts`

- Same: resolve `matkulId` from `katalogId + semesterId`.

### 6. Other routes that take `matkulId` in path

Check and update any hardcoded `matkulId` references in:
- `src/app/api/matkul/[id]/assign`
- `src/app/api/matkul/[id]/assign-coordinator`
- `src/app/api/matkul/[id]/change-request`

These deal with current-semester admin actions — keep using `matkulId` directly
OR accept `katalogId + semesterId`. Decision: keep `matkulId` for admin routes,
only switch document-facing routes.

---

## Semester Dropdown Behaviour

| Scenario | Behaviour |
|---|---|
| User is dosen on matkul in 3 semesters | Dropdown shows those 3 semesters |
| Kaprodi (sees all) | Dropdown shows all semesters with any instance |
| Selected semester has no instance for this katalog | "Tidak ada data untuk semester ini" |
| Default selection | Most recent semester that has an instance |

---

## Build Sequence

1. Update `src/app/api/matkul/mine/route.ts` — returns katalog-grouped list
2. Update `src/app/dashboard/matkul/page.tsx` — consume new shape, update links
3. Rename folder `[matkulId]` → `[katalogId]`, update `page.tsx` resolver logic
4. Update `MatkulHubClient.tsx` — semester tuples carry `matkulId` internally
5. Update `/api/matkul/[id]/documents` routes — resolve matkulId from katalogId
6. Smoke-test: historical semester → docs show as APPROVED; active semester → upload/review works normally
7. Update `docs/changelog.md` and `docs/project_status.md`

---

## What Does NOT Change

- `RPS` review workflow (koordinator/kaprodi approve routes) — still use `rpsId`
- `AcademicDocument` review routes — still use `docId`
- Kaprodi analytics route — already queries across all semesters by matkul
- Admin matkul CRUD — still operates on `Matkul` instances
- Database schema — no migration required (katalogMatkulId already exists)
