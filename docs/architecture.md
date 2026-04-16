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

---

## Planned: Email + Calendar Notification System (Phase 8)

> **Status:** Architecture revised (2026-04-15). Not yet implemented. Azure AD app registration was rejected by UPH IT — M365 OAuth2 approach is no longer viable.

### Stack Decision

**Primary: Resend**
- API-key based, no OAuth flow required
- 3,000 emails/month free tier — sufficient for internal UPH dashboard load
- Clean SDK: `npm install resend`
- Sender domain must be verified in Resend dashboard

**Alternative: Nodemailer + Gmail OAuth2**
- Uses a dedicated Gmail account (e.g. `noreply.uph@gmail.com`)
- 500 emails/day free via Google SMTP
- Google OAuth2 consent screen is easier to get approved than Azure AD
- Minimal code changes from original Nodemailer approach

**Ruled out:** Nodemailer + Microsoft 365 OAuth2 — Azure AD app registration rejected by UPH IT.

### Architecture (Resend path)

```
API Route (mutation handler)
     │
     ▼
src/lib/mailer.ts              ← sendEmail() helper + ICS attachment builder
     │
     ├── Resend SDK             ← API key from env, no token management needed
     │
     └── ics payload            ← .ics file generated per event (deadline reminder)
         attached to email      ← auto-prompts calendar add in Gmail/Outlook/Apple Mail
```

### Calendar Integration

Notification emails include:
1. **ICS attachment** (`.ics` file) — opens in any calendar app (Google Calendar, Outlook, Apple Calendar), prompts user to add event. No calendar API or extra OAuth required.
2. **"Add to Google Calendar" deep-link** in the email body — fallback for clients that don't handle `.ics` attachments automatically.

This approach is universal and requires zero additional authentication beyond the email provider.

### Notification Trigger Points

| Event | Triggered in | Recipients | ICS Event |
|---|---|---|---|
| Dosen submits / re-uploads RPS | `POST /api/rps/upload` | Assigned Koordinator | RPS review deadline reminder |
| Koordinator approves | `PATCH /api/rps/[id]/review` (koordinator + approve) | Assigned Kaprodi | Kaprodi review deadline reminder |
| Kaprodi approves | `PATCH /api/rps/[id]/review` (kaprodi + approve) | Dosen who submitted | — (approval confirmation, no deadline) |
| Koordinator or Kaprodi rejects | `PATCH /api/rps/[id]/review` (reject) | Dosen who submitted | RPS revision deadline reminder |

### Required Environment Variables

**Resend path:**
```
RESEND_API_KEY=       # From Resend dashboard
MAIL_SENDER=          # noreply@yourdomain.com (verified in Resend)
```

**Gmail OAuth2 path:**
```
GMAIL_CLIENT_ID=      # Google Cloud project OAuth client ID
GMAIL_CLIENT_SECRET=  # Google Cloud project OAuth client secret
GMAIL_REFRESH_TOKEN=  # Long-lived refresh token from OAuth consent
MAIL_SENDER=          # noreply.uph@gmail.com
```

---

## Planned: Local Server Deployment

> **Status:** Planned (2026-04-15). Target hardware: MacBook Intel repurposed as a local server.

### Stack

| Layer | Choice |
|---|---|
| OS | Ubuntu Server 24.04 LTS (headless) |
| Runtime | Node.js 22 LTS via NVM |
| Process manager | PM2 (auto-restart on reboot) |
| Database | PostgreSQL via existing Docker Compose setup |
| Reverse proxy (optional) | Nginx (`http://uph.local`) |

### Setup Steps

```bash
# 1. Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 2. Install Node.js 22 via NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install 22

# 3. Clone repo and install dependencies
git clone <repo-url>
cd Project-23T2-Magang
npm install

# 4. Start database and run migrations
docker compose up -d
npx prisma migrate deploy

# 5. Build and start with PM2
npm run build
pm2 start npm --name "uph-dashboard" -- start
pm2 save && pm2 startup
```

### Network Access

- LAN access: `http://<server-ip>:3000` — all devices on the same network
- SSH management: `ssh username@<server-ip>`
- MacBook broadcom WiFi may require `bcmwl-kernel-source` driver; use Ethernet during initial OS install
- Boot from USB installer: hold **Option** key on startup to select boot device
