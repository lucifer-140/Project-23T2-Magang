"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, X, BookOpen, Upload, ClipboardCheck, GraduationCap, ChevronRight
} from 'lucide-react';
import useSWR from 'swr';
import { SyncIndicator } from '@/components/SyncIndicator';

interface SemesterOption {
  id: string;
  nama: string;
  isActive: boolean;
  tahunAkademik: { tahun: string };
}

interface Matkul {
  id: string;
  code: string;
  name: string;
  sks: number;
  semesterId: string | null;
  userRoles: string[];
  dosens: { id: string; name: string }[];
  koordinators: { id: string; name: string }[];
  classes: { id: string; name: string }[];
  semester: {
    id: string;
    nama: string;
    isActive: boolean;
    tahunAkademik: { tahun: string };
  } | null;
}

interface Props {
  initialMatkuls: Matkul[];
  semesters: SemesterOption[];
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

const ROLE_CONFIG: Record<string, { label: string; badgeCls: string; Icon: React.ElementType }> = {
  dosen: {
    label: 'Dosen',
    badgeCls: 'bg-blue-50 text-blue-700 border border-blue-200',
    Icon: Upload,
  },
  koordinator: {
    label: 'Koordinator',
    badgeCls: 'bg-amber-50 text-amber-700 border border-amber-200',
    Icon: ClipboardCheck,
  },
  kaprodi: {
    label: 'Kaprodi',
    badgeCls: 'bg-purple-50 text-purple-700 border border-purple-200',
    Icon: GraduationCap,
  },
  prodi: {
    label: 'PRODI',
    badgeCls: 'bg-teal-50 text-teal-700 border border-teal-200',
    Icon: ClipboardCheck,
  },
};

const SEMESTER_TYPES = ['Ganjil', 'Genap', 'Akselerasi'] as const;

function RoleBadge({ role }: { role: string }) {
  const cfg = ROLE_CONFIG[role];
  if (!cfg) return null;
  const { Icon, label, badgeCls } = cfg;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${badgeCls}`}>
      <Icon size={10} />
      {label}
    </span>
  );
}

export default function MatkulListClient({ initialMatkuls, semesters }: Props) {
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [selectedTahun, setSelectedTahun] = useState('');
  const [selectedSemType, setSelectedSemType] = useState('');

  const { data, isValidating, error } = useSWR<Matkul[]>(
    '/api/matkul/mine',
    fetcher,
    { fallbackData: initialMatkuls, refreshInterval: 5000 }
  );

  const matkuls = data ?? initialMatkuls;

  const tahunOptions = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const m of matkuls) {
      const t = m.semester?.tahunAkademik.tahun;
      if (t && !seen.has(t)) { seen.add(t); out.push(t); }
    }
    return out.sort().reverse();
  }, [matkuls]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return matkuls.filter(m => {
      if (selectedTahun && m.semester?.tahunAkademik.tahun !== selectedTahun) return false;
      if (selectedSemType && m.semester?.nama !== selectedSemType) return false;
      if (!q) return true;
      return (
        m.code.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q) ||
        m.dosens.some(d => d.name.toLowerCase().includes(q)) ||
        m.koordinators.some(k => k.name.toLowerCase().includes(q)) ||
        m.classes.some(c => c.name.toLowerCase().includes(q))
      );
    });
  }, [matkuls, search, selectedTahun, selectedSemType]);

  const hasFilters = search || selectedTahun || selectedSemType;

  function clearFilters() {
    setSearch('');
    setSelectedTahun('');
    setSelectedSemType('');
  }

  return (
    <>
      <div>
        <div className="mb-6">
          <h1 className="font-playfair text-2xl font-bold text-uph-blue">Mata Kuliah</h1>
          <p className="text-sm text-gray-500 mt-1">Pilih mata kuliah untuk mengelola dokumen akademik.</p>
        </div>

        {/* Filter Bar */}
        <div className="bg-white border border-uph-border rounded-xl p-4 mb-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
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

          {tahunOptions.length > 0 && (
            <select
              value={selectedTahun}
              onChange={e => setSelectedTahun(e.target.value)}
              className="border border-uph-border rounded-lg px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-uph-blue/30"
            >
              <option value="">Semua Tahun</option>
              {tahunOptions.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          )}

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

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-uph-red px-2 py-1.5 rounded-lg border border-uph-border hover:border-uph-red transition-colors"
            >
              <X size={12} /> Reset
            </button>
          )}
        </div>

        <p className="text-xs text-gray-400 mb-3">
          Menampilkan <span className="font-semibold text-gray-600">{filtered.length}</span> dari {matkuls.length} mata kuliah
        </p>

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
        ) : (
          <div className="bg-white border border-uph-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-uph-grayBg border-b border-uph-border text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3 text-left">Kode</th>
                    <th className="px-4 py-3 text-left">Nama Matkul</th>
                    <th className="px-4 py-3 text-center">SKS</th>
                    <th className="px-4 py-3 text-left">Tahun Akademik</th>
                    <th className="px-4 py-3 text-left">Semester</th>
                    <th className="px-4 py-3 text-left">Kelas</th>
                    <th className="px-4 py-3 text-left">Koordinator</th>
                    <th className="px-4 py-3 text-left">Dosen</th>
                    <th className="px-4 py-3 text-left">Peran</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-uph-border">
                  {filtered.map(m => (
                    <tr
                      key={m.id}
                      onClick={() => router.push(`/dashboard/matkul/${m.id}`)}
                      className="hover:bg-uph-grayBg cursor-pointer transition-colors group"
                    >
                      <td className="px-4 py-3 font-mono text-xs font-bold text-gray-500 whitespace-nowrap">{m.code}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800 group-hover:text-uph-blue transition-colors">{m.name}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{m.sks}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{m.semester?.tahunAkademik.tahun ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{m.semester?.nama ?? '—'}</td>
                      <td className="px-4 py-3">
                        {m.classes.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {m.classes.map(c => (
                              <span key={c.id} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">
                                {c.name}
                              </span>
                            ))}
                          </div>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {m.koordinators.length > 0
                          ? m.koordinators.map(k => k.name).join(', ')
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {m.dosens.length > 0
                          ? m.dosens.map(d => d.name).join(', ')
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {m.userRoles.map(r => <RoleBadge key={r} role={r} />)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <ChevronRight size={16} className="text-gray-300 group-hover:text-uph-blue transition-colors" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <SyncIndicator isValidating={isValidating} error={error} />
    </>
  );
}
