# Plan: v0.14.0 — Workflow Overhaul + New Features

**Created:** 2026-04-20  
**Target Version:** 0.14.0  
**Status:** Planned

---

## Overview

5 major changes:
1. Signature toggle (sign or approve without signing) + name/timestamp on all stamps
2. Universal 3-stage workflow: Koor → Prodi → Kaprodi for ALL doc types
3. EPP additional input fields before file upload
4. Berita Acara Perwalian — standalone section, per-kelas per-semester
5. Rename system title

---

## 1. Signature Toggle + Name/Timestamp on Stamps

**Scope:** Sign modal UI + `/api/documents/[docId]/sign` + `/api/rps/[id]/sign`

### Changes
- Toggle checkbox in signing modal: "Sertakan Tanda Tangan" (default ON)
- When **OFF**: approval proceeds without burning a stamp to PDF
- When **ON**: burn signature image + text block below it:
  ```
  [Nama Reviewer]
  [DD/MM/YYYY HH:mm WIB]
  ```
- `pdf-lib` uses `drawText()` below placed signature image
- No schema change needed — toggle is per-action UI state only

---

## 2. Universal Workflow: Koor → Prodi → Kaprodi

**Current state:**
- Most doc types: Koor → Kaprodi
- LPP/EPP only: Koor → Prodi (Kaprodi excluded)

**New state:** ALL doc types → Koor → Prodi → Kaprodi

### Schema
`AcademicDocument` already has `isProdiApproved` / `prodiId` / `prodiNotes` — no new fields needed.

### API Changes
- `PATCH /api/documents/[docId]/review` — remove LPP/EPP special-casing
  - Prodi gate: requires `isKoordinatorApproved = true`
  - Kaprodi gate: requires `isProdiApproved = true`
  - Applies to ALL `DocType` values

### Dashboard Scope Changes
| Role | Before | After |
|------|--------|-------|
| PRODI | Reviews LPP & EPP only | Reviews ALL doc types |
| KAPRODI | Reviews all types (after Koor) | Reviews all types (after Prodi) |

### UI Updates
- Kaprodi queue: gate display on `isProdiApproved = true`
- Status flow labels across Dosen/Koor/Prodi/Kaprodi pages updated
- Progress indicator updated to show 3-stage flow

---

## 3. EPP Additional Inputs

### New Schema Fields on `AcademicDocument`

```prisma
eppPersentaseMateri     Float?  // Persentase kesesuaian materi dari perencanaan (RPS)
eppPersentaseCpmk       Float?  // Persentase kesesuaian CPMK dengan Sub CPMK
eppPersentaseKehadiran  Float?  // Persentase rata-rata kehadiran mahasiswa dalam setiap pertemuan
eppPersentaseNilaiB     Float?  // Persentase jumlah mahasiswa yang mendapat nilai minimal ≥ B
eppPersentaseKkmToB     Float?  // Persentase jumlah mahasiswa yang mendapat KKM ≤ Nilai < B
```

### UI (EPP section in matkul detail hub)
Shown **before** file upload slot, only for `DocType = EPP`:

| # | Label | Field |
|---|-------|-------|
| 1 | Persentase kesesuaian materi dari perencanaan (RPS) | `eppPersentaseMateri` |
| 2 | Persentase kesesuaian CPMK dengan Sub CPMK | `eppPersentaseCpmk` |
| 3 | Persentase rata-rata kehadiran mahasiswa dalam setiap pertemuan | `eppPersentaseKehadiran` |
| 4 | Persentase jumlah mahasiswa yang mendapat nilai minimal ≥ B | `eppPersentaseNilaiB` |
| 5 | Persentase jumlah mahasiswa yang mendapat KKM ≤ Nilai < B | `eppPersentaseKkmToB` |

- Inputs 4 and 5 grouped under heading: **"Tingkat pemahaman mahasiswa terhadap materi yang diberikan"**
- All values are `%` — numeric input, 0–100
- Saved via `POST /api/matkul/[id]/documents/upload` body (extend to accept EPP fields)
- Displayed read-only in reviewer views
- Migration: `npx prisma migrate dev` — all nullable, no backfill needed

---

## 4. Berita Acara Perwalian (Standalone Section)

**Concept:** Not per-matkul. Per-*kelas* (student cohort, e.g. "23TI1") + per-semester.  
Kaprodi creates BAP entries and assigns Dosen PA per kelas.

### New Schema

```prisma
model BeritaAcaraPerwalian {
  id          String   @id @default(cuid())
  kelasName   String   // e.g. "23TI1"
  semesterId  String
  semester    Semester @relation(fields: [semesterId], references: [id])
  dosenPaId   String
  dosenPa     User     @relation("DosenPaBAP", fields: [dosenPaId], references: [id])

  // 3 independent file slots
  lembarKehadiranUrl  String?
  lembarKehadiranName String?
  absensiUrl          String?
  absensiName         String?
  beritaAcaraUrl      String?
  beritaAcaraName     String?

  status          DocStatus @default(UNSUBMITTED)
  isProdiApproved Boolean   @default(false)
  prodiId         String?
  prodi           User?     @relation("ProdiBAP", fields: [prodiId], references: [id])
  prodiNotes      String?
  kaprodiNotes    String?
  finalApprovedAt DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([kelasName, semesterId])
}
```

Add back-relations to `User` and `Semester` models accordingly.

### File Slots Description

| Slot | Label |
|------|-------|
| `lembarKehadiran` | Lembar Kehadiran Pembimbing |
| `absensi` | Absensi (NIM, Nama, Hadir/Tidak) |
| `beritaAcara` | Berita Acara (Dosen Bicara Apa + Bukti Screenshot) |

### New API Routes

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/bap` | List BAP — Kaprodi/Prodi see all; Dosen PA sees assigned only |
| `POST` | `/api/bap` | Kaprodi creates BAP entry (kelas + semester + assign Dosen PA) |
| `PATCH` | `/api/bap/[id]/assign` | Kaprodi reassigns Dosen PA |
| `POST` | `/api/bap/[id]/upload` | Dosen PA uploads one slot; body: `{ slot, file }` |
| `PATCH` | `/api/bap/[id]/review` | Prodi or Kaprodi approve/reject; enforces sequential gate |
| `POST` | `/api/bap/[id]/sign` | Prodi or Kaprodi stamp signature |

### New Pages

| Route | Description |
|-------|-------------|
| `/dashboard/berita-acara` | List page — all roles scoped |
| `/dashboard/berita-acara/[bapId]` | Detail: 3 upload slots + status + review panel |

### Sidebar Navigation

Add "Berita Acara Perwalian" nav item for:
- DOSEN — visible only if user has at least one BAP assignment
- PRODI — always visible
- KAPRODI — always visible (+ "Kelola Dosen PA" sub-item)

### Workflow

```
Dosen PA uploads 3 files → submits
  → Prodi: cek kelengkapan isi dokumen (approve/reject)
    → Kaprodi: pemeriksa terakhir (approve/reject)
```

All 3 files must be uploaded before Dosen PA can submit.

---

## 5. Rename System Title

**Find & replace across all pages/components:**

```
"Sistem Administrasi UPH"
→ "Sistem Administrasi Prodi Informatika Medan"
```

Files likely affected: layout, login page, sidebar, metadata/head tags.

---

## Implementation Order

| Step | Task | Effort | Risk |
|------|------|--------|------|
| 1 | Rename system title | XS | None |
| 2 | Sig toggle + name/timestamp on stamps | S | Low |
| 3 | EPP additional inputs (schema + UI) | S | Low — additive |
| 4 | Universal Koor→Prodi→Kaprodi workflow | M | Medium — touches review logic for all doc types |
| 5 | Berita Acara Perwalian | L | Medium — new model, routes, pages |

---

## Schema Migration Summary

### `AcademicDocument` — add 5 nullable fields
```prisma
eppPersentaseMateri     Float?
eppPersentaseCpmk       Float?
eppPersentaseKehadiran  Float?
eppPersentaseNilaiB     Float?
eppPersentaseKkmToB     Float?
```

### New model `BeritaAcaraPerwalian`
As defined in section 4.

### No other model changes required.
