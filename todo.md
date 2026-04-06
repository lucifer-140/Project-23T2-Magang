# Refactoring & Dashboard Enhancement Plan

## Phase 1: Admin Page - Kelola Matkul (Manage Subjects)
- [x] **Refactor SKS Input**: Changed `<select>` to `<input type="number" />` in the Add and Edit/Change Request modals.
- [x] **Auto-Assign on checkbox**: "Selesai" button removed. Checkbox `onChange` instantly calls API + updates state.
- [x] **Fix Double-Click Bug**: Both `assigningMatkul` state AND `matkuls` state are updated simultaneously in `handleAssignDosen` - no desync possible.
- [x] **Fix Key Prop Error**: All `.map()` over dosens arrays use `key={d.id}` (unique DB ID), never index or duplicated UUID.

## Phase 2: Admin Page - Kelola Pengguna (Manage Users)
- [x] **RBAC Protection**: "Ubah Role" button is hidden and replaced with a 🔒 "Terlindungi" badge for MASTER-role users. MASTER role is also disabled in the role picker within the Edit modal.
- [x] **Declutter Table**: "Matkul Diampu" column fully removed.
- [x] **UI/UX Overhaul**: Single flat table replaced with:
  - Role filter tabs with per-role counts
  - Full-text search bar (name, username, role)
  - Paginated DataTable (10 per page) with page number buttons
  - User avatar initials for visual scanning

## Phase 3: Master Page
- [x] **API – POST /api/users**: Create new users with validation & duplicate username check.
- [x] **API – PATCH /api/users/[id]**: Edit name/username/password fields.
- [x] **API – DELETE /api/users/[id]**: Safe delete - blocks MASTER deletion, disconnects M2M before removing row.
- [x] **Master Users page**: Full CRUD with Add/Edit/Delete modals, role tabs, search, pagination, delete confirmation modal + success toast.
- [x] **Application Logs page**: Terminal-style dark log viewer showing merged RPS + change-request audit trail with timestamp, level badge (INFO/WARN/DEBUG), message, actor, and action columns.
- [x] **Sidebar nav**: Added "Kelola Pengguna" link for MASTER role (`/dashboard/master/users`).

## Phase 4: Global Deliverables
- [x] `todo.md` tracking checklist.
- [x] `src/components/ui-templates/DataTable.tsx`
- [x] `src/components/ui-templates/Modal.tsx`
- [x] `src/components/ui-templates/NumberInput.tsx`
- [x] `src/components/ui-templates/StatusBadge.tsx`
