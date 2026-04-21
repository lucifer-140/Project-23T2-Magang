# Changelog

All notable changes to this project are documented here.

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

## [0.5.0] - 2026-02-15

### Initial Release
- Core dashboard infrastructure (Admin, Kaprodi, Dosen, Master)
- Single-stage RPS approval workflow (Dosen → Kaprodi)
- Matkul assignment and CRUD
- User management (RBAC)
- System logs and monitoring
- UI components library
