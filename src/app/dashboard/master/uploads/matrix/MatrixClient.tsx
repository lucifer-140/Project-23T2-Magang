'use client';

import useSWR from 'swr';
import { useState, useMemo } from 'react';
import { ExternalLink, BarChart2, Download } from 'lucide-react';
import type { MatrixRow, SemesterOption } from '@/lib/api-types';

type Props = { semesters: SemesterOption[]; dark?: boolean };

const fetcher = (url: string) => fetch(url).then(r => r.json());

function DocCell({ fileName, fileUrl, dark }: { fileName: string | null; fileUrl: string | null; dark: boolean }) {
  if (!fileName || !fileUrl) return <span className={dark ? 'text-gray-700' : 'text-gray-300'}>—</span>;
  return (
    <a
      href={fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 underline text-xs max-w-[140px] truncate ${dark ? 'text-purple-400 hover:text-purple-300 font-mono' : 'text-uph-blue hover:text-blue-800'}`}
      title={fileName}
    >
      <ExternalLink size={10} className="shrink-0" />
      {fileName}
    </a>
  );
}

export function MatrixClient({ semesters, dark = false }: Props) {
  const defaultSemesterId =
    semesters.find(s => s.isActive)?.id ?? semesters[0]?.id ?? '';

  const [selectedSemesterId, setSelectedSemesterId] = useState(defaultSemesterId);

  const { data: rows, isLoading, error } = useSWR<MatrixRow[]>(
    selectedSemesterId
      ? `/api/master/document-matrix?semesterId=${selectedSemesterId}`
      : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const grouped = useMemo(() => {
    const map = new Map<string, { tahunNama: string; semesters: SemesterOption[] }>();
    for (const s of semesters) {
      if (!map.has(s.tahunAkademikId)) {
        map.set(s.tahunAkademikId, { tahunNama: s.tahunAkademikNama, semesters: [] });
      }
      map.get(s.tahunAkademikId)!.semesters.push(s);
    }
    return Array.from(map.values());
  }, [semesters]);

  const exportHref = selectedSemesterId
    ? `/api/master/document-matrix/export?semesterId=${selectedSemesterId}`
    : '#';

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
          <BarChart2 size={20} className="text-white" />
        </div>
        <h1 className={`text-3xl font-playfair font-bold ${dark ? 'text-gray-100' : 'text-uph-blue'}`}>Matrix Dokumen</h1>
      </div>
      <p className="text-gray-500 mb-6 text-sm">
        Rekap dokumen per matakuliah, kelas, dan dosen.{' '}
        <span className={`text-xs ${dark ? 'text-gray-600' : 'text-gray-400'}`}>* Dokumen tanpa kelas tidak ditampilkan.</span>
      </p>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <label className={`text-sm ${dark ? 'text-gray-500 font-mono' : 'text-gray-700 font-medium'}`}>Semester</label>
          <select
            value={selectedSemesterId}
            onChange={e => setSelectedSemesterId(e.target.value)}
            className={dark
              ? 'bg-gray-900 border border-gray-700 text-gray-300 rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-700'
              : 'border border-uph-border rounded-lg px-3 py-1.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-uph-blue/30'
            }
          >
            {semesters.length === 0 && <option value="">Tidak ada semester</option>}
            {grouped.map(g => (
              <optgroup key={g.tahunNama} label={g.tahunNama}>
                {g.semesters.map(s => (
                  <option key={s.id} value={s.id}>{s.nama}{s.isActive ? ' (Aktif)' : ''}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <a
          href={exportHref}
          download
          className={`inline-flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors ${
            selectedSemesterId
              ? dark ? 'bg-purple-600 text-white border-purple-600 hover:bg-purple-700 font-mono' : 'bg-uph-blue text-white border-uph-blue hover:bg-blue-900'
              : dark ? 'bg-gray-800 text-gray-600 border-gray-700 pointer-events-none' : 'bg-gray-100 text-gray-400 border-gray-200 pointer-events-none'
          }`}
        >
          <Download size={14} /> Export Semester Ini
        </a>

        <a
          href="/api/master/document-matrix/export?all=true"
          download
          className={`inline-flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors ${
            dark
              ? 'border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-gray-300 font-mono'
              : 'border-uph-border text-uph-blue hover:bg-uph-grayBg'
          }`}
        >
          <Download size={14} /> Export Semua Semester
        </a>
      </div>

      {/* Table */}
      {!selectedSemesterId ? (
        <p className={`text-sm ${dark ? 'text-gray-500 font-mono' : 'text-gray-400'}`}>Pilih semester untuk menampilkan data.</p>
      ) : isLoading ? (
        <p className={`text-sm animate-pulse ${dark ? 'text-gray-500 font-mono' : 'text-gray-400'}`}>Memuat data…</p>
      ) : error ? (
        <p className={`text-sm ${dark ? 'text-red-400 font-mono' : 'text-red-500'}`}>Gagal memuat data. Coba refresh.</p>
      ) : !rows || rows.length === 0 ? (
        <p className={`text-sm ${dark ? 'text-gray-500 font-mono' : 'text-gray-400'}`}>Tidak ada data untuk semester ini.</p>
      ) : (
        <div className={`overflow-x-auto rounded-xl border ${dark ? 'border-gray-800' : 'border-uph-border'}`}>
          <table className="w-full text-sm">
            <thead>
              <tr className={dark ? 'bg-gray-800 border-b border-gray-700' : 'bg-uph-blue'}>
                {['Kelas', 'Kode MK', 'Nama MK', 'Dosen', 'RPS', 'LPP', 'Soal UTS', 'EPP UTS', 'Soal UAS', 'EPP UAS'].map(h => (
                  <th key={h} className={`px-3 py-2.5 text-left text-xs font-semibold whitespace-nowrap ${dark ? 'text-[10px] font-bold uppercase tracking-widest text-gray-400 font-mono' : 'text-white'}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={`${row.matkulClassId}-${row.dosenId}`} className={
                  dark
                    ? `border-b border-gray-800/50 ${i % 2 === 1 ? 'bg-gray-900' : 'bg-gray-950'} hover:bg-gray-800/40`
                    : `${i % 2 === 1 ? 'bg-gray-50' : 'bg-white'}`
                }>
                  <td className={`px-3 py-2 whitespace-nowrap text-xs font-medium ${dark ? 'text-green-400 font-mono' : 'text-gray-700'}`}>{row.kelasName}</td>
                  <td className={`px-3 py-2 whitespace-nowrap text-xs ${dark ? 'text-gray-500 font-mono' : 'text-gray-600'}`}>{row.matkulCode}</td>
                  <td className={`px-3 py-2 text-xs max-w-[200px] ${dark ? 'text-gray-300 font-mono' : 'text-gray-800'}`}>{row.matkulName}</td>
                  <td className={`px-3 py-2 whitespace-nowrap text-xs ${dark ? 'text-gray-400 font-mono' : 'text-gray-700'}`}>{row.dosenName}</td>
                  <td className="px-3 py-2"><DocCell fileName={row.rpsFileName} fileUrl={row.rpsFileUrl} dark={dark} /></td>
                  <td className="px-3 py-2"><DocCell fileName={row.lppFileName} fileUrl={row.lppFileUrl} dark={dark} /></td>
                  <td className="px-3 py-2"><DocCell fileName={row.utsFileName} fileUrl={row.utsFileUrl} dark={dark} /></td>
                  <td className="px-3 py-2"><DocCell fileName={row.eppUtsFileName} fileUrl={row.eppUtsFileUrl} dark={dark} /></td>
                  <td className="px-3 py-2"><DocCell fileName={row.uasFileName} fileUrl={row.uasFileUrl} dark={dark} /></td>
                  <td className="px-3 py-2"><DocCell fileName={row.eppUasFileName} fileUrl={row.eppUasFileUrl} dark={dark} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rows && rows.length > 0 && (
        <p className={`mt-3 text-xs ${dark ? 'text-gray-600 font-mono' : 'text-gray-400'}`}>{rows.length} baris ditemukan.</p>
      )}
    </div>
  );
}
