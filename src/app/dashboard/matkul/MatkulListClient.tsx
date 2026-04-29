"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, X, BookOpen, Upload, ClipboardCheck, GraduationCap, ChevronRight,
  Filter, LayoutGrid, List, Users, Calendar, Hash, AlertCircle, Clock,
  ChevronUp, ChevronDown,
} from 'lucide-react';
import useSWR from 'swr';
import { SyncIndicator } from '@/components/SyncIndicator';

interface DocCounts {
  SUBMITTED: number;
  APPROVED: number;
  REVISION: number;
  PENGECEKAN: number;
  UNSUBMITTED: number;
  total: number;
}

interface Matkul {
  id: string;       // katalogId or matkulId (for navigation)
  matkulId?: string; // unique per instance (React key)
  code: string;
  name: string;
  sks: number;
  userRoles: string[];
  dosens: { id: string; name: string }[];
  koordinators: { id: string; name: string }[];
  classes: { id: string; name: string }[];
  semester: { id: string; nama: string; isActive: boolean; tahunAkademik: { tahun: string } } | null;
  docCounts?: DocCounts;
}

interface Props {
  initialMatkuls: (Matkul & { docCounts: DocCounts })[];
  initialFilter?: string;
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

const ROLE_CONFIG: Record<string, { label: string; badgeCls: string; Icon: React.ElementType }> = {
  dosen:       { label: 'Dosen',       badgeCls: 'bg-blue-50 text-blue-700 border border-blue-200',     Icon: Upload        },
  koordinator: { label: 'Koordinator', badgeCls: 'bg-amber-50 text-amber-700 border border-amber-200',  Icon: ClipboardCheck },
  kaprodi:     { label: 'Kaprodi',     badgeCls: 'bg-purple-50 text-purple-700 border border-purple-200', Icon: GraduationCap },
  prodi:       { label: 'PRODI',       badgeCls: 'bg-teal-50 text-teal-700 border border-teal-200',     Icon: ClipboardCheck },
};

const DOC_STATUS_OPTIONS = [
  { value: 'pending',  label: 'Menunggu Review', icon: <Clock size={11} />,        cls: 'text-yellow-700' },
  { value: 'revision', label: 'Perlu Revisi',    icon: <AlertCircle size={11} />,  cls: 'text-red-600'    },
  { value: 'complete', label: 'Semua Selesai',   icon: null,                       cls: 'text-green-700'  },
] as const;

const SEMESTER_TYPES = ['Ganjil', 'Genap', 'Akselerasi'] as const;

const EMPTY_COUNTS: DocCounts = { SUBMITTED: 0, APPROVED: 0, REVISION: 0, PENGECEKAN: 0, UNSUBMITTED: 0, total: 0 };

function RoleBadge({ role }: { role: string }) {
  const cfg = ROLE_CONFIG[role];
  if (!cfg) return null;
  const { Icon, label, badgeCls } = cfg;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${badgeCls}`}>
      <Icon size={10} />{label}
    </span>
  );
}

function completionStatus(counts: DocCounts): { label: string; cls: string; dot: string } {
  if (counts.total === 0) return { label: 'Belum Ada Data', cls: 'text-gray-400 bg-gray-50 border-gray-200', dot: 'bg-gray-300' };
  if (counts.APPROVED === counts.total) return { label: 'Semua Selesai', cls: 'text-green-700 bg-green-50 border-green-200', dot: 'bg-green-500' };
  if (counts.REVISION > 0) return { label: 'Ada Revisi', cls: 'text-red-600 bg-red-50 border-red-200', dot: 'bg-red-500' };
  if (counts.UNSUBMITTED > 0) return { label: 'Belum Lengkap', cls: 'text-gray-500 bg-gray-50 border-gray-200', dot: 'bg-gray-400' };
  return { label: 'Dalam Review', cls: 'text-amber-700 bg-amber-50 border-amber-200', dot: 'bg-amber-400' };
}

function DocStatusBar({ counts }: { counts: DocCounts }) {
  if (counts.total === 0) return <span className="text-xs text-gray-300">—</span>;
  const pct = (n: number) => `${Math.round((n / counts.total) * 100)}%`;
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-100 w-16 shrink-0">
        {counts.APPROVED    > 0 && <div style={{ width: pct(counts.APPROVED) }}    className="bg-green-400" />}
        {counts.PENGECEKAN  > 0 && <div style={{ width: pct(counts.PENGECEKAN) }}  className="bg-blue-400"  />}
        {counts.SUBMITTED   > 0 && <div style={{ width: pct(counts.SUBMITTED) }}   className="bg-yellow-400"/>}
        {counts.REVISION    > 0 && <div style={{ width: pct(counts.REVISION) }}    className="bg-red-400"   />}
      </div>
      <span className="text-xs text-gray-500 whitespace-nowrap">{counts.APPROVED}/{counts.total}</span>
      {counts.REVISION > 0 && <span className="text-xs font-semibold text-red-500">{counts.REVISION} revisi</span>}
      {counts.SUBMITTED > 0 && counts.REVISION === 0 && <span className="text-xs font-semibold text-yellow-600">{counts.SUBMITTED} pending</span>}
    </div>
  );
}

function MatkulCard({ m, onClick }: { m: Matkul & { docCounts: DocCounts }; onClick: () => void }) {
  const semLabel = m.semester ? `${m.semester.nama} ${m.semester.tahunAkademik.tahun}` : null;
  const cs = completionStatus(m.docCounts);
  return (
    <div
      onClick={onClick}
      className="bg-white border border-uph-border rounded-xl p-4 cursor-pointer hover:border-uph-blue hover:shadow-md transition-all group flex flex-col gap-3 overflow-hidden relative"
    >
      {/* completion accent stripe */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${cs.dot}`} />
      {/* Header — same atoms as table */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold text-gray-500">{m.code}</span>
            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{m.sks} SKS</span>
          </div>
          <p className="font-semibold text-gray-800 text-sm group-hover:text-uph-blue transition-colors leading-tight">{m.name}</p>
        </div>
        <ChevronRight size={14} className="text-gray-300 group-hover:text-uph-blue transition-colors shrink-0 mt-0.5" />
      </div>

      {/* Meta */}
      <div className="space-y-1.5 text-xs text-gray-500">
        {semLabel && (
          <div className="flex items-center gap-1.5">
            <Calendar size={11} className="text-gray-300 shrink-0" />
            <span>{semLabel}</span>
          </div>
        )}
        {m.dosens.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Users size={11} className="text-gray-300 shrink-0" />
            <span className="truncate">{m.dosens.map(d => d.name).join(', ')}</span>
          </div>
        )}
        {m.koordinators.length > 0 && (
          <div className="flex items-center gap-1.5">
            <GraduationCap size={11} className="text-gray-300 shrink-0" />
            <span className="truncate">{m.koordinators.map(k => k.name).join(', ')}</span>
          </div>
        )}
        {m.classes.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Hash size={11} className="text-gray-300 shrink-0" />
            <div className="flex flex-wrap gap-1">
              {m.classes.map(c => (
                <span key={c.id} className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">{c.name}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <DocStatusBar counts={m.docCounts} />
          <div className="flex flex-wrap gap-1 justify-end">
            {m.userRoles.map(r => <RoleBadge key={r} role={r} />)}
          </div>
        </div>
        <span className={`self-start inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${cs.cls}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cs.dot}`} />
          {cs.label}
        </span>
      </div>
    </div>
  );
}

function SemesterGroupHeader({ label, count, pendingCount, revisionCount }: { label: string; count: number; pendingCount: number; revisionCount: number }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="flex items-center gap-2">
        <Calendar size={14} className="text-uph-blue" />
        <h3 className="font-bold text-gray-700 text-sm">{label}</h3>
        <span className="text-xs text-gray-400 font-semibold">{count} matkul</span>
      </div>
      <div className="flex-1 h-px bg-gray-100" />
      <div className="flex gap-2 shrink-0">
        {pendingCount > 0 && (
          <span className="text-xs font-semibold text-yellow-700 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-full">
            {pendingCount} pending
          </span>
        )}
        {revisionCount > 0 && (
          <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
            {revisionCount} revisi
          </span>
        )}
      </div>
    </div>
  );
}

export default function MatkulListClient({ initialMatkuls, initialFilter }: Props) {
  const router = useRouter();

  const [search,          setSearch]          = useState('');
  const [selectedTahun,   setSelectedTahun]   = useState('');
  const [selectedSemType, setSelectedSemType] = useState('');
  const [selectedRole,    setSelectedRole]    = useState('');
  const [selectedSks,     setSelectedSks]     = useState('');
  const [docStatus,       setDocStatus]       = useState(initialFilter === 'pending' ? 'pending' : '');
  const [showFilters,     setShowFilters]     = useState(initialFilter === 'pending');
  const [viewMode,        setViewMode]        = useState<'card' | 'table'>('table');
  const [groupBySem,      setGroupBySem]      = useState(false);
  const [sortKey,         setSortKey]         = useState<'code' | 'name' | 'sks' | 'semester' | null>(null);
  const [sortDir,         setSortDir]         = useState<'asc' | 'desc'>('asc');

  const { data: swrData, isValidating, error } = useSWR<(Matkul & { docCounts: DocCounts })[]>(
    '/api/matkul/mine',
    fetcher,
    { fallbackData: initialMatkuls, refreshInterval: 10000 }
  );

  // Preserve docCounts from initial render (SWR may not always include them)
  const dcById = useMemo(() => {
    const map = new Map<string, DocCounts>();
    for (const m of initialMatkuls) map.set(m.matkulId ?? m.id, m.docCounts);
    return map;
  }, [initialMatkuls]);

  const matkuls = useMemo(() =>
    (swrData ?? initialMatkuls).map(m => ({
      ...m,
      docCounts: m.docCounts ?? dcById.get(m.matkulId ?? m.id) ?? EMPTY_COUNTS,
    })),
  [swrData, initialMatkuls, dcById]);

  const tahunOptions = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const m of matkuls) {
      const t = m.semester?.tahunAkademik.tahun;
      if (t && !seen.has(t)) { seen.add(t); out.push(t); }
    }
    return out.sort().reverse();
  }, [matkuls]);

  const sksOptions = useMemo(() => {
    const seen = new Set<number>();
    for (const m of matkuls) seen.add(m.sks);
    return Array.from(seen).sort((a, b) => a - b);
  }, [matkuls]);

  const roleOptions = useMemo(() => {
    const seen = new Set<string>();
    for (const m of matkuls) m.userRoles.forEach(r => seen.add(r));
    return Array.from(seen);
  }, [matkuls]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return matkuls.filter(m => {
      if (selectedTahun && m.semester?.tahunAkademik.tahun !== selectedTahun) return false;
      if (selectedSemType && m.semester?.nama !== selectedSemType) return false;
      if (selectedRole && !m.userRoles.includes(selectedRole)) return false;
      if (selectedSks && m.sks !== Number(selectedSks)) return false;
      if (docStatus === 'pending'  && m.docCounts.SUBMITTED === 0) return false;
      if (docStatus === 'revision' && m.docCounts.REVISION === 0)  return false;
      if (docStatus === 'complete' && (m.docCounts.total === 0 || m.docCounts.APPROVED < m.docCounts.total)) return false;
      if (!q) return true;
      return (
        m.code.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q) ||
        m.dosens.some(d => d.name.toLowerCase().includes(q)) ||
        m.koordinators.some(k => k.name.toLowerCase().includes(q)) ||
        m.classes.some(c => c.name.toLowerCase().includes(q))
      );
    });
  }, [matkuls, search, selectedTahun, selectedSemType, selectedRole, selectedSks, docStatus]);

  const sortedFiltered = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'code') cmp = a.code.localeCompare(b.code);
      else if (sortKey === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortKey === 'sks') cmp = a.sks - b.sks;
      else if (sortKey === 'semester') {
        const sa = a.semester ? `${a.semester.tahunAkademik.tahun}__${a.semester.nama === 'Genap' ? '2' : '1'}` : '';
        const sb = b.semester ? `${b.semester.tahunAkademik.tahun}__${b.semester.nama === 'Genap' ? '2' : '1'}` : '';
        cmp = sa.localeCompare(sb);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  }

  const grouped = useMemo(() => {
    if (!groupBySem) return null;
    const map = new Map<string, { label: string; items: typeof filtered }>();
    for (const m of filtered) {
      const key = m.semester
        ? `${m.semester.tahunAkademik.tahun}__${m.semester.nama}`
        : '__none__';
      const label = m.semester
        ? `${m.semester.nama} ${m.semester.tahunAkademik.tahun}`
        : 'Tanpa Semester';
      if (!map.has(key)) map.set(key, { label, items: [] });
      map.get(key)!.items.push(m);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([, v]) => v);
  }, [filtered, groupBySem]);

  const activeFilterCount = [selectedTahun, selectedSemType, selectedRole, selectedSks, docStatus].filter(Boolean).length;
  const hasFilters = !!(search || activeFilterCount);

  function clearFilters() {
    setSearch(''); setSelectedTahun(''); setSelectedSemType('');
    setSelectedRole(''); setSelectedSks(''); setDocStatus('');
  }

  function navigate(id: string) { router.push(`/dashboard/matkul/${id}`); }

  function renderCards(items: typeof sortedFiltered) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map(m => <MatkulCard key={m.matkulId ?? m.id} m={m} onClick={() => navigate(m.id)} />)}
      </div>
    );
  }

  function SortTh({ col, label }: { col: typeof sortKey; label: string }) {
    const active = sortKey === col;
    const Icon = active && sortDir === 'desc' ? ChevronDown : ChevronUp;
    return (
      <th
        className="px-4 py-3 text-left cursor-pointer select-none group/th whitespace-nowrap"
        onClick={() => toggleSort(col)}
      >
        <span className="inline-flex items-center gap-1">
          {label}
          <Icon size={12} className={active ? 'text-uph-blue' : 'text-gray-300 group-hover/th:text-gray-400'} />
        </span>
      </th>
    );
  }

  function renderTable(items: typeof sortedFiltered) {
    return (
      <div className="bg-white border border-uph-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-uph-grayBg border-b border-uph-border text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                <SortTh col="code" label="Kode" />
                <SortTh col="name" label="Nama Matkul" />
                <SortTh col="sks" label="SKS" />
                <SortTh col="semester" label="Semester" />
                <th className="px-4 py-3 text-left">Kelas</th>
                <th className="px-4 py-3 text-left">Pengajar</th>
                <th className="px-4 py-3 text-left">Peran</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-uph-border">
              {items.map(m => (
                <tr
                  key={m.matkulId ?? m.id}
                  onClick={() => navigate(m.id)}
                  className="hover:bg-uph-grayBg cursor-pointer transition-colors group"
                >
                  <td className="px-4 py-3 font-mono text-xs font-bold text-gray-500 whitespace-nowrap">{m.code}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="block max-w-72 truncate font-semibold text-sm text-gray-800 group-hover:text-uph-blue transition-colors" title={m.name}>{m.name}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{m.sks} SKS</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                    {m.semester ? `${m.semester.nama} ${m.semester.tahunAkademik.tahun}` : '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {m.classes.length > 0 ? (
                      <div className="flex gap-1">
                        {m.classes.map(c => (
                          <span key={c.id} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono whitespace-nowrap">{c.name}</span>
                        ))}
                      </div>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    <div className="space-y-0.5">
                      {m.dosens.length > 0 && (
                        <div className="max-w-48 truncate" title={m.dosens.map(d => d.name).join(', ')}>
                          {m.dosens.map(d => d.name).join(', ')}
                        </div>
                      )}
                      {m.koordinators.length > 0 && (
                        <div className="max-w-48 truncate text-gray-400" title={m.koordinators.map(k => k.name).join(', ')}>
                          {m.koordinators.map(k => k.name).join(', ')}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex gap-1">
                      {m.userRoles.map(r => <RoleBadge key={r} role={r} />)}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {(() => { const cs = completionStatus(m.docCounts); return (
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${cs.cls}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cs.dot}`} />{cs.label}
                      </span>
                    ); })()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-uph-blue transition-colors" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <>
      <div>
        <div className="mb-5">
          <h1 className="font-playfair text-2xl font-bold text-uph-blue">Mata Kuliah</h1>
          <p className="text-sm text-gray-500 mt-1">Pilih mata kuliah untuk mengelola dokumen akademik.</p>
        </div>

        {/* Filter Bar */}
        <div className="bg-white border border-uph-border rounded-xl mb-4 overflow-hidden">
          {/* Search row */}
          <div className="flex items-center gap-2 p-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama, kode, kelas, dosen, koordinator..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-sm border border-uph-border rounded-lg focus:outline-none focus:ring-2 focus:ring-uph-blue/30 bg-uph-grayBg"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(p => !p)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border transition-colors shrink-0 ${
                showFilters || activeFilterCount > 0
                  ? 'bg-uph-blue/10 text-uph-blue border-uph-blue/30'
                  : 'text-gray-500 border-uph-border hover:border-uph-blue hover:text-uph-blue'
              }`}
            >
              <Filter size={14} />
              Filter
              {activeFilterCount > 0 && (
                <span className="bg-uph-blue text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-uph-red px-2 py-2 rounded-lg border border-uph-border hover:border-uph-red transition-colors shrink-0"
              >
                <X size={12} /> Reset
              </button>
            )}
          </div>

          {/* Role quick-filter — always visible when user has multiple roles */}
          {roleOptions.length > 1 && (
            <div className="flex items-center gap-2 px-3 pb-3">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider shrink-0">Peran:</span>
              <div className="flex flex-wrap gap-1.5">
                {roleOptions.map(role => {
                  const cfg = ROLE_CONFIG[role];
                  return cfg ? (
                    <button
                      key={role}
                      onClick={() => setSelectedRole(selectedRole === role ? '' : role)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                        selectedRole === role ? 'bg-uph-blue text-white border-uph-blue' : `${cfg.badgeCls} hover:border-uph-blue`
                      }`}
                    >
                      <cfg.Icon size={10} />{cfg.label}
                    </button>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Expanded filters */}
          {showFilters && (
            <div className="px-3 pb-3 border-t border-uph-border pt-3 bg-uph-grayBg flex flex-wrap gap-x-6 gap-y-3 items-start">
              {tahunOptions.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tahun Akademik</span>
                  <select
                    value={selectedTahun}
                    onChange={e => setSelectedTahun(e.target.value)}
                    className="border border-uph-border rounded-lg px-3 py-1.5 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-uph-blue/30"
                  >
                    <option value="">Semua</option>
                    {tahunOptions.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Semester</span>
                <div className="flex gap-1.5">
                  {SEMESTER_TYPES.map(type => (
                    <button
                      key={type}
                      onClick={() => setSelectedSemType(selectedSemType === type ? '' : type)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        selectedSemType === type
                          ? 'bg-uph-blue text-white border-uph-blue'
                          : 'bg-white text-gray-600 border-uph-border hover:border-uph-blue hover:text-uph-blue'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {sksOptions.length > 1 && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">SKS</span>
                  <div className="flex gap-1.5">
                    {sksOptions.map(sks => (
                      <button
                        key={sks}
                        onClick={() => setSelectedSks(selectedSks === String(sks) ? '' : String(sks))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                          selectedSks === String(sks)
                            ? 'bg-uph-blue text-white border-uph-blue'
                            : 'bg-white text-gray-600 border-uph-border hover:border-uph-blue hover:text-uph-blue'
                        }`}
                      >
                        {sks} SKS
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status Dokumen</span>
                <div className="flex gap-1.5">
                  {DOC_STATUS_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setDocStatus(docStatus === opt.value ? '' : opt.value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        docStatus === opt.value
                          ? 'bg-uph-blue text-white border-uph-blue'
                          : 'bg-white text-gray-600 border-uph-border hover:border-uph-blue hover:text-uph-blue'
                      }`}
                    >
                      {opt.icon}{opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results bar */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-gray-400">
            <span className="font-semibold text-gray-600">{filtered.length}</span> dari {matkuls.length} mata kuliah
            {docStatus === 'pending' && <span className="ml-2 text-yellow-600 font-semibold">· Filter: Menunggu Review</span>}
          </p>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={groupBySem}
                onChange={e => setGroupBySem(e.target.checked)}
                className="rounded border-gray-300 text-uph-blue focus:ring-uph-blue/30"
              />
              Kelompok per Semester
            </label>
            <div className="flex border border-uph-border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('card')}
                className={`px-3 py-1.5 transition-colors ${viewMode === 'card' ? 'bg-uph-blue text-white' : 'text-gray-500 hover:bg-uph-grayBg'}`}
                title="Tampilan Kartu"
              >
                <LayoutGrid size={14} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 transition-colors ${viewMode === 'table' ? 'bg-uph-blue text-white' : 'text-gray-500 hover:bg-uph-grayBg'}`}
                title="Tampilan Tabel"
              >
                <List size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {filtered.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <BookOpen size={48} className="mx-auto mb-4 opacity-40" />
            <p className="font-semibold">Tidak ada mata kuliah ditemukan.</p>
            {hasFilters && (
              <button onClick={clearFilters} className="mt-3 text-sm text-uph-blue hover:underline">
                Hapus filter
              </button>
            )}
          </div>
        ) : grouped ? (
          <div className="space-y-8">
            {grouped.map(group => (
              <div key={group.label}>
                <SemesterGroupHeader
                  label={group.label}
                  count={group.items.length}
                  pendingCount={group.items.reduce((s, m) => s + m.docCounts.SUBMITTED, 0)}
                  revisionCount={group.items.reduce((s, m) => s + m.docCounts.REVISION, 0)}
                />
                {viewMode === 'card' ? renderCards(group.items) : renderTable(group.items)}
              </div>
            ))}
          </div>
        ) : viewMode === 'card' ? renderCards(sortedFiltered) : renderTable(sortedFiltered)}
      </div>

      <SyncIndicator isValidating={isValidating} error={error} />
    </>
  );
}
