# Changelog

All notable changes to this project are documented here.

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
