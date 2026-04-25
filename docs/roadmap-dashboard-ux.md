# Roadmap: Dashboard UX — Deferred Features

**Status:** Planned — blocked on Active Semester implementation (`docs/roadmap-active-semester.md`)

These items were deferred from the v0.17.0 dashboard UX overhaul. All depend on knowing which semester is currently active.

---

## Dosen Dashboard — Deferred Items

### A. Active Semester Banner

```
Selamat Datang, Budi                          [semester pill]
Pantau status akademik dan tugas Anda.   Ganjil 2025/2026 · Aktif
```

- Pull `activeSemester` from `GET /api/active-semester`
- If no active semester → amber warning: "Belum ada semester aktif — hubungi Admin"
- Semester scopes the document matrix below

**Blocked by:** Semester date-range auto-detection (see roadmap-active-semester.md)

### B. Document Progress Matrix

```
Mata Kuliah          RPS    Soal UTS  Soal UAS   LPP    EPP
─────────────────────────────────────────────────────────────
Algoritma & P.       ✓       ○         ○          ✎      ○
Basis Data           ✎       ✓         ○          ○      ○
```

- Requires active semester context to scope documents (avoids showing old-semester docs)
- Query: `AcademicDocument` filtered by `semesterId` of active semester

**Blocked by:** Active semester resolution

---

## Implementation Order (when unblocked)

1. Implement active semester (see roadmap-active-semester.md)
2. Add semester banner to dosen dashboard home
3. Add document progress matrix below banner
4. Wire matkul list to default-filter to active semester on first load
