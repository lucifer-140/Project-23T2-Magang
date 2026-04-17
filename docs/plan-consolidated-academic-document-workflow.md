# Consolidated Plan: Academic Document Workflow Phases 9-11

**Status:** In Progress → Final Cleanup  
**Target Version:** 0.12.0+  
**Last Updated:** 2026-04-17

---

## Overview

Phases 9, 10, and 11 consolidate a new academic document workflow:
- **Phase 9:** Multi-document hub (8 document types via `AcademicDocument`)
- **Phase 10:** Hierarchical term structure (`TahunAkademik` + `Semester`)
- **Phase 11:** Dashboard alignment to new models

**Current Status:** Core implementation complete. Dashboard integration done. Remaining work: validation, cleanup, and edge cases.

---

## Phase 9: Matkul-Centric Academic Document Hub

**Status:** ✅ COMPLETE

### What's Done
- [x] `AcademicDocument` model created (8 doc types via `DocType` enum)
- [x] `AcademicDocAnnotation` model for reviewer annotations
- [x] API routes:
  - [x] `/api/documents/[docId]/review` — Koordinator/Kaprodi approval workflow
  - [x] `/api/documents/[docId]/annotations` — GET/POST/DELETE annotations + flatten
  - [x] `/api/documents/[docId]/sign` — Signature placement
  - [x] `/api/matkul/[id]/documents/upload` — Upload + re-upload logic
  - [x] `/api/matkul/[id]/documents` — Fetch scoped by role
- [x] UI routes:
  - [x] `/dashboard/matkul` — Unified Matkul list (all roles)
  - [x] `/dashboard/matkul/[matkulId]` — Hub with dual-role tabs
  - [x] Dosen view: 8 accordion sections per doc type
  - [x] Reviewer view: role-scoped review queue per doc type
- [x] Sidebar updated: removed `/rps` links, added "Mata Kuliah"
- [x] Old RPS pages deleted: `/dashboard/dosen/rps`, `/dashboard/kaprodi/rps`, `/dashboard/koordinator/rps`, `/dashboard/admin/rps`

### Validation Checklist
- [ ] Test Dosen upload → re-upload → revision flow
- [ ] Test Koordinator review queue and annotation flattening
- [ ] Test Kaprodi second-level review
- [ ] Test dual-role tab switching
- [ ] Verify PDF annotation overlay positioning is correct
- [ ] Verify semester selector persistence in URL params

---

## Phase 10: Hierarchical Academic Term UX

**Status:** ✅ COMPLETE (with structural variant)

### What's Done
- [x] Term structure implemented via:
  - [x] `TahunAkademik` model (academic years)
  - [x] `Semester` model (per-year terms: Ganjil, Genap, Akselerasi)
  - [x] `Matkul.semesterId` FK to Semester (replaces old `semester` + `academicYear` strings)
  - [x] `AcademicDocument.semesterId` FK to Semester
- [x] API routes:
  - [x] `/api/tahun-akademik` — List + create academic years
  - [x] `/api/tahun-akademik/[tahunId]/semesters` — List + create semesters
- [x] Matkul creation updated: `termId` param instead of semester/year inputs
- [x] Admin Matkul page scoped to term:
  - [x] `/dashboard/admin/matkul` — Groups by TahunAkademik + Semester badges
  - [x] `/dashboard/admin/matkul/[semesterId]` — Matkul table scoped to semester
- [x] Seed data: Ganjil + Genap 2025/2026 terms pre-created

### Design Note
Instead of `AcademicTerm` (single composite model), implementation uses hierarchical `TahunAkademik → Semester` structure. This allows flexible semester management and better admin UX.

### Validation Checklist
- [ ] Admin can create new TahunAkademik
- [ ] Admin can create new Semester under TahunAkademik
- [ ] Matkul list filters correctly by semester
- [ ] Semester selector in Matkul hub pages loads all active semesters
- [ ] Backfill: verify all existing Matkul/AcademicDocument rows have semesterId

---

## Phase 11: Role Dashboard Alignment

**Status:** ✅ COMPLETE

### What's Done

**Dosen Dashboard**
- [x] Replaced `prisma.rPS` queries with `prisma.academicDocument`
- [x] Stats: Total Matkul, Submitted, Revision, Approved
- [x] Koordinator section: shows assigned matkuls with document submission count
- [x] Kaprodi section: shows pending review count + link to review hub

**Kaprodi Dashboard**
- [x] Replaced all RPS-related queries with AcademicDocument queries
- [x] Stats: Documents needing review, pending change requests, approved docs
- [x] Quick-action card: link to `/dashboard/matkul` for document review
- [x] Updated labels: "RPS" → "Dokumen"

**Koordinator Dashboard**
- [x] Real implementation (was placeholder)
- [x] Fetches assigned matkuls + computes stats from academicDocs
- [x] Stats: Assigned matkuls, involved dosens, pending reviews, approved count
- [x] Quick-action card: link to `/dashboard/matkul`
- [x] Shows revision count (documents sent back for revision)

**Sidebar & Navigation**
- [x] Active state styling on `/dashboard/matkul/**` routes
- [x] Removed dead `/rps` route links
- [x] New `SidebarNav.tsx` component (if created)

### Validation Checklist
- [ ] Dosen dashboard loads stats correctly
- [ ] Kaprodi dashboard shows accurate review counts
- [ ] Koordinator dashboard reflects all assigned matkuls
- [ ] All dashboard cards update in real-time (no stale cache)
- [ ] Sidebar active state highlights correct link

---

## Remaining Work

### Critical Path
1. **Data Migration** (if upgrading from Phase 8)
   - [ ] Backfill `AcademicDocument` from existing `RPS` data (already in seed, verify for prod data)
   - [ ] Backfill `semesterId` on all Matkul/AcademicDocument rows
   - [ ] Verify no orphaned RPS records remain

2. **Edge Case Testing**
   - [ ] Multi-role user (Dosen + Koordinator + Kaprodi): verify tab logic on all pages
   - [ ] Document re-upload while in REVISION state: confirm annotations clear
   - [ ] Signature placement across multiple doc types
   - [ ] Semester deactivation: prevent upload to inactive term?

3. **UI Polish**
   - [ ] Matkul hub: add semester name to tab headers ("Dokumen Saya — Ganjil 2025/2026")
   - [ ] Document section headers: show file size + upload date
   - [ ] Bulk actions: select multiple documents for batch operations? (future)

4. **Performance**
   - [ ] Verify query N+1 on dashboard loads (especially Koordinator with many matkuls)
   - [ ] Cache semester list on Matkul hub pages
   - [ ] Optimize annotation SVG overlay on large PDFs

### Optional Enhancements
- **Semester Lifecycle:** Deactivate old terms → prevent new uploads but keep viewing
- **Document Export:** Bulk download all approved documents for a semester
- **Deadline Tracking:** Per-semester document deadlines
- **Role-specific Access:** Lock Koordinator view if not assigned to matkul

---

## Implementation Order (Remaining Tasks)

```
Data Migration        ← high priority, dependency for all dashboards
Edge Case Testing     ← medium priority, ship quality
UI Polish             ← low priority, cosmetic
Performance Review    ← medium priority if many users
```

---

## File Manifest (Complete)

### Models
- `prisma/schema.prisma` — AcademicDocument, AcademicDocAnnotation, TahunAkademik, Semester

### API Routes
- `/api/documents/[docId]/review`
- `/api/documents/[docId]/annotations`
- `/api/documents/[docId]/sign`
- `/api/matkul/[id]/documents`
- `/api/matkul/[id]/documents/upload`
- `/api/tahun-akademik`
- `/api/tahun-akademik/[tahunId]/semesters`

### UI Pages
- `/dashboard/matkul` (list + term selection)
- `/dashboard/matkul/[matkulId]` (hub with tabs)
- `/dashboard/dosen/page.tsx` (updated)
- `/dashboard/kaprodi/page.tsx` (updated)
- `/dashboard/koordinator/page.tsx` (updated)
- `/dashboard/admin/matkul` (term-scoped index)
- `/dashboard/admin/matkul/[semesterId]` (matkul table)

### Components
- `PdfAnnotationViewer` — reused for all AcademicDocument types
- `SignaturePad` — reused for signature placement
- `MatkulListClient` — unified hub UI
- `SidebarNav` — navigation with active state

---

## Risk Summary

| Risk | Mitigation |
|------|-----------|
| Orphaned RPS data | Backfill script; verify counts before/after |
| N+1 queries on dashboard | Use `include` strategically; test with 100+ matkuls |
| Annotation positioning variance | Test across browsers; use PDF.js coordinate mapping |
| Semester deactivation breaks active workflows | Document deactivation rules; add UI warnings |

---

## Done Checklist (Phase 9-11 Core)

- [x] Schema: AcademicDocument + AcademicDocAnnotation
- [x] Schema: TahunAkademik + Semester hierarchy
- [x] API routes: documents + review + annotations
- [x] API routes: terms/semesters
- [x] Matkul hub: list, detail, tabs
- [x] Dosen dashboard: updated stats
- [x] Kaprodi dashboard: updated stats
- [x] Koordinator dashboard: real implementation
- [x] Sidebar: updated links
- [x] Old RPS routes: deleted

---

## Next Steps

1. **Run validation checklist** above (test each feature)
2. **Data migration audit** (if upgrading from Phase 8)
3. **Merge this consolidated plan** — delete old phase-9, 10, 11 docs
4. **Prepare release notes** for 0.12.0 (if shipping)
