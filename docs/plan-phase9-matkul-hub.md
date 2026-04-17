# Phase 9 Implementation Plan — Matkul-Centric Academic Document Hub

**Version target:** 0.11.0  
**Status:** Planning

---

## Overview

Replace all siloed RPS-only dashboards with a unified Matkul-centric hub. Every role (Dosen, Koordinator, Kaprodi) navigates the same route structure: pick a Matkul, then manage/review all 8 document types inside it. All document sections are **independent** — no sequential locking.

---

## Document Types

| Key | Label (ID) |
|-----|-----------|
| `RPS` | RPS |
| `SOAL_UTS` | Soal UTS |
| `SOAL_UAS` | Soal UAS |
| `LPP` | Laporan Pelaksanaan Pembelajaran |
| `LPP_TINDAK_LANJUT` | Tindak Lanjut LPP |
| `EPP` | Evaluasi Pencapaian Program |
| `EPP_TINDAK_LANJUT` | Tindak Lanjut EPP |
| `BERITA_ACARA` | Berita Acara Perwalian |

---

## 1. Schema Changes

### 1.1 New enum

```prisma
enum DocType {
  RPS
  SOAL_UTS
  SOAL_UAS
  LPP
  LPP_TINDAK_LANJUT
  EPP
  EPP_TINDAK_LANJUT
  BERITA_ACARA
}
```

### 1.2 New model: `AcademicDocument`

Generic document record — same two-level approval pattern as existing `RPS`.

```prisma
model AcademicDocument {
  id       String   @id @default(cuid())
  matkulId String
  matkul   Matkul   @relation(fields: [matkulId], references: [id])
  dosenId  String
  dosen    User     @relation("DosenAcademicDocs", fields: [dosenId], references: [id])
  semester String   // e.g. "Ganjil 2025/2026"
  type     DocType

  // File
  fileUrl             String?
  fileName            String?
  annotatedPdfUrl     String?   // burned-in annotation PDF shown to Dosen on revision

  // Status
  status                  DocStatus @default(UNSUBMITTED)
  isKoordinatorApproved   Boolean   @default(false)
  koordinatorId           String?
  koordinator             User?     @relation("KoordinatorAcademicReview", fields: [koordinatorId], references: [id])
  koordinatorNotes        String?
  kaprodiNotes            String?

  // Koordinator signature
  koordinatorSigUrl       String?
  koordinatorSigPage      Int?
  koordinatorSigX         Float?
  koordinatorSigY         Float?
  koordinatorSigWidth     Float?
  koordinatorSignedPdfUrl String?

  // Kaprodi signature
  kaprodiSigUrl           String?
  kaprodiSigPage          Int?
  kaprodiSigX             Float?
  kaprodiSigY             Float?
  kaprodiSigWidth         Float?
  finalPdfUrl             String?

  annotations AcademicDocAnnotation[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([matkulId, dosenId, semester, type])
}
```

### 1.3 New model: `AcademicDocAnnotation`

Identical to `RpsAnnotation`, scoped to `AcademicDocument`.

```prisma
model AcademicDocAnnotation {
  id           String           @id @default(cuid())
  docId        String
  doc          AcademicDocument @relation(fields: [docId], references: [id], onDelete: Cascade)
  type         String           // "highlight" | "draw" | "box" | "sticky"
  page         Int
  x            Float
  y            Float
  width        Float?
  height       Float?
  color        String           @default("#FFD700")
  content      String?
  pathData     String?
  reviewerRole String           // "koordinator" | "kaprodi"
  createdAt    DateTime         @default(now())
}
```

### 1.4 Additions to existing models

```prisma
// Matkul
academicDocs AcademicDocument[]

// User
academicDocs          AcademicDocument[] @relation("DosenAcademicDocs")
koordinatorDocReviews AcademicDocument[] @relation("KoordinatorAcademicReview")
```

### 1.5 Migration commands

```bash
npx prisma migrate dev --name add_academic_document
npx prisma generate
```

---

## 2. API Routes

All new routes. Existing `/api/rps/*` routes are untouched during transition.

### 2.1 Matkul documents list

```
GET /api/matkul/[id]/documents?semester=XXXX
```

**Scope inference (no extra params):**
- Caller is Dosen for this Matkul → returns `AcademicDocument[]` where `dosenId = me`, all types
- Caller is Koordinator/Kaprodi for this Matkul → returns all `AcademicDocument[]` for this Matkul grouped by `type`, each with `dosen` included

Response shape (reviewer):
```ts
{
  sections: {
    type: DocType
    docs: { dosenId, dosenName, status, isKoordinatorApproved, ... }[]
  }[]
}
```

Response shape (dosen):
```ts
{
  sections: {
    type: DocType
    doc: AcademicDocument | null
  }[]
}
```

### 2.2 Upload

```
POST /api/matkul/[id]/documents/upload
Body: FormData { type: DocType, semester: string, file: File }
```

- Creates or updates `AcademicDocument` for `(matkulId, dosenId=me, semester, type)`
- On re-upload: resets `status=SUBMITTED`, `isKoordinatorApproved=false`, deletes annotations, clears `annotatedPdfUrl` and all sig fields
- Rejects if `status=APPROVED` (locked)

### 2.3 Review (approve / reject)

```
PATCH /api/documents/[docId]/review
Body: { reviewer: "koordinator" | "kaprodi", action: "approve" | "reject", notes?: string }
```

Same logic as existing `/api/rps/[id]/review`:
- Koordinator approve → `isKoordinatorApproved=true`, `status=PENGECEKAN`
- Koordinator reject → flatten annotations → `annotatedPdfUrl`, `status=REVISION`
- Kaprodi approve → requires `isKoordinatorApproved=true`, `status=APPROVED`
- Kaprodi reject → flatten annotations → `annotatedPdfUrl`, `status=REVISION`

### 2.4 Annotations

```
GET    /api/documents/[docId]/annotations
POST   /api/documents/[docId]/annotations        Body: annotation fields
DELETE /api/documents/[docId]/annotations/[annotId]
POST   /api/documents/[docId]/annotations/flatten
```

Identical logic to existing `/api/rps/[id]/annotations/*`.

### 2.5 Sign

```
POST /api/documents/[docId]/sign
Body: { sigUrl, sigX, sigY, sigPage, sigWidth, role: "koordinator" | "kaprodi" }
```

Identical logic to existing `/api/rps/[id]/sign`.

---

## 3. UI — Route Structure

Single shared route, no role-specific subfolders.

```
/dashboard/matkul                    Matkul list (all roles)
/dashboard/matkul/[matkulId]         Matkul detail hub (all roles)
```

Remove from sidebar after migration:
- Dosen: "RPS Saya" → `/dashboard/dosen/rps`
- Koordinator: "Kelola RPS" → `/dashboard/koordinator/rps`
- Kaprodi: "Kelola RPS" → `/dashboard/kaprodi/rps`

Add to sidebar (all roles):
- "Mata Kuliah" → `/dashboard/matkul`

---

## 4. UI — Matkul List Page (`/dashboard/matkul`)

**Data fetched:** All Matkuls where user is Dosen OR Koordinator OR Kaprodi (union, deduplicated).

**Each Matkul card shows:**
- Matkul name, code, SKS
- Role badge(s): `[Dosen]` `[Koordinator]` `[Kaprodi]` — based on user's relationship
- Semester selector (dropdown, persisted in URL param `?semester=`)
- Quick-glance progress: count of approved sections out of 8 (Dosen view) or count of pending reviews (Reviewer view)

---

## 5. UI — Matkul Detail Hub (`/dashboard/matkul/[matkulId]`)

### 5.1 Page header

```
Aljabar Linear — INF20032 · 3 SKS
Semester: [Ganjil 2025/2026 ▼]
```

### 5.2 Tab logic

| User's role for this Matkul | Tabs shown |
|-----------------------------|-----------|
| Dosen only | No tabs — show Dosen view directly |
| Koordinator only | No tabs — show Reviewer view directly |
| Kaprodi only | No tabs — show Reviewer view directly |
| Dosen + Koordinator | Two tabs: "Dokumen Saya" \| "Review Dosen" |
| Dosen + Kaprodi | Two tabs: "Dokumen Saya" \| "Review Dosen" |

### 5.3 Dosen view — "Dokumen Saya"

8 accordion sections, one per `DocType`. Each section:

```
┌─ Soal UTS ─────────────────────────────────────────────┐
│ Status: REVISION                                        │
│ Catatan Koordinator: "Perbaiki nomor 3 dan 5"          │
│ [Lihat Anotasi PDF]   [Upload Ulang]                   │
└────────────────────────────────────────────────────────┘

┌─ Soal UAS ─────────────────────────────────────────────┐
│ Status: UNSUBMITTED                                     │
│ [Upload File]                                           │
└────────────────────────────────────────────────────────┘

┌─ LPP ──────────────────────────────────────────────────┐
│ Status: APPROVED ✓                                      │
│ [Download Final PDF]                                    │
└────────────────────────────────────────────────────────┘
```

Rules:
- `APPROVED` → locked, shows Download only
- `REVISION` → shows rejection notes + annotated PDF link + re-upload button
- `SUBMITTED / PENGECEKAN` → shows status badge, no actions (waiting for review)
- `UNSUBMITTED` → shows upload button

### 5.4 Reviewer view — "Review Dosen"

8 accordion sections. Each section lists all Dosens assigned to this Matkul:

```
┌─ RPS ──────────────────────────────────────────────────┐
│  Budi Santoso      APPROVED ✓                          │
│  Ani Rahayu        PENGECEKAN         [Review →]       │
│  Citra Dewi        UNSUBMITTED        —                │
└────────────────────────────────────────────────────────┘

┌─ Soal UTS ─────────────────────────────────────────────┐
│  Budi Santoso      SUBMITTED          [Review →]       │
│  Ani Rahayu        UNSUBMITTED        —                │
│  Citra Dewi        REVISION           [Review →]       │
└────────────────────────────────────────────────────────┘
```

`[Review →]` opens the existing annotation + approve/reject modal (reuse `PdfAnnotationViewer` + `SignaturePad` components), parameterized by `docId`.

**Koordinator:** sees `[Review →]` only when `status=SUBMITTED` or `status=PENGECEKAN` (their queue).  
**Kaprodi:** sees `[Review →]` only when `isKoordinatorApproved=true` (second-level queue).

---

## 6. Component Plan

All existing RPS components are reused with `docId` replacing `rpsId`. No new annotation/signature logic needed.

| Existing component | Reuse as |
|--------------------|---------|
| `PdfAnnotationViewer` | Reviewer modal for any `AcademicDocument` |
| `SignaturePad` | Signature step in reviewer modal |
| `PdfSignatureOverlay` | Signature placement overlay |
| `StatusBadge` | Status display per section |

New components needed:

| Component | Purpose |
|-----------|---------|
| `MatkulCard` | Card on list page with role badges + progress |
| `DocumentSection` | Single accordion section (Dosen view) |
| `ReviewSection` | Single accordion section (Reviewer view) with Dosen rows |
| `MatkulDetailTabs` | Tab switcher for dual-role users |

---

## 7. Role Behavior Summary

### Dosen
- Sees only Matkuls they are assigned to teach
- Inside each Matkul: 8 sections showing their own document status
- Can upload/re-upload any section independently at any time
- Cannot upload a section once `APPROVED`

### Koordinator
- Sees Matkuls they coordinate (as reviewer) + Matkuls they teach (as Dosen), unified list
- Inside Matkul where they are Koordinator: sees all Dosens' submissions per section
- Reviews documents at first level; can annotate, approve, reject
- Cannot approve at Kaprodi level
- If also Dosen for a Matkul: sees both tabs

### Kaprodi
- Sees all Matkuls in the program
- Inside each Matkul: sees all Dosens' submissions per section
- Reviews at second level; `[Review →]` enabled only after Koordinator approves
- Can annotate, approve, reject at Kaprodi level
- If also Dosen for a Matkul: sees both tabs

---

## 8. Migration Plan (RPS → AcademicDocument)

Existing `RPS` data must be backfilled into `AcademicDocument` before old routes are removed.

```ts
// prisma/migrate-rps.ts
const rpsList = await prisma.rPS.findMany({ include: { matkul: true, dosen: true } })

for (const rps of rpsList) {
  await prisma.academicDocument.upsert({
    where: {
      matkulId_dosenId_semester_type: {
        matkulId: rps.matkulId,
        dosenId: rps.dosenId,
        semester: 'Ganjil 2024/2025', // best-guess if semester not on RPS model
        type: 'RPS',
      }
    },
    create: {
      matkulId: rps.matkulId,
      dosenId: rps.dosenId,
      semester: 'Ganjil 2024/2025',
      type: 'RPS',
      fileUrl: rps.fileUrl,
      fileName: rps.fileName,
      status: rps.status,
      isKoordinatorApproved: rps.isKoordinatorApproved,
      koordinatorId: rps.koordinatorId,
      koordinatorNotes: rps.koordinatorNotes,
      kaprodiNotes: rps.kaprodiNotes,
      annotatedPdfUrl: rps.annotatedPdfUrl,
      koordinatorSignedPdfUrl: rps.koordinatorSignedPdfUrl,
      finalPdfUrl: rps.finalPdfUrl,
      // sig fields...
    },
    update: {},
  })
}
```

Run: `npx tsx prisma/migrate-rps.ts`

---

## 9. Implementation Order

| Step | Task |
|------|------|
| 1 | Add `DocType` enum + `AcademicDocument` + `AcademicDocAnnotation` to schema |
| 2 | `npx prisma migrate dev && npx prisma generate` |
| 3 | `POST /api/matkul/[id]/documents/upload` |
| 4 | `GET /api/matkul/[id]/documents` (Dosen scope) |
| 5 | `GET /api/matkul/[id]/documents` (Reviewer scope) |
| 6 | `PATCH /api/documents/[docId]/review` |
| 7 | `GET|POST /api/documents/[docId]/annotations` + `DELETE` + `flatten` |
| 8 | `POST /api/documents/[docId]/sign` |
| 9 | `/dashboard/matkul` list page |
| 10 | `/dashboard/matkul/[matkulId]` — Dosen view |
| 11 | `/dashboard/matkul/[matkulId]` — Reviewer view |
| 12 | Dual-role tab support |
| 13 | Update sidebar (add "Mata Kuliah", remove old RPS links) |
| 14 | Run RPS backfill migration script |
| 15 | Redirect old `/rps` routes → `/matkul` |
| 16 | Remove old RPS pages + routes after validation |

---

## 10. Semester Handling

`RPS` model currently has no `semester` field. `AcademicDocument` requires it.

- Add a `semester` field to the upload form (dropdown: "Ganjil 2024/2025", "Genap 2024/2025", etc.)
- Persist selected semester in URL param (`?semester=`) so it persists across navigation
- Default: current active semester (hardcoded constant, or future `Semester` model)
- Backfill: assign a best-guess semester to all existing RPS during migration

---

## 11. Out of Scope (this phase)

- Email notifications (Phase 8, separate track)
- Semester model / academic calendar
- Bulk operations
- Export / reporting per Matkul
