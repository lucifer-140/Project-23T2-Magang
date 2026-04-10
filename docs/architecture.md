# System Architecture

## High-Level Overview

```
Client Layer (Next.js 16 + React 19)
    ├── Dosen: RPS Upload & Status View
    ├── Koordinator: RPS First-Level Review
    └── Kaprodi: RPS Final Review
            ↓
    API Routes (Next.js App Router)
    ├── /api/rps/upload (Dosen file upload)
    ├── /api/rps/[id]/review (Koordinator & Kaprodi approval)
    └── Other routes...
            ↓
    Database (PostgreSQL + Prisma ORM)
```

## RPS State Machine (v0.6.0)

Two-tier approval workflow:

- Dosen uploads file → SUBMITTED (isKoordinatorApproved=false)
- Koordinator reviews and approves → isKoordinatorApproved=true (status=SUBMITTED, waits for Kaprodi)
- Kaprodi reviews and approves → status=APPROVED (final)
- Either reviewer rejects → status=REVISION (back to Dosen, reset approval chain)

## Key Database Fields

- `status`: UNSUBMITTED | SUBMITTED | PENGECEKAN | REVISION | APPROVED
- `isKoordinatorApproved`: Boolean (false = waiting/rejected by Koordinator)
- `koordinatorId`: User FK (who reviewed at tier 1)
- `koordinatorNotes`: Rejection reason from Koordinator
- `kaprodiNotes`: Rejection reason from Kaprodi

## Frontend Pages

- **DosenRPSClient**: Upload + status view (shows Download for APPROVED)
- **KoordinatorRPSClient**: Review queue (first tier)
- **KaprodiRPSClient**: Review queue (final tier, shows Koordinator name, locked until approval)

Both Koordinator and Kaprodi pages use identical UI and tab structure.

## API Flow

POST /api/rps/upload → Creates/updates RPS, resets chain on re-upload

PATCH /api/rps/[id]/review → Koordinator or Kaprodi approve/reject
Body: { reviewer: "koordinator"|"kaprodi", action: "approve"|"reject", notes?: string }

## Performance

- Eager load relations (matkul, dosen, koordinator)
- Index on status, dosenId, matkulId for filtering
- Memoize computed progress values
