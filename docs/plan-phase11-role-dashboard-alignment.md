# Plan: Role Dashboard Alignment (Phase 11)

Align Dosen, Koordinator, and Kaprodi dashboards with the new `TahunAkademik → Semester → Matkul → AcademicDocument` structure introduced in v0.11.0–v0.12.0.

## Context

- v0.11.0: Replaced RPS-only flow with `AcademicDocument` (8 doc types). New hub at `/dashboard/matkul/[matkulId]`.
- v0.12.0: Replaced `AcademicTerm` with `TahunAkademik + Semester`. `Matkul.semesterId` replaces old `semester + academicYear`.
- **Problem:** Dashboard stat pages still query old `prisma.rPS`. Koordinator dashboard is a placeholder. Nav cards link to dead `/rps` routes.

---

## Phase 1 — Dosen Dashboard (`src/app/dashboard/dosen/page.tsx`)

1. Replace `prisma.rPS.findMany({ where: { dosenId: userId } })` with:
   - `prisma.matkul.count({ where: { dosens: { some: { id: userId } } } })` → `total`
   - `prisma.academicDocument.count({ where: { dosenId: userId, status: { in: ['SUBMITTED','PENGECEKAN'] } } })` → `submitted`
   - `prisma.academicDocument.count({ where: { dosenId: userId, status: 'REVISION' } })` → `revision`
   - `prisma.academicDocument.count({ where: { dosenId: userId, status: 'APPROVED' } })` → `approved`
2. Koordinator section: replace `include: { dosens: true, rps: true }` → `include: { dosens: true, academicDocs: true }`. Update filter: `m.rps.filter(r => r.status !== 'UNSUBMITTED')` → `m.academicDocs.filter(d => d.status !== 'UNSUBMITTED')`. Label "RPS Diterima Sistem" → "Dokumen Diterima Sistem".
3. Kaprodi section: replace `prisma.rPS.count(...)` → `prisma.academicDocument.count(...)`. Link `/dashboard/kaprodi/rps` → `/dashboard/matkul`. Label "RPS Perlu Review" → "Dokumen Perlu Review".

---

## Phase 2 — Kaprodi Dashboard (`src/app/dashboard/kaprodi/page.tsx`)

1. Replace all `prisma.rPS.count(...)`:
   - `needsReview`: `prisma.academicDocument.count({ where: { status: 'SUBMITTED' } })`
   - `approved`: `prisma.academicDocument.count({ where: { status: 'APPROVED' } })`
   - `pendingRequests`: unchanged (MatkulChangeRequest)
2. Update labels: "RPS Perlu Review" → "Dokumen Perlu Review", "RPS Disetujui" → "Dokumen Disetujui".
3. Quick-action card: link `/dashboard/kaprodi/rps` → `/dashboard/matkul`. Rename "Review RPS Dosen" → "Review Dokumen Akademik".
4. Update subtitle text to reflect new multi-doc workflow.

---

## Phase 3 — Koordinator Dashboard (`src/app/dashboard/koordinator/page.tsx`)

Replace placeholder with real async server component:

1. Read `userId` from cookies.
2. Fetch assigned matkuls with `dosens` + `academicDocs` included.
3. Compute stats:
   - `matkulCount` — total assigned matkuls
   - `dosenCount` — unique dosens across all matkuls
   - `pendingReview` — docs with `status === 'SUBMITTED'`
   - `approvedCount` — docs with `status === 'APPROVED'`
4. Render 4 stat cards + quick-action card linking to `/dashboard/matkul`.

---

## Phase 4 — Remove Old RPS Route Pages (Cleanup)

- `src/app/dashboard/dosen/rps/` — delete
- `src/app/dashboard/kaprodi/rps/` — delete
- `src/app/dashboard/koordinator/rps/` — delete
- `src/app/dashboard/admin/rps/` — check and delete if unused

> Confirm no links/redirects point to these before deleting.

---

## Phase 5 — MatkulListClient Semester Display

Add semester name (e.g. "Ganjil 2025/2026") to each matkul card in `MatkulListClient.tsx`.
Requires including `semester: { include: { tahunAkademik: true } }` in the server-side fetch.

---

## Phase 6 — Sidebar Active State

Convert sidebar nav links to use `usePathname()` for active highlighting on `/dashboard/matkul/**`.

---

## Execution Order

```
Phase 1 + 2 + 3   ← parallel, independent
Phase 4           ← after 1-3 verified working
Phase 5           ← cosmetic, independent
Phase 6           ← last, polish
```

## Risk: Relation Field Names

- `Matkul.academicDocs` → `AcademicDocument[]` ✓ (confirmed in schema)
- `AcademicDocument.dosenId` ✓
- `AcademicDocument.status` uses `DocStatus` enum (same values as `RpsStatus`) ✓
