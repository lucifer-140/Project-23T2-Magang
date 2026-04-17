# Phase 10 — Hierarchical Academic Term UX

**Version target:** 0.12.0
**Status:** In Progress

---

## Problem

Current flow forces admin to input `Semester` + `Tahun Akademik` for **every single course**. With 20+ courses per term, this is repetitive and error-prone.

---

## Solution: Option B — `AcademicTerm` Model

Introduce a parent `AcademicTerm` entity. Admin creates terms once, then navigates into a term to manage its courses. Semester and academic year are set **once per term**, never per course.

### New Admin Flow

```
/dashboard/admin/matkul
  └── Groups by Tahun Akademik (e.g. 2025/2026)
      └── Semester badges: [Ganjil] [Genap] [Akselerasi]
          └── Click → /dashboard/admin/matkul/[termId]
              └── Matkul table scoped to this term
                  └── "Tambah Matkul" — no semester/year inputs
```

---

## 1. Schema Changes

### 1.1 New model: `AcademicTerm`

```prisma
model AcademicTerm {
  id            String             @id @default(cuid())
  tahunAkademik String             // "2025/2026"
  semester      String             // "Ganjil" | "Genap" | "Akselerasi"
  isActive      Boolean            @default(false)
  matkuls       Matkul[]
  academicDocs  AcademicDocument[]

  @@unique([tahunAkademik, semester])
}
```

### 1.2 Modify `Matkul`

- Remove `semester String?` and `academicYear String?`
- Add `termId String?` + `term AcademicTerm? @relation(...)`
- Unique: `@@unique([code, termId])` (was `[code, semester, academicYear]`)

### 1.3 Modify `AcademicDocument`

- Remove `semester String`
- Add `termId String?` + `term AcademicTerm? @relation(...)`
- Unique: `@@unique([matkulId, dosenId, termId, type])` (was `[..., semester, ...]`)

### 1.4 Migration

```bash
npx prisma migrate dev --name add_academic_term
npx prisma generate
```

### 1.5 Backfill (dev environments with existing data)

Script: `prisma/migrate-terms.ts`

```bash
npx tsx prisma/migrate-terms.ts
```

Finds all distinct `(semester, academicYear)` combos on existing `Matkul` rows,
creates `AcademicTerm` records, then sets `termId` on each row.

---

## 2. API Changes

### 2.1 New: `/api/terms`

| Method | Description |
|--------|-------------|
| `GET`  | List all terms, ordered by `tahunAkademik` desc + semester |
| `POST` | Create term `{ tahunAkademik, semester }` |

### 2.2 Update: `POST /api/matkul`

- Accept `termId` instead of `semester` + `academicYear`
- Error message updated for new unique constraint

### 2.3 Update: `/api/matkul/[id]/documents`

- Query param `?semester=` → `?termId=`
- All Prisma `where` clauses updated

### 2.4 Update: `/api/matkul/[id]/documents/upload`

- FormData field `semester` → `termId`
- Unique lookup updated to `matkulId_dosenId_termId_type`

---

## 3. UI / Routing Changes

### New route structure

```
/dashboard/admin/matkul                   ← Term index (year + semester cards)
/dashboard/admin/matkul/[termId]          ← Matkul list scoped to term
```

### Files changed

| File | Change |
|------|--------|
| `src/app/dashboard/admin/matkul/page.tsx` | Becomes term index; fetches all terms |
| `src/app/dashboard/admin/matkul/TermListClient.tsx` | NEW — term list UI |
| `src/app/dashboard/admin/matkul/[termId]/page.tsx` | NEW — scoped matkul page |
| `src/app/dashboard/admin/matkul/MatkulClientPage.tsx` | Receives `termId` prop; remove semester/year form fields |

### `TermListClient.tsx` behaviour

- Groups terms by `tahunAkademik`
- Each group shows semester badges: clicking navigates to `/matkul/[termId]`
- "Tambah Term Baru" modal: select `tahunAkademik` (free text or dropdown) + `semester` (Ganjil/Genap/Akselerasi)
- Shows matkul count per term badge

### `[termId]/MatkulClientPage.tsx` behaviour

- Header shows: `2025/2026 — Semester Ganjil` (from term data)
- "Tambah Matkul" form has **no** semester or tahun akademik fields
- POST body sends `termId` (from URL)
- Table column "Semester / Kelas" shows only kelas (semester already in header)

---

## 4. Seed Changes

- Insert `AcademicTerm` rows first (two terms: Ganjil + Genap 2025/2026)
- `Matkul` inserts reference `termId` via lookup

---

## 5. Phase 9 Alignment

`plan-phase9-matkul-hub.md` references `AcademicDocument.semester String` — updated to `termId`.
URL param `?semester=` in Matkul hub pages → `?termId=`.

---

## 6. Implementation Order

| # | Task | Status |
|---|------|--------|
| 1 | Write this plan doc | ✅ Done |
| 2 | Update `schema.prisma` | ⬜ |
| 3 | `npx prisma migrate dev` | ⬜ |
| 4 | Write `prisma/migrate-terms.ts` | ⬜ |
| 5 | New `src/app/api/terms/route.ts` | ⬜ |
| 6 | Update `src/app/api/matkul/route.ts` | ⬜ |
| 7 | Update `documents/route.ts` | ⬜ |
| 8 | Update `documents/upload/route.ts` | ⬜ |
| 9 | Update `page.tsx` → term index | ⬜ |
| 10 | New `TermListClient.tsx` | ⬜ |
| 11 | New `[termId]/page.tsx` | ⬜ |
| 12 | Update `MatkulClientPage.tsx` | ⬜ |
| 13 | Update `seed.ts` | ⬜ |

---

## 7. Out of Scope

- Activating/deactivating terms globally
- Per-term deadline configuration
- Archiving old terms
