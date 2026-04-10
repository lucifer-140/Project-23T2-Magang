# Changelog

All notable changes to this project are documented here.

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
