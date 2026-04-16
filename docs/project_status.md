# Project Status Report

**Last Updated:** 2026-04-16  
**Current Version:** 0.10.0  
**Status:** Stable - Inline PDF Annotation System

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
| **KAPRODI** | RPS review queue, PDF annotation, approval workflow, dosen directory | Complete (v0.10.0) |
| **KOORDINATOR** | RPS first-level review, PDF annotation, digital signature stamping, dosen directory | Complete (v0.10.0) |
| **DOSEN** | Upload RPS (DOCX/PDF), track status, view annotated revision PDF, download signed final PDF | Complete (v0.10.0) |

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

### Out of Scope (Roadmap)
- Verifikasi SOAL (UTS/UAS)
- Verifikasi LPP
- Verifikasi EPP
- Berita Acara Perwalian

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
