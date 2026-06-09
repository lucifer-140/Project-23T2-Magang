# Changelog

All notable changes to this project are documented here.

## [1.8.0] - 2026-06-09

### Added
- **Session management** — `Session` table in Prisma schema; `prisma/migrations/20260508071513_add_session_table/` migration.
- **Heartbeat API** — `src/app/api/auth/heartbeat/` keeps sessions alive on active clients.
- **Error logging API** — `src/app/api/log-error/` for client-side error capture.
- **`SessionGuard` component** — `src/components/SessionGuard.tsx` wraps dashboard layout; redirects on session expiry.
- **Global error boundary** — `src/app/error.tsx` catches unhandled React errors.
- **Custom 404 page** — `src/app/not-found.tsx`.
- **Deployment documentation** — `docs/deployment-idcloudhost.md` with full VPS setup guide.

### Changed
- `src/lib/auth.ts` — session cookie helpers extended with heartbeat/expiry logic.
- `src/app/dashboard/layout.tsx` — wraps children in `SessionGuard`.
- `src/app/page.tsx` — root page redirect improvements.
- `src/app/api/auth/logout/route.ts` — clears session from DB on logout.

## [1.7.0] - 2026-05-08

### Added
- **Document Status Matrix** — pivot table showing all (Kelas × Matkul × Dosen × DocType) cells for a given semester; each cell links directly to the uploaded file.
  - **`src/lib/queries/documentMatrixPivot.ts`** — `runDocumentMatrixPivot(semesterId)` raw query: joins `MatkulClass → Matkul → AcademicDocument` and pivots RPS, LPP, Soal UTS, EPP UTS, Soal UAS, EPP UAS into a single `MatrixRow[]`.
  - **`GET /api/master/document-matrix`** — MASTER + KAPRODI; accepts `?semesterId=` query param; returns `MatrixRow[]`.
  - **`GET /api/master/document-matrix/export`** — Excel (.xlsx) export via ExcelJS; file cells rendered as clickable hyperlinks; supports `?semesterId=` (single sheet) or `?all=true` (one sheet per semester, ordered tahun desc). Auth: MASTER + KAPRODI.
  - **`/dashboard/kaprodi/matrix`** — Kaprodi matrix page: semester selector, pivot table, "Export Excel" button.
  - **`/dashboard/master/uploads/matrix`** — Master matrix page: same UI, accessible from Master dashboard.
- **`MatrixRow` + `SemesterOption` types** exported from `src/lib/api-types.ts`.
- **Backup snapshot** — `backup/db-pre-migration.sql` (full PostgreSQL dump) + `backup/uploads-pre-migration/` (1 036 files) created before migration.

### Changed
- **Master dashboard** — "Matrix Dokumen" nav card added; live disk-usage stats and DB health shown inline.
- **Kaprodi sidebar** — "Matrix Dokumen" nav entry (`LayoutGrid` icon, `/dashboard/kaprodi/matrix`).
- **`src/lib/api-types.ts`** — added `DocCell`, `MatrixRow`, `SemesterOption` types.
- **Removed** `src/app/feature/PdfRenderer.tsx` and `src/app/feature/page.tsx` (dev scaffold pages).
- Dashboard client components — minor UX polish and type fixes (`ApprovalsClient`, `DashboardWrapper`, `SidebarNav`, `ErrorsClient`, `LogsClient`, `UploadsClient`, `UsersManageClientPage`, `settings/page.tsx`).

### Dependencies
- `exceljs` added for server-side `.xlsx` generation.

## [1.6.0] - 2026-05-08

### Added
- **`src/lib/auth.ts`** — centralized auth helpers: `getCurrentUserId()`, `getRoles()`, `unauthorized()`, `forbidden()`, `SESSION_COOKIE_OPTIONS`. All API routes now import from here instead of duplicating cookie logic inline.
- **`src/lib/logger.ts`** — structured DB logger: `logInfo`, `logWarn`, `logDebug`, `logError`. Writes to `SystemLog` table (fire-and-forget, never throws).
- **`src/lib/rate-limit.ts`** — in-memory sliding-window rate limiter: `checkRateLimit(key, limit, windowMs)`, `getIpFromRequest(req)`, `getIpFromHeaders()`. Auto-prunes expired entries every 10 minutes.
- **`SystemLog` Prisma model** — structured server error log: `level` (`INFO|WARN|DEBUG|ERROR`), `route`, `message`, `stack?`, `userId?`, `createdAt`. Indexed on `(level, createdAt DESC)` and `route`.
- **Rate limiting on auth endpoints** — `POST /api/auth/forgot-password`: 5 req / 15 min per IP (429 + `Retry-After`). Reset-password endpoint similarly guarded.
- **`GET /api/master/uploads`** — MASTER-only: recursively scans `/public/uploads/`, returns file list with `name`, `relativePath`, `folder`, `sizeHuman`, `modifiedAt`, `ext`, `publicUrl`; aggregated stats (`totalFiles`, `totalSizeHuman`, `byFolder`).
- **`DELETE /api/master/uploads`** — MASTER-only: deletes a single file by `relativePath`; path-traversal-safe (`path.normalize` + strip leading `../`).
- **`GET /api/master/health`** — public health-check endpoint.
- **Master "File Manager" page** (`/dashboard/master/uploads`) — `UploadsClient`: lists all uploaded files with folder grouping, file size, last modified; per-folder stats; inline delete with confirmation; SWR polling.
- **Master "Error Logs" page** (`/dashboard/master/errors`) — `ErrorsClient`: shows `SystemLog` ERROR entries; expandable stack traces; SWR polling.
- **DB migrations** — `20260508010259_add_indexes_cascade_deletes`: performance indexes and cascade deletes on orphan-prone relations. `20260508022659_add_system_log`: creates `SystemLog` table + `LogLevel` enum.

### Changed
- **All API routes refactored** to import auth helpers from `src/lib/auth.ts` — no behavioral change, cookie logic now centralized.
- **Master dashboard** (`/dashboard/master/page.tsx`) — updated nav cards to link to new File Manager and Error Logs pages.
- **`tsconfig.json`** — minor compiler option update.

## [1.5.1] - 2026-05-06

### Changed
- **Matkul table — merged Kelas & Pengajar column** — replaced separate "Kelas" and "Pengajar" columns with a single "Kelas & Pengajar" column; each row shows the class chip paired with its assigned dosens inline; koordinator displayed as amber `K` badge row at the bottom
- **Per-class dosen data** — `page.tsx` and `/api/matkul/mine` now fetch `dosens` per `MatkulClass` (via `include`) instead of only matkul-level dosens
- **Card view** updated to match: class chip + dosen name paired rows, koordinator `K` badge row below

## [1.5.0] - 2026-05-06

### Added
- **Admin Kelas management page** — `/dashboard/admin/kelas`: CRUD for Kelas records; lock/unlock toggle per row; Dosen PA assignment; delete with confirmation modal
- **"Kelola Kelas" sidebar entry** for ADMIN (`School` icon, links to `/dashboard/admin/kelas`)
- **`Kelas.isLocked` field** — boolean flag (`@default(false)`) for admin-controlled lock independent of BAP state
- **`MatkulClass.kelasId` FK** — links `MatkulClass` rows to parent `Kelas` entity; `SET NULL` on Kelas delete
- **`prisma/sync-kelas.ts`** — one-shot backfill script: upserts `Kelas` from distinct `MatkulClass.name` values and sets `kelasId` on all matched rows. Run: `npx tsx prisma/sync-kelas.ts`

### Changed
- **`Kelas.dosenPaId`** made nullable — Kelas can now exist without an assigned Dosen PA
- **`GET/POST /api/kelas`** — auth fixed (403 for non-admin/non-master callers); `name` trimmed before uniqueness check
- **`GET /api/matkul/[id]/classes`** — includes `kelasId` in response; minor query fixes
- **`POST /api/matkul/[id]/assign-coordinator`** — minor auth fix

### Schema
- `Kelas`: +`isLocked Boolean @default(false)`; `dosenPaId` now optional
- `MatkulClass`: +`kelasId Text?` FK → `Kelas`
- Migration: `20260505143007_kelas_is_locked_matkul_class_kelas_id`

## [1.3.0] - 2026-04-30

### Added
- **Collapsible sidebar** — `DashboardWrapper` replaces `DashboardClientShell`; sidebar toggles between 64px (icon-only) and 256px via `PanelLeftClose`/`PanelLeftOpen` button; `SidebarNav` updated to render icons-only when collapsed
- **User menu dropdown** — `UserMenuButton` in sticky header: avatar initial button opens dropdown with user name, "Pengaturan" link, and "Keluar" button
- **Settings page** — `/dashboard/settings`: edit name + email, change password (current-password verification required); role badges displayed read-only
- **`GET /api/users/me`** — returns `{ id, name, email, roles }` for authenticated user
- **`PATCH /api/users/me`** — update name, email (unique-checked), or password; refreshes `userName` cookie on name change
- **`POST /api/auth/logout`** — clears all session cookies; called by `UserMenuButton`

### Changed
- **`DashboardClientShell` removed** — replaced by `DashboardWrapper` (same responsibilities: `ToastProvider`, `SWRProvider`, sticky header, footer, notification bell + collapsible sidebar)
- **Dashboard layout** — uses `DashboardWrapper`; sidebar width dynamic (collapsed/expanded); main content margin adjusts accordingly
- **`import-data/metadata/users.csv`** — updated

## [1.2.1] - 2026-04-29

### Added
- **`DELETE /api/tahun-akademik/[tahunId]`** — delete TahunAkademik; blocked if any linked Matkul exists (returns 409 with count)
- **Delete TahunAkademik button** in `TahunAkademikClient` — inline delete with per-row error state

### Changed
- **Matkul list table** — sortable columns (Kode, Nama Matkul, SKS, Semester); default view changed from card to table
- **Matkul list table** — wider name column (`max-w-72`), wider Pengajar column (`max-w-48`), `matkulId` used as React key to avoid duplicate-key warnings on multi-semester catalogs
- **Login page** — removed test account cheat-sheet box from UI
- **`/api/matkul/mine`** — cleaned up query; now returns `matkulId` alongside `id` (katalogId) for stable React keys

### Fixed
- `kaprodi/requests/page.tsx` — missing JSX fragment wrapper around `<ChangeRequestsClient>` + `<AutoRefresh>` caused render error

## [1.2.0] - 2026-04-29

### Added
- **Katalog-centric matkul hub** — `[matkulId]` route replaced by `[katalogId]`; hub now shows all semester instances of a course under one URL with a semester dropdown switcher
- **Completion status badge** on matkul list cards and table — "Semua Selesai" (green), "Ada Revisi" (red), "Dalam Review" (amber), "Belum Lengkap" / "Belum Ada Data" (gray)
- **Accordion class sections** in matkul hub (dosen + reviewer views) — all classes rendered inline, collapsible via header click; replaces previous tab-based class switching
- **`scripts/update-matkul-codes.ts`** — one-shot script to rename `-OLD` placeholder codes to official UPH codes across `KatalogMatkul` and all linked `Matkul` instances

### Changed
- **`GET /api/matkul/mine`** — now groups by `katalogMatkulId`; returns one entry per `KatalogMatkul` with `docCounts` from latest semester instance only (fixes inflated progress bar)
- **`/dashboard/matkul` page** — same katalog-grouping logic as API; `id` = `katalogId` for navigation
- **`GET /api/matkul/[id]/documents`** — `[id]` is now `katalogId`; resolves to `matkulId` via `semesterId` param
- **`POST /api/matkul/[id]/documents/upload`** — same katalog → matkul resolution; notification URL updated to katalog route
- **17 KatalogMatkul codes** updated from `-OLD` placeholders to official codes (e.g. `TI-AP-OLD` → `IFT09102`); 43 Matkul instances updated in-place
- **`import-data/metadata/matkul.csv`** updated with correct official codes
- **Bulk-approved** 4 remaining SUBMITTED/PENGECEKAN documents so all historical data is APPROVED

### Fixed
- Doc progress bar on matkul list cards no longer inflates by aggregating across all semesters — shows latest semester instance only
- Class switching in hub was silently showing same content — replaced index-based tab state with accordion rendering all classes simultaneously

## [1.1.0] - 2026-04-28

### Added
- **Historical data import pipeline** — scripts to seed legacy academic documents (2022–2025) into the database from canonical  directory structure
  -  — normalizes dosen folder names from full academic titles to canonical names
  -  — normalizes matkul folder names, resolves typos and case variants
  -  — generates  and  templates from folder structure
  -  — full DB seeder: upserts Users, KatalogMatkul, TahunAkademik, Semester, Matkul, MatkulClass, RPS, AcademicDocument from  tree; supports - **27 dosen accounts** seeded with  emails; Ferawaty set as - **42 KatalogMatkul** entries seeded with official UPH course codes and SKS
- **441 historical PDFs** copied to  with all records marked -  — step-by-step import guide and checklist
-  — architecture plan for katalog-based matkul routing (next milestone)
-  port updated  to avoid Windows Hyper-V port reservation conflict

## [1.0.0] - 2026-04-25

### Added
- **BAP manual submit flow** — dosen PA now clicks "Ajukan ke Kaprodi" / "Kirim Ulang ke Kaprodi" button instead of auto-submit on 3rd upload. `POST /api/bap/[bapId]/submit` endpoint validates all 3 files, transitions status → SUBMITTED, notifies KAPRODI, clears stale `kaprodiNotes`.
- **BAP review notifications** — `bap/review/route.ts` now notifies dosenPa on Kaprodi approve/reject; `bap/upload/route.ts` notifies KAPRODI on submit.
- **BAP unlock notification guard** — unlock route checks dosenPa user exists before creating notification; unlock proceeds even if notification fails.
- **AutoRefresh on sub-pages** — added `<AutoRefresh />` to `matkul/[matkulId]`, `kaprodi/requests`, `admin/approvals`, `admin/matkul`, `prodi/page` which previously had no auto-refresh.
- **`POST /api/bap/[bapId]/submit`** — new manual submit endpoint replacing auto-submit logic.

### Changed
- **BAP flow simplified to dosen → Kaprodi** (PRODI reviewer layer removed from BAP). `bap/review/route.ts` only accepts `reviewer: 'kaprodi'`; Kaprodi reviews directly from `SUBMITTED` state.
- **BapDetailClient** — full UI/UX overhaul:
  - 3-step progress stepper (Upload → Menunggu Review → Selesai) for dosen PA
  - File slot cards with color-coded borders (green = uploaded, dashed gray = missing)
  - Submit banner on manual send, blue "sedang direview" banner when SUBMITTED
  - Approved state replaced by large green ✓ card with approval date
  - Revision state shows Kaprodi notes with re-upload + re-submit CTA
  - Kaprodi view: document list with timestamps + approve confirmation modal
- **TahunDetailClient** — card grid redesigned:
  - Color-coded borders per status (amber = SUBMITTED, green = APPROVED, red = REVISION)
  - Pulsing amber dot on SUBMITTED cards for Kaprodi
  - 3-segment file progress bar per card
  - Pending review counter badge in page header
  - Cleaner unlock modal with warning alert

### Fixed
- `BapDetailClient` `locked` logic no longer blocks uploads in REVISION state (was including `PENGECEKAN` and `REVISION` incorrectly).
- `await` inside `setBap(prev => ...)` callback removed (was parse error in non-async function).
- Stale PRODI-related `isProdiApproved` check removed from `canKaprodiReview`.

---

## [0.18.0] - 2026-04-24

### Added
- **`KatalogMatkul` model** — separates the course catalog (canonical codes/names/SKS) from semester-scoped `Matkul` instances. `Matkul` now has optional `katalogMatkulId` FK.
- **`MatkulChangeRequest` migrated to catalog** — change requests now reference `KatalogMatkul` instead of `Matkul`; added `requestedById` FK (User who submitted).
- **`GET /api/katalog/[id]/change-request`** — new API for catalog-level change requests.
- **`src/lib/upload-paths.ts`** — shared upload utilities: `getUploadDir(typeFolder, sub)`, `sanitizeName()`, `unlinkIfExists()`. Replaces inline `mkdirSync` in each upload route.
- **Organized upload directory structure** — files now stored in `/public/uploads/<type>/<sub>/` (e.g. `/uploads/rps/drafts/`) instead of flat `/public/uploads/`.
- **Old file cleanup on re-upload** — RPS re-upload now deletes all previous associated files (draft, annotated PDF, koordinator/kaprodi sig PNG, signed PDFs, finalPdf) before writing new upload.
- **`Notification` index** — `@@index([userId, createdAt(sort: Desc)])` added for faster notification queries.
- **Assignment notifications** — Dosen notified on add/remove to matkul (`/api/matkul/[id]/assign`); Koordinator notified on assign/unassign (`/api/matkul/[id]/assign-coordinator`).
- **Matkul deletion notification** — all affected dosens, koordinators, and KAPRODI role notified when a matkul is deleted.
- **`MatkulCombobox` refactored** — now receives live `katalog: KatalogItem[]` prop from server instead of hardcoded `MATKUL_CATALOG`; selects full `KatalogItem` (includes `id` and `sks`).

### Changed
- `POST /api/matkul` accepts optional `katalogMatkulId` and passes it to Prisma create.
- `GET /api/change-requests` maps `katalogMatkul` fields instead of `matkul` fields.
- `DELETE /api/matkul/[id]` removes orphaned `MatkulChangeRequest.deleteMany` (change requests now live on catalog, not on matkul instance); sends deletion notifications.
- `MatkulClientPage` `Props` extended with `katalog: KatalogItem[]`; hardcoded catalog array removed.
- RPS upload route uses `getUploadDir` / `sanitizeName` / `unlinkIfExists` from shared lib.
- `public/uploads/` flat-file accumulation cleared — legacy uploaded files removed from repo tracking.

### Fixed
- `User` model missing `changeRequests` relation — added `changeRequests MatkulChangeRequest[]`.

---

## [0.17.0] - 2026-04-23

### Added
- **Toast notification system** — `ToastProvider` context with bottom-right toast queue (max 4, 5s auto-dismiss, slide-in animation). `useToast` hook available to all client components.
- **Header notification bell** — `NotificationBell` moved from sidebar to sticky top header inside new `DashboardClientShell`. Detects new notifications on 5s poll via `prevIds` ref diff, triggers toast per new item.
- **`DashboardClientShell`** — new client wrapper housing `ToastProvider`, sticky header, footer, and `SWRProvider`. Replaces inline `<main>` block in layout.
- **`src/lib/notifications.ts`** — server-side helpers: `createNotification`, `notifyRole`, `notifyUsers`.
- **Document upload notification** — koordinators notified when a dosen uploads a document to their matkul.
- **Review flow notifications** — full coverage across all reviewer stages (koordinator, prodi, kaprodi) with deep links.
- **Dosen dashboard UX overhaul** — stat cards with progress bar and `#revisi` anchor; revision list as `<Link>` with reviewer attribution and rejection note preview; koordinator section has compact 3-stat row + pending review list with `timeAgo` + empty state.
- **Admin dashboard UX overhaul** — conditional alert banners; 6-card stat grid with urgency styling; matkul coverage table; merged activity feed; 3 nav cards with live counts.
- **Revision list polish** — `FileText` icon per row, bolder matkul name, explicit "Buka" CTA, removed em-dash and HTML quote entities.
- Plan docs: `docs/plan-dashboard-ux.md`, `docs/plan-master-pages.md`.
- `lucide` package added.

### Changed
- Dashboard layout: sidebar no longer contains `NotificationBell`; moved to `DashboardClientShell` header.
- Active Semester Banner and Document Progress Matrix on dosen dashboard deferred — marked `[FUTURE]` pending Semester Manager.
- Admin activity feed orders users by `id` desc (User model has no `createdAt`).

### Fixed
- `PrismaClientValidationError` on admin dashboard — `orderBy: { createdAt }` invalid on User model; fixed to `orderBy: { id: 'desc' }`.

---

## [0.16.0] - 2026-04-23

### Added
- **Kaprodi analytics dashboard** — `/dashboard/kaprodi` now shows semester-filterable analytics: 5 stat cards (Perlu Review / Pengecekan / Disetujui / Revisi / Total), stacked bar chart of doc counts by type × status, horizontal bar chart of avg EPP metrics (5 fields) color-coded by threshold.
- `GET /api/analytics/kaprodi?semesterId=` — aggregation endpoint returning semester list, doc counts by status, type × status breakdown, EPP averages. Default: all-time.
- **Matkul list overhaul** — card grid view (default) + table view toggle; group-by-semester toggle with section headers showing pending/revision summary counts.
- **Doc status filter** on matkul list: "Menunggu Review", "Perlu Revisi", "Semua Selesai" chips.
- **Role quick-filter** chips always visible in matkul filter bar for multi-role users.
- **SKS filter** chips in expanded filter panel.
- **Doc progress bar** on each matkul card (color-coded segments: approved/pengecekan/submitted/revision).
- **Auto-filter from URL**: `/dashboard/matkul?filter=pending` opens filter panel pre-set to "Menunggu Review".
- "Lihat Semua" link on Kaprodi pending docs panel → `/dashboard/matkul?filter=pending`.
- `recharts` dependency added for dashboard charts.

### Changed
- **Kaprodi sidebar** — removed Permintaan Perubahan, Kelola PRODI, Berita Acara Perwalian entries; replaced with single "Analitik Kaprodi" entry linking to `/dashboard/kaprodi`.
- **Dosen combined dashboard** — removed Kaprodi section (stats + action cards); Kaprodi role now navigates to `/dashboard/kaprodi` via sidebar.
- **Kaprodi quick actions** — "Berita Acara" renamed to "Kelola Berita Acara".
- **Matkul table** — removed Dokumen progress bar column; merged Dosen + Koordinator into single Pengajar column; all cells `whitespace-nowrap`; SKS shown as badge matching card style.
- **Matkul card** — code/name font weight/color aligned to table; kelas uses same mono chips as table; divider color `border-gray-100`.
- `GET /api/matkul/mine` now includes `docCounts` per matkul (grouped by status).
- `MatkulListPage` passes `initialFilter` from `searchParams` to client; server also computes `docCounts`.

### API
- `GET /api/analytics/kaprodi` — new analytics aggregation endpoint.

## [0.15.0] - 2026-04-21

### Added
- **Kelas model** — new `Kelas` DB entity (`name` unique, `dosenPaId`); replaces `kelasName` string + `dosenPaId` on `BeritaAcaraPerwalian`.
- **BAP restructured hierarchy** — Kelas → Tahun Akademik → 3 semester BAP tiles (Ganjil/Genap/Akselerasi).
- **New pages** — `/berita-acara` lists Kelas; `/berita-acara/kelas/[kelasId]` lists Tahun Akademik; `/berita-acara/kelas/[kelasId]/[tahunAkademikId]` shows 3 semester cards.
- **Auto-create BAPs** — adding a Tahun Akademik to a Kelas creates one BAP per semester in that tahun; navigates directly to the tahun page.
- **Locked/unlocked BAP cards** — `isUnlocked Boolean @default(false)` on BAP; cards start locked; Kaprodi unlocks with confirmation modal.
- **Unlock notification** — unlocking a BAP sends in-app notification to Dosen PA via new `Notification` model.
- **NotificationBell** — sidebar client component polling `/api/notifications` every 5 s; unread badge; mark-all-read on open.
- **Delete Kelas / Tahun** — Kaprodi can delete kelas (cascade) or remove a tahun's BAPs, both with confirmation modals.
- **Ganti Dosen PA** — moved from BAP detail to Kelas detail page; dedicated info bar card with confirmation modal; change applies to all semesters in that kelas.
- **Auto-refresh** — `router.refresh()` every 30 s in KelasListClient, KelasDetailClient, TahunDetailClient, BapDetailClient.

### Changed
- `BeritaAcaraPerwalian`: `kelasName`+`dosenPaId` → `kelasId` FK; `@@unique([kelasId, semesterId])`.
- `User`: `dosenPaBAPs` relation replaced by `kelasDosenPa Kelas[]`.
- BAP assign route now patches parent `Kelas.dosenPaId` instead of the BAP directly.
- BAP list page (`/berita-acara`) rewritten as `KelasListClient`; old `BapListClient` removed.
- "Tambah Tahun Akademik" button blocked (commented out) pending decision on auto-create flow.

### API
- `GET/POST /api/kelas` — list/create kelas.
- `GET/PATCH/DELETE /api/kelas/[kelasId]` — detail, update dosenPa, delete kelas.
- `POST /api/kelas/[kelasId]/tahun` — add tahun → auto-create BAPs.
- `DELETE /api/kelas/[kelasId]/tahun/[tahunAkademikId]` — remove tahun's BAPs.
- `PATCH /api/bap/[id]/unlock` — unlock BAP + create notification.
- `GET /api/notifications` — user notifications.
- `PATCH /api/notifications/read` — mark all read.

### Schema
- New model `Kelas`.
- New model `Notification` (`userId`, `message`, `link`, `isRead`).
- `BeritaAcaraPerwalian`: +`kelasId`, +`isUnlocked`; -`kelasName`, -`dosenPaId`.

## [0.14.0] - 2026-04-20

### Added
- **Signature toggle** — "Sertakan Tanda Tangan" checkbox in sign step; approve without stamp calls review API directly.
- **Name + timestamp on stamps** — `drawText()` below placed signature image: reviewer name + DD/MM/YYYY HH:mm WIB.
- **Universal 3-stage workflow** — ALL doc types now follow Koordinator → PRODI → Kaprodi (previously only LPP/EPP went through PRODI).
- **EPP additional inputs** — 5 nullable Float fields on `AcademicDocument` (`eppPersentaseMateri`, `eppPersentaseCpmk`, `eppPersentaseKehadiran`, `eppPersentaseNilaiB`, `eppPersentaseKkmToB`); shown before upload slot in dosen view; read-only in reviewer modal.
- **Berita Acara Perwalian (BAP)** — new standalone section per kelas per semester; 3 file slots (lembarKehadiran, absensi, beritaAcara); Kaprodi creates entries and assigns Dosen PA; Prodi → Kaprodi approval workflow.
- **BAP API routes** — `GET/POST /api/bap`, `POST /api/bap/[id]/upload`, `PATCH /api/bap/[id]/review`, `PATCH /api/bap/[id]/assign`.
- **BAP pages** — `/dashboard/berita-acara` (list) + `/dashboard/berita-acara/[bapId]` (detail with upload slots + review panel).
- **Sidebar BAP nav** — visible for all combined-role users (DOSEN, KOORDINATOR, PRODI, KAPRODI).
- **System title renamed** — "Sistem Administrasi UPH" → "Sistem Administrasi Prodi Informatika Medan".

### Changed
- **Universal workflow** — `review/route.ts`: removed `PRODI_DOC_TYPES` special-casing; kaprodi now gates on `isProdiApproved`; prodi approve sets `status=PENGECEKAN` (not APPROVED).
- **Kaprodi gate in sign route** — returns 400 if `isProdiApproved = false`.
- **PRODI dashboard** — stats now count all doc types (not just LPP/EPP); label "Review Semua Dokumen".
- **StatusBadge** — updated to 3-stage labels: "Menunggu Koordinator" → "Menunggu PRODI" → "Menunggu Kaprodi".
- **Upload route** — reset `isProdiApproved` and `prodiNotes` on re-upload; accepts EPP fields from FormData.

### Schema
- `AcademicDocument`: +5 nullable Float EPP fields.
- New model `BeritaAcaraPerwalian` with 3 file slots, Prodi→Kaprodi workflow, back-relations on `User` and `Semester`.

## [0.13.0] - 2026-04-20

### Added
- **PRODI role** — new globally-scoped reviewer role for LPP & EPP documents system-wide (no matkul-level assignment needed).
- **LPP & EPP workflow** — Koordinator (Stage 1) → PRODI (Stage 2) instead of Kaprodi; Kaprodi handles all other doc types unchanged.
- **Kaprodi → PRODI role assignment UI** — `/dashboard/kaprodi/prodi-users`: Kaprodi can assign/revoke PRODI role on any DOSEN user.
- **PRODI dashboard** — `/dashboard/prodi` with 4 stat cards (pending, approved, revision, total) + link to matkul review list.
- **PRODI sign support** — `/api/documents/[docId]/sign` accepts `reviewer: 'prodi'`; stamps koordinator-signed PDF.
- **`isProdiApproved`, `prodiId`, `prodiNotes`** fields on `AcademicDocument` schema.
- **`PRODI` Role enum** value added to Prisma schema.
- **Seed account** — `prodi@test.com / prodi123` (DOSEN + PRODI roles).

### Changed
- **DocType** — removed `LPP_TINDAK_LANJUT` and `EPP_TINDAK_LANJUT`; only `LPP` and `EPP` remain.
- **`/api/documents/[docId]/review`** — PRODI reviewer branch: approve → `isProdiApproved=true, status=APPROVED`; reject → `status=REVISION, isKoordinatorApproved=false`.
- **`/api/matkul/[id]/documents`** — PRODI scope: only LPP/EPP sections shown; isProdi detection.
- **`/api/matkul/mine`** — returns all matkuls for PRODI users (globally scoped, same as kaprodi).
- **`/dashboard/matkul/page.tsx`** — fetches all matkuls for PRODI role.
- **`MatkulListClient`** — added `prodi` entry to `ROLE_CONFIG` badge map.
- **`MatkulHubClient`** — PRODI reviewer tab, dynamic stage-2 label, `prodiNotes` display, signature label "Tanda Tangan PRODI", koordinator review blocked for LPP/EPP once `isKoordinatorApproved=true`.
- **`PdfAnnotationViewer`** — `reviewerRole` prop union extended to include `'prodi'`.
- **Dashboard layout** — Kaprodi sidebar shows "Kelola PRODI" link; PRODI role gets "Review LPP & EPP" nav entry.
- **Prisma migration** — `20260419000002_remove_tindak_lanjut_doctypes` deletes old TINDAK_LANJUT rows and recreates DocType enum.

---

## [0.12.1] - 2026-04-18

### Changed
- **Matkul list filter bar** — replaced single semester dropdown with three-part filter: text search (nama, kode, kelas, dosen, koordinator), tahun akademik dropdown, and Ganjil/Genap/Akselerasi toggle buttons. "Hapus Filter" button appears when any filter is active.
- **MatkulHubClient** — minor layout and UX adjustments on the per-matkul hub page.
- **`/api/matkul/mine`** — minor query fix.

---

## [0.12.0] - 2026-04-17

### Added
- **Hierarchical Academic Term UX** — Admin no longer inputs semester + tahun akademik per course. New parent-child structure: `TahunAkademik` (year, created standalone) → `Semester` (Ganjil/Genap/Akselerasi, added as needed) → `Matkul`.
- **New admin routing** — `/dashboard/admin/matkul` (year list) → `/[tahunId]` (semester slots) → `/[tahunId]/[semesterId]` (scoped matkul table). Breadcrumb navigation between levels.
- **New API routes** — `GET/POST /api/tahun-akademik`, `GET/POST /api/tahun-akademik/[tahunId]/semesters`.
- **Plan doc** — `docs/plan-phase10-academic-term.md`.

### Changed
- **Schema** — Replaced `AcademicTerm` (combined year+semester) with `TahunAkademik` + `Semester` models. `Matkul.termId` → `Matkul.semesterId`. `AcademicDocument.termId` → `AcademicDocument.semesterId`. Unique constraints updated accordingly.
- **`/api/matkul` POST** — Accepts `semesterId` instead of `semester` + `academicYear`.
- **`/api/matkul/[id]/documents`** — Query param `?semester=` → `?semesterId=`.
- **`/api/matkul/[id]/documents/upload`** — FormData field `semester` → `semesterId`.
- **Matkul hub client** — Semester selector now shows real `Semester` records (e.g. "Ganjil 2025/2026") instead of free-text string list.
- **Seed** — Creates `TahunAkademik` first, then `Semester` rows, then links `Matkul` via `semesterId`.

---

## [0.11.1] - 2026-04-17

### Changed
- **Matkul unique constraint** — changed from `code @unique` to composite `@@unique([code, semester, academicYear])`. Same course code can now be reused across different semesters or academic years.
- **Seed data** — all 5 matkuls now include `semester` and `academicYear` values (`Ganjil/Genap` + `2025/2026`). Seed cleans up by code (not ID) to handle any existing rows before re-inserting with fixed IDs.

### Fixed
- `ON CONFLICT` clause in seed updated from `(code)` to `(code, semester, "academicYear")` to match new composite constraint.
- Seed cleanup now deletes all related rows (`AcademicDocument`, `AcademicDocAnnotation`, `MatkulChangeRequest`, `_KoordinatorMatkul`, `_DosenMatkul`, `MatkulClass`, `RPS`, `RpsAnnotation`) before re-seeding Matkul rows.

---

## [0.11.0] - 2026-04-16

### Added
- **Matkul-Centric Academic Document Hub** — Unified route structure `/dashboard/matkul` → `/dashboard/matkul/[matkulId]` for all roles. Replaces siloed per-role RPS pages.
- **8 Document Types** — `AcademicDocument` supports: RPS, Soal UTS, Soal UAS, LPP, Tindak Lanjut LPP, EPP, Tindak Lanjut EPP, Berita Acara Perwalian. All sections independent.
- **`AcademicDocument` + `AcademicDocAnnotation` models** — Generic two-level approval doc with full sig/annotation fields. Unique on `(matkulId, dosenId, semester, type)`. Annotations cascade-delete on re-upload.
- **`DocType` + `DocStatus` Prisma enums**.
- **API routes**: `GET/POST /api/matkul/[id]/documents`, `/documents/upload`, `PATCH /api/documents/[docId]/review`, `GET/POST/DELETE /api/documents/[docId]/annotations`, `/flatten`, `/sign`, `GET /api/matkul/mine`.
- **Matkul List Page** (`/dashboard/matkul`) — Card grid with role badges + semester selector.
- **Matkul Detail Hub** (`/dashboard/matkul/[matkulId]`) — 8 accordion sections; Dosen view (upload/revision/approved states); Reviewer view (all dosens per section + Review button); dual-role tabs.
- **RPS backfill script** (`prisma/migrate-rps.ts`) — Migrates existing RPS rows → `AcademicDocument`. Run: `npx tsx prisma/migrate-rps.ts`.

### Changed
- **Sidebar** — Added "Mata Kuliah" nav item for Dosen/Koordinator/Kaprodi roles. Removed "RPS Saya", "Kelola RPS", "Review RPS". Old RPS pages still accessible via direct URL during transition.
- **`PdfAnnotationViewer`** — Added optional `apiBase` prop for reuse with new doc routes. `rpsId` now optional.

---

## [0.10.1] - 2026-04-16

### Fixed
- **Assign modal — immediate save w/o confirmation**: Unchecking a koordinator now shows "Hapus Koordinator dari Matkul?" confirmation modal before removing (mirrors existing dosen removal flow). "Selesai" button removed — assignment is immediate, button was misleading.
- **Combobox dropdown broken after selection**: After picking a catalog item in "Tambah Matkul", the dropdown now correctly reopens on focus or ChevronDown click. On focus, query resets to empty so the full catalog list appears.
- **Kode/SKS/Nama editable after catalog selection**: Fields are now `readOnly` (gray, non-interactive) once a catalog item is selected. Clearing via re-selection from dropdown restores editability.

### Changed
- **Admin section renamed**: "Kelola Mata Kuliah" → "Penugasan Mata Kuliah" across page title, dashboard card, and sidebar nav — better reflects the section's purpose (assigning courses to dosen for RPS uploads, not managing the catalog itself).

---

## [0.10.0] - 2026-04-16

### Added
- **Inline PDF Annotation System** — Reviewers (Koordinator & Kaprodi) can annotate RPS PDFs directly in the review modal before rejecting. Four annotation tools: Highlight (semi-transparent rect), Draw (freehand polyline), Box (rect outline), Sticky Note (positioned text bubble).
- **`RpsAnnotation` model** — Stores annotations as coordinate rows (x/y/width/height as % of page dims, color, content, pathData for draw). Cascade-deletes with RPS.
- **Annotation persistence** — `GET/POST /api/rps/[id]/annotations`, `DELETE /api/rps/[id]/annotations/[annotId]`. Auth-gated: KOORDINATOR/KAPRODI only for write.
- **PDF flattening on rejection** — `POST /api/rps/[id]/annotations/flatten` burns all annotations into a static PDF using `pdf-lib` (server-side), stores result as `annotatedPdfUrl`. Called automatically before `reject` action.
- **Dosen read-only view** — When status is `REVISION` and `annotatedPdfUrl` exists, Dosen sees an "Lihat Anotasi" button that opens the flattened PDF directly (new tab). No overlay — pixel-perfect, no coordinate drift.
- **Clean re-upload** — On Dosen re-upload all `RpsAnnotation` rows are deleted and `annotatedPdfUrl` cleared, alongside the existing signature reset chain.
- **`PdfAnnotationViewer` component** (`src/components/PdfAnnotationViewer.tsx`) — SSR-disabled; react-pdf + SVG overlay (viewBox 0 0 100 100, preserveAspectRatio none); reviewer mode only.

### Changed
- Koordinator & Kaprodi review modals: replaced `<iframe>` PDF preview with `PdfAnnotationViewer` (interactive annotator).
- `RPS.annotatedPdfUrl` field added to schema, API responses, and type definitions.

---

## [Unreleased] — Matkul-Centric Academic Document Hub (Phase 9)

### Planned
- **`AcademicDocument` model** — generic document record for all 8 document types per (Matkul × Dosen × Semester). Reuses same two-level approval fields as `RPS`. `@@unique([matkulId, dosenId, semester, type])`.
- **`DocType` enum** — `RPS | SOAL_UTS | SOAL_UAS | LPP | LPP_TINDAK_LANJUT | EPP | EPP_TINDAK_LANJUT | BERITA_ACARA`
- **Shared Matkul route** — `/dashboard/matkul` and `/dashboard/matkul/[matkulId]` replace all role-specific `/rps` routes. Single route, server-side role-aware rendering.
- **Matkul list** — shows all Matkuls relevant to the caller: taught (Dosen), coordinated (Koordinator), or program-wide (Kaprodi).
- **Detail hub — Dosen view** — 8 independent document sections; each shows own upload/status/revision panel. All sections uploadable at any time; only `APPROVED` locks re-upload.
- **Detail hub — Reviewer view** (Koordinator/Kaprodi) — same 8 sections, each lists all assigned Dosens with their submission status. Click any row → opens annotation + approve/reject modal for that `AcademicDocument`.
- **Dual-role support** — Koordinator and Kaprodi who are also Dosen for a Matkul see both "Dokumen Saya" and "Review Dosen" tabs in the detail hub.
- **API scope inference** — `GET /api/matkul/[id]/documents?semester=...` returns caller's own docs if Dosen, all Dosens' docs if Koordinator/Kaprodi — no extra query params needed.
- **RPS migration** — backfill existing `RPS` records into `AcademicDocument(type=RPS)`; deprecate standalone `/rps` routes.

---

## [Unreleased] — Email Notifications (Phase 8)

### Planned
- **Email Notification System**: Nodemailer + Microsoft 365 OAuth2 (Client Credentials flow)
  - Sends from institutional UPH mailbox (`noreply@uph.edu`) via `smtp.office365.com:587` (STARTTLS)
  - OAuth2 access token acquired from Azure AD with in-memory cache and auto-refresh
  - Notifications triggered at key RPS workflow events:
    - Koordinator alerted on Dosen submission/re-upload
    - Kaprodi alerted on Koordinator approval
    - Dosen alerted on final approval or rejection (with reviewer notes)
  - Fallback: Resend (if Azure AD registration unavailable)
- **New file**: `src/lib/mailer.ts` — `sendEmail()` helper and token cache
- **New env vars**: `MAIL_TENANT_ID`, `MAIL_CLIENT_ID`, `MAIL_CLIENT_SECRET`, `MAIL_SENDER`

> Implementation blocked on: Azure AD app registration by UPH IT + `SMTP.SendAsApp` permission grant.

---

## [0.9.0] - 2026-04-11

### Added
- **Searchable Combobox for Tambah Matkul**: The "Tambah Matkul" form now includes a live-search combobox backed by a `MATKUL_CATALOG` list (CS101–CS410). Admins can search by code or name; selecting an item auto-fills the Code and Name fields. Fields remain individually editable for overrides.
- **Unified "Assign Roles" Modal**: Replaced the separate `+Koord` and `+Dosen` buttons in the matkul table with a single **Assign Roles** button (`UserCog`). The new modal has two tabs — Koordinator (blue) and Dosen (teal) — each with its own search box, giving admins a single workflow to manage both role assignments per matkul.
- **Deep Cleanup on Dosen Removal (Bug Fix)**:
  - `POST /api/matkul/[id]/assign` action `remove` now runs a `prisma.$transaction` that deletes all `RPS` records for the (matkul, dosen) pair before disconnecting the dosen, preventing orphaned ghost data and future duplication errors on reassignment.
  - Client-side: unchecking a dosen in the Assign Roles modal no longer fires the API immediately. Instead, a dedicated **confirmation modal** (z-60, above the assign modal) appears with a red warning describing the permanent RPS data cleanup. The admin must click "Hapus & Bersihkan Data" to proceed.

### Changed
- Matkul table action column: consolidated four buttons (two rows) into two buttons (Assign Roles + Edit Data/Hapus row) for a cleaner layout.
- Warning banner in matkul page updated to mention that dosen removal also deletes related RPS data.

## [0.8.1] - 2026-04-11

### Bug Fixes
- **Koordinator auto-refresh broken for KOORDINATOR+DOSEN users**: `GET /api/rps` DOSEN branch was firing before the KOORDINATOR branch for users holding both roles, returning a `MatkulRps[]` array instead of the expected `RpsApiResponse`. `KoordinatorRPSClient` silently fell back to stale SSR data on every poll. Fixed by adding `!roles.includes('KOORDINATOR')` guard to the DOSEN branch so mixed-role users always receive the correct `{ submissions, assignments }` shape.
- **Koordinator signature not persisting**: `handleSaveSignature` in `KoordinatorRPSClient` called `setSavedSignature` unconditionally, causing the UI to report success even when the PATCH to `/api/users/me/signature` failed. The saved state was lost on next page load. Fixed by gating `setSavedSignature` on `res.ok`.
- **Global SWR revalidation on focus/reconnect disabled**: All dashboard SWR hooks explicitly set `revalidateOnFocus: false`, overriding any global config. Fixed by creating a `SWRProvider` client wrapper with `revalidateOnFocus: true` and `revalidateOnReconnect: true`, wrapping the dashboard layout children, and removing the per-hook overrides.
- **SignaturePad saved-tab not auto-selected after async load**: `useState` computed `defaultTab` once at mount when `savedSignature` was still `null` (fetch pending). Added a `useEffect` in `SignaturePad` to switch `activeTab` to `'saved'` when the prop transitions from `null` to a non-null value.
- **Optimistic mutate crash** (`TypeError: prev.submissions is undefined`): Koordinator `handleStampAndApprove` mutate callback checked `prev` truthiness but not `prev.submissions`, crashing when SWR cache held a different shape. Fixed with optional-chaining guard: `prev?.submissions ? { ...prev, submissions: ... } : prev`.

## [0.8.0] - 2026-04-11

### Added
- **Multi-Step Document Conversion & Digital Signature Flow**: Full end-to-end PDF signing pipeline across three roles
  - **DOCX → PDF conversion** on upload via Gotenberg (primary, Docker-hosted LibreOffice-powered API), LibreOffice CLI (fallback), and puppeteer/mammoth (last resort)
  - **In-browser PDF viewer** (`PdfSignatureOverlay`) with drag-to-position and resize handle for placing signatures
  - **Signature canvas** (`SignaturePad`) with draw and upload modes; canvas exports transparent PNG
  - **Koordinator signing step**: two-step modal (review → place signature → stamp PDF with pdf-lib)
  - **Kaprodi signing step**: signs the Koordinator-stamped PDF, producing `finalPdfUrl`
  - **POST `/api/rps/[id]/sign`**: stamps PNG signature onto PDF at percentage coordinates using pdf-lib; saves output to `/public/uploads/`
  - **Saved Signature** (profile-level): users can save their signature to their profile (`savedSignature` field on `User`); `SignaturePad` shows a "Tersimpan" tab for one-click reuse
  - **GET/PATCH `/api/users/me/signature`**: read and persist calling user's saved signature
  - `pdf.worker.min.js` served statically to avoid CDN dependency for react-pdf

### Changed
- **`POST /api/rps/upload`**: now attempts DOCX → PDF conversion before saving; on failure keeps DOCX with fallback UI warning; resets all signature fields on re-upload
- **`PdfSignatureOverlay`**: fully responsive — measures container width via `ResizeObserver` and renders PDF at that width instead of fixed 680px
- **Koordinator and Kaprodi modals**: show amber warning (with download link) when file is not a PDF; "Stamp & Setujui" button disabled for non-PDF
- **`SignaturePad`**: transparent canvas (no white fill); new `savedSignature` + `onSaveSignature` props; "Simpan ke Profil" button in draw/upload tabs

### Bug Fixes
- **Download bug (Dosen + Arsip)**: APPROVED download button now serves `finalPdfUrl ?? fileUrl` instead of always the original unsigned file
- **Stale SWR after Koordinator signs**: `handleStampAndApprove` now applies an optimistic SWR update that immediately removes the signed item from the "Needs Review" list without waiting for the next poll
- **Transparent signatures**: canvas `init` and `clearCanvas` use `clearRect` (transparent) instead of `fillRect` white, so stamped signatures have no solid background

### Technical
- **New Prisma fields on `RPS`**: `koordinatorSigUrl`, `koordinatorSigX/Y/Page/Width`, `koordinatorSignedPdfUrl`, `kaprodiSigUrl`, `kaprodiSigX/Y/Page/Width`, `finalPdfUrl`
- **New Prisma field on `User`**: `savedSignature String?` (migration `20260411031301_add_saved_signature`)
- **New components**: `src/components/PdfSignatureOverlay.tsx`, `src/components/SignaturePad.tsx`
- **New API routes**: `src/app/api/rps/[id]/sign/route.ts`, `src/app/api/users/me/signature/route.ts`
- **Dependencies**: `pdf-lib`, `react-pdf`, `pdfjs-dist`, `mammoth`, `puppeteer` added to `serverExternalPackages`
- **`next.config.mjs`**: `serverExternalPackages` updated to include `puppeteer` and `mammoth`
- **`GOTENBERG_URL`** env var (default `http://localhost:3001`) controls Gotenberg service endpoint

## [0.7.0] - 2026-04-10

### Added
- **Account Approval Flow**: New registration workflow requiring admin/master approval before access is granted
  - New `UserStatus` enum (`PENDING`, `ACTIVE`, `REJECTED`) added to schema
  - `status` field added to `User` model (`@default(PENDING)`)
  - Migration `20260410150830_add_user_status` applied
- **Lobby Page** (`/lobby`): Public waiting room shown after registration; displays rejection info when `?status=rejected`
- **Approval API** (`PATCH /api/users/[id]/approve`): Approve or reject PENDING accounts with role assignment
  - Only `ADMIN` or `MASTER` can call this endpoint
  - Only `MASTER` can assign `ADMIN` or `MASTER` roles during approval
- **Approval Dashboards**:
  - `/dashboard/admin/approvals` — Admin can approve with KAPRODI/KOORDINATOR/DOSEN roles or reject
  - `/dashboard/master/approvals` — Master can additionally assign ADMIN role
- **"Persetujuan Akun" nav item** added to Admin and Master sidebars (`UserCheck` icon)

### Changed
- **Signup flow**: New users are saved with `status: PENDING` and `roles: ['DOSEN']`; redirected to `/lobby` instead of login page
- **Login**: Blocks `PENDING` users (shows yellow warning) and `REJECTED` users (shows red error) — no cookies set, no dashboard access
- **`GET /api/users`**: Accepts `?status=pending` query param to return PENDING users (admin/master only); default now returns only `ACTIVE` users
- **All seed accounts**: Set to `status: ACTIVE` so test logins continue to work

### Bug Fixes
- Fixed `server_error` on signup caused by stale `NEXT_REDIRECT` message check; replaced with `isRedirectError()` (Next.js 16 compatibility)

## [0.6.1] - 2026-04-10

### Added
- **SWR Auto-Refresh**: Implemented client-side polling for real-time data updates on all dashboard pages
  - 5-second polling interval for all RPS, logs, and change request pages
  - No manual refresh needed — data updates automatically in the background
- **GET API Endpoints**: New read-only endpoints for SWR polling
  - `GET /api/rps` — Role-scoped RPS data (returns MatkulRps[] for dosen, RpsApiResponse for reviewers)
  - `GET /api/logs` — Master system audit logs (merged RPS + change request logs)
  - `GET /api/change-requests` — Kaprodi change request list
- **Sync Status Indicator**: Floating "Memperbarui..." indicator appears during background polls, error indicator on network failures
- **Shared API Types**: Centralized TypeScript types (`src/lib/api-types.ts`) for type-safe API responses across all endpoints

### Changed
- **Data Fetching Strategy**: Hybrid SSR + SWR approach
  - Server Components continue to provide initial data (fast first paint)
  - Data passed as `fallbackData` to SWR hooks (no loading spinner flash)
  - Client Components poll via GET endpoints every 5 seconds for updates
- **Client Components Updated**:
  - `KaprodiRPSClient`: Now uses SWR polling instead of setState on mutations
  - `KoordinatorRPSClient`: Automatic updates when new submissions arrive
  - `DosenRPSClient`: Added smart data normalization to handle multi-role access
  - `ChangeRequestsClient`: Real-time change request status updates
- **Logs Page**: Split into server component (`page.tsx`) + client component (`LogsClient.tsx`) with SWR polling

### Technical
- **Dependencies**: Added `swr@^2.0.0` for client-side data fetching and caching
- **Multi-Role Data Handling**: GET /api/rps intelligently returns different formats based on user role
  - DOSEN (no reviewer roles) → MatkulRps[] (flat array)
  - KAPRODI (exclusive) → RpsApiResponse (submissions + assignments)
  - KOORDINATOR (with or without DOSEN) → RpsApiResponse or MatkulRps[] depending on context
- **Revalidation**: After mutations (PATCH/POST), `mutate()` triggers immediate SWR revalidation instead of manual state updates
- **Focus Handling**: SWR configured with `revalidateOnFocus: false` to avoid spurious refetches when users switch browser tabs

### Bug Fixes
- Fixed DosenRPSClient crash when KAPRODI/KOORDINATOR accounts access `/dashboard/dosen/rps`
  - Added `normalizeData()` helper to gracefully handle different API response formats
  - When reviewers visit dosen page, endpoint returns empty matkul list (expected behavior)

### Performance
- Eliminated loading states on every page navigation (instant initial paint from SSR)
- Network requests only fire when needed (every 5 seconds on active page)
- Reduced unnecessary refetches with smart caching and fallback data

## [0.6.0] - 2026-04-10

### Added
- **Multi-Level RPS Approval Workflow**: Implemented two-tier approval system (Koordinator → Kaprodi) replacing single-stage Kaprodi review
- **Koordinator Dashboard**: New dedicated page at `/dashboard/koordinator/rps` for first-level RPS verification
  - Visually identical UI to Kaprodi page for consistency
  - Scoped to coordinator's assigned matkuls only
- **Rejection Attribution**: Backend captures which reviewer (Koordinator or Kaprodi) rejected a document and stores their specific notes
- **Simultaneous Visibility**: When Dosen uploads RPS, file appears immediately on both Koordinator and Kaprodi pages
- **Download PDF Feature**: On Dosen page, approved RPS now shows green "Download PDF" button instead of upload button

### Changed
- **RPS Schema**: Added `isKoordinatorApproved` boolean flag to track first-level approval state
- **RPS Approval Logic**: Kaprodi review button now locked until Koordinator approves (`isKoordinatorApproved=true`)
- **Status Badges**: All role dashboards now display context-specific labels (e.g., "Menunggu Koordinator", "Menunggu Kaprodi")
- **Revision Section**: "Menunggu Revisi" tab on both Koordinator and Kaprodi pages now shows labeled rejection source ("Ditolak oleh Koordinator" or "Ditolak oleh Kaprodi")
- **Kaprodi Visibility**: Kaprodi page now shows Koordinator name in a new column for each submission

### Technical
- **New RPS Fields** (Prisma):
  - `isKoordinatorApproved: Boolean` (default: false)
  - `koordinatorId: String?` (Foreign Key to User)
  - `koordinatorNotes: String?` (Koordinator's rejection message)
  - `kaprodiNotes: String?` (Kaprodi's rejection message)
  - `finalPdfUrl: String?` (Reserved for future archive functionality)
- **API Update** (`PATCH /api/rps/[id]/review`):
  - Now accepts `reviewer` parameter ("koordinator" | "kaprodi")
  - Captures reviewer-specific notes and approval state
  - Enforces sequential workflow in backend
- **File Upload Reset**: Re-uploads by Dosen now reset `isKoordinatorApproved` to false and clear notes, returning doc to Koordinator queue
- **Navigation**: Sidebar now shows "Kelola RPS" link for users with KOORDINATOR role

### Removed
- Emoji usage from all UI labels and badges (no emojis in production code)

### UI/UX Consistency
- Koordinator and Kaprodi RPS pages are now fully visually identical
- All buttons, tables, modals, and spacing use same design tokens
- Consistent status badge colors and typography across both pages

## [0.5.0] - 2026-04-06

### Initial Release
- Core dashboard infrastructure (Admin, Kaprodi, Dosen, Master)
- Single-stage RPS approval workflow (Dosen → Kaprodi)
- Matkul assignment and CRUD
- User management (RBAC)
- System logs and monitoring
- UI components library
