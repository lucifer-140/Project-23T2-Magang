# Plan: PRODI Role + LPP/EPP Workflow

## Summary

Add a new `PRODI` role to handle Stage 2 review of **LPP** and **EPP** documents.  
**Kaprodi** assigns the PRODI role to eligible users (must already be DOSEN).  
Once assigned PRODI role, the user reviews **all** LPP & EPP across all matkuls — no per-matkul scoping.

---

## Role & Assignment Flowchart

```mermaid
flowchart TD
    A[Kaprodi] -->|Assigns PRODI role| B[User with DOSEN role]
    B --> C[User now has roles: DOSEN + PRODI]
    C --> E[PRODI user reviews ALL LPP & EPP\nacross all matkuls system-wide]
```

### Who assigns what

| Action | Who can do it | Constraint |
|--------|--------------|------------|
| Assign `PRODI` role to a user | **Kaprodi** only | Target user must already have `DOSEN` role |
| Remove `PRODI` role from a user | **Kaprodi** only | — |

> PRODI is **not** matkul-scoped. One PRODI user sees all LPP/EPP from every matkul.

---

## Document Approval Workflow

### LPP / EPP — New 2-stage flow

```mermaid
flowchart LR
    D[Dosen uploads\nLPP or EPP] --> S1[Status: SUBMITTED]
    S1 --> K{Koordinator\nStage 1}
    K -->|Reject| R1[Status: REVISION\nkoordinatorNotes set]
    R1 -->|Dosen re-uploads| S1
    K -->|Approve| P1[Status: PENGECEKAN\nisKoordinatorApproved = true]
    P1 --> P{PRODI\nStage 2}
    P -->|Reject| R2[Status: REVISION\nisKoordinatorApproved = false\nprodiNotes set]
    R2 -->|Dosen re-uploads| S1
    P -->|Approve| AP[Status: APPROVED\nisProdiApproved = true]
```

### All other documents (RPS, SOAL_UTS, SOAL_UAS, etc.) — unchanged

```mermaid
flowchart LR
    D2[Dosen uploads] --> S2[Status: SUBMITTED]
    S2 --> K2{Koordinator\nStage 1}
    K2 -->|Reject| R3[REVISION]
    K2 -->|Approve| P2[PENGECEKAN]
    P2 --> KP{Kaprodi\nStage 2}
    KP -->|Reject| R4[REVISION]
    KP -->|Approve| AP2[APPROVED]
```

---

## Schema Changes

### 1. `Role` enum — add `PRODI`

```prisma
enum Role {
  MASTER
  ADMIN
  KAPRODI
  KOORDINATOR
  DOSEN
  PRODI
}
```

### 2. `User` model — add back-relation

```prisma
prodiDocReviews  AcademicDocument[] @relation("ProdiAcademicReview")
```

### 3. `AcademicDocument` model — add PRODI review fields

```prisma
isProdiApproved  Boolean  @default(false)
prodiId          String?
prodi            User?    @relation("ProdiAcademicReview", fields: [prodiId], references: [id])
prodiNotes       String?
```

---

## API Changes

### `PATCH /api/users/[id]/role`

Caller with `KAPRODI` role (non-MASTER) can:
- Only add/remove `PRODI` role on the target
- Target must already have `DOSEN` role
- Cannot strip `DOSEN` while assigning `PRODI`

### `PATCH /api/documents/[docId]/review`

Add `reviewer === 'prodi'` branch for `LPP`/`EPP` doc types:
- Guard: `isKoordinatorApproved` must be `true`
- `approve` → `{ isProdiApproved: true, prodiId, status: 'APPROVED' }`
- `reject`  → `{ status: 'REVISION', isProdiApproved: false, isKoordinatorApproved: false, prodiNotes: notes }`

---

## Routing

```
PRODI → /dashboard/prodi  (+ /dashboard/dosen)
```

PRODI is added to the combinable-roles group in `dashboard/layout.tsx`.

---

## New Dashboard Pages

### `src/app/dashboard/prodi/`

```
prodi/
  page.tsx    → PRODI dashboard with LPP+EPP queue stats
```

Query: all `AcademicDocument` where `type IN [LPP, EPP]`, `isKoordinatorApproved = true`, `isProdiApproved = false`.

### Kaprodi dashboard

- Existing users page gets PRODI toggle for DOSEN users (new section in role edit modal, KAPRODI-only)

---

## Seed

New test account: `prodi@test.com` / `prodi123` with roles `[DOSEN, PRODI]`.

---

## Build Sequence (completed)

| Step | File | Status |
|------|------|--------|
| 1 | `prisma/schema.prisma` | ✅ |
| 2 | `npx prisma migrate dev` | ✅ |
| 3 | `src/app/api/users/[id]/role/route.ts` | ✅ |
| 4 | `src/app/api/documents/[docId]/review/route.ts` | ✅ |
| 5 | `src/app/dashboard/layout.tsx` | ✅ |
| 6 | `src/app/dashboard/prodi/page.tsx` | ✅ |
| 7 | `src/app/page.tsx` (login redirect) | ✅ |
| 8 | `prisma/seed.ts` | ✅ |
