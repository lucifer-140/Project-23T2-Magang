# Dashboard UX Upgrade Plan — Dosen & Admin

> **Note on Active Semester:** The `Semester` and `TahunAkademik` models exist in the schema with `isActive` flags, but there is no management UI yet (planned in `plan-master-pages.md` → Semester Manager). Until that feature is built, all semester-scoped features are deferred. Affected items are marked **[FUTURE]** below.

---

## `/dashboard/dosen` — Upgrade Plan

### Problems with current design
1. No semester context — user doesn't know which semester is active
2. 5 stat cards are counts only — no sense of progress or completion
3. Revision list has no direct link to the matkul page
4. Koordinator section shows 5 stat cards + 1 nav link — doesn't show *what* needs reviewing
5. No at-a-glance view of which matkul × doc type is missing/pending

---

### Proposed Layout (top to bottom)

#### A. Active Semester Banner **[FUTURE — needs Semester Manager first]**
```
Selamat Datang, Budi                          [semester pill]
Pantau status akademik dan tugas Anda.   Ganjil 2025/2026 · Aktif
```
- Pull `activeSemester` from DB (join TahunAkademik)
- If no active semester → amber warning: "Belum ada semester aktif — hubungi Admin"
- Semester scopes the document matrix below
- **Do not implement until Semester Manager page is built and seeded data confirmed.**

#### B. Stat Strip (replace 5 cards) ✅ Implement now
Keep same 5 cards but:
- Make "Perlu Revisi" card **clickable** → scrolls to revision section below (anchor `#revisi`)
- Add thin progress bar under card count: `approved / (approved + inProgress + revision + unsubmitted)` as % fill
- Cards stay as `<div>` except Revisi which becomes an `<a href="#revisi">`

#### C. Document Progress Matrix **[FUTURE — needs active semester context]**
```
Mata Kuliah          RPS    Soal UTS  Soal UAS   LPP    EPP
─────────────────────────────────────────────────────────────
Algoritma & P.       ✓       ○         ○          ✎      ○
Basis Data           ✎       ✓         ○          ○      ○
```
- Requires knowing which semester to scope docs to
- Without active semester, showing "all" docs is misleading (old docs from past semesters appear)
- **Do not implement until Semester Manager is done.**

#### D. Revision Detail List ✅ Implement now
- Each row becomes a `<Link href="/dashboard/matkul/[matkulId]">`
- Add which reviewer sent it back (Koordinator / PRODI / Kaprodi) as secondary text
- Show truncated rejection note (1 line, max 80 chars) under the matkul name

#### E. Koordinator Pending Review List ✅ Implement now
Replace 5 stat cards + 1 nav link with:

**Compact 3-stat row:**
```
[Matkul: 3]   [Perlu Review: 5]   [Disetujui: 12]
```

**Pending Review List (NEW):**
```
Algoritma & Pemrog. — Budi Santoso    RPS          [Review →]
Basis Data — Citra Dewi               Soal UTS     [Review →]
Pemrog. Web — Ahmad Fauzi             LPP          [Review →]
```
- Query: academicDocuments where `matkul.koordinators.some(id)` AND `status: SUBMITTED`
- Show max 5, "Lihat semua (N)" link to `/dashboard/matkul`
- Each row links to `/dashboard/matkul/[matkulId]`

---

### Implementation scope (current)
- ✅ B: Stat cards polish (progress bar + revision anchor)
- ✅ D: Revision list with links + reviewer attribution
- ✅ E: Koordinator pending review list
- 🔜 A: Active semester banner (after Semester Manager)
- 🔜 C: Document progress matrix (after Semester Manager)

---

## `/dashboard/admin` — Upgrade Plan

### Problems with current design
1. Only 3 stat cards — misses pending user approvals (most urgent admin task)
2. "Permintaan Pending" count is change requests only — user approvals not shown
3. No matkul coverage info (which matkuls lack koordinator/dosen)
4. 2 nav link cards feel empty — no data shown
5. No recent activity feed

---

### Proposed Layout (top to bottom)

#### A. Alert Banners (conditional, NEW) ✅ Implement now
Show above stat cards only when non-zero:
```
⚠ 3 akun menunggu persetujuan                        [Tinjau Sekarang →]
⚠ 2 permintaan perubahan matkul belum diproses        [Tinjau →]
```
- Amber background, full-width
- Each links to the relevant page

#### B. Stat Grid expand 3 → 6 ✅ Implement now
```
[Total Matkul]        [Pengguna Aktif]        [Change Req. Pending]
[Matkul Tanpa Koor]   [Matkul Tanpa Dosen]    [Persetujuan Pending]
```
- Row 2 (NEW):
  - "Matkul Tanpa Koordinator": `matkul.count({ where: { koordinators: { none: {} } } })`
  - "Matkul Tanpa Dosen": `matkul.count({ where: { dosens: { none: {} } } })`
  - "Persetujuan Pending": `user.count({ where: { status: 'PENDING' } })`
- Red border when > 0 for coverage gaps and pending approvals

#### C. Matkul Coverage Table ✅ Implement now
```
Mata Kuliah          Koordinator          Dosen    Status
─────────────────────────────────────────────────────────
Algoritma & P.       —                    2        ⚠ Tanpa Koordinator
Basis Data           Dr. Sari             —        ⚠ Tanpa Dosen
Pemrog. Web          Dr. Sari             3        ✓ Lengkap
```
- Incomplete matkuls first, complete below
- Max 8 rows; "Lihat semua" → `/dashboard/admin/matkul`
- "Assign →" link per row → `/dashboard/admin/matkul` (filter by that matkul)

#### D. Quick Nav Cards improve 2 → 3 ✅ Implement now
Add "Persetujuan Akun" as third card; add live counts as badge on each card.

#### E. Recent Activity Feed ✅ Implement now
```
Recent Activity
────────────────────────────────────────
Rifki Maulana    mendaftar sebagai Dosen        2j lalu
Dr. Ahmad        mengajukan perubahan MK-202    1h lalu
```
- Last 5 new users + last 5 change requests, merged + sorted by timestamp
- Relative timestamps ("2j lalu", "kemarin")

---

### Implementation scope (current — all items)
- ✅ A: Alert banners
- ✅ B: Expanded stat grid
- ✅ C: Matkul coverage table
- ✅ D: 3 nav cards with counts
- ✅ E: Recent activity feed

No active semester dependency in admin page — full implementation now.
