# Plan: PWA + Mobile-Friendly Implementation

## Overview

Convert existing Next.js dashboard into installable PWA with fully responsive mobile UI.

Target: works on Android/iOS Chrome, installable from browser, offline shell.

---

## Phase 1 — PWA Foundation

**Estimated effort:** 1–2 days

### Tasks

1. Install `next-pwa` package
2. Create `public/manifest.json`
   - `name`, `short_name`, `display: standalone`
   - `theme_color: #1a2a4a` (uph-blue)
   - `background_color: #f7f9fc` (uph-grayBg)
   - Icon entries: 192×192, 512×512
3. Generate PWA icon set from `public/Gambar/Logo UPH.png`
4. Configure `next-pwa` in `next.config.mjs` — cache static assets + offline shell
5. Add meta tags to `src/app/layout.tsx`:
   - `<meta name="theme-color" content="#1a2a4a">`
   - `<link rel="manifest" href="/manifest.json">`
   - `<link rel="apple-touch-icon" href="/icons/icon-192.png">`
   - Viewport meta already present — verify `width=device-width, initial-scale=1`

### Done When

- Chrome DevTools Lighthouse PWA audit passes
- "Add to Home Screen" prompt appears on Android Chrome
- App opens standalone (no browser chrome) after install

---

## Phase 2 — Mobile-Responsive UI

**Estimated effort:** 3–5 days

### 2a. Sidebar Navigation

Current: always-visible fixed sidebar, desktop-only.

Fix:
- Below `md` breakpoint: hide sidebar, show hamburger button in top bar
- Slide-out drawer overlay on hamburger tap
- Drawer closes on route change or backdrop tap
- Component: extend `src/components/SidebarNav.tsx` + add drawer state in `src/app/dashboard/layout.tsx`

### 2b. DataTable Component

File: `src/components/ui-templates/DataTable.tsx`

Fix:
- On mobile (`< md`): render rows as cards instead of table rows
- Hide low-priority columns, keep name/status/action visible
- Or: horizontal scroll container with `min-w-max` table (simpler, less ideal)

### 2c. Modals

File: `src/components/ui-templates/Modal.tsx`

Fix:
- `w-full max-w-sm mx-4` on mobile
- Bottom-sheet style optional (slide up from bottom) for better thumb reach

### 2d. Forms

All dashboard forms (matkul, user, RPS upload):
- Stack fields vertically (already likely, verify)
- Input `font-size: 16px` minimum — prevents iOS auto-zoom on focus
- Tap targets min 44×44px (buttons, selects)

### 2e. General Layout

- Replace fixed px widths with `max-w-*` + `w-full`
- Add `px-4` mobile padding on all page containers
- Tables: `overflow-x-auto` wrapper as fallback

---

## Phase 3 — Mobile UX Polish

**Estimated effort:** 1 day

- Verify `SignaturePad.tsx` has `touch-action: none` on canvas (prevents scroll conflict)
- SWR already handles refetch — add pull-to-refresh if needed
- Test on real device: Android Chrome + iOS Safari
- Fix any tap/hover state issues (`:hover` vs `:active` for touch)

---

## Phase 4 — PDF Viewer Mobile Adaptation

**Estimated effort:** 1–2 days (complex)

File: `src/components/PdfAnnotationViewer.tsx`

This is the hardest component to mobilize.

### Options (pick one)

**Option A — View-only on mobile (recommended)**
- Detect mobile via `window.innerWidth < 768` or user-agent
- Hide annotation toolbar on mobile
- Show read-only PDF with pinch-zoom enabled
- Reviewers must use desktop to annotate

**Option B — Mobile annotation support**
- Redesign toolbar as floating bottom bar
- Touch draw support (already works via SVG touch events)
- Significant effort, lower priority

**Recommendation:** Ship Option A first.

---

## Complexity Hotspots

| Area | Risk | Mitigation |
|------|------|------------|
| PDF Annotation Viewer | High | View-only on mobile (Option A) |
| Signature Pad | Medium | Verify `touch-action: none` |
| DataTable | Medium | Card layout or scroll fallback |
| Sidebar drawer | Low | Standard pattern, well-documented |

---

## Implementation Order

```
1. Phase 1: next-pwa + manifest (quick win)
2. Phase 2a: Sidebar mobile drawer
3. Phase 2b: DataTable responsive
4. Phase 2c–d: Modals + forms
5. Phase 3: Polish + device testing
6. Phase 4: PDF viewer mobile (Option A)
```

---

## Dependencies

- `next-pwa` — npm package
- PWA icons — generate from existing UPH logo (use sharp or squoosh)
- No new UI libraries needed

---

## Notes

- File uploads (`/public/uploads/`) must move to object storage (R2/Supabase) before prod — local filesystem doesn't survive server restarts on most hosting platforms
- Plain-text passwords must be hashed (`bcrypt`) before any real users touch this
- PWA install prompt only appears on HTTPS — local dev won't trigger it (expected)
