"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, ChevronRight, Users, UserCheck } from 'lucide-react';
import useSWR from 'swr';
import { SyncIndicator } from '@/components/SyncIndicator';

const SEMESTERS = [
  'Ganjil 2025/2026',
  'Genap 2024/2025',
  'Ganjil 2024/2025',
  'Genap 2023/2024',
];

interface Matkul {
  id: string;
  code: string;
  name: string;
  sks: number;
  userRoles: string[];
  dosens: { id: string; name: string }[];
  koordinators: { id: string; name: string }[];
}

interface Props {
  initialMatkuls: Matkul[];
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function MatkulListClient({ initialMatkuls }: Props) {
  const router = useRouter();
  const [semester, setSemester] = useState(SEMESTERS[0]);

  const { data, isValidating, error } = useSWR<Matkul[]>(
    '/api/matkul/mine',
    fetcher,
    { fallbackData: initialMatkuls, refreshInterval: 5000 }
  );

  const matkuls = data ?? initialMatkuls;

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-playfair text-2xl font-bold text-uph-blue">Mata Kuliah</h1>
            <p className="text-sm text-gray-500 mt-1">Pilih mata kuliah untuk mengelola dokumen akademik.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Semester:</span>
            <select
              value={semester}
              onChange={e => setSemester(e.target.value)}
              className="border border-uph-border rounded-lg px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-uph-blue/30"
            >
              {SEMESTERS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {matkuls.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <BookOpen size={48} className="mx-auto mb-4 opacity-40" />
            <p className="font-semibold">Belum ada mata kuliah yang ditugaskan.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {matkuls.map(m => (
              <button
                key={m.id}
                onClick={() => router.push(`/dashboard/matkul/${m.id}?semester=${encodeURIComponent(semester)}`)}
                className="text-left bg-white border border-uph-border rounded-xl p-5 hover:border-uph-blue/40 hover:shadow-md transition-all group"
              >
                {/* Title */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{m.code} · {m.sks} SKS</p>
                    <p className="font-bold text-gray-800 group-hover:text-uph-blue transition-colors leading-tight">{m.name}</p>
                  </div>
                  <ChevronRight size={18} className="text-gray-300 group-hover:text-uph-blue transition-colors flex-shrink-0 mt-0.5" />
                </div>

                {/* Koordinator names */}
                {m.koordinators.length > 0 && (
                  <div className="flex items-start gap-2 mb-1.5">
                    <UserCheck size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-600 leading-snug">
                      <span className="font-semibold text-amber-700">Koordinator:</span>{' '}
                      {m.koordinators.map(k => k.name).join(', ')}
                    </p>
                  </div>
                )}

                {/* Dosen names */}
                {m.dosens.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Users size={13} className="text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-600 leading-snug">
                      <span className="font-semibold text-blue-700">Dosen:</span>{' '}
                      {m.dosens.map(d => d.name).join(', ')}
                    </p>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <SyncIndicator isValidating={isValidating} error={error} />
    </>
  );
}
