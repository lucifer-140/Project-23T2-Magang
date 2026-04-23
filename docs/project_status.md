# Project Status Report

**Last Updated:** 2026-04-23  
**Current Version:** 0.16.0  
**Status:** Active Development - Phase 16 Complete

---

## Completed Milestones

### Phase 1: Foundation (v0.5.0)
- [x] Authentication & RBAC
- [x] Dashboard infrastructure (Admin, Kaprodi, Dosen, Master)
- [x] Database schema (PostgreSQL + Prisma)
- [x] Matkul management (CRUD, assignments)
- [x] User management (RBAC-protected)
- [x] System logs and audit trail

### Phase 2: RPS Management - Single Stage (v0.5.0)
- [x] Dosen upload workflow
- [x] Kaprodi review & approval/rejection
- [x] Status tracking (UNSUBMITTED → SUBMITTED → PENGECEKAN → REVISION/APPROVED)
- [x] Revision notes and feedback loop

### Phase 3: RPS Management - Multi-Level Approval (v0.6.0)
- [x] Koordinator role integration for two-tier review
- [x] Sequential approval enforcement (Koordinator → Kaprodi)
- [x] Koordinator dashboard page with identical UI to Kaprodi
- [x] Rejection attribution (shows who rejected and why)
- [x] Simultaneous visibility (Dosen upload appears on both reviewer dashboards)
- [x] Download PDF feature for approved RPS
- [x] Backend state machine with `isKoordinatorApproved` flag
- [x] Approval locking (Kaprodi can't review until Koordinator approves)
- [x] UI/UX synchronization (Koordinator & Kaprodi pages identical)
- [x] Removal of emojis from all UI labels

### Phase 7: Admin UX Polish & Data Integrity (v0.9.0)
- [x] Searchable combobox in "Tambah Matkul" with hardcoded MATKUL_CATALOG (5 entries)
- [x] Unified "Assign Roles" modal replaces separate +Koord / +Dosen buttons
- [x] Two-tab modal (Koordinator / Dosen) with per-tab search
- [x] Deep cleanup on dosen removal: `prisma.$transaction` deletes RPS records before disconnect
- [x] Confirmation modal for dosen removal with explicit RPS data loss warning (replaces `window.confirm`)
- [x] Matkul table action column layout consolidated

### Phase 10: Hierarchical Academic Term UX (v0.12.0)
- [x] `TahunAkademik` + `Semester` models (replaces earlier `AcademicTerm` design)
- [x] Matkul.semesterId FK (replaces old `semester` + `academicYear` strings)
- [x] AcademicDocument.semesterId FK (replaces `semester` string)
- [x] `GET/POST /api/tahun-akademik` — List and create academic years
- [x] `GET/POST /api/tahun-akademik/[tahunId]/semesters` — List and create semesters
- [x] Admin Matkul page restructured: `/dashboard/admin/matkul` (year/semester list) → `/[semesterId]` (scoped matkul table)
- [x] Seed data: Ganjil + Genap 2025/2026 terms pre-created with matkul assignments
- [x] Semester selector on Matkul hub pages loads from database

### Phase 16: Kaprodi Analytics Dashboard + Matkul List Overhaul (v0.16.0)
- [x] `GET /api/analytics/kaprodi` — semester-filterable aggregation: doc counts by status, type × status breakdown, EPP metric averages
- [x] `/dashboard/kaprodi` — dedicated analytics page with recharts bar charts (doc type stacked + EPP horizontal), semester dropdown, stat cards
- [x] `KaprodiDashboardClient` + `KaprodiDashboardWrapper` — client-side analytics with SWR-like fetch on semester change
- [x] Kaprodi sidebar cleaned: single "Analitik Kaprodi" entry replaces 3 sub-items
- [x] Dosen combined dashboard: Kaprodi section removed; Kaprodi role uses `/dashboard/kaprodi` as home via sidebar
- [x] Matkul list: card grid view (default) + table view toggle + group-by-semester toggle
- [x] Matkul list: doc status filter chips (Menunggu Review / Perlu Revisi / Semua Selesai)
- [x] Matkul list: role quick-filter chips always visible for multi-role users
- [x] Matkul list: SKS filter in expanded panel
- [x] Matkul card: doc progress bar (color-coded segments), aligned visual atoms with table
- [x] Matkul table: removed Dokumen column, merged Pengajar, whitespace-nowrap, SKS badge
- [x] `GET /api/matkul/mine` — now returns `docCounts` per matkul
- [x] Auto-filter from URL: `?filter=pending` pre-sets "Menunggu Review" filter
- [x] "Lihat Semua" on Kaprodi pending panel → `/dashboard/matkul?filter=pending`
- [x] Kaprodi quick action "Berita Acara" renamed to "Kelola Berita Acara"

### Phase 15: BAP Hierarchy Overhaul + Notifications (v0.15.0)
- [x] `Kelas` model — replaces flat `kelasName`/`dosenPaId` on BAP; Kelas owns Dosen PA
- [x] `Notification` model — in-app notifications with link, isRead, userId
- [x] `BeritaAcaraPerwalian` restructured: `kelasId` FK + `isUnlocked` flag
- [x] Three-level navigation: Kelas list → Tahun Akademik list → 3 semester tiles
- [x] Auto-create 3 BAPs (Ganjil/Genap/Akselerasi) on tahun add; auto-navigate to tiles page
- [x] Locked cards by default; Kaprodi unlocks with confirmation modal → notifies Dosen PA
- [x] Delete Kelas and delete Tahun Akademik with confirmation modals (cascade)
- [x] Ganti Dosen PA moved to Kelas detail page — info bar with confirmation modal
- [x] NotificationBell in sidebar — 5 s polling, unread badge, mark-all-read on open
- [x] Auto-refresh (`router.refresh()` 30 s) on all 4 BAP client pages
- [x] "Tambah Tahun Akademik" button blocked pending auto-create flow review

### Phase 13: PRODI Role & LPP/EPP Workflow (v0.13.0)
- [x] `PRODI` Role enum added to Prisma schema
- [x] `isProdiApproved`, `prodiId`, `prodiNotes` fields on `AcademicDocument`
- [x] `LPP_TINDAK_LANJUT` and `EPP_TINDAK_LANJUT` doc types removed; only LPP and EPP remain
- [x] LPP/EPP approval flow: Koordinator (Stage 1) → PRODI (Stage 2); Kaprodi handles all other types
- [x] PRODI globally scoped — once assigned, reviews all LPP & EPP system-wide
- [x] Kaprodi can assign/revoke PRODI role at `/dashboard/kaprodi/prodi-users`
- [x] PRODI dashboard at `/dashboard/prodi` with stats + review entry point
- [x] `POST /api/documents/[docId]/sign` extended for `prodi` reviewer
- [x] `GET /api/matkul/mine` and list page updated for PRODI scope
- [x] Koordinator review button blocked for LPP/EPP once Stage 1 approved
- [x] Seed account: `prodi@test.com / prodi123`

### Phase 12: Matkul List Filter Bar (v0.12.1)
- [x] Replaced semester dropdown with multi-part filter bar on `/dashboard/matkul`
- [x] Text search across nama, kode, kelas, dosen, koordinator fields
- [x] Tahun akademik dropdown (derived from loaded matkul data)
- [x] Semester type toggle buttons (Ganjil / Genap / Akselerasi)
- [x] "Hapus Filter" clear button appears when any filter is active
- [x] Minor UX adjustments on MatkulHubClient per-matkul page
- [x] Minor fix to `/api/matkul/mine` query

### Phase 11: Role Dashboard Alignment (v0.12.0)
- [x] Dosen dashboard: updated to query `AcademicDocument` instead of `RPS`
- [x] Kaprodi dashboard: updated to query `AcademicDocument`; labels changed ("RPS" → "Dokumen")
- [x] Koordinator dashboard: real implementation (was placeholder) with academicDoc stats
- [x] All dashboard stats accurately reflect new data model
- [x] Sidebar updated: removed dead `/rps` links, added "Mata Kuliah"
- [x] Old RPS route pages deleted: `/dashboard/dosen/rps`, `/dashboard/kaprodi/rps`, `/dashboard/koordinator/rps`, `/dashboard/admin/rps`
- [x] All role dashboards link to `/dashboard/matkul` for document management

### Phase 9b: Matkul Composite Unique + Seed Fix (v0.11.1)
- [x] `Matkul.code` unique constraint changed to composite `@@unique([code, semester, academicYear])`
- [x] Migration: `20260416091313_change_matkul_unique_to_composite`
- [x] API P2002 error message updated to reflect composite constraint
- [x] Seed data updated with `semester`/`academicYear` values; cleanup logic robustified

### Phase 9: Matkul-Centric Document Hub (v0.11.0)
- [x] `DocType` + `DocStatus` Prisma enums (8 document types)
- [x] `AcademicDocument` model — generic two-level approval with sig/annotation fields, unique on `(matkulId, dosenId, semester, type)`
- [x] `AcademicDocAnnotation` model — cascade-deleted on re-upload
- [x] Migration: `20260416_add_academic_document`
- [x] `GET /api/matkul/mine` — returns user's matkuls with role annotations
- [x] `POST /api/matkul/[id]/documents/upload` — create/update doc, reset on re-upload, locked when APPROVED
- [x] `GET /api/matkul/[id]/documents` — dosen scope (own docs) + reviewer scope (all dosens, grouped by type)
- [x] `PATCH /api/documents/[docId]/review` — koordinator/kaprodi approve/reject with two-level enforcement
- [x] `GET/POST /api/documents/[docId]/annotations`, `DELETE /[annotId]`, `POST /flatten`
- [x] `POST /api/documents/[docId]/sign`
- [x] `/dashboard/matkul` list page — card grid with role badges + semester selector
- [x] `/dashboard/matkul/[matkulId]` detail hub — 8 accordion sections; Dosen + Reviewer views; dual-role tabs
- [x] `PdfAnnotationViewer` — `apiBase` prop added for generic doc routes; `rpsId` now optional
- [x] Sidebar updated — "Mata Kuliah" added; old RPS nav items removed
- [x] `prisma/migrate-rps.ts` backfill script for existing RPS data

### Phase 8: Inline PDF Annotation (v0.10.0)
- [x] `RpsAnnotation` Prisma model with % coordinate system
- [x] `GET/POST /api/rps/[id]/annotations` + `DELETE /api/rps/[id]/annotations/[annotId]`
- [x] `POST /api/rps/[id]/annotations/flatten` — burns annotations into PDF via pdf-lib
- [x] `PdfAnnotationViewer` component (SSR-disabled, react-pdf + SVG overlay)
- [x] Four annotation tools: Highlight, Draw, Box, Sticky Note; six color options
- [x] Auto-flatten on rejection (before review PATCH call)
- [x] Dosen sees static annotated PDF via `annotatedPdfUrl` (no overlay drift)
- [x] Re-upload clears all annotations + `annotatedPdfUrl`
- [x] `RPS.annotatedPdfUrl` field in schema, API routes, and TypeScript types

### Phase 6: Bug Fixes — Koordinator Role (v0.8.1)
- [x] Fixed `/api/rps` role-branch ordering: KOORDINATOR+DOSEN users now correctly receive `RpsApiResponse` (not DOSEN-format array)
- [x] Fixed `handleSaveSignature`: `setSavedSignature` now only called when PATCH succeeds (`res.ok`)
- [x] Added global `SWRProvider` to dashboard layout with `revalidateOnFocus: true` and `revalidateOnReconnect: true`
- [x] Removed per-hook `revalidateOnFocus: false` overrides from all three RPS client components
- [x] Fixed `SignaturePad` tab hydration: `useEffect` now switches to `'saved'` tab when `savedSignature` loads asynchronously
- [x] Fixed optimistic mutate `TypeError`: optional-chaining guard on `prev?.submissions` prevents crash when cache shape is unexpected

### Phase 6: Digital Signature & Document Conversion (v0.8.0)
- [x] DOCX → PDF conversion via Gotenberg (Docker), LibreOffice CLI fallback, puppeteer/mammoth last resort
- [x] In-browser PDF viewer with drag-and-drop signature placement (`PdfSignatureOverlay`)
- [x] Signature canvas with draw/upload modes; exports transparent PNG (`SignaturePad`)
- [x] Koordinator two-step signing modal (review → stamp → approve)
- [x] Kaprodi signs Koordinator-stamped PDF producing `finalPdfUrl`
- [x] `POST /api/rps/[id]/sign` — pdf-lib stamp at percentage coordinates
- [x] Saved signature on user profile (`savedSignature` field) with "Tersimpan" quick-select tab
- [x] `GET/PATCH /api/users/me/signature` — read/persist saved signature
- [x] Responsive PDF viewer (ResizeObserver-based width measurement)
- [x] Graceful DOCX fallback UI (amber warning + download link)
- [x] Bug fix: Download button serves `finalPdfUrl` for approved RPS
- [x] Bug fix: Optimistic SWR update removes signed item from Koordinator queue instantly
- [x] Bug fix: Canvas transparent background (no white fill behind signatures)

### Phase 5: Account Approval Flow (v0.7.0)
- [x] `UserStatus` enum (`PENDING`, `ACTIVE`, `REJECTED`) added to schema
- [x] Registration creates PENDING account, redirects to `/lobby`
- [x] Login blocks PENDING/REJECTED users with informative error messages
- [x] `/lobby` waiting room page for new registrants
- [x] `PATCH /api/users/[id]/approve` — approve/reject with role assignment
- [x] Admin approval dashboard (`/dashboard/admin/approvals`)
- [x] Master approval dashboard (`/dashboard/master/approvals`)
- [x] Role elevation (KAPRODI/KOORDINATOR) only assignable during approval by admin/master
- [x] ADMIN role only assignable by MASTER during approval
- [x] Sidebar nav links for both Admin and Master
- [x] Fixed Next.js 16 redirect compatibility in signup

### Phase 4: Real-Time Data Updates (v0.6.1)
- [x] SWR auto-refresh implementation (5-second polling)
- [x] GET API endpoints for role-scoped data
  - [x] GET /api/rps — Role-aware RPS data fetching
  - [x] GET /api/logs — Master audit log streaming
  - [x] GET /api/change-requests — Kaprodi change requests
- [x] Client-side data synchronization across all dashboards
- [x] Sync status indicator (loading/error states)
- [x] SSR + SWR hybrid approach (fast initial paint + live updates)
- [x] Multi-role data handling (graceful fallbacks)
- [x] Type-safe API responses (centralized types)

---

## Current Feature Set

### Dashboards
| Role | Features | Status |
|---|---|---|
| **MASTER** | System monitoring, audit logs, user management, account approvals | Complete |
| **ADMIN** | Matkul CRUD (with catalog combobox + unified assign modal), user management, change requests, account approvals | Complete (v0.9.0) |
| **KAPRODI** | Analytics dashboard (EPP charts, doc breakdown, semester filter), document review queue, PDF annotation, approval workflow, PRODI role assignment | Complete (v0.16.0) |
| **KOORDINATOR** | Stage-1 review for all doc types, PDF annotation, digital signature stamping | Complete (v0.13.0) |
| **PRODI** | Stage-2 review for LPP & EPP system-wide, PDF annotation, digital signature stamping | Complete (v0.13.0) |
| **DOSEN** | Upload documents (all 6 types), track status, view annotated revision PDF, download signed final PDF | Complete (v0.13.0) |

### RPS Workflow
- Dosen upload → visible to both Koordinator and Kaprodi
- Koordinator verifies and approves/rejects
- Kaprodi verifies (only if Koordinator approved) and approves/rejects
- Rejection returns to Dosen with specific reviewer attribution
- Final approval locks document and stores in archive
- Download available only for approved RPS

### Real-Time Features
- Auto-refresh every 5 seconds on all dashboard pages
- No manual refresh needed for data updates
- Background sync indicator (subtle floating notification)
- Smart error handling with retry logic
- SSR + SWR hybrid for optimal performance

### Technical Stack
- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Data Fetching**: SWR (Stale-While-Revalidate) for client-side polling
- **Backend**: Node.js, Next.js API routes
- **Database**: PostgreSQL + Prisma ORM v7
- **UI Components**: Lucide Icons, custom DataTable, Modal, StatusBadge, SyncIndicator
- **Code Quality**: ESLint, TypeScript strict mode

---

## Testing Status

### Unit & Integration Tests
- [x] API routes (RPS upload, review, approval)
- [x] Authentication & middleware
- [x] Database queries and ORM logic
- [x] Form validation
- [ ] End-to-end test suite (Future)

### Manual Testing Checklist (v0.6.0 - Workflow)
- [x] Dosen upload → appears in both Koordinator and Kaprodi queues
- [x] Koordinator approve → toggles `isKoordinatorApproved=true`, file remains in Kaprodi queue
- [x] Koordinator reject → shows in Menunggu Revisi with "Ditolak oleh Koordinator" label
- [x] Kaprodi review locked until Koordinator approves (button disabled)
- [x] Kaprodi approve → status APPROVED, Dosen sees Download button
- [x] Kaprodi reject → status REVISION, shows "Ditolak oleh Kaprodi" label
- [x] Dosen re-upload → resets approval chain, back to Koordinator queue
- [x] Progress bar accuracy in Direktori Dosen
- [x] UI consistency between Koordinator and Kaprodi pages

### Manual Testing Checklist (v0.6.1 - Auto-Refresh)
- [x] API endpoints return correct data structure (`GET /api/rps`, `GET /api/logs`, `GET /api/change-requests`)
- [x] SWR polls every 5 seconds (visible in Network tab)
- [x] Initial page load shows SSR data immediately (no loading flash)
- [x] Sync indicator appears briefly during background polls
- [x] Kaprodi account can access `/dashboard/dosen/rps` without errors
- [x] DOSEN + KOORDINATOR accounts see dosen perspective on dosen page
- [x] RPS updates appear within 5 seconds when made in parallel tab
- [x] Master logs page updates in real-time
- [x] No console errors with multi-role data handling

---

## Known Issues & Limitations

### In Scope (Planned)

#### Phase 8: Email Notifications (Planned)
- [ ] Email notification system for RPS workflow events
  - [ ] Notify Koordinator when Dosen submits/re-uploads RPS
  - [ ] Notify Kaprodi when Koordinator approves RPS
  - [ ] Notify Dosen when RPS is approved or rejected (with reviewer notes)
- [ ] `src/lib/mailer.ts` — email transport singleton (see architecture decision below)
- [ ] Reusable `sendEmail({ to, subject, html, ics? })` helper used in API routes
- [ ] ICS calendar attachment generation for deadline reminders
- [ ] "Add to Google Calendar" deep-link in email body (fallback for non-ICS clients)

**Architecture Decision (2026-04-15):** Azure AD app registration was rejected by UPH IT. Email strategy updated:

- **Primary:** [Resend](https://resend.com) — API-key based, no OAuth, 3,000 emails/month free tier. Sender domain must be verified. Simplest integration path.
- **Alternative:** Nodemailer + Gmail OAuth2 — uses a dedicated Gmail account (e.g. `noreply.uph@gmail.com`), 500 emails/day free. Google OAuth2 consent screen approval is easier than Azure AD.
- **Ruled out:** Nodemailer + M365 OAuth2 (Azure AD registration blocked by IT).

**Calendar Integration Decision (2026-04-15):** RPS deadline reminder emails will include an `.ics` file attachment. This auto-prompts the recipient's calendar app (Google Calendar, Outlook, Apple Calendar) to create the event — no calendar API or extra OAuth required. Email body will also contain an "Add to Google Calendar" deep-link as a fallback.

Required env vars when implemented (Resend path):
```
RESEND_API_KEY=...
MAIL_SENDER=noreply@yourdomain.com
```

Required env vars when implemented (Gmail OAuth2 path):
```
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
GMAIL_REFRESH_TOKEN=...
MAIL_SENDER=noreply.uph@gmail.com
```

- [ ] Bulk operations (multiple file reviews)
- [ ] Advanced filtering/search on RPS queues

### In Scope (Planned)

#### Phase 9: Matkul-Centric Academic Document Hub (Planned)
Full replacement of the siloed RPS-only flow with a unified per-Matkul document hub. All document types are **independent** — no sequential locking between sections.

**Document sections per Matkul (all independent):**
- RPS (existing, to be migrated)
- Soal UTS
- Soal UAS
- LPP (Laporan Pelaksanaan Pembelajaran)
- Tindak Lanjut LPP
- EPP (Evaluasi Pencapaian Program)
- Tindak Lanjut EPP
- Berita Acara Perwalian

**UI Flow — single shared route for all roles:**
- Sidebar: "Mata Kuliah" replaces all separate RPS menu entries
- Route: `/dashboard/matkul` (list) → `/dashboard/matkul/[matkulId]` (detail hub)
- Matkul list shows all Matkuls relevant to the user (as Dosen, Koordinator, or Kaprodi — or any combination)
- Detail hub is **role-aware, rendered server-side** based on user's relationship to that Matkul

**Detail Hub — Dosen view** (user is Dosen for this Matkul):
- 8 sections, each shows the user's own document status + upload/revision panel
- `APPROVED` section locks re-upload; all others independently uploadable

**Detail Hub — Koordinator / Kaprodi view** (user is reviewer for this Matkul):
- Same 8 sections, but each section lists **all assigned Dosens** and their submission status
- Koordinator/Kaprodi can click into any individual submission to open the annotation + approve/reject modal
- Note: Koordinator and Kaprodi are often also Dosens — if user holds both roles for a Matkul, both views are shown (e.g. two tabs: "Dokumen Saya" | "Review Dosen")

**Reviewer section layout (per section):**
```
┌─ Soal UTS ──────────────────────────────────────┐
│  Budi Santoso     APPROVED ✓                    │
│  Ani Rahayu       PENGECEKAN   [Review →]       │
│  Citra Dewi       UNSUBMITTED  —                │
└─────────────────────────────────────────────────┘
```

**Planned schema:**
```prisma
enum DocType {
  RPS, SOAL_UTS, SOAL_UAS, LPP,
  LPP_TINDAK_LANJUT, EPP, EPP_TINDAK_LANJUT, BERITA_ACARA
}

model AcademicDocument {
  // Same two-level approval fields as current RPS model
  // @@unique([matkulId, dosenId, semester, type])
}
```

**Planned API surface:**
- `GET /api/matkul/[id]/documents?semester=...` — server infers scope from caller's role + assignment (own docs if Dosen, all Dosens' docs if Koordinator/Kaprodi)
- `POST /api/matkul/[id]/documents/upload` — body: `{ type, semester, file }`
- `PATCH /api/documents/[docId]/review`
- `GET|POST /api/documents/[docId]/annotations`
- `POST /api/documents/[docId]/annotations/flatten`

**Migration path:** Backfill existing `RPS` records → `AcademicDocument(type=RPS)`, then deprecate standalone `/rps` routes.

**Implementation phases:**
1. Schema + `npx prisma migrate dev`
2. New API routes (upload, review, annotations)
3. `/dashboard/matkul` list page (shared, role-aware)
4. `/dashboard/matkul/[matkulId]` detail hub — Dosen view
5. Detail hub — Koordinator/Kaprodi reviewer view (per-section Dosen list)
6. Dual-role tab support (Dosen + Reviewer in same detail page)
7. Backfill RPS → AcademicDocument
8. Redirect/remove old `/rps` routes

### Out of Scope (Roadmap)

---

## Performance Metrics

- **API Response Time**: < 200ms for typical queries
- **Database Queries**: Optimized with includes for related entities
- **UI Render**: Fast mode enabled for development, instant SSR initial paint
- **SWR Polling**: 5-second interval for background updates, minimal overhead
- **Network Efficiency**: Automatic deduplication across multiple SWR hooks
- **File Upload Limit**: 10 MB (configurable)
- **Concurrent Users**: Supports typical semester load (tested with 50+ concurrent)
- **First Contentful Paint**: < 100ms (SSR + fallback data)

---

## Next Steps & Recommendations

1. **Setup CI/CD Pipeline**: Automated testing and deployment
2. **Implement Email Notifications + Calendar Reminders (Phase 8)**: Resend (primary) or Gmail OAuth2 (alternative) — Azure AD rejected; ICS attachment for calendar integration; see architecture docs for full spec
3. **Implement Search/Filter**: Advanced RPS queue filtering
4. **Monitor Performance**: Add application metrics and observability
5. **User Training**: Documentation for all roles
6. **Data Backup**: Automated PostgreSQL backups
7. **Security Audit**: Penetration testing and security review

---

## Deployment Notes

**Current Environment**: Development (Docker-based local PostgreSQL)

**Planned Local Server Environment (2026-04-15):**
- **Hardware**: MacBook Intel (repurposed as local server)
- **OS**: Ubuntu Server 24.04 LTS (headless)
- **Runtime**: Node.js 22 LTS via NVM + PM2 (process manager, auto-restart on reboot)
- **Database**: PostgreSQL via Docker Compose (existing setup, unchanged)
- **Access**: LAN access via `http://<server-ip>:3000`; SSH for remote management
- **Optional**: Nginx reverse proxy for clean local domain (e.g. `http://uph.local`)

Setup notes:
- MacBook broadcom WiFi may need `bcmwl-kernel-source` driver; use Ethernet during initial install
- Boot from USB: hold **Option** key on startup to select boot device
- Enable OpenSSH during Ubuntu install for headless management

**Production Checklist**:
- [ ] Environment variables configured (.env.production)
- [ ] Database backups enabled
- [ ] HTTPS enforced
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] Monitoring & alerting setup
- [ ] User session timeout configured
- [ ] File upload security hardened

---

## Documentation Links

- [RPS Workflow Guide](../RPS.md) — Detailed process for all roles
- [Architecture Overview](./architecture.md) — System design
- [CLAUDE.md](../CLAUDE.md) — Developer guidelines
- [README.md](../README.md) — Project overview
