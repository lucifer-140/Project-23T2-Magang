# Roadmap: Active Semester Auto-Detection

**Status:** Planned (post-v0.18.0)

## Problem

`TahunAkademik` and `Semester` models have `isActive` flags but no mechanism to set them automatically. Admin must manually remember which semester is running, and no page in the system uses this information for filtering or display.

## Design

### Schema Change

Add `startDate` and `endDate` to the `Semester` model:

```prisma
model Semester {
  id               String        @id @default(cuid())
  tahunAkademikId  String
  nama             String        // Ganjil | Genap | Akselerasi
  isActive         Boolean       @default(false)  // manual override — wins over date logic
  startDate        DateTime?     // inclusive start of semester
  endDate          DateTime?     // inclusive end of semester
  tahunAkademik    TahunAkademik @relation(...)
  matkuls          Matkul[]
  @@unique([tahunAkademikId, nama])
}
```

Migration:
```sql
ALTER TABLE "Semester" ADD COLUMN "startDate" TIMESTAMP;
ALTER TABLE "Semester" ADD COLUMN "endDate" TIMESTAMP;
```

### Active Semester Resolution (priority order)

1. `isActive = true` — manual override, always wins
2. `startDate <= now() <= endDate` — auto-detected from date range
3. `null` — no active semester; UI shows warning

### New API

**`GET /api/active-semester`**

```ts
// Returns:
{
  tahunAkademik: { id: string; tahun: string };
  semester: { id: string; nama: string; startDate: string; endDate: string };
  source: 'manual' | 'auto'; // how it was determined
} | null
```

Logic:
1. Find first `Semester` where `isActive = true` → source: `'manual'`
2. Else find first `Semester` where `startDate <= now AND endDate >= now` → source: `'auto'`
3. Else return `null`

**`PATCH /api/tahun-akademik/[tahunId]/semesters/[semesterId]`** (new route)

```ts
// Body: { isActive?: boolean; startDate?: string; endDate?: string }
// - Setting isActive=true deactivates all other semesters (across all tahun)
// - Also sets parent TahunAkademik.isActive = true
// - Validate: startDate must be before endDate
// - Warn (not error) if date range overlaps existing semester
```

### UI Changes

**`TahunDetailClient.tsx`** — semester cards:
- Add date range inputs (startDate / endDate) visible on create + edit
- Show date range on card: "1 Sep 2025 – 31 Jan 2026"
- Auto-active badge: green "Aktif (otomatis)" when today in range
- Manual override badge: blue "Aktif (manual)" when isActive=true
- "Jadikan Aktif Manual" button — sets isActive=true, warns if another is already active
- "Hapus Override" button — sets isActive=false (falls back to date logic)

**`/dashboard/admin/page.tsx`** — admin dashboard:
- Fetch `/api/active-semester` server-side alongside existing queries
- Show info card: "Semester Aktif: Ganjil 2025/2026 · 1 Sep – 31 Jan"
- If source='auto': show "Terdeteksi otomatis" label
- If source='manual': show "Diatur manual" label
- If null: amber warning banner "Belum ada semester aktif — atur tanggal semester di Penugasan Matkul"

### Behavior Rules

- Only one semester should be active at a time (enforced in PATCH via transaction)
- Setting a semester active → parent `TahunAkademik.isActive` also set true
- Date overlap validation: warn admin if two semesters have overlapping date ranges (don't block save)
- `isActive=true` always overrides date logic — useful for edge cases (semester extended, delayed start)

## Files to Create/Modify

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `startDate`, `endDate` to `Semester` |
| `prisma/migrations/` | New migration for two new columns |
| `src/app/api/active-semester/route.ts` | New GET route |
| `src/app/api/tahun-akademik/[tahunId]/semesters/route.ts` | Accept `startDate`/`endDate` in POST |
| `src/app/api/tahun-akademik/[tahunId]/semesters/[semesterId]/route.ts` | New PATCH for manual override + date edits |
| `src/app/dashboard/admin/matkul/[tahunId]/TahunDetailClient.tsx` | Date picker UI + auto/manual badges |
| `src/app/dashboard/admin/page.tsx` | Active semester status card |

## Future Extensions (after this lands)

- **Dosen dashboard banner** — show "Semester Ganjil 2025/2026 · Aktif" at top of dosen home
- **Document matrix** — scope the per-matkul document progress grid to active semester only
- **Auto-filter** — matkul list defaults to active semester's filter on first load
