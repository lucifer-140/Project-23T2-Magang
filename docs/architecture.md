# System Architecture

## High-Level Overview

```
UI Layer (Next.js 16 + React 19)
    ├── Server Component (SSR)
    │   └── Fetches initial data from Prisma
    │       └── Passes as fallbackData to Client Component
    │
    ├── Client Component (React)
    │   ├── Dosen: RPS Upload & Status View
    │   ├── Koordinator: RPS First-Level Review
    │   └── Kaprodi: RPS Final Review
    │       └── Renders immediately with SSR data (no loading)
    │
    └── SWR Polling Layer (Every 5 seconds)
        └── Fetches fresh data via GET endpoints
            └── Automatic sync on background (fallback + revalidate)
            ↓
GET API Routes (Read-only data fetching)
    ├── GET /api/rps (role-scoped RPS list)
    ├── GET /api/logs (Master audit trail)
    ├── GET /api/change-requests (Kaprodi change queue)
    └── Returns type-safe JSON
            ↓
Mutation API Routes (Write operations)
    ├── POST /api/rps/upload (Dosen file upload)
    ├── PATCH /api/rps/[id]/review (Review approval/rejection)
    └── PATCH /api/change-requests/[id] (Change request decision)
            ↓
Database Layer (PostgreSQL + Prisma ORM)
    └── Persistent storage & state management
```

## Data Flow (v0.6.1 - SSR + SWR Hybrid)

1. **Page Load**: Server Component renders → fetches Prisma data → passes to Client Component
2. **First Paint**: Client Component renders immediately with SSR data (no loading state)
3. **Background Sync**: SWR hook initialized with `fallbackData: ssrData` and `refreshInterval: 5000`
4. **Polling**: Every 5 seconds, SWR fetches from GET endpoint
5. **Revalidation**: If data changes, UI updates automatically (no manual refresh)
6. **Mutations**: PATCH/POST operations → `mutate()` triggers immediate SWR revalidation
7. **Errors**: Sync indicator shows error state, retries automatically

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

## API Flow (v0.6.1)

### Read Endpoints (SWR Polling)

**GET /api/rps** — Role-scoped RPS data
- DOSEN (no reviewer roles) → MatkulRps[] (flat array of assigned matkuls + their RPS)
- KAPRODI (exclusive) → RpsApiResponse { submissions: [], assignments: [] } (all RPS)
- KOORDINATOR (±DOSEN) → RpsApiResponse scoped to coordinator's matkuls
- Multi-role handling: Returns MatkulRps[] if user has DOSEN, else RpsApiResponse

**GET /api/logs** — Master audit log
- MASTER only (403 if not MASTER)
- Returns LogEntry[] (merged RPS status changes + change request actions)
- Sorted by timestamp, limited to 120 most recent

**GET /api/change-requests** — Kaprodi change request queue
- KAPRODI only (403 if not KAPRODI)
- Returns ChangeRequest[]

### Write Endpoints (Mutations)

**POST /api/rps/upload** → Creates/updates RPS, resets chain on re-upload
- Body: { file, matkulId, dosenId, rpsId? }
- Triggers: SWR revalidation after successful upload

**PATCH /api/rps/[id]/review** → Koordinator or Kaprodi approve/reject
- Body: { reviewer: "koordinator"|"kaprodi", action: "approve"|"reject", notes?: string }
- Triggers: SWR revalidation after review decision

**PATCH /api/change-requests/[id]** → Admin approve/reject change request
- Body: { action: "approve"|"reject" }
- Triggers: SWR revalidation after decision

## Performance

- Eager load relations (matkul, dosen, koordinator)
- Index on status, dosenId, matkulId for filtering
- Memoize computed progress values
