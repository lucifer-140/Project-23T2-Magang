"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, ChevronRight, Users, UserCheck, CalendarDays, Upload, ClipboardCheck, GraduationCap } from 'lucide-react';
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

const ROLE_CONFIG: Record<string, {
  label: string;
  badgeCls: string;
  borderCls: string;
  Icon: React.ElementType;
  action: string;
}> = {
  dosen: {
    label: 'Dosen',
    badgeCls: 'bg-blue-50 text-blue-700 border border-blue-200',
    borderCls: 'border-l-blue-400',
    Icon: Upload,
    action: 'Upload & pantau RPS',
  },
  koordinator: {
    label: 'Koordinator',
    badgeCls: 'bg-amber-50 text-amber-700 border border-amber-200',
    borderCls: 'border-l-amber-400',
    Icon: ClipboardCheck,
    action: 'Tinjau RPS dosen',
  },
  kaprodi: {
    label: 'Kaprodi',
    badgeCls: 'bg-purple-50 text-purple-700 border border-purple-200',
    borderCls: 'border-l-purple-400',
    Icon: GraduationCap,
    action: 'Persetujuan akhir RPS',
  },
};

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

function getPrimaryBorderCls(roles: string[]): string {
  if (roles.includes('kaprodi')) return 'border-l-purple-400';
  if (roles.includes('koordinator')) return 'border-l-amber-400';
  return 'border-l-blue-400';
}

function getActionHint(roles: string[]): string {
  return roles.map(r => ROLE_CONFIG[r]?.action).filter(Boolean).join(' · ');
}

export default function MatkulListClient({ initialMatkuls, semesters }: Props) {
  const router = useRouter();

  const defaultSemesterId =
    semesters.find(s => s.isActive)?.id ?? semesters[0]?.id ?? '';

  const [selectedSemesterId, setSelectedSemesterId] = useState(defaultSemesterId);

  const { data, isValidating, error } = useSWR<Matkul[]>(
    '/api/matkul/mine',
    fetcher,
    { fallbackData: initialMatkuls, refreshInterval: 5000 }
  );

  const matkuls = data ?? initialMatkuls;

  const filtered = selectedSemesterId
    ? matkuls.filter(m => m.semesterId === selectedSemesterId)
    : matkuls;

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-playfair text-2xl font-bold text-uph-blue">Mata Kuliah</h1>
            <p className="text-sm text-gray-500 mt-1">Pilih mata kuliah untuk mengelola dokumen akademik.</p>
          </div>
          {semesters.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Semester:</span>
              <select
                value={selectedSemesterId}
                onChange={e => setSelectedSemesterId(e.target.value)}
                className="border border-uph-border rounded-lg px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-uph-blue/30"
              >
                {semesters.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.nama} {s.tahunAkademik.tahun}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <BookOpen size={48} className="mx-auto mb-4 opacity-40" />
            <p className="font-semibold">Belum ada mata kuliah yang ditugaskan.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(m => (
              <button
                key={m.id}
                onClick={() => router.push(`/dashboard/matkul/${m.id}?semesterId=${selectedSemesterId}`)}
                className={`text-left bg-white border border-uph-border border-l-4 ${getPrimaryBorderCls(m.userRoles)} rounded-xl p-5 hover:shadow-md transition-all group`}
              >
                {/* Role badges row */}
                {m.userRoles.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {m.userRoles.map(r => <RoleBadge key={r} role={r} />)}
                  </div>
                )}

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
                  <div className="flex items-start gap-2 mb-3">
                    <Users size={13} className="text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-600 leading-snug">
                      <span className="font-semibold text-blue-700">Dosen:</span>{' '}
                      {m.dosens.map(d => d.name).join(', ')}
                    </p>
                  </div>
                )}

                {/* Semester + action hint footer */}
                <div className="flex items-center justify-between pt-2 border-t border-uph-border/60">
                  {m.semester ? (
                    <div className="flex items-center gap-1">
                      <CalendarDays size={11} className="text-gray-400" />
                      <span className="text-xs text-gray-400 font-medium">
                        {m.semester.nama} {m.semester.tahunAkademik.tahun}
                      </span>
                    </div>
                  ) : <span />}
                  <span className="text-xs text-gray-400 italic">{getActionHint(m.userRoles)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <SyncIndicator isValidating={isValidating} error={error} />
    </>
  );
}
